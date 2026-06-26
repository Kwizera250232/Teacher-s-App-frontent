import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function AlumniWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/alumni/wallet');
        setWallet(data.wallet);
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading wallet...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h2 style={{ marginBottom: 4 }}>💰 Alumni Wallet</h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Track your composition rewards and payment history.
      </p>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <BalanceCard label="Reward Balance" value={`${wallet?.reward_balance || 0} RWF`} color="#059669" />
        <BalanceCard label="Total Earned" value={`${wallet?.total_earned || 0} RWF`} color="#2563eb" />
        <BalanceCard label="Total Paid" value={`${wallet?.total_paid || 0} RWF`} color="#7c3aed" />
        <BalanceCard label="Pending Rewards" value={`${wallet?.pending_rewards || 0} RWF`} color="#d97706" />
      </div>

      {/* Transactions */}
      <h3 style={{ marginBottom: 12 }}>Transaction History</h3>
      {transactions.length === 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 32, textAlign: 'center', color: '#64748b' }}>
          No transactions yet. Start writing compositions to earn rewards!
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#64748b' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, textTransform: 'capitalize' }}>
                    <span style={{
                      background: t.type === 'reward' ? '#ecfdf5' : '#f1f5f9',
                      color: t.type === 'reward' ? '#059669' : '#475569',
                      padding: '2px 8px', borderRadius: 12, fontSize: 12,
                    }}>
                      {t.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{t.description || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                    {t.amount} RWF
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'center' }}>
                    <span style={{
                      color: t.status === 'paid' ? '#059669' : t.status === 'pending' ? '#d97706' : '#dc2626',
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
          <strong>Note:</strong> Rewards are paid manually by administrators via Mobile Money. 
          You will receive an in-app notification and email when a reward is marked as paid.
        </p>
      </div>
    </div>
  );
}

function BalanceCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
