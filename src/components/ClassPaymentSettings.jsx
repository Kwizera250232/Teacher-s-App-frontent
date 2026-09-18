import { useState, useEffect } from 'react';
import { api } from '../api';

/**
 * Teacher panel: enable/disable class subscription + set price,
 * and see who paid. Rendered inside the class page (Pricing tab).
 */
export default function ClassPaymentSettings({ classId, token }) {
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [subscribers, setSubscribers] = useState([]);

  const load = async () => {
    try {
      const s = await api.get(`/classes/${classId}/payment-settings`, token);
      setEnabled(s.enabled);
      setAmount(s.amount_rwf ? String(s.amount_rwf) : '');
      setDuration(s.duration_days || 30);
      const subs = await api.get(`/classes/${classId}/subscribers`, token).catch(() => []);
      setSubscribers(Array.isArray(subs) ? subs : []);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [classId]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await api.put(`/classes/${classId}/payment-settings`, {
        enabled,
        amount_rwf: parseInt(amount, 10) || 0,
        duration_days: duration,
      }, token);
      setMsg('✓ Saved. New students will now be asked to pay before accessing class content.');
      load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ padding: 20, color: '#94a3b8' }}>Loading payment settings…</p>;

  const activeSubs = subscribers.filter(s => s.active && s.status === 'SUCCESSFUL');
  const totalCollected = subscribers.filter(s => s.status === 'SUCCESSFUL').reduce((a, s) => a + s.amount, 0);

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>💰 Class Subscription</h3>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px' }}>
          Charge students a monthly fee to access this class. You receive <strong>70%</strong> of each payment
          (30% covers platform costs). Withdraw earnings when your balance reaches 7,000 RWF.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: enabled ? '#f0fdf4' : '#f8fafc', borderRadius: 10, border: `2px solid ${enabled ? '#86efac' : '#e2e8f0'}`, cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{enabled ? 'Subscription enabled — students must pay' : 'Enable paid subscription'}</span>
        </label>

        {enabled && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Price (RWF)</label>
              <input
                type="number" min={100} step={100}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 1000"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Minimum 100 RWF</span>
            </div>
            <div style={{ minWidth: 140 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Access duration</label>
              <select value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14 }}>
                <option value={7}>7 days</option>
                <option value={30}>30 days (1 month)</option>
                <option value={90}>90 days (term)</option>
                <option value={365}>365 days (year)</option>
              </select>
            </div>
          </div>
        )}

        <button onClick={save} disabled={saving || (enabled && (!amount || parseInt(amount) < 100))}
          className="btn btn-primary" style={{ marginTop: 16, padding: '10px 24px', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {msg && <p style={{ fontSize: 13, color: msg.startsWith('✓') ? '#16a34a' : '#dc2626', marginTop: 10 }}>{msg}</p>}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120, background: '#fff', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#5A3FFF' }}>{activeSubs.length}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Active subscribers</div>
        </div>
        <div style={{ flex: 1, minWidth: 120, background: '#fff', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{totalCollected.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>RWF collected</div>
        </div>
      </div>

      {/* Subscribers list */}
      {subscribers.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Payments ({subscribers.length})</h4>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {subscribers.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{s.student_name}</span>
                <span style={{ color: '#6b7280' }}>{s.amount.toLocaleString()} RWF</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  background: s.active ? '#dcfce7' : s.status === 'PENDING' ? '#fef9c3' : '#fee2e2',
                  color: s.active ? '#166534' : s.status === 'PENDING' ? '#854d0e' : '#991b1b',
                }}>
                  {s.active ? `Active · ${Math.max(0, Math.ceil((new Date(s.expires_at) - Date.now()) / 86400000))}d left` : s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
