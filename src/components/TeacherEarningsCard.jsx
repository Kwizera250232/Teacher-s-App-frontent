import { useState, useEffect } from 'react';
import { api } from '../api';

/**
 * Teacher earnings card for the dashboard.
 * Shows 70% share of class subscription payments, withdraw button
 * (min 7,000 RWF) via MTN MoMo disbursement, and payment history.
 */
export default function TeacherEarningsCard({ token }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const d = await api.get('/teacher/earnings', token);
      setData(d);
    } catch { /* silent */ }
  };

  useEffect(() => { load(); }, []);

  const withdraw = async () => {
    setMsg('');
    if (!phone.trim()) { setMsg('Enter your MTN number'); return; }
    setWithdrawing(true);
    try {
      const r = await api.post('/teacher/withdraw', { phone: phone.trim() }, token);
      setMsg(`✓ ${r.message} (${r.amount?.toLocaleString()} RWF)`);
      setPhone('');
      load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (!data) return null;
  const canWithdraw = data.available >= data.withdraw_min;

  return (
    <div style={{
      background: 'linear-gradient(135deg,#064e3b,#047857)', borderRadius: 16,
      padding: 20, color: '#fff', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 2 }}>💰 My Earnings (70% share)</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{data.available.toLocaleString()} <span style={{ fontSize: 15, fontWeight: 600 }}>RWF</span></div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            Collected: {data.total_collected.toLocaleString()} RWF · Withdrawn: {data.withdrawn.toLocaleString()} RWF
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: canWithdraw ? '#ffcc00' : 'rgba(255,255,255,0.2)',
              color: canWithdraw ? '#1e1e1e' : '#fff', fontWeight: 800, fontSize: 14,
            }}
          >
            Withdraw
          </button>
        </div>
      </div>

      {!canWithdraw && (
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
          Minimum withdrawal: {data.withdraw_min.toLocaleString()} RWF
        </div>
      )}

      {open && (
        <div style={{ marginTop: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 14 }}>
          {canWithdraw ? (
            <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.9 }}>
                MTN MoMo number to receive {data.available.toLocaleString()} RWF
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="tel" placeholder="0781234567" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none', fontSize: 14, color: '#111' }}
                />
                <button onClick={withdraw} disabled={withdrawing}
                  style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#ffcc00', fontWeight: 800, cursor: withdrawing ? 'not-allowed' : 'pointer', color: '#1e1e1e' }}>
                  {withdrawing ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
              Keep going! You need {Math.max(0, data.withdraw_min - data.available).toLocaleString()} RWF more to withdraw.
            </p>
          )}
          {msg && <p style={{ margin: '10px 0 0', fontSize: 13, color: msg.startsWith('✓') ? '#86efac' : '#fca5a5' }}>{msg}</p>}

          {/* History */}
          {(data.withdrawals?.length > 0 || data.recent_payments?.length > 0) && (
            <div style={{ marginTop: 14, fontSize: 12 }}>
              {data.withdrawals?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.9 }}>Withdrawals</div>
                  {data.withdrawals.map(w => (
                    <div key={w.id} style={{ display: 'flex', gap: 8, opacity: 0.85, padding: '2px 0' }}>
                      <span style={{ flex: 1 }}>{w.amount.toLocaleString()} RWF → {w.phone}</span>
                      <span>{w.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.recent_payments?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.9 }}>Recent payments</div>
                  {data.recent_payments.slice(0, 5).map(p => (
                    <div key={p.id} style={{ display: 'flex', gap: 8, opacity: 0.85, padding: '2px 0' }}>
                      <span style={{ flex: 1 }}>{p.student_name} — {p.class_name}</span>
                      <span>+{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
