const API_BASE = '';

function getToken() { return localStorage.getItem('anchor_token'); }
function getAdmin() {
  try { return JSON.parse(localStorage.getItem('anchor_admin')); } catch { return null; }
}

function requireAuth() {
  if (!getToken()) window.location.href = 'login.html';
}

function loadAdminInfo() {
  const admin = getAdmin();
  if (!admin) return;
  const nameEl = document.getElementById('admin-name');
  const roleEl = document.getElementById('admin-role');
  if (nameEl) nameEl.textContent = admin.full_name || admin.username;
  if (roleEl) roleEl.textContent = admin.role === 'superadmin' ? 'Super Admin' : 'Admin';
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = 'login.html'; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg, type = 'default') {
  const tc = document.getElementById('toast-container');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : type === 'error' ? 'xmark' : 'info'}"></i> ${msg}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

document.getElementById('logout-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = 'login.html';
});
