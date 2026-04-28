import { createPortal } from 'react-dom';
import { useState } from 'react';
import { UPLOADS_BASE, api } from '../api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23667eea'/%3E%3Ctext y='.9em' font-size='50' x='25' fill='white'%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E";

function tryParse(val, fallback) {
  try { return JSON.parse(val) || fallback; } catch { return fallback; }
}

export default function ClassmateProfileModal({ person, onClose, onMessage }) {
  const { token } = useAuth();
  const schools = tryParse(person.schools, []);
  const favLessons = tryParse(person.favorite_lessons, []);
  const hobbies = tryParse(person.hobbies, []);
  const initials = person.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  const bg = colors[(parseInt(person.id) || 0) % colors.length];

  const [subscribed, setSubscribed] = useState(!!person.i_subscribed);
  const [subCount, setSubCount] = useState(person.subscriber_count || 0);
  const [subLoading, setSubLoading] = useState(false);

  async function toggleSubscribe() {
    if (subLoading) return;
    setSubLoading(true);
    try {
      const res = await api.post(`/profile/${person.id}/subscribe`, {}, token);
      setSubscribed(res.subscribed);
      setSubCount(res.subscriber_count);
    } catch (e) {
      console.error('Subscribe error:', e);
    } finally {
      setSubLoading(false);
    }
  }

  const modal = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 99999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        fontFamily: 'inherit',
      }}
    >
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        borderRadius: '24px 24px 0 0',
        overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16,
          background: '#f1f5f9', border: 'none', borderRadius: '50%',
          width: 34, height: 34, fontSize: 16, cursor: 'pointer',
          color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>âœ•</button>

        {/* Hero section */}
        <div style={{
          textAlign: 'center',
          padding: '36px 24px 20px',
          background: 'linear-gradient(160deg, rgba(102,126,234,0.06) 0%, rgba(118,75,162,0.06) 100%)',
          borderBottom: '1px solid #f1f5f9',
        }}>
          {person.avatar_path
            ? <img src={`${UPLOADS_BASE}${person.avatar_path}`} alt={person.name} style={{
                width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                border: '4px solid #fff', boxShadow: '0 4px 18px rgba(0,0,0,0.15)', marginBottom: 12,
              }} />
            : <div style={{
                width: 96, height: 96, borderRadius: '50%', background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 32,
                margin: '0 auto 12px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
              }}>{initials}</div>
          }

          {/* Name + verified badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{person.name}</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#1d9bf0"/>
              <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <span style={{
            display: 'inline-block', padding: '3px 14px', borderRadius: 20,
            fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
            background: person.role === 'teacher' ? '#d1fae5' : '#e0e7ff',
            color: person.role === 'teacher' ? '#065f46' : '#3730a3',
            marginBottom: 6,
          }}>{person.role}</span>

          {person.email && <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>✉️ {person.email}</div>}

          {/* Subscriber count */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 14, marginBottom: 2 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#5c6bc0', lineHeight: 1 }}>{subCount}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Subscribers</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '0 20px 4px' }}>
          {(person.phone || person.home_address || schools.length > 0) && (
            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: '#667eea', marginBottom: 10 }}>ðŸ“‹ Personal Info</div>
              {person.phone && <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#374151' }}><span>ðŸ“ž</span><span>{person.phone}</span></div>}
              {person.home_address && <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#374151' }}><span>ðŸ </span><span>{person.home_address}</span></div>}
              {schools.length > 0 && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: '#374151' }}>
                  <span>ðŸ«</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {schools.map((s, i) => <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {(person.dreams || favLessons.length > 0 || hobbies.length > 0 || person.fears) && (
            <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: '#667eea', marginBottom: 10 }}>âœ¨ About Me</div>
              {person.dreams && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>ðŸŒŸ Dreams</div>
                  <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{person.dreams}</p>
                </div>
              )}
              {favLessons.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>ðŸ“š Favorite Lessons</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {favLessons.map((l, i) => <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{l}</span>)}
                  </div>
                </div>
              )}
              {hobbies.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>ðŸŽ¯ Hobbies</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {hobbies.map((h, i) => <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{h}</span>)}
                  </div>
                </div>
              )}
              {person.fears && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>😰 What I Fear</div>
                  <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{person.fears}</p>
                </div>
              )}
            </div>
          )}

          {!(person.dreams || favLessons.length > 0 || hobbies.length > 0 || person.phone || schools.length > 0) && (
            <p style={{ textAlign: 'center', color: '#aaa', padding: '24px 0', fontSize: 14 }}>
              This person hasn't filled their profile yet.
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 20px 32px', borderTop: '1px solid #f1f5f9' }}>
          {/* Subscribe button */}
          <button
            onClick={toggleSubscribe}
            disabled={subLoading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: subscribed
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', border: 'none', fontWeight: 700, fontSize: 15,
              cursor: subLoading ? 'not-allowed' : 'pointer',
              opacity: subLoading ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {subscribed ? '✅ Subscribed' : '➕ Subscribe'}
            <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.9 }}>· {subCount} subscribers</span>
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {onMessage && (
              <button onClick={() => onMessage(person.id)} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}>💬 Send Message</button>
            )}
            <button onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              background: '#f1f5f9', color: '#374151', border: 'none',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
