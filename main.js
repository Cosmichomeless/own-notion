/***** SUPABASE *****/
const SUPABASE_URL = "https://nkyfbgdcgunkwnboemqn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWZiZ2RjZ3Vua3duYm9lbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzM4MzUsImV4cCI6MjA3MjE0OTgzNX0.eKhl-eMS5SsmaZj2DEe9S0IvfNXHKV1d5m-sJAkzs2Q";

// 👇 el bundle del CDN expone "window.supabase"
const supabasejs = window.supabase; 
const supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- Captura el magic-link y establece la sesión (GitHub Pages) ---
(function handleSupabaseMagicLink(){
  // Los tokens llegan en el fragmento #... de la URL
  const params = new URLSearchParams(location.hash.slice(1));
  const access_token  = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token }).then(() => {
      // Limpia la URL (quita el #... para que no se rompa nada)
      history.replaceState({}, document.title, location.pathname + location.search);
    });
  }
})();


// 👇 NUEVO: procesa el magic link de regreso y guarda la sesión
(async () => {
  try {
    if (location.hash.includes('access_token') || location.search.includes('access_token')) {
      const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      if (error) {
        console.error('getSessionFromUrl error:', error);
      } else {
        const cleanUrl = location.pathname + location.search;
        history.replaceState({}, document.title, cleanUrl);
      }
    }
  } catch (e) {
    console.error('Error al procesar el magic link:', e);
  }
})();


/***** ESTADO LOCAL (offline) *****/
let debts = JSON.parse(localStorage.getItem('personalAgendaDebts')) || [];
let activities = JSON.parse(localStorage.getItem('personalAgendaActivities')) || [];
let userData = JSON.parse(localStorage.getItem('personalAgendaUser')) || { name: '' };

/***** SESIÓN ACTUAL *****/
let currentUser = null;

/***** UI: TABS *****/
function showTab(tabName, clickedBtn) {
  // ocultar contenidos
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  // desactivar botones
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  // activar el elegido
  document.getElementById(tabName).classList.add('active');
  if (clickedBtn) clickedBtn.classList.add('active');
}

/***** GUARDAR LOCAL + (opcional) SUBIR NUBE *****/
function saveData(pushToCloud = true) {
  localStorage.setItem('personalAgendaDebts', JSON.stringify(debts));
  localStorage.setItem('personalAgendaActivities', JSON.stringify(activities));
  localStorage.setItem('personalAgendaUser', JSON.stringify(userData));

  updateSummary();
  updateDashboard();
  updateConfigInfo();
  updatePersonLists();
  displayDebts();
  displayPeopleView();

  if (pushToCloud && currentUser) {
    if (saveData._timer) clearTimeout(saveData._timer);
    saveData._timer = setTimeout(() => { syncUpToSupabase(); }, 500);
  }
}

/***** ACTIVIDAD RECIENTE *****/
function addActivity(type, text, icon = '📋') {
  const activity = {
    id: Date.now(),
    type,
    text,
    icon,
    time: new Date().toISOString()
  };
  activities.unshift(activity);
  activities = activities.slice(0, 10);
  saveData();
}

/***** DASHBOARD *****/
function updateDashboard() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = hour < 12 ? "¡Buenos días!" : hour < 18 ? "¡Buenas tardes!" : "¡Buenas noches!";
  const personalized = userData.name ? `${greeting.slice(0,-1)} ${userData.name}!` : greeting;

  document.getElementById('welcomeMessage').textContent = personalized;
  document.getElementById('headerGreeting').textContent = `📅 ${personalized}`;
  document.getElementById('currentDate').textContent = now.toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const totalOwed = debts.filter(d=>d.type==='owed').reduce((s,d)=>s+d.amount,0);
  const totalOwe  = debts.filter(d=>d.type==='owe' ).reduce((s,d)=>s+d.amount,0);
  const net = totalOwed - totalOwe;

  document.getElementById('dashTotalOwed').textContent = `$${totalOwed.toFixed(2)}`;
  document.getElementById('dashTotalOwe').textContent  = `$${totalOwe.toFixed(2)}`;
  const dashNet = document.getElementById('dashNetBalance');
  dashNet.textContent = `$${net.toFixed(2)}`;
  dashNet.style.color = net >= 0 ? '#27ae60' : '#e74c3c';
  document.getElementById('dashDebtCount').textContent = `${debts.length} registro${debts.length!==1?'s':''}`;

  displayRecentActivity();
}

