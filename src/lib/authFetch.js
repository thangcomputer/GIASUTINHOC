/**
 * Authorization headers — tách admin vs học viên để không gửi nhầm JWT admin lên API học viên.
 */

export function getStudentToken() {
  const t = localStorage.getItem('auth_token');
  return t && t.includes('.') ? t : null;
}

export function getAdminToken() {
  const raw = localStorage.getItem('admin_token');
  if (!raw) return null;
  if (raw.includes('.') && !raw.startsWith('{')) return raw;
  try {
    const p = JSON.parse(raw);
    return p?.token && String(p.token).includes('.') ? p.token : null;
  } catch {
    return null;
  }
}

export function studentAuthHeaders(extra = {}) {
  const headers = { ...extra };
  const tok = getStudentToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  return headers;
}

export function studentJsonAuthHeaders() {
  return studentAuthHeaders({ 'Content-Type': 'application/json' });
}

export function adminAuthHeaders(extra = {}) {
  const headers = { ...extra };
  const tok = getAdminToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  return headers;
}

export function adminJsonAuthHeaders() {
  return adminAuthHeaders({ 'Content-Type': 'application/json' });
}
