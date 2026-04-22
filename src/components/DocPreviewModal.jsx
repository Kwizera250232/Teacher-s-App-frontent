import { useEffect } from 'react';

export default function DocPreviewModal({ viewerUrl, fileName, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header bar */}
      <div style={{
        background: '#1e293b', padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📄 {fileName}
        </span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <a href={viewerUrl} target="_blank" rel="noreferrer" style={{
            padding: '6px 14px', background: '#334155', color: '#fff',
            borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            ↗ Open in new tab
          </a>
          <button onClick={onClose} style={{
            background: '#ef4444', color: '#fff', border: 'none',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}>
            ✕ Close
          </button>
        </div>
      </div>

      {/* Document iframe */}
      <iframe
        src={viewerUrl}
        style={{ flex: 1, border: 'none', background: '#fff' }}
        title={fileName}
        allowFullScreen
      />
    </div>
  );
}
