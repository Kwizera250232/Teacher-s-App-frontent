import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

/** Warn when studentapi.umunsi.com is still on an old build (404 on new routes). */
export default function StaleApiBanner() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const healthRes = await fetch(`${API_BASE}/health`);
        const health = healthRes.ok ? await healthRes.json() : null;
        if (health?.features?.class_images && health?.features?.quiz_teacher_shares) {
          if (!cancelled) setStale(false);
          return;
        }
        const probe = await fetch(`${API_BASE}/quiz-teacher-shares/colleagues`);
        if (!cancelled) setStale(probe.status === 404);
      } catch {
        if (!cancelled) setStale(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!stale) return null;

  return (
    <div
      className="alert alert-error"
      style={{ marginBottom: 16, lineHeight: 1.5 }}
      role="alert"
    >
      <strong>Server update required.</strong>{' '}
      Class photos, note sharing, and &ldquo;Share w/ teacher&rdquo; need the latest API on{' '}
      <code>studentapi.umunsi.com</code>. Your uploads are not saved until the server is updated.
      Ask your admin to run the Hostinger deploy script, then hard-refresh this page and upload again.
    </div>
  );
}
