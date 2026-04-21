const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(method, endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (endpoint, token) => request('GET', endpoint, null, token),
  post: (endpoint, body, token) => request('POST', endpoint, body, token),
  put: (endpoint, body, token) => request('PUT', endpoint, body, token),
  delete: (endpoint, token) => request('DELETE', endpoint, null, token),
};

export async function uploadFile(endpoint, formData, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}