function displayRecentActivity() {
  const activityList = document.getElementById('recentActivityList');
  if (activities.length === 0) {
    activityList.innerHTML = `
      <div class="empty-state">
        <div class="empty-activity-icon" style="font-size:3rem; margin-bottom:15px; opacity:.5;">🕒</div>
        <p>No hay actividad reciente</p>
        <p style="font-size:.9rem; opacity:.7;">Comienza usando tu agenda para ver la actividad aquí</p>
      </div>`;
    return;
  }
  activityList.innerHTML = activities.slice(0,5).map(a=>{
    const timeAgo = getTimeAgo(new Date(a.time));
    return `
      <div class="activity-item">
        <div class="activity-icon ${a.type}">${a.icon}</div>
        <div class="activity-content">
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${timeAgo}</div>
        </div>
      </div>`;
  }).join('');
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} minuto${mins!==1?'s':''}`;
  if (hours < 24) return `Hace ${hours} hora${hours!==1?'s':''}`;
  return `Hace ${days} día${days!==1?'s':''}`;
}

/***** VISTA POR PERSONAS *****/
function toggleView(view) {
  const listView = document.getElementById('listView');
  const peopleView = document.getElementById('peopleView');
  const listBtn = document.getElementById('listViewBtn');
  const peopleBtn = document.getElementById('peopleViewBtn');
  if (view === 'list') {
    listView.style.display = 'block'; peopleView.style.display = 'none';
    listBtn.classList.add('active'); peopleBtn.classList.remove('active');
  } else {
    listView.style.display = 'none'; peopleView.style.display = 'block';
    listBtn.classList.remove('active'); peopleBtn.classList.add('active');
    displayPeopleView();
  }
}

function updatePersonLists() {
  const people = [...new Set(debts.map(d => d.person))];
  const owedList = document.getElementById('owedPersonsList');
  const oweList = document.getElementById('owePersonsList');
  owedList.innerHTML = ''; oweList.innerHTML = '';
  people.forEach(p=>{
    const o1 = document.createElement('option'); o1.value = p; owedList.appendChild(o1);
    const o2 = document.createElement('option'); o2.value = p; oweList.appendChild(o2);
  });
}

function displayPeopleView() {
  const peopleList = document.getElementById('peopleList');
  if (debts.length === 0) {
    peopleList.innerHTML = `
      <div class="empty-state">
        <div>👥</div>
        <h3>No hay registros por personas</h3>
        <p>Agrega algunas deudas o préstamos para ver el resumen por personas</p>
      </div>`;
    return;
  }

  const peopleData = {};
  debts.forEach(d=>{
    if (!peopleData[d.person]) {
      peopleData[d.person] = { name:d.person, owed:[], owe:[], totalOwed:0, totalOwe:0, balance:0 };
    }
    if (d.type==='owed'){ peopleData[d.person].owed.push(d); peopleData[d.person].totalOwed += d.amount; }
    else { peopleData[d.person].owe.push(d); peopleData[d.person].totalOwe += d.amount; }
    peopleData[d.person].balance = peopleData[d.person].totalOwed - peopleData[d.person].totalOwe;
  });

  const sorted = Object.values(peopleData).sort((a,b)=>Math.abs(b.balance)-Math.abs(a.balance));

  peopleList.innerHTML = sorted.map(person=>{
    const cls = person.balance>0 ? 'positive' : person.balance<0 ? 'negative' : 'neutral';
    const txt = person.balance>0 ? `+$${person.balance.toFixed(2)}`
              : person.balance<0 ? `-$${Math.abs(person.balance).toFixed(2)}`
              : '$0.00';
    const desc = person.balance>0 ? 'Te debe' : person.balance<0 ? 'Le debes' : 'Sin deuda';
    const rows = [...person.owed, ...person.owe].sort((a,b)=> new Date(b.date)-new Date(a.date))
      .map(t=>`
        <div class="transaction-item ${t.type}">
          <div class="transaction-header">
            <span class="transaction-amount ${t.type==='owed'?'positive':'negative'}">
              ${t.type==='owed'?'+':'-'}$${t.amount.toFixed(2)}
            </span>
            <span class="transaction-date">${new Date(t.date).toLocaleDateString('es-ES')}</span>
          </div>
          ${t.description?`<div class="transaction-description">${t.description}</div>`:''}
          <div style="display:flex; gap:10px; margin-top:10px;">
            <button class="btn btn-small" onclick="markAsPaid(${t.id})">✅ Pagado</button>
            <button class="btn btn-danger btn-small" onclick="deleteDebt(${t.id})">🗑️ Eliminar</button>
          </div>
        </div>`).join('');

    return `
      <div class="person-card">
        <div class="person-header">
          <div class="person-name">👤 ${person.name}</div>
          <div class="person-balance ${cls}">${desc}: ${txt}</div>
        </div>
        <div class="person-summary" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:15px; margin-bottom:15px; padding:15px; background:#f8f9fa; border-radius:8px;">
          <div style="text-align:center;"><div style="font-size:1.2rem; font-weight:700; color:#2c3e50;">${person.owed.length}</div><div style="font-size:.85rem; color:#6c757d; margin-top:2px;">Te debe</div></div>
          <div style="text-align:center;"><div style="font-size:1.2rem; font-weight:700; color:#2c3e50;">${person.owe.length}</div><div style="font-size:.85rem; color:#6c757d; margin-top:2px;">Le debes</div></div>
          <div style="text-align:center;"><div style="font-size:1.2rem; font-weight:700; color:#2c3e50;">$${person.totalOwed.toFixed(2)}</div><div style="font-size:.85rem; color:#6c757d; margin-top:2px;">Total a favor</div></div>
          <div style="text-align:center;"><div style="font-size:1.2rem; font-weight:700; color:#2c3e50;">$${person.totalOwe.toFixed(2)}</div><div style="font-size:.85rem; color:#6c757d; margin-top:2px;">Total en contra</div></div>
        </div>
        <div class="person-transactions">${rows}</div>
        ${Math.abs(person.balance)>0 ? `
          <div class="person-actions">
            <button class="btn-settle" onclick="settlePerson('${person.name.replace(/'/g,"\\'")}')">💰 Saldar cuenta</button>
          </div>` : ''}
      </div>`;
  }).join('');
}

function settlePerson(personName) {
  const personDebts = debts.filter(d=>d.person===personName);
  const totalOwed = personDebts.filter(d=>d.type==='owed').reduce((s,d)=>s+d.amount,0);
  const totalOwe  = personDebts.filter(d=>d.type==='owe' ).reduce((s,d)=>s+d.amount,0);
  const balance = totalOwed - totalOwe;
  if (balance === 0) return alert('No hay deuda pendiente con esta persona.');
  const message = balance>0
    ? `¿Saldar cuenta con ${personName}?\n\n${personName} te pagará $${balance.toFixed(2)}`
    : `¿Saldar cuenta con ${personName}?\n\nTú pagarás $${Math.abs(balance).toFixed(2)} a ${personName}`;
  if (confirm(message)) {
    debts = debts.filter(d=>d.person!==personName);
    addActivity('finance', `Cuenta saldada: ${balance>0? personName+' te pagó':'le pagaste a '+personName} $${Math.abs(balance).toFixed(2)}`, '💰');
    saveData();
  }
}

/***** CRUD FINANZAS *****/
document.getElementById('owedForm').addEventListener('submit', function(e){
    e.preventDefault();
  
    const person = document.getElementById('owedPerson').value.trim();
    const raw = (document.getElementById('owedAmount').value || '').trim();
    const amount = parseFloat(raw.replace(',', '.'));
    const date = document.getElementById('owedDate').value || new Date().toISOString().split('T')[0];
  
    if (!person || isNaN(amount)) {
      alert('Rellena persona y una cantidad válida'); 
      return;
    }
  
    const debt = {
      id: Date.now(), type:'owed', person, amount,
      description: document.getElementById('owedDescription').value,
      date,
      created: new Date().toISOString()
    };
  
    debts.push(debt);
    addActivity('finance', `${person} te debe $${amount.toFixed(2)}`, '💵');
    saveData();
    this.reset();
    document.getElementById('owedDate').value = new Date().toISOString().split('T')[0];
  });
  
  document.getElementById('oweForm').addEventListener('submit', function(e){
    e.preventDefault();
  
    const person = document.getElementById('owePerson').value.trim();
    const raw = (document.getElementById('oweAmount').value || '').trim();
    const amount = parseFloat(raw.replace(',', '.'));
    const date = document.getElementById('oweDate').value || new Date().toISOString().split('T')[0];
  
    if (!person || isNaN(amount)) {
      alert('Rellena persona y una cantidad válida'); 
      return;
    }
  
    const debt = {
      id: Date.now(), type:'owe', person, amount,
      description: document.getElementById('oweDescription').value,
      date,
      created: new Date().toISOString()
    };
  
    debts.push(debt);
    addActivity('finance', `Debes $${amount.toFixed(2)} a ${person}`, '💸');
    saveData();
    this.reset();
    document.getElementById('oweDate').value = new Date().toISOString().split('T')[0];
  });
  
/***** RESUMEN *****/
function updateSummary() {
  const totalOwed = debts.filter(d=>d.type==='owed').reduce((s,d)=>s+d.amount,0);
  const totalOwe  = debts.filter(d=>d.type==='owe' ).reduce((s,d)=>s+d.amount,0);
  const net = totalOwed - totalOwe;
  document.getElementById('totalOwed').textContent = `$${totalOwed.toFixed(2)}`;
  document.getElementById('totalOwe').textContent  = `$${totalOwe.toFixed(2)}`;
  const netEl = document.getElementById('netBalance');
  netEl.textContent = `$${net.toFixed(2)}`;
  netEl.style.color = net >= 0 ? '#27ae60' : '#e74c3c';
}

/***** FECHAS POR DEFECTO *****/
document.getElementById('owedDate').value = new Date().toISOString().split('T')[0];
document.getElementById('oweDate').value  = new Date().toISOString().split('T')[0];

/***** INICIALIZACIÓN *****/
updateSummary();
updateDashboard();
updateConfigInfo();
updatePersonLists();
displayDebts();
displayPeopleView();
loadUserName();
setInterval(updateDashboard, 60000);

/***** CONFIGURACIÓN *****/
async function saveUserName() {
  const name = document.getElementById('userName').value.trim();
  if (!name) { showMessage('Por favor ingresa un nombre válido', 'error'); return; }
  userData.name = name;
  saveData();
  if (currentUser) await upsertUserProfile(name);
  showMessage('Nombre guardado correctamente', 'success');
  updateDashboard();
}
function loadUserName() {
  document.getElementById('userName').value = userData.name || '';
}

function exportData() {
  const allData = { debts, activities, userData, exportDate:new Date().toISOString(), version:'1.0.0' };
  const dataStr = JSON.stringify(allData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const fname = `mi-agenda-personal-${new Date().toISOString().split('T')[0]}.json`;
  const a = document.createElement('a'); a.href=dataUri; a.download=fname; a.click();
  addActivity('config','Datos exportados correctamente','📤');
  showMessage('Datos exportados correctamente','success');
}

function importData(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.debts || !Array.isArray(imported.debts)) throw new Error('Archivo JSON inválido');
      if (confirm('¿Importar estos datos? Esto sobrescribirá todos los datos actuales.')) {
        debts = imported.debts || [];
        activities = imported.activities || [];
        userData = imported.userData || { name:'' };
        saveData();
        loadUserName();
        addActivity('config','Datos importados correctamente','📥');
        showMessage(`Datos importados correctamente. ${debts.length} registros cargados.`,'success');
      }
    } catch {
      showMessage('Error al importar el archivo. Verifica que sea un JSON válido.','error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('⚠️ ¿Eliminar TODOS los datos? Esta acción NO se puede deshacer.')) return;
  if (!confirm('🚨 CONFIRMACIÓN FINAL: Se eliminarán registros financieros, actividades y configuraciones.')) return;
  localStorage.removeItem('personalAgendaDebts');
  localStorage.removeItem('personalAgendaActivities');
  localStorage.removeItem('personalAgendaUser');
  debts=[]; activities=[]; userData={ name:'' };
  updateSummary(); updateDashboard(); updateConfigInfo(); displayDebts(); loadUserName();
  showMessage('Todos los datos han sido eliminados','success');
}

function updateConfigInfo() {
  const totalRecords = debts.length + activities.length;
  const storageSize = new Blob([JSON.stringify({debts,activities,userData})]).size;
  const lastActivity = activities.length>0 ? getTimeAgo(new Date(activities[0].time)) : 'Nunca';
  document.getElementById('totalRecords').textContent = totalRecords;
  document.getElementById('storageUsed').textContent = `${(storageSize/1024).toFixed(2)} KB`;
  document.getElementById('lastActivity').textContent = lastActivity;
}

function showMessage(text, type) {
  document.querySelectorAll('.success-message, .error-message').forEach(m=>m.remove());
  const div = document.createElement('div');
  div.className = type==='success' ? 'success-message' : 'error-message';
  div.textContent = text;
  div.style.display = 'block';
  const configTitle = document.querySelector('#configuracion .section-title');
  configTitle.parentNode.insertBefore(div, configTitle.nextSibling);
  setTimeout(()=>div.remove(), 5000);
}

/***** AUTH: LOGIN/LOGOUT *****/
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const authEmailInput = document.getElementById('authEmail');
const authStatus = document.getElementById('authStatus');

btnLogin?.addEventListener('click', async () => {
  const email = (authEmailInput?.value || '').trim();
  if (!email) return alert('Escribe tu email');

  // Usa la carpeta publicada en GitHub Pages, con barra final
  const redirectTo = 'https://cosmichomeless.github.io/own-notion/';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });

  if (error) {
    console.error('OTP error:', error);
    authStatus.textContent = `Error: ${error.message}`;
    alert(`No pude enviar el correo:\n${error.message}\n\nAsegúrate de haber permitido:\n${redirectTo}`);
    return;
  }
  authStatus.textContent = 'Te envié un enlace de acceso por email 📩 (revisa spam)';
});



btnLogout?.addEventListener('click', async ()=>{ await supabase.auth.signOut(); });

supabase.auth.onAuthStateChange(async (_ev, session)=>{
  currentUser = session?.user || null;
  const logged = !!currentUser;
  if (btnLogout) btnLogout.style.display = logged ? 'inline-block' : 'none';
  if (authStatus) authStatus.textContent = logged ? `Sesión iniciada como ${currentUser?.email}` : 'Sin sesión';
  if (logged) {
    await syncDownFromSupabase();
    if (userData.name) await upsertUserProfile(userData.name);
  }
  saveData(false);
});

/***** SYNC NUBE <-> LOCAL *****/
async function syncDownFromSupabase() {
  if (!currentUser) return;

  const { data: remoteDebts, error: e1 } = await supabase
    .from('debts').select('*').eq('user_id', currentUser.id)
    .order('created', { ascending: false });
  if (e1) { console.warn(e1); return; }

  const { data: remoteActivities, error: e2 } = await supabase
    .from('activities').select('*').eq('user_id', currentUser.id)
    .order('time', { ascending: false }).limit(10);
  if (e2) { console.warn(e2); return; }

  const { data: prof } = await supabase
    .from('user_profile').select('name')
    .eq('user_id', currentUser.id).maybeSingle();

  debts = (remoteDebts || []).map(d=>({
    id:Number(d.id), type:d.type, person:d.person, amount:Number(d.amount),
    description:d.description||'', date:d.date, created:new Date(d.created).toISOString()
  }));
  activities = (remoteActivities || []).map(a=>({
    id:Number(a.id), type:a.type, text:a.text, icon:a.icon||'📋', time:new Date(a.time).toISOString()
  }));
  if (prof && prof.name) { userData.name = prof.name; loadUserName(); }
  saveData(false);
}

async function syncUpToSupabase() {
  if (!currentUser) return;

  // Estrategia simple para empezar: borrar y reinsertar todo del usuario
  await supabase.from('debts').delete().eq('user_id', currentUser.id);
  if (debts.length) {
    const rows = debts.map(d=>({
      id:d.id, user_id:currentUser.id, type:d.type, person:d.person,
      amount:d.amount, description:d.description||null, date:d.date, created:d.created
    }));
    const { error } = await supabase.from('debts').insert(rows);
    if (error) console.warn(error);
  }

  await supabase.from('activities').delete().eq('user_id', currentUser.id);
  if (activities.length) {
    const rowsA = activities.map(a=>({
      id:a.id, user_id:currentUser.id, type:a.type, text:a.text, icon:a.icon||null, time:a.time
    }));
    const { error } = await supabase.from('activities').insert(rowsA);
    if (error) console.warn(error);
  }

  if (userData.name) await upsertUserProfile(userData.name);
}

async function upsertUserProfile(name) {
  if (!currentUser) return;
  await supabase.from('user_profile').upsert({ user_id: currentUser.id, name });
}
