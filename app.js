// ======================= CONFIGURACIÓN SUPABASE =======================
const SUPABASE_URL = "https://nkyfbgdcgunkwnboemqn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWZiZ2RjZ3Vua3duYm9lbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzM4MzUsImV4cCI6MjA3MjE0OTgzNX0.eKhl-eMS5SsmaZj2DEe9S0IvfNXHKV1d5m-sJAkzs2Q";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// ======================= ESTADO GLOBAL =======================
let currentUser = null;
let debts = [];
let userProfile = { name: '' };

// ======================= INICIALIZACIÓN =======================
document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();
  await handleAuthRedirect();
  
  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    await handleAuthStateChange();
  });
});

// ======================= MANEJO DE AUTENTICACIÓN =======================
async function handleAuthRedirect() {
  try {
    const url = new URL(location.href);
    
    // Manejar PKCE
    const code = url.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) console.error('Error en exchangeCodeForSession:', error);
      history.replaceState({}, document.title, url.origin + url.pathname);
      return;
    }
    
    // Manejar flujo implícito
    const hash = new URLSearchParams(url.hash.slice(1));
    const access_token = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');
    
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) console.error('Error en setSession:', error);
      history.replaceState({}, document.title, url.origin + url.pathname);
    }
  } catch (error) {
    console.error('Error en handleAuthRedirect:', error);
  }
}

async function handleAuthStateChange() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  const authStatus = document.getElementById('authStatus');
  const btnLogout = document.getElementById('btnLogout');
  
  if (currentUser) {
    // Usuario logueado
    loginScreen.style.display = 'none';
    appScreen.style.display = 'block';
    authStatus.textContent = `Sesión iniciada como ${currentUser.email}`;
    btnLogout.style.display = 'inline-flex';
    
    // Cargar datos del usuario
    await loadUserData();
    updateUI();
  } else {
    // Usuario no logueado
    loginScreen.style.display = 'block';
    appScreen.style.display = 'none';
    authStatus.textContent = 'Sin sesión';
    btnLogout.style.display = 'none';
    
    // Limpiar datos
    debts = [];
    userProfile = { name: '' };
  }
}

