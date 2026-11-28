import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './DonateButton.css';

const AMOUNTS = [500, 1000, 2500, 5000, 10000];
const PURPOSE_ITEMS = [
  { icon: '👩‍🏫', text: 'Teachers prepare lessons & notes for every class' },
  { icon: '📝', text: 'Students do quizzes & homework from home' },
  { icon: '🎥', text: 'Live studying — teachers coach students remotely' },
  { icon: '📊', text: 'Schools generate Mid-Term, End-Term & Yearly reports' },
];

export default function DonateButton({ compact = false, fab = false }) {
  const { token } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('form'); // form | pending | success | failed
  const [reference, setReference] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pollRef = useRef(null);

  const effective = parseInt(custom, 10) || amount;

  useEffect(() => () => clearInterval(pollRef.current), []);

  const requestPath = token ? '/donate/mtn/request' : '/donate/public/mtn/request';
  const statusPath = (ref) => token ? `/donate/mtn/status/${ref}` : `/donate/public/mtn/status/${ref}`;

  const startPolling = (ref) => {
    clearInterval(pollRef.current);
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries += 1;
      try {
        const s = await api.get(statusPath(ref), token || undefined);
        if (s.status === 'SUCCESSFUL') { clearInterval(pollRef.current); setStage('success'); }
        else if (['FAILED', 'REJECTED', 'TIMEOUT', 'CANCELLED'].includes(s.status)) { clearInterval(pollRef.current); setStage('failed'); }
      } catch {}
      if (tries > 40) clearInterval(pollRef.current); // ~2 min
    }, 3000);
  };

  const donate = async () => {
    setError('');
    if (!/^\+?\d{9,15}$/.test(phone.replace(/\s/g, ''))) {
      setError('Enter a valid MTN phone number (e.g. 0788 123 456).');
      return;
    }
    if (!effective || effective < 500) {
      setError('Minimum donation is 500 RWF.');
      return;
    }
    setBusy(true);
    try {
      const data = await api.post(requestPath, { phone, amount: effective }, token || undefined);
      setReference(data.reference_id);
      if (data.status === 'SUCCESSFUL') {
        setStage('success');
      } else {
        setStage('pending');
        startPolling(data.reference_id);
      }
    } catch (e) {
      setError(e.message || 'Donation request failed — try again.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => { clearInterval(pollRef.current); setOpen(false); };

  return (
    <>
      <button
        type="button"
        className={`donate-header-btn ${compact ? 'donate-header-btn--compact' : ''} ${fab ? 'donate-header-btn--fab' : ''}`}
        onClick={() => { setStage('form'); setError(''); setOpen(true); }}
        title="Support UClass education"
        aria-label="Donate"
      >
        {compact ? '💛' : '💛 DONATE'}
      </button>
      {open && (
        <div className="donate-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="donate-modal" style={{ maxWidth: 480, width: '100%', textAlign: 'left', padding: 0, overflow: 'hidden', borderRadius: 20 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)', padding: '20px 24px', position: 'relative' }}>
              <button onClick={close} style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 15, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 30, marginBottom: 6 }}>💛</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 19 }}>Support UClass Education</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>Help keep learning tools free for Rwanda's schools</div>
            </div>

            <div style={{ padding: '20px 24px 24px' }}>
              {stage === 'success' ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 56, marginBottom: 10 }}>🎉</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Murakoze cyane!</h3>
                  <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
                    Thank you — your {effective.toLocaleString()} RWF donation helps Rwanda's teachers, students and schools keep learning with UClass.
                  </p>
                  <button onClick={close} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#ea580c)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Done</button>
                </div>
              ) : stage === 'pending' ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📱</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Check your phone</h3>
                  <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
                    An MTN MoMo prompt was sent to <strong>{phone}</strong> for <strong>{effective.toLocaleString()} RWF</strong>. Approve it — this page updates automatically.
                  </p>
                  <style>{`@keyframes donatePulse { 0%,80%,100%{opacity:.3} 40%{opacity:1} }`}</style>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#f59e0b', fontWeight: 700, fontSize: 14 }}>
                    <span style={{ animation: 'donatePulse 1.2s infinite' }}>●</span>
                    <span style={{ animation: 'donatePulse 1.2s 0.2s infinite' }}>●</span>
                    <span style={{ animation: 'donatePulse 1.2s 0.4s infinite' }}>●</span>
                    <span style={{ marginLeft: 6 }}>Waiting for approval…</span>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <button onClick={() => { clearInterval(pollRef.current); setStage('form'); }} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>← Back</button>
                  </div>
                </div>
              ) : (
                <>
                  {stage === 'failed' && (
                    <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>The payment was not approved — you can try again below.</div>
                  )}

                  {/* What UClass does */}
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 8 }}>What your donation powers:</div>
                    {PURPOSE_ITEMS.map(p => (
                      <div key={p.icon} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: '#78350f', marginBottom: 4 }}>
                        <span>{p.icon}</span><span>{p.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Amount picker */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 8 }}>Choose amount (RWF)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {AMOUNTS.map(a => (
                      <button key={a} type="button" onClick={() => { setAmount(a); setCustom(''); }} style={{
                        padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        border: effective === a && !custom ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                        background: effective === a && !custom ? '#fffbeb' : '#fff',
                        color: effective === a && !custom ? '#b45309' : '#64748b',
                      }}>{a.toLocaleString()}</button>
                    ))}
                  </div>
                  <input
                    type="number" min={500} placeholder="Or enter a custom amount (min 500)"
                    value={custom} onChange={e => setCustom(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}
                  />

                  {/* Phone */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 8 }}>MTN MoMo number</div>
                  <input
                    type="tel" placeholder="0788 123 456" value={phone} onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 6, boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 14 }}>You'll get a prompt on your phone to approve the payment.</div>

                  {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

                  <button
                    onClick={donate} disabled={busy}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#f59e0b,#ea580c)', color: '#fff',
                      fontWeight: 800, fontSize: 15, opacity: busy ? 0.6 : 1,
                      boxShadow: '0 4px 14px rgba(234,88,12,0.35)',
                    }}
                  >
                    {busy ? 'Sending request…' : `💛 Donate ${effective.toLocaleString()} RWF`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
