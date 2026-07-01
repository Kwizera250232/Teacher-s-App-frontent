import { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function BadgeSvg({ sz }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" aria-label="Verified">
      <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
      <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function VerifiedBadge({ size = 16, userId = null, info = null, onViewProfile = null }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [cachedInfo, setCachedInfo] = useState(info);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open || !userId || cachedInfo || fetching) return;
    setFetching(true);
    api.get(`/alumni/verify-info/${userId}`, token)
      .then((data) => {
        const items = [
          { icon: '🏫', label: 'School', value: data.school_name || '—' },
          { icon: '🎓', label: 'Class Joined', value: data.class_name || '—' },
          { icon: '👨‍🏫', label: 'Teacher', value: data.teacher_name || '—' },
          { icon: '⭐', label: 'Points', value: String(data.points || 0) },
          { icon: '✍️', label: 'Articles', value: String(data.total_compositions || 0) },
          { icon: '👥', label: 'Followers', value: String(data.followers_count || 0) },
        ];
        setCachedInfo({ items });
      })
      .catch(() => setCachedInfo({ items: [] }))
      .finally(() => setFetching(false));
  }, [open, userId, cachedInfo, fetching, token]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0, verticalAlign: 'middle' }}
    >
      <span
        style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4, cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <BadgeSvg sz={size} />
      </span>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            padding: '1rem 1.1rem 0.85rem',
            minWidth: 240,
            zIndex: 9999,
            textAlign: 'left',
          }}
        >
          <div style={{
            position: 'absolute', bottom: -6, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12, height: 12,
            background: '#fff',
            boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <BadgeSvg sz={20} />
            <strong style={{ fontSize: 14, color: '#0f1419' }}>Verified UClass Alumni</strong>
          </div>

          {fetching ? (
            <div style={{ padding: '12px 0', textAlign: 'center', color: '#536471', fontSize: 13 }}>Loading...</div>
          ) : (
            (cachedInfo?.items || []).map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '7px 0',
                borderTop: '1px solid #eff3f4',
              }}>
                <span style={{ fontSize: 16, lineHeight: 1.2 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 10, color: '#536471', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#0f1419', fontWeight: 500, marginTop: 1 }}>{item.value || '—'}</div>
                </div>
              </div>
            ))
          )}

          {onViewProfile && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onViewProfile(); }}
              style={{
                marginTop: 10, width: '100%', padding: '9px 0',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              👤 View Profile &amp; Subscribe
            </button>
          )}
        </div>
      )}
    </span>
  );
}
