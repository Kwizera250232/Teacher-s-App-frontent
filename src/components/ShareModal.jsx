import { useState } from 'react';

export default function ShareModal({ title, text, url, onClose }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = text || title || '';

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch {
      // user cancelled or not supported
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const encoded = encodeURIComponent(shareUrl);
  const textEncoded = encodeURIComponent(shareText);

  const socials = [
    {
      name: 'WhatsApp',
      color: '#25d366',
      icon: '💬',
      href: `https://wa.me/?text=${textEncoded}%20${encoded}`,
    },
    {
      name: 'Facebook',
      color: '#1877f2',
      icon: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}&quote=${textEncoded}`,
    },
    {
      name: 'Twitter / X',
      color: '#000000',
      icon: '🐦',
      href: `https://twitter.com/intent/tweet?text=${textEncoded}&url=${encoded}`,
    },
    {
      name: 'Telegram',
      color: '#0088cc',
      icon: '✈️',
      href: `https://t.me/share/url?url=${encoded}&text=${textEncoded}`,
    },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>📤 Share</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        {/* Content preview card (mimics social media link preview) */}
        {title && (
          <div style={{
            marginBottom: 16, border: '1.5px solid #e2e8f0', borderRadius: 10,
            overflow: 'hidden', background: '#f8fafc',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              height: 6,
            }} />
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                uclass.vercel.app
              </div>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14, marginBottom: 3 }}>
                🎓 UClass
              </div>
              <div style={{ fontSize: 13, color: '#475569', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {title}
              </div>
            </div>
          </div>
        )}

        {/* Native share button (mobile) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <button onClick={handleNativeShare} style={{
            width: '100%', padding: '11px 16px', marginBottom: 14,
            background: '#667eea', color: '#fff', border: 'none',
            borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 15,
          }}>
            📤 Share via...
          </button>
        )}

        {/* Social buttons grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {socials.map(s => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10, background: s.color,
                color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none',
              }}
            >
              {s.icon} {s.name}
            </a>
          ))}
        </div>

        {/* Copy link row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly
            value={shareUrl}
            style={{
              flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0',
              borderRadius: 8, fontSize: 12, color: '#475569', minWidth: 0,
            }}
          />
          <button onClick={copyLink} style={{
            padding: '8px 14px', background: copied ? '#22c55e' : '#667eea',
            color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600,
            cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', transition: 'background 0.2s',
          }}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
