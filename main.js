// ======================= AUTH (Magic Link) =======================
const APP_VERSION = 'login-v8-post-instant';
console.log('main.js cargado:', APP_VERSION);
document.getElementById('appVersion')?.append(APP_VERSION);

/***** SUPABASE *****/
const SUPABASE_URL = "https://nkyfbgdcgunkwnboemqn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWZiZ2RjZ3Vua3duYm9lbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzM4MzUsImV4cCI6MjA3MjE0OTgzNX0.eKhl-eMS5SsmaZj2DEe9S0IvfNXHKV1d5m-sJAkzs2Q";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

/* 1) Procesa el regreso del magic link y guarda sesión */
(async function handleAuthRedirect() {
  try {
    const url = new URL(location.href);

    // PKCE (?code=)
    const code = url.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession({ code });
      if (error) console.error('exchangeCodeForSession error:', error);
      history.replaceState({}, document.title, url.origin + url.pathname);
      return;
    }

    // Implícito (#access_token=)
    const hash = new URLSearchParams(url.hash.slice(1));
    const access_token  = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) console.error('setSession error:', error);
      history.replaceState({}, document.title, url.origin + url.pathname);
    }
  } catch (e) {
    console.error('handleAuthRedirect error:', e);
  }
})();

/* 2) Login: envía magic link a tu correo */
async function doLogin(){
  const emailInput = document.getElementById('authEmail');
  const authStatus = document.getElementById('authStatus');
  const email = (emailInput?.value || '').trim();
  if (!email) return alert('Escribe tu email');

  const redirectTo = 'https://cosmichomeless.github.io/own-notion/';

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });

  if (error) {
    console.error('OTP error:', error);
    authStatus.textContent = `Error: ${error.message}`;
    alert(`No pude enviar el correo:\n${error.message}\n\nURL usada:\n${redirectTo}`);
    return;
  }
  console.log('[login] enviado', data);
  authStatus.textContent = 'Te envié un enlace de acceso por email 📩 (revisa spam)';
}

/***** AUTH: BOOTSTRAP + LISTENER *****/
let currentUser = null;

// Listener temprano
supabase.auth.onAuthStateChange(async (_ev, session) => {
  currentUser = session?.user || null;

  const btnLogout  = document.getElementById('btnLogout');
  const authStatus = document.getElementById('authStatus');

  const logged = !!currentUser;
  if (btnLogout)  btnLogout.style.display = logged ? 'inline-block' : 'none';
  if (authStatus) authStatus.textContent = logged
    ? `Sesión iniciada como ${currentUser.email}`
    : 'Sin sesión';

  if (logged) {
    // Baja lo de la nube (ya que ahora subimos por operación individual)
    await syncDownFromSupabase();
    saveData(false);
  } else {
    saveData(false);
  }
});

// Bootstrap en frío
(async function bootstrapAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('getSession error:', error);
    currentUser = session?.user || null;

    const btnLogout  = document.getElementById('btnLogout');
    const authStatus = document.getElementById('authStatus');
    const logged = !!currentUser;

    if (btnLogout)  btnLogout.style.display = logged ? 'inline-block' : 'none';
    if (authStatus) authStatus.textContent = logged
      ? `Sesión iniciada como ${currentUser.email}`
      : 'Sin sesión';

    if (logged) {
      await syncDownFromSupabase();
      saveData(false);
    }
  } catch (e) {
    console.error('bootstrapAuth error:', e);
  }
})();

/* 3) Engancha botones cuando el DOM esté listo */
document.addEventListener('DOMContentLoaded', () => {
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');

  btnLogin?.addEventListener('click', doLogin);
  btnLogout?.addEventListener('click', async () => { await supabase.auth.signOut(); });

  // Botón de sincronización manual (ahora solo BAJA de la nube)
  document.getElementById('btnSync')?.addEventListener('click', async () => {
    if (!currentUser) return alert('Inicia sesión primero');
    await syncDownFromSupabase();
    saveData(false);
    alert('Sincronizado desde la nube');
  });

  // Botón de diagnóstico
  document.getElementById('btnDiagnose')?.addEventListener('click', async () => {
    await runDiagnostic();
  });
});

// ======================= UTIL ===========================
const toYMD = (d = new Date()) => d.toISOString().slice(0,10);

// ======================= ESTADO LOCAL ============================
let debts      = JSON.parse(localStorage.getItem('personalAgendaDebts')) || [];
let activities = JSON.parse(localStorage.getItem('personalAgendaActivities')) || [];
let userData   = JSON.parse(localStorage.getItem('personalAgendaUser')) || { name: '' };

