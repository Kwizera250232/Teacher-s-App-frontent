import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './DonateButton.css';

export default function DonateButton() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('500');
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
      setInfo({ min_amount: 500, currency: 'RWF', mode: 'demo' });
    }
  };

  const pay = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!refId) return;
    try {
      const res = await api.get(`/donate/mtn/status/${refId}`, token);
      setMsg(`Status: ${res.status}`);
    } catch (err) {
      setError(err.message);
    }
  };

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
              Help us keep improving learning tools for Rwanda schools. Minimum <strong>500 RWF</strong> via MTN MoMo (sandbox test).
            </p>
            {info?.mtn_configured === false && (
              <p className="donate-hint">Sandbox demo mode — set MTN API keys on server for live MoMo tests.</p>
            )}
            <form onSubmit={pay}>
              <label>
                MTN phone (Rwanda)
                <input
                  type="tel"
                  placeholder="0781234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label>
                Amount (RWF, min {info?.min_amount || 500})
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
              {error && <p className="donate-err">{error}</p>}
              {msg && <p className="donate-ok">{msg}</p>}
              <div className="donate-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Pay with MTN MoMo'}
                </button>
                {refId && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={checkStatus}>
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
