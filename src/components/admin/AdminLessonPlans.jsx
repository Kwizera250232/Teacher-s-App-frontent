import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function AdminLessonPlans({ token }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('paid'); // 'paid' | 'all' | teacher id
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [sendErr, setSendErr] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/lesson-plan/admin/subscribers', token)
      .then(r => setSubs(r.subscribers || []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [token]);

  const activeSubs = subs.filter(s => s.active && s.status === 'SUCCESSFUL');
  const uniqueTeachers = [...new Map(activeSubs.map(s => [s.teacher_id, s])).values()];

  const send = async (e) => {
    e.preventDefault();
    setSendMsg(''); setSendErr('');
    if (!subject.trim() || !message.trim()) {
      return setSendErr('Subject and message are required.');
    }
    const teacher_ids = target === 'paid' || target === 'all' ? target : [Number(target)];
    setSending(true);
    try {
      const r = await api.post('/lesson-plan/admin/email', { teacher_ids, subject: subject.trim(), message: message.trim() }, token);
      setSendMsg(`Sent to ${r.sent} teacher(s)${r.failed ? `, ${r.failed} failed` : ''}.`);
      setSubject(''); setMessage('');
    } catch (e2) {
      setSendErr(e2.message || 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <h3 className="admin-card-title">💎 Lesson Plan Pro — Paid Teachers</h3>
        {loading ? (
          <p className="empty-text">Loading…</p>
        ) : subs.length === 0 ? (
          <p className="empty-text">No lesson plan payments yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Email</th>
                  <th>Paid with</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Plans saved</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email || '—'}</td>
                    <td>{s.pay_phone}</td>
                    <td>{Number(s.amount).toLocaleString()} RWF</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                        background: s.active ? '#dcfce7' : '#fee2e2',
                        color: s.active ? '#166534' : '#991b1b',
                      }}>
                        {s.active ? '● Active term' : 'Expired/' + s.status}
                      </span>
                    </td>
                    <td>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                    <td>{s.plans_saved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">📧 Email Teachers</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
          One-way email — goes straight to the teacher's inbox. They cannot reply to it.
        </p>
        {sendErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{sendErr}</div>}
        {sendMsg && <div className="alert alert-success" style={{ marginBottom: 12 }}>{sendMsg}</div>}
        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Send to</label>
            <select className="admin-input" value={target} onChange={e => setTarget(e.target.value)} style={{ marginTop: 6 }}>
              <option value="paid">All teachers with an active Lesson Plan term ({uniqueTeachers.length})</option>
              <option value="all">All teachers on UClass</option>
              {uniqueTeachers.map(t => (
                <option key={t.teacher_id} value={t.teacher_id}>{t.name} ({t.email || 'no email'})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Subject</label>
            <input className="admin-input" style={{ marginTop: 6 }} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Lesson Plan Generator update" />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Message</label>
            <textarea className="admin-input" rows={6} style={{ marginTop: 6, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write the message…" />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Sending…' : '📤 Send email now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