// ======================= UI BÁSICA ===============================
function showTab(tabName, clickedBtn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  if (clickedBtn) clickedBtn.classList.add('active');
}

// 👉 Sin subida automática; la haremos nosotros por operación
function saveData(pushToCloud = false) {
  localStorage.setItem('personalAgendaDebts', JSON.stringify(debts));
  localStorage.setItem('personalAgendaActivities', JSON.stringify(activities));
  localStorage.setItem('personalAgendaUser', JSON.stringify(userData));

  updateSummary();
  updateDashboard();
  updateConfigInfo();
  updatePersonLists();
  displayDebts();
  displayPeopleView();
}

// addActivity ahora devuelve el objeto creado (para subirlo a la nube si hay sesión)
function addActivity(type, text, icon = '📋') {
  const activity = { id: Date.now(), type, text, icon, time: new Date().toISOString() };
  activities.unshift(activity);
  activities = activities.slice(0, 10);
  saveData(false);
  return activity;
}

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
  if (!activityList) return;
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

// ======================= VISTA POR PERSONAS ======================
function toggleView(view) {
  const listView   = document.getElementById('listView');
  const peopleView = document.getElementById('peopleView');
  const listBtn    = document.getElementById('listViewBtn');
  const peopleBtn  = document.getElementById('peopleViewBtn');
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
  const oweList  = document.getElementById('owePersonsList');
  if (!owedList || !oweList) return;
  owedList.innerHTML = ''; oweList.innerHTML = '';
  people.forEach(p=>{
    const o1 = document.createElement('option'); o1.value = p; owedList.appendChild(o1);
    const o2 = document.createElement('option'); o2.value = p; oweList.appendChild(o2);
  });
}

