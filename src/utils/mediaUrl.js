import { UPLOADS_BASE } from '../api';

/** Resolve feed/uploads path — use student.umunsi.com in browser (Vercel proxies /uploads). */
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : (UPLOADS_BASE || 'https://student.umunsi.com').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${p}`;
}
