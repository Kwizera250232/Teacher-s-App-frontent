import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function AdminAIRevision({ token }) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sessData, statsData] = await Promise.all([
        api.get('/ai-revision/admin/sessions', token),
        api.get('/ai-revision/admin/stats', token),
      ]);
      setSessions(sessData.sessions || []);
      setStats(statsData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/ai-revision/admin/sessions/${selected.id}/reply`, { reply }, token);
      setReply('');
      setSelected(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  const filtered = sessions.filter(s =>
    !filter ||
    s.student_name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.subject?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>🤖 AI Revision Dashboard</h2>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#667eea' }}>{stats.total_sessions}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Total Sessions</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>{stats.avg_score}%</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Average Score</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>By Subject</div>
            {(stats.by_subject || []).slice(0, 3).map(s => (
              <div key={s.subject} style={{ fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>{s.subject}</span>
                <span style={{ fontWeight: 600 }}>{s.count}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>By Grade</div>
            {(stats.by_grade || []).slice(0, 3).map(g => (
              <div key={g.grade} style={{ fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>{g.grade}</span>
                <span style={{ fontWeight: 600 }}>{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by student or subject..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 14, outline: 'none' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No sessions found.</div>}
        {filtered.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `hsl(${(s.student_id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {s.student_name?.[0] || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{s.student_name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.subject} · {s.quiz_type} · {s.grade}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.percentage >= 60 ? '#059669' : '#ef4444' }}>{s.percentage}%</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.score}/{s.total}</div>
            </div>
            {s.reflection_difficulty && (
              <div style={{ fontSize: 11, color: '#f59e0b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.reflection_difficulty}>
                💬 {s.reflection_difficulty.slice(0, 30)}
              </div>
            )}
            {s.admin_reply && <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✅ Replied</span>}
            <button onClick={() => { setSelected(s); setReply(s.admin_reply || ''); }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              View
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Quiz Session #{selected.id}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><span style={{ color: '#64748b', fontSize: 12 }}>Student</span><div style={{ fontWeight: 600 }}>{selected.student_name}</div></div>
              <div><span style={{ color: '#64748b', fontSize: 12 }}>Email</span><div style={{ fontWeight: 600 }}>{selected.student_email}</div></div>
              <div><span style={{ color: '#64748b', fontSize: 12 }}>Subject</span><div style={{ fontWeight: 600 }}>{selected.subject}</div></div>
              <div><span style={{ color: '#64748b', fontSize: 12 }}>Grade</span><div style={{ fontWeight: 600 }}>{selected.grade}</div></div>
              <div><span style={{ color: '#64748b', fontSize: 12 }}>Score</span><div style={{ fontWeight: 600 }}>{selected.score}/{selected.total} ({selected.percentage}%)</div></div>
              <div><span style={{ color: '#64748b', fontSize: 12 }}>Grade Letter</span><div style={{ fontWeight: 600 }}>{selected.grade_letter || 'N/A'}</div></div>
            </div>

            {selected.ai_feedback && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>AI Feedback</div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.6 }}>{selected.ai_feedback}</div>
              </div>
            )}

            {selected.reflection_difficulty && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Difficulty:</div>
                <div style={{ fontSize: 13 }}>{selected.reflection_difficulty}</div>
              </div>
            )}
            {selected.reflection_improvement && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Improvement:</div>
                <div style={{ fontSize: 13 }}>{selected.reflection_improvement}</div>
              </div>
            )}
            {selected.reflection_question && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Student Question:</div>
                <div style={{ fontSize: 13 }}>{selected.reflection_question}</div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Admin Reply</div>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a reply to this student's feedback..."
                style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setSelected(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={sendReply} disabled={sending || !reply.trim()} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