function displayPeopleView() {
  const peopleList = document.getElementById('peopleList');
  if (!peopleList) return;
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
    else { peopleData[d.person].owe.push(d); peopleData[d.person].totalOwe  += d.amount; }
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

async function settlePerson(personName) {
  // local
  const personDebts = debts.filter(d=>d.person===personName);
  const totalOwed = personDebts.filter(d=>d.type==='owed').reduce((s,d)=>s+d.amount,0);
  const totalOwe  = personDebts.filter(d=>d.type==='owe' ).reduce((s,d)=>s+d.amount,0);
  const balance = totalOwed - totalOwe;
  if (balance === 0) return alert('No hay deuda pendiente con esta persona.');
  const message = balance>0
    ? `¿Saldar cuenta con ${personName}?\n\n${personName} te pagará $${balance.toFixed(2)}`
    : `¿Saldar cuenta con ${personName}?\n\nTú pagarás $${Math.abs(balance).toFixed(2)} a ${personName}`;
  if (!confirm(message)) return;

  // nube
  if (currentUser) {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('person', personName);
    if (error) console.warn('[settlePerson] delete cloud error:', error);
  }

  debts = debts.filter(d=>d.person!==personName);
  const act = addActivity('finance', `Cuenta saldada: ${balance>0? personName+' te pagó':'le pagaste a '+personName} $${Math.abs(balance).toFixed(2)}`, '💰');

  // sube actividad
  if (currentUser && act) {
    const { error: aerr } = await supabase.from('activities').insert({
      id: act.id, user_id: currentUser.id, type: act.type, text: act.text, icon: act.icon, time: act.time
    });
    if (aerr) console.warn('[settlePerson] insert activity error:', aerr);
  }

  saveData(false);
}

// ======================= CRUD FINANZAS (formularios) =============
document.getElementById('owedForm')?.addEventListener('submit', async function(e){
  e.preventDefault();

  const person = document.getElementById('owedPerson').value.trim();
  const raw    = (document.getElementById('owedAmount').value || '').trim();
  const amount = parseFloat(raw.replace(',', '.'));
  const date   = document.getElementById('owedDate').value || toYMD();
  if (!person || isNaN(amount)) { alert('Rellena persona y una cantidad válida'); return; }

  const debt = {
    id: Date.now(), type:'owed', person, amount,
    description: document.getElementById('owedDescription').value,
    date,
    created: new Date().toISOString()
  };

  // Local primero
  debts.push(debt);
  const act = addActivity('finance', `${person} te debe $${amount.toFixed(2)}`, '💵');
  saveData(false);

  // Cloud inmediato con logs detallados
  if (currentUser) {
    try {
      console.log('[owedForm] intentando insertar deuda:', { user_id: currentUser.id, debt_id: debt.id });
      
      const { data, error } = await supabase.from('debts').insert({
        id: debt.id, 
        user_id: currentUser.id, 
        type: debt.type, 
        person: debt.person,
        amount: debt.amount, 
        description: debt.description || null, 
        date: debt.date, 
        created: debt.created
      }).select('id');
      
      if (error) {
        console.error('[owedForm] insert debt error:', error);
        alert(`Error al guardar en la nube: ${error.message}`);
      } else {
        console.log('[owedForm] deuda insertada correctamente:', data);
      }

      if (act) {
        const { data: actData, error: aerr } = await supabase.from('activities').insert({
          id: act.id, 
          user_id: currentUser.id, 
          type: act.type, 
          text: act.text, 
          icon: act.icon, 
          time: act.time
        }).select('id');
        
        if (aerr) {
          console.warn('[owedForm] insert activity error:', aerr);
        } else {
          console.log('[owedForm] actividad insertada correctamente:', actData);
        }
      }
    } catch (e) {
      console.error('[owedForm] sync error:', e);
      alert(`Error de conexión: ${e.message}`);
    }
  } else {
    console.warn('[owedForm] sin sesión: solo localStorage');
    alert('Sin sesión activa - solo se guardó localmente');
  }

  this.reset();
  document.getElementById('owedDate').value = toYMD();
});

document.getElementById('oweForm')?.addEventListener('submit', async function(e){
  e.preventDefault();

  const person = document.getElementById('owePerson').value.trim();
  const raw    = (document.getElementById('oweAmount').value || '').trim();
  const amount = parseFloat(raw.replace(',', '.'));
  const date   = document.getElementById('oweDate').value || toYMD();
  if (!person || isNaN(amount)) { alert('Rellena persona y una cantidad válida'); return; }

  const debt = {
    id: Date.now(), type:'owe', person, amount,
    description: document.getElementById('oweDescription').value,
    date,
    created: new Date().toISOString()
  };

  // Local primero
  debts.push(debt);
  const act = addActivity('finance', `Debes $${amount.toFixed(2)} a ${person}`, '💸');
  saveData(false);

  // Cloud inmediato con logs detallados
  if (currentUser) {
    try {
      console.log('[oweForm] intentando insertar deuda:', { user_id: currentUser.id, debt_id: debt.id });
      
      const { data, error } = await supabase.from('debts').insert({
        id: debt.id, 
        user_id: currentUser.id, 
        type: debt.type, 
        person: debt.person,
        amount: debt.amount, 
        description: debt.description || null, 
        date: debt.date, 
        created: debt.created
      }).select('id');
      
      if (error) {
        console.error('[oweForm] insert debt error:', error);
        alert(`Error al guardar en la nube: ${error.message}`);
      } else {
        console.log('[oweForm] deuda insertada correctamente:', data);
      }

      if (act) {
        const { data: actData, error: aerr } = await supabase.from('activities').insert({
          id: act.id, 
          user_id: currentUser.id, 
          type: act.type, 
          text: act.text, 
          icon: act.icon, 
          time: act.time
        }).select('id');
        
        if (aerr) {
          console.warn('[oweForm] insert activity error:', aerr);
        } else {
          console.log('[oweForm] actividad insertada correctamente:', actData);
        }
      }
    } catch (e) {
      console.error('[oweForm] sync error:', e);
      alert(`Error de conexión: ${e.message}`);
    }
  } else {
    console.warn('[oweForm] sin sesión: solo localStorage');
    alert('Sin sesión activa - solo se guardó localmente');
  }

  this.reset();
  document.getElementById('oweDate').value = toYMD();
});

// ======================= RESUMEN Y LISTA =========================
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

function displayDebts(){
  const container = document.getElementById('debtsList');
  if (!container) return;
  if (debts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div>📄</div><p>Sin registros todavía</p></div>`;
    return;
  }
  container.innerHTML = debts
    .slice()
    .sort((a,b)=> new Date(b.date) - new Date(a.date))
    .map(d => `
      <div class="debt-item ${d.type}">
        <div class="debt-header">
          <div class="debt-person">👤 ${d.person}</div>
          <div class="debt-amount ${d.type==='owed'?'positive':'negative'}">
            ${d.type==='owed'?'+':'-'}$${d.amount.toFixed(2)}
          </div>
        </div>
        ${d.description? `<div class="debt-description">${d.description}</div>` : ''}
        <div class="debt-date">${new Date(d.date).toLocaleDateString('es-ES')}</div>
        <div class="debt-actions">
          <button class="btn btn-small" onclick="markAsPaid(${d.id})">✅ Pagado</button>
          <button class="btn btn-danger btn-small" onclick="deleteDebt(${d.id})">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');
}

async function markAsPaid(id){
  const idx = debts.findIndex(d=>d.id===id);
  if (idx === -1) return;
  const d = debts[idx];

  // nube: borra fila
  if (currentUser) {
    const { error } = await supabase.from('debts').delete().eq('user_id', currentUser.id).eq('id', id);
    if (error) console.warn('[markAsPaid] delete error:', error);
  }

  debts.splice(idx,1);
  const act = addActivity('finance', `Marcado como pagado: ${d.type==='owed'? (d.person+' te pagó') : ('pagaste a '+d.person)} $${d.amount.toFixed(2)}`, '✅');
  saveData(false);

  if (currentUser && act) {
    const { error: aerr } = await supabase.from('activities').insert({
      id: act.id, user_id: currentUser.id, type: act.type, text: act.text, icon: act.icon, time: act.time
    });
    if (aerr) console.warn('[markAsPaid] insert activity error:', aerr);
  }
}

async function deleteDebt(id){
  const d = debts.find(dd=>dd.id===id);
  if (!d) return;
  if (!confirm('¿Eliminar este registro?')) return;

  // nube: borra fila con logs detallados
  if (currentUser) {
    try {
      console.log('[deleteDebt] intentando eliminar:', { user_id: currentUser.id, debt_id: id });
      
      const { data, error } = await supabase.from('debts')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('id', id)
        .select('id');
        
      if (error) {
        console.error('[deleteDebt] delete error:', error);
        alert(`Error al eliminar de la nube: ${error.message}`);
        return; // No eliminar localmente si falló en la nube
      } else {
        console.log('[deleteDebt] eliminado correctamente de la nube:', data);
      }
    } catch (e) {
      console.error('[deleteDebt] error de conexión:', e);
      alert(`Error de conexión al eliminar: ${e.message}`);
      return;
    }
  }

  debts = debts.filter(dd=>dd.id!==id);
  const act = addActivity('finance', `Eliminado registro con ${d.person}`, '🗑️');
  saveData(false);

  if (currentUser && act) {
    try {
      const { data: actData, error: aerr } = await supabase.from('activities').insert({
        id: act.id, 
        user_id: currentUser.id, 
        type: act.type, 
        text: act.text, 
        icon: act.icon, 
        time: act.time
      }).select('id');
      
      if (aerr) {
        console.warn('[deleteDebt] insert activity error:', aerr);
      } else {
        console.log('[deleteDebt] actividad insertada correctamente:', actData);
      }
    } catch (e) {
      console.warn('[deleteDebt] error al insertar actividad:', e);
    }
  }
}

// ======================= FECHAS por defecto ======================
document.getElementById('owedDate')?.setAttribute('value', toYMD());
document.getElementById('oweDate') ?.setAttribute('value', toYMD());

// ======================= CONFIGURACIÓN ===========================
async function saveUserName() {
  const name = document.getElementById('userName').value.trim();
  if (!name) { showMessage('Por favor ingresa un nombre válido', 'error'); return; }
  userData.name = name;
  saveData(false);

  if (currentUser) {
    const { error } = await supabase.from('user_profile').upsert({ user_id: currentUser.id, name });
    if (error) console.warn('[saveUserName] upsert profile error:', error);
  }

  showMessage('Nombre guardado correctamente', 'success');
  updateDashboard();
}
function loadUserName() { document.getElementById('userName').value = userData.name || ''; }

function exportData() {
  const allData = { debts, activities, userData, exportDate:new Date().toISOString(), version:APP_VERSION };
  const dataStr = JSON.stringify(allData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const fname = `mi-agenda-personal-${toYMD()}.json`;
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
        saveData(false);
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
  configTitle?.parentNode?.insertBefore(div, configTitle.nextSibling);
  setTimeout(()=>div.remove(), 5000);
}

// ======================= INICIALIZACIÓN ==========================
updateSummary();
updateDashboard();
updateConfigInfo();
updatePersonLists();
displayDebts();
displayPeopleView();
loadUserName();
setInterval(updateDashboard, 60000);

// ======================= SYNC SUPABASE (solo DOWN aquí) =========
async function syncDownFromSupabase() {
  if (!currentUser) return;

  const { data: remoteDebts, error: e1 } = await supabase
    .from('debts').select('*').eq('user_id', currentUser.id)
    .order('created', { ascending: false });
  if (e1) { console.warn('[syncDown] debts error:', e1); return; }

  const { data: remoteActivities, error: e2 } = await supabase
    .from('activities').select('*').eq('user_id', currentUser.id)
    .order('time', { ascending: false }).limit(10);
  if (e2) { console.warn('[syncDown] activities error:', e2); return; }

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
  // No llamamos subida aquí.
  console.log('[syncDown] ok →', { debts: debts.length, activities: activities.length, name: userData.name });
}

// ======================= FUNCIÓN DE DIAGNÓSTICO =================
async function runDiagnostic() {
  console.log('=== DIAGNÓSTICO SUPABASE ===');
  
  // 1. Verificar token de autenticación
  const token = JSON.parse(localStorage.getItem('sb-nkyfbgdcgunkwnboemqn-auth-token') || 'null');
  console.log('1. Token de localStorage:', !!token?.access_token ? 'ENCONTRADO' : 'NO ENCONTRADO');
  
  if (!token?.access_token) {
    console.error('❌ Sin token de acceso - necesitas hacer login');
    alert('❌ Sin autenticación - inicia sesión primero');
    return;
  }

  // 2. Verificar usuario actual
  console.log('2. currentUser:', currentUser ? `${currentUser.id} (${currentUser.email})` : 'NULL');
  
  if (!currentUser) {
    console.error('❌ currentUser es null - problema de autenticación');
    alert('❌ currentUser es null - refresca la página e inicia sesión');
    return;
  }

  // 3. Test de conexión GET /auth/v1/user
  try {
    console.log('3. Probando GET /auth/v1/user...');
    const userRes = await fetch('https://nkyfbgdcgunkwnboemqn.supabase.co/auth/v1/user', {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token.access_token}`
      }
    });
    console.log('   - Respuesta:', userRes.status, userRes.statusText);
    
    if (userRes.ok) {
      const userJson = await userRes.json();
      console.log('   - Usuario:', userJson.id, userJson.email);
      console.log('✅ GET /auth/v1/user funcionando');
    } else {
      console.error('❌ GET /auth/v1/user falló');
    }
  } catch (e) {
    console.error('❌ Error en GET /auth/v1/user:', e);
  }

  // 4. Test de conexión POST /rest/v1/debts
  try {
    console.log('4. Probando POST /rest/v1/debts...');
    const now = new Date();
    const testRow = {
      id: Date.now(),
      user_id: currentUser.id,
      type: 'owed',
      person: 'Test Diagnóstico',
      amount: 1.00,
      description: 'Test de diagnóstico - puede eliminarse',
      date: now.toISOString().slice(0,10),
      created: now.toISOString()
    };

    const insertRes = await fetch('https://nkyfbgdcgunkwnboemqn.supabase.co/rest/v1/debts', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(testRow)
    });

    console.log('   - Respuesta POST:', insertRes.status, insertRes.statusText);
    
    if (insertRes.ok) {
      const insertJson = await insertRes.json();
      console.log('   - Fila insertada:', insertJson);
      console.log('✅ POST /rest/v1/debts funcionando');
      
      // Limpiar el test
      await supabase.from('debts').delete().eq('user_id', currentUser.id).eq('id', testRow.id);
      console.log('   - Test row eliminada');
    } else {
      const errorText = await insertRes.text();
      console.error('❌ POST /rest/v1/debts falló:', errorText);
    }
  } catch (e) {
    console.error('❌ Error en POST /rest/v1/debts:', e);
  }

  // 5. Test de conexión GET /rest/v1/debts
  try {
    console.log('5. Probando GET /rest/v1/debts...');
    const getRes = await fetch(`https://nkyfbgdcgunkwnboemqn.supabase.co/rest/v1/debts?user_id=eq.${currentUser.id}&limit=5`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token.access_token}`
      }
    });

    console.log('   - Respuesta GET:', getRes.status, getRes.statusText);
    
    if (getRes.ok) {
      const getJson = await getRes.json();
      console.log('   - Filas encontradas:', getJson.length);
      console.log('✅ GET /rest/v1/debts funcionando');
    } else {
      const errorText = await getRes.text();
      console.error('❌ GET /rest/v1/debts falló:', errorText);
    }
  } catch (e) {
    console.error('❌ Error en GET /rest/v1/debts:', e);
  }

  console.log('=== FIN DIAGNÓSTICO ===');
  alert('Diagnóstico completado - revisa la consola para detalles');
}
