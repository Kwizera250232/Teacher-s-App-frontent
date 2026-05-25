import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './DonateButton.css';

export default function DonateButton() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState('mtn_momo');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [refId, setRefId] = useState('');

  const openModal = async () => {
    setOpen(true);
    setError('');
    setMsg('');
    try {
      const data = await api.get('/donate/info', token);
      setInfo(data);
    } catch {
      setInfo({ min_amount: 500, currency: 'RWF', mode: 'demo', payment_methods: [] });
    }
  };

  const pay = async (e) => {
    e.preventDefault();
    if (method !== 'mtn_momo') {
      setError('This payment method is coming soon. Use MTN MoMo for testing now.');
      return;
    }
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/donate/mtn/request', {
        phone,
        amount: parseInt(amount, 10),
      }, token);
      setRefId(res.reference_id);
      setMsg(res.message);
      if (res.mode === 'demo' || res.demo) {
        setTimeout(async () => {
          try {
            const st = await api.get(`/donate/mtn/status/${res.reference_id}`, token);
            setMsg(`Test successful! Status: ${st.status}. Thank you for supporting education.`);
          } catch { /* ignore */ }
        }, 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!refId) return;
    setLoading(true);
    try {
      const res = await api.get(`/donate/mtn/status/${refId}`, token);
      setMsg(`Payment status: ${res.status}${res.demo ? ' (sandbox test)' : ''}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const methods = info?.payment_methods || [
    { id: 'mtn_momo', name: 'MTN Mobile Money', active: true },
    { id: 'airtel', name: 'Airtel Money', active: false },
    { id: 'card', name: 'Bank / Card', active: false },
  ];

  return (
    <>
      <button type="button" className="donate-header-btn" onClick={openModal} title="Support UClass education">
        💛 DONATE
      </button>
      {open && (
        <div className="donate-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="donate-modal">
            <h3>Support UClass Education</h3>
            <p className="donate-tagline">
              Help us keep updating tools for Rwanda schools. Minimum <strong>500 RWF</strong>.
            </p>

            <div className="donate-methods">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`donate-method-btn ${method === m.id ? 'active' : ''} ${!m.active ? 'soon' : ''}`}
                  onClick={() => m.active && setMethod(m.id)}
                  disabled={!m.active}
                >
                  {m.name}{!m.active ? ' (soon)' : ''}
                </button>
              ))}
            </div>

            {info?.mtn_sandbox_steps && (
              <details className="donate-sandbox-details">
                <summary>MTN MoMo sandbox APIs (test checklist)</summary>
                <ul>
                  {info.mtn_sandbox_steps.map((s) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
              </details>
            )}

            {!info?.mtn_configured && (
              <p className="donate-hint">
                <strong>Test mode:</strong> No MTN API keys on server yet — payments run as sandbox demo (auto-success for testing). Add keys for live MoMo sandbox.
              </p>
            )}

            <form onSubmit={pay}>
              <label>
                MTN phone (Rwanda)
                <input type="tel" placeholder="0781234567" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>
              <label>
                Amount (RWF, min {info?.min_amount || 500})
                <input type="number" min={500} step={100} value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </label>
              {error && <p className="donate-err">{error}</p>}
              {msg && <p className="donate-ok">{msg}</p>}
              <div className="donate-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Pay with MTN MoMo'}
                </button>
                {refId && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={checkStatus} disabled={loading}>
                    Check status
                  </button>
                )}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
