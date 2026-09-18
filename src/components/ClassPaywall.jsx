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

  const card = { background: '#fff', borderRadius: 16, padding: 28, maxWidth: 440, margin: '40px auto', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' };

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={card}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🔒</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, color: '#111827' }}>This class requires a subscription</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 18px' }}>
          <strong>{className}</strong>{teacherName ? ` · by ${teacherName}` : ''}
        </p>

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
          /* Pending state — MoMo USSD flow */
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📱</div>
            <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Check your phone</p>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px' }}>
              Approve the MTN MoMo payment on <strong>{phone}</strong> (dial the prompt / enter PIN).
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={checkNow} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                ✓ Check status
              </button>
              <button onClick={() => { setReferenceId(null); setStatus(null); }} style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Change number
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 14 }}>Status: {status} — checking automatically every 5s</p>
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
  );
}
