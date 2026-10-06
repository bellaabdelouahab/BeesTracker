export const TOKEN_KEY = 'ibee.token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = 'GET', body, params } = {}) {
  const qs = params ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')))}` : '';
  const res = await fetch(`/api${path}${qs}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && getToken()) window.dispatchEvent(new Event('ibee:unauthorized'));
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me').then((r) => r.user),
  overview: () => request('/overview'),
  hives: () => request('/hives'),
  hive: (id) => request(`/hives/${id}`),
  updateHive: (id, body) => request(`/hives/${id}`, { method: 'PATCH', body }),
  streams: (id, range) => request(`/hives/${id}/streams`, { params: { range } }),
  readings: (id, limit = 25) => request(`/hives/${id}/readings`, { params: { limit } }),
  inspections: (id) => request(`/hives/${id}/inspections`),
  addInspection: (id, body) => request(`/hives/${id}/inspections`, { method: 'POST', body }),
  notifications: (params) => request('/notifications', { params }),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => request('/notifications/read-all', { method: 'POST' }),
  analytics: (days) => request('/analytics', { params: { days } }),
  simulator: () => request('/simulator'),
  simulate: (body) => request('/simulator', { method: 'POST', body }),
  system: () => request('/system'),
  sendReading: (body) => request('/ingest', { method: 'POST', body }),
};