async function doLogin() {
  const emailInput = document.getElementById('authEmail');
  const email = emailInput.value.trim();
  
  if (!email) {
    alert('Por favor ingresa tu email');
    return;
  }
  
  showLoading(true);
  
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });
    
    if (error) throw error;
    
    alert('Te hemos enviado un enlace mágico por email. Revisa tu bandeja de entrada (y spam).');
    emailInput.value = '';
  } catch (error) {
    console.error('Error en login:', error);
    alert(`Error al enviar el enlace: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

async function doLogout() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error en logout:', error);
  }
}

// ======================= CARGA DE DATOS =======================
async function loadUserData() {
  try {
    showLoading(true);
    
    // Cargar perfil del usuario
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    if (profile) {
      userProfile = profile;
    }
    
    // Cargar deudas
    const { data: debtsData, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    debts = debtsData || [];
    
  } catch (error) {
    console.error('Error cargando datos:', error);
    alert('Error al cargar los datos');
  } finally {
    showLoading(false);
  }
}

// ======================= GESTIÓN DE DEUDAS =======================
async function addDebt(debtData) {
  try {
    const { data, error } = await supabase
      .from('debts')
      .insert([{
        user_id: currentUser.id,
        person_name: debtData.personName,
        amount: parseFloat(debtData.amount),
        description: debtData.description || null,
        date_due: debtData.dueDate || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    debts.unshift(data);
    updateUI();
    
    return data;
  } catch (error) {
    console.error('Error agregando deuda:', error);
    throw error;
  }
}

async function updateDebt(debtId, debtData) {
  try {
    const { data, error } = await supabase
      .from('debts')
      .update({
        person_name: debtData.personName,
        amount: parseFloat(debtData.amount),
        description: debtData.description || null,
        date_due: debtData.dueDate || null
      })
      .eq('id', debtId)
      .eq('user_id', currentUser.id)
      .select()
      .single();
    
    if (error) throw error;
    
    const index = debts.findIndex(d => d.id === debtId);
    if (index !== -1) {
      debts[index] = data;
      updateUI();
    }
    
    return data;
  } catch (error) {
    console.error('Error actualizando deuda:', error);
    throw error;
  }
}

async function markDebtAsPaid(debtId, isPaid = true) {
  try {
    const { data, error } = await supabase
      .from('debts')
      .update({ is_paid: isPaid })
      .eq('id', debtId)
      .eq('user_id', currentUser.id)
      .select()
      .single();
    
    if (error) throw error;
    
    const index = debts.findIndex(d => d.id === debtId);
    if (index !== -1) {
      debts[index] = data;
      updateUI();
    }
    
    return data;
  } catch (error) {
    console.error('Error marcando deuda como pagada:', error);
    throw error;
  }
}

async function deleteDebt(debtId) {
  try {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', debtId)
      .eq('user_id', currentUser.id);
    
    if (error) throw error;
    
    debts = debts.filter(d => d.id !== debtId);
    updateUI();
  } catch (error) {
    console.error('Error eliminando deuda:', error);
    throw error;
  }
}

// ======================= GESTIÓN DE PERFIL =======================
async function updateUserProfile(profileData) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: currentUser.id,
        name: profileData.name
      })
      .select()
      .single();
    
    if (error) throw error;
    
    userProfile = data;
    updateUI();
    
    return data;
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    throw error;
  }
}

// ======================= INICIALIZACIÓN DE EVENTOS =======================
function initializeEventListeners() {
  // Autenticación
  document.getElementById('btnLogin')?.addEventListener('click', doLogin);
  document.getElementById('btnLogout')?.addEventListener('click', doLogout);
  
  // Formulario de deuda rápida
  document.getElementById('quickDebtForm')?.addEventListener('submit', handleQuickDebtSubmit);
  
  // Formulario de deuda modal
  document.getElementById('debtForm')?.addEventListener('submit', handleDebtSubmit);
  
  // Formulario de perfil
  document.getElementById('profileForm')?.addEventListener('submit', handleProfileSubmit);
  
  // Botones varios
  document.getElementById('btnAddDebt')?.addEventListener('click', () => openDebtModal());
  document.getElementById('btnExportData')?.addEventListener('click', exportData);
  document.getElementById('btnSyncData')?.addEventListener('click', loadUserData);
  
  // Filtros
  document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
  document.getElementById('filterPerson')?.addEventListener('input', applyFilters);
  
  // Enter en email para login
  document.getElementById('authEmail')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doLogin();
  });
  
  // Cerrar modal al hacer click fuera
  document.getElementById('debtModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'debtModal') closeDebtModal();
  });
}

// ======================= MANEJO DE FORMULARIOS =======================
async function handleQuickDebtSubmit(e) {
  e.preventDefault();
  
  const formData = {
    personName: document.getElementById('quickPersonName').value.trim(),
    amount: document.getElementById('quickAmount').value,
    description: document.getElementById('quickDescription').value.trim(),
    dueDate: document.getElementById('quickDueDate').value || null
  };
  
  if (!formData.personName || !formData.amount) {
    alert('Por favor completa los campos obligatorios');
    return;
  }
  
  try {
    await addDebt(formData);
    e.target.reset();
    alert('Deuda agregada correctamente');
  } catch (error) {
    alert('Error al agregar la deuda');
  }
}

async function handleDebtSubmit(e) {
  e.preventDefault();
  
  const debtId = document.getElementById('debtId').value;
  const formData = {
    personName: document.getElementById('personName').value.trim(),
    amount: document.getElementById('amount').value,
    description: document.getElementById('description').value.trim(),
    dueDate: document.getElementById('dueDate').value || null
  };
  
  if (!formData.personName || !formData.amount) {
    alert('Por favor completa los campos obligatorios');
    return;
  }
  
  try {
    if (debtId) {
      await updateDebt(debtId, formData);
    } else {
      await addDebt(formData);
    }
    
    closeDebtModal();
    alert(debtId ? 'Deuda actualizada correctamente' : 'Deuda agregada correctamente');
  } catch (error) {
    alert('Error al guardar la deuda');
  }
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const profileData = {
    name: document.getElementById('userName').value.trim()
  };
  
  try {
    await updateUserProfile(profileData);
    alert('Perfil actualizado correctamente');
  } catch (error) {
    alert('Error al actualizar el perfil');
  }
}

// ======================= NAVEGACIÓN Y UI =======================
function showTab(tabName, clickedBtn) {
  // Ocultar todas las tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Desactivar todos los botones
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostrar tab seleccionada
  document.getElementById(tabName)?.classList.add('active');
  clickedBtn?.classList.add('active');
  
  // Actualizar contenido específico de la tab
  if (tabName === 'debts') {
    displayDebts();
  } else if (tabName === 'people') {
    displayPeople();
  } else if (tabName === 'profile') {
    loadProfileData();
  }
}

function updateUI() {
  updateDashboard();
  displayDebts();
  displayPeople();
  loadProfileData();
}

function updateDashboard() {
  const activeDebts = debts.filter(d => !d.is_paid);
  const totalAmount = activeDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
  const uniquePeople = new Set(activeDebts.map(d => d.person_name)).size;
  
  document.getElementById('totalOwed').textContent = `$${totalAmount.toFixed(2)}`;
  document.getElementById('totalDebts').textContent = activeDebts.length;
  document.getElementById('totalPeople').textContent = uniquePeople;
  
  displayRecentDebts();
}

function displayRecentDebts() {
  const recentDebtsList = document.getElementById('recentDebtsList');
  if (!recentDebtsList) return;
  
  const recentDebts = debts.filter(d => !d.is_paid).slice(0, 5);
  
  if (recentDebts.length === 0) {
    recentDebtsList.innerHTML = '<p class="text-muted">No hay deudas pendientes</p>';
    return;
  }
  
  recentDebtsList.innerHTML = recentDebts.map(debt => `
    <div class="recent-item">
      <div class="debt-header">
        <span class="debt-person">${debt.person_name}</span>
        <span class="debt-amount">$${parseFloat(debt.amount).toFixed(2)}</span>
      </div>
      ${debt.description ? `<div class="debt-description">${debt.description}</div>` : ''}
    </div>
  `).join('');
}

function displayDebts() {
  const debtsList = document.getElementById('debtsList');
  if (!debtsList) return;
  
  const filteredDebts = getFilteredDebts();
  
  if (filteredDebts.length === 0) {
    debtsList.innerHTML = '<p class="text-muted">No hay deudas que mostrar</p>';
    return;
  }
  
  debtsList.innerHTML = filteredDebts.map(debt => createDebtHTML(debt)).join('');
}

function createDebtHTML(debt) {
  const dueDate = debt.date_due ? new Date(debt.date_due) : null;
  const isOverdue = dueDate && dueDate < new Date() && !debt.is_paid;
  const createdDate = new Date(debt.created_at).toLocaleDateString();
  
  return `
    <div class="debt-item">
      <div class="debt-header">
        <span class="debt-person">${debt.person_name}</span>
        <span class="debt-amount">$${parseFloat(debt.amount).toFixed(2)}</span>
      </div>
      
      ${debt.description ? `<div class="debt-description">${debt.description}</div>` : ''}
      
      <div class="debt-meta">
        <div>
          <span class="status-badge ${debt.is_paid ? 'status-paid' : (isOverdue ? 'status-overdue' : 'status-pending')}">
            ${debt.is_paid ? 'Pagada' : (isOverdue ? 'Vencida' : 'Pendiente')}
          </span>
          ${dueDate ? ` • Vence: ${dueDate.toLocaleDateString()}` : ''}
          • Creada: ${createdDate}
        </div>
        
        <div class="debt-actions">
          ${!debt.is_paid ? `
            <button class="btn-sm btn-primary" onclick="markDebtAsPaid('${debt.id}')">
              <i class="fas fa-check"></i> Marcar como pagada
            </button>
          ` : `
            <button class="btn-sm btn-secondary" onclick="markDebtAsPaid('${debt.id}', false)">
              <i class="fas fa-undo"></i> Marcar como pendiente
            </button>
          `}
          <button class="btn-sm btn-secondary" onclick="editDebt('${debt.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-sm text-danger" onclick="deleteDebtConfirm('${debt.id}')">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </div>
      </div>
    </div>
  `;
}

function displayPeople() {
  const peopleList = document.getElementById('peopleList');
  if (!peopleList) return;
  
  const peopleData = getPeopleData();
  
  if (peopleData.length === 0) {
    peopleList.innerHTML = '<p class="text-muted">No hay personas registradas</p>';
    return;
  }
  
  peopleList.innerHTML = peopleData.map(person => `
    <div class="person-item">
      <div class="person-header">
        <span class="person-name">${person.name}</span>
        <span class="debt-amount">$${person.totalAmount.toFixed(2)}</span>
      </div>
      
      <div class="person-meta">
        <div>
          ${person.activeDebts} deuda(s) activa(s) • ${person.totalDebts} total
        </div>
        <div>
          Última actividad: ${person.lastActivity}
        </div>
      </div>
    </div>
  `).join('');
}

function getPeopleData() {
  const peopleMap = new Map();
  
  debts.forEach(debt => {
    const name = debt.person_name;
    
    if (!peopleMap.has(name)) {
      peopleMap.set(name, {
        name,
        totalAmount: 0,
        activeDebts: 0,
        totalDebts: 0,
        lastActivity: debt.created_at
      });
    }
    
    const person = peopleMap.get(name);
    person.totalDebts++;
    
    if (!debt.is_paid) {
      person.activeDebts++;
      person.totalAmount += parseFloat(debt.amount);
    }
    
    if (new Date(debt.created_at) > new Date(person.lastActivity)) {
      person.lastActivity = debt.created_at;
    }
  });
  
  return Array.from(peopleMap.values())
    .map(person => ({
      ...person,
      lastActivity: new Date(person.lastActivity).toLocaleDateString()
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

// ======================= FILTROS =======================
function getFilteredDebts() {
  const statusFilter = document.getElementById('filterStatus')?.value || 'all';
  const personFilter = document.getElementById('filterPerson')?.value.toLowerCase() || '';
  
  return debts.filter(debt => {
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'pending' && !debt.is_paid) ||
      (statusFilter === 'paid' && debt.is_paid);
    
    const personMatch = debt.person_name.toLowerCase().includes(personFilter);
    
    return statusMatch && personMatch;
  });
}

function applyFilters() {
  displayDebts();
}

// ======================= MODAL =======================
function openDebtModal(debtId = null) {
  const modal = document.getElementById('debtModal');
  const form = document.getElementById('debtForm');
  const title = document.getElementById('modalTitle');
  
  // Limpiar formulario
  form.reset();
  document.getElementById('debtId').value = '';
  
  if (debtId) {
    // Editar deuda existente
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      title.textContent = 'Editar Deuda';
      document.getElementById('debtId').value = debt.id;
      document.getElementById('personName').value = debt.person_name;
      document.getElementById('amount').value = debt.amount;
      document.getElementById('description').value = debt.description || '';
      document.getElementById('dueDate').value = debt.date_due || '';
    }
  } else {
    title.textContent = 'Agregar Deuda';
  }
  
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.getElementById('personName').focus();
}

function closeDebtModal() {
  const modal = document.getElementById('debtModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

function editDebt(debtId) {
  openDebtModal(debtId);
}

async function deleteDebtConfirm(debtId) {
  if (confirm('¿Estás seguro de que quieres eliminar esta deuda?')) {
    try {
      await deleteDebt(debtId);
      alert('Deuda eliminada correctamente');
    } catch (error) {
      alert('Error al eliminar la deuda');
    }
  }
}

// ======================= PERFIL =======================
function loadProfileData() {
  document.getElementById('userName').value = userProfile.name || '';
  document.getElementById('userEmail').value = currentUser?.email || '';
}

// ======================= UTILIDADES =======================
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = show ? 'flex' : 'none';
}

function exportData() {
  const data = {
    profile: userProfile,
    debts: debts,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finanzapp-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Exponer funciones globales necesarias
window.showTab = showTab;
window.closeDebtModal = closeDebtModal;
window.editDebt = editDebt;
window.deleteDebtConfirm = deleteDebtConfirm;
window.markDebtAsPaid = markDebtAsPaid;
