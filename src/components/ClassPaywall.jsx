import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

/**
 * Class paywall — shown when a student opens a paid class without
 * an active subscription. MTN MoMo USSD-push flow:
 * enter phone → approve on phone → auto-poll → unlocked.
 */
export default function ClassPaywall({ classId, className, teacherName, access, token, onUnlocked }) {
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [referenceId, setReferenceId] = useState(null);
  const [status, setStatus] = useState(null); // PENDING | SUCCESSFUL | FAILED
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const amount = access?.amount_rwf || 0;
  const days = access?.duration_days || 30;
  const benefits = access?.benefits || [];

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startPolling = (ref) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const s = await api.get(`/classes/${classId}/pay-status/${ref}`, token);
        setStatus(s.status);
        if (s.status === 'SUCCESSFUL') {
          clearInterval(pollRef.current);
          setTimeout(() => onUnlocked?.(), 1500);
        } else if (s.status === 'FAILED' || s.status === 'REJECTED' || s.status === 'EXPIRED') {
          clearInterval(pollRef.current);
          setError(s.reason_message || 'Payment was not completed. Try again.');
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  const pay = async () => {
    setError('');
    if (!phone.trim()) { setError('Enter your MTN number (e.g. 0781234567)'); return; }
    setPaying(true);
    try {
      const r = await api.post(`/classes/${classId}/pay`, { phone: phone.trim() }, token);
      if (r.already_paid) { onUnlocked?.(); return; }
      setReferenceId(r.reference_id);
      setStatus(r.status);
      if (r.status === 'SUCCESSFUL') {
        setTimeout(() => onUnlocked?.(), 1200);
      } else {
        startPolling(r.reference_id);
      }
    } catch (e) {
      setError(e.message || 'Payment failed. Try again.');
    } finally {
      setPaying(false);
    }
  };

  const checkNow = async () => {
    if (!referenceId) return;
    try {
      const s = await api.get(`/classes/${classId}/pay-status/${referenceId}`, token);
      setStatus(s.status);
      if (s.status === 'SUCCESSFUL') {
        if (pollRef.current) clearInterval(pollRef.current);
        setTimeout(() => onUnlocked?.(), 1200);
      } else if (s.status === 'FAILED' && s.reason_message) {
        setError(s.reason_message);
      }
    } catch (e) { setError(e.message); }
  };

  const goBack = () => { window.history.back(); };

  return (
    /* Modal overlay — writer-style popup */
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 0, maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Header — icon + title + subtitle + close */}
        <div style={{ padding: '24px 24px 0', position: 'relative' }}>
          <button onClick={goBack} aria-label="Close" style={{
            position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%',
            border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <span style={{ fontSize: 26 }}>⚡</span>
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 19, color: '#111827' }}>Pay for Class Access</h2>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0' }}>
            {className}{teacherName ? ` · by ${teacherName}` : ''}
          </p>
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', margin: '16px 0 0' }} />
        <div style={{ padding: '8px 24px 24px' }}>

        {/* Package card */}
        <div style={{ background: 'linear-gradient(135deg,#5A3FFF,#8B5CF6)', borderRadius: 12, padding: '18px 20px', color: '#fff', marginBottom: 18, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>📦 Class Package</span>
            <span style={{ fontWeight: 800, fontSize: 20 }}>{amount.toLocaleString()} RWF</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10 }}>Valid for {days} days</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13, lineHeight: 1.7 }}>
            {benefits.map((b, i) => (
              <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span>✓</span><span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {status === 'SUCCESSFUL' ? (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <p style={{ color: '#16a34a', fontWeight: 700 }}>Payment confirmed! Unlocking…</p>
          </div>
        ) : status && referenceId ? (
          /* Pending state — MoMo USSD flow (writer.umunsi.com style) */
          <div>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <span style={{ fontSize: 30 }}>🔔</span>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#111827' }}>Check your phone</h3>
            <p style={{ color: '#4b5563', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
              We sent a payment request to <strong>{(() => { let p = phone.replace(/\D/g, ''); if (p.startsWith('250')) return p; if (p.startsWith('0')) return '250' + p.slice(1); if (p.length === 9) return '250' + p; return p; })()}</strong>.
              Approve it on your phone to unlock this class.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
              <span className="paywall-spinner" style={{
                width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: '#5A3FFF',
                borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite',
              }} />
              <span style={{ fontSize: 13, color: '#6b7280' }}>Waiting for your approval…</span>
            </div>
            <div style={{
              background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8,
              padding: '10px 14px', fontSize: 12, color: '#854d0e', textAlign: 'left',
              display: 'flex', gap: 8, marginBottom: 16,
            }}>
              <span>⚠️</span>
              <span>The payment prompt expires after a few minutes. If you don't see it, dial <strong>*182#</strong> on your MTN phone.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
              <button onClick={() => { setReferenceId(null); setStatus(null); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Cancel and go back
              </button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          /* Phone entry */
          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              MTN MoMo number
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="tel"
                placeholder="0781234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#5A3FFF'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                onKeyDown={e => { if (e.key === 'Enter') pay(); }}
              />
            </div>
            <button
              onClick={pay}
              disabled={paying}
              style={{
                width: '100%', marginTop: 14, padding: '14px', borderRadius: 10, border: 'none',
                background: paying ? '#a5b4fc' : '#ffcc00', color: '#1e1e1e', fontWeight: 800,
                fontSize: 15, cursor: paying ? 'not-allowed' : 'pointer',
              }}
            >
              {paying ? 'Requesting…' : `📱 Pay ${amount.toLocaleString()} RWF with MTN MoMo`}
            </button>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
              You will receive a prompt on your phone to approve the payment.
            </p>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
