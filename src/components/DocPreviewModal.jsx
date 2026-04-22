import { useEffect, useState } from 'react';

export default function DocPreviewModal({ viewerUrl, fileUrl, fileName, onClose }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Derive a clean display name (strip uuid prefix like "1776870909850-416860117.")
  const displayName = fileName
    ? fileName.replace(/^\d+-\d+\./, '')
    : 'Document';

  const ext = displayName.split('.').pop().toUpperCase();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header bar */}
      <div style={{
        background: '#1e293b', padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, gap: 10,
      }}>
        {/* File name + type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <span style={{
            background: '#667eea', color: '#fff', fontWeight: 700,
            fontSize: 11, padding: '2px 8px', borderRadius: 4, flexShrink: 0,
          }}>{ext}</span>
          <span style={{
            color: '#fff', fontWeight: 600, fontSize: 15,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <a
            href={fileUrl || viewerUrl}
            download={displayName}
            style={{
              padding: '6px 14px', background: '#334155', color: '#fff',
              borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            ⬇ Download
          </a>
          <a href={fileUrl || viewerUrl} target="_blank" rel="noreferrer" style={{
            padding: '6px 14px', background: '#334155', color: '#fff',
            borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            ↗ New tab
          </a>
          <button onClick={onClose} style={{
            background: '#ef4444', color: '#fff', border: 'none',
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}>
            ✕ Close
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: '48px 0 0 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#f8fafc', zIndex: 1,
        }}>
          <div style={{
            width: 48, height: 48, border: '5px solid #e2e8f0',
            borderTopColor: '#667eea', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ marginTop: 16, color: '#64748b', fontWeight: 600 }}>Loading {displayName}…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Document iframe */}
      <iframe
        src={viewerUrl}
        style={{ flex: 1, border: 'none', background: '#fff' }}
        title={displayName}
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
