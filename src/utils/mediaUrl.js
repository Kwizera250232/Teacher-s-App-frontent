import { UPLOADS_BASE } from '../api';

/** Media files are stored on the API server under /uploads/. */
export function resolveMediaUrl(path) {
  if (!path) return null;
  const raw = String(path).trim();
  if (raw.startsWith('blob:') || raw.startsWith('http')) return raw;

  const base = (UPLOADS_BASE || 'https://studentapi.umunsi.com').replace(/\/$/, '');
  let p = raw.replace(/^\/+/, '');

  if (!p.startsWith('uploads/')) {
    p = `uploads/${p}`;
  }

  return `${base}/${p}`;
}
