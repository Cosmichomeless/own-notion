// =============== AUTH LIMPIO (PEGAR AL INICIO DE main.js) ===============
const APP_VERSION = 'login-v7';
console.log('main.js cargado:', APP_VERSION);

/***** SUPABASE *****/
const SUPABASE_URL = "https://nkyfbgdcgunkwnboemqn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reWZiZ2RjZ3Vua3duYm9lbXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzM4MzUsImV4cCI6MjA3MjE0OTgzNX0.eKhl-eMS5SsmaZj2DEe9S0IvfNXHKV1d5m-sJAkzs2Q";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true // también cubre el caso #access_token
  }
});

/* 1) Procesar el regreso del magic link y convertirlo en sesión */
(async function handleAuthRedirect() {
  try {
    const url = new URL(location.href);

    // Caso PKCE (?code=...)
    const code = url.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession({ code });
      if (error) console.error('exchangeCodeForSession error:', error);
      // limpia parámetros
      history.replaceState({}, document.title, url.origin + url.pathname);
      return;
    }

    // Caso implícito (#access_token=...)
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

/* 2) Login por botón (mismo redirect que te funciona) */
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

/* 3) ¡Engancha el botón! */
document.getElementById('btnLogin')?.addEventListener('click', doLogin);
// =======================================================================
