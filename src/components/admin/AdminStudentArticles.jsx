import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';

/** Strip leading pin emoji / legacy mojibake from article first line. */
function articleTitle(content) {
  const first = String(content || '').split('\n')[0] || '';
  return first
    .replace(/^[\u{1F4CC}\u{FE0F}\u{200D}]+\s*/gu, '')
    .replace(/^📌\s*/, '')
    .replace(/^[\x00-\x1F]+/, '')
    .trim() || 'Untitled';
}

export default function AdminStudentArticles({ token }) {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewText, setReviewText] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [source, setSource] = useState('shares');
  const [alumniRows, setAlumniRows] = useState([]);
  const [reading, setReading] = useState(null);
  const [rewardAmt, setRewardAmt] = useState({});

  const loadAlumni = () => {
    setLoading(true);
    setError('');
    api.get('/alumni/admin/feed-posts', token)
      .then(d => setAlumniRows(d.posts || []))
      .catch(e => setError(e.message || 'Failed to load alumni articles.'))
      .finally(() => setLoading(false));
  };

  const alumniReview = async (id, st) => {
    setSavingId('a' + id);
    try { await api.put(`/alumni/admin/feed-posts/${id}/review`, { status: st }, token); loadAlumni(); }
    catch (e) { setError(e.message || 'Review failed.'); }
    finally { setSavingId(null); }
  };

  const alumniReward = async (id) => {
    const amount = Math.floor(Number(rewardAmt[id] || 0));
    if (!amount) { setError('Enter a reward amount in RWF first.'); return; }
    setSavingId('a' + id);
    try { await api.post(`/alumni/admin/feed-posts/${id}/reward`, { amount }, token); setRewardAmt(p => ({ ...p, [id]: '' })); loadAlumni(); }
    catch (e) { setError(e.message || 'Reward failed.'); }
    finally { setSavingId(null); }
  };

  const counts = useMemo(() => {
    return rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, { pending: 0, approved: 0, declined: 0 });
  }, [rows]);

  const load = () => {
    setLoading(true);
    setError('');
    api.get(`/admin/student-shares?status=${status}`, token)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message || 'Failed to load student articles.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (source === 'shares') load(); else loadAlumni();
  }, [status, source]);

  const moderate = async (id, decision) => {
    setSavingId(id);
    setError('');
    try {
      const note = (reviewText[id] || '').trim();
      if (decision === 'declined' && !note) {
        setError('Please enter a decline reason.');
        return;
      }
      await api.put(`/admin/student-shares/${id}/moderate`, { decision, review_note: note }, token);
      setRows(prev => prev.filter(r => r.id !== id));
      setReviewText(prev => ({ ...prev, [id]: '' }));
    } catch (e) {
      setError(e.message || 'Moderation failed.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Articles Review</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'shares', label: '🧾 Student Shares' },
            { key: 'alumni', label: '🎓 Alumni Posts' },
          ].map(t => (
            <button key={t.key} className={`btn-sm ${source === t.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSource(t.key)}>
              {t.label}
            </button>
          ))}
          {source === 'shares' && [
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'declined', label: 'Declined' },
            { key: 'all', label: 'All' },
          ].map(t => (
            <button key={t.key} className={`btn-sm ${status === t.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatus(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span className="badge badge-blue">Pending: {counts.pending || 0}</span>
        <span className="badge badge-green">Approved: {counts.approved || 0}</span>
        <span className="badge badge-red">Declined: {counts.declined || 0}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <p className="empty-text">Loading...</p> : null}

      {!loading && source === 'shares' && rows.length === 0 && (
        <p className="empty-text">No articles for this filter.</p>
      )}

      {!loading && source === 'alumni' && (alumniRows.length === 0 ? (
        <p className="empty-text">No alumni articles yet.</p>
      ) : alumniRows.map(p => {
        const badge = p.review_status === 'approved' ? { t: '✅ Approved', c: '#16a34a', bg: '#dcfce7' }
          : p.review_status === 'flagged' ? { t: '🚩 Flagged', c: '#dc2626', bg: '#fee2e2' }
          : { t: '⏳ Pending review', c: '#b45309', bg: '#fef3c7' };
        return (
          <div key={'a' + p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.author_name} <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b' }}>· {p.author_role}{p.school_name ? ` · ${p.school_name}` : ''}</span></div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {new Date(p.created_at).toLocaleString()} · 👁 {p.views_count || 0} · ❤️ {p.likes_count || 0} · 💬 {p.comments_count || 0}{p.rewarded > 0 ? ` · 🎁 ${p.rewarded.toLocaleString()} RWF` : ''}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: badge.bg, color: badge.c, height: 'fit-content' }}>{badge.t}</span>
            </div>
            <p style={{ marginTop: 8, color: '#334155', fontSize: 13, lineHeight: 1.55 }}>{String(p.content || '📷 image post').slice(0, 260)}{String(p.content || '').length > 260 ? '…' : ''}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn-sm btn-outline" onClick={() => setReading(p)}>📖 Read</button>
              <button className="btn-sm btn-success" disabled={savingId === 'a' + p.id} onClick={() => alumniReview(p.id, 'approved')}>Approve</button>
              <button className="btn-sm btn-danger" disabled={savingId === 'a' + p.id} onClick={() => alumniReview(p.id, 'flagged')}>Flag</button>
              <input className="admin-input" style={{ maxWidth: 120 }} type="number" min="1" placeholder="RWF" value={rewardAmt[p.id] || ''} onChange={e => setRewardAmt(prev => ({ ...prev, [p.id]: e.target.value }))} />
              <button className="btn-sm btn-primary" disabled={savingId === 'a' + p.id} onClick={() => alumniReward(p.id)}>🎁 Reward</button>
            </div>
          </div>
        );
      }))}

      {reading && (
        <div onClick={() => setReading(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 640, width: '100%', maxHeight: '80vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>{reading.author_name} <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b' }}>{reading.school_name || ''} · {new Date(reading.created_at).toLocaleString()}</span></strong>
              <button onClick={() => setReading(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {Array.isArray(reading.image_paths) && reading.image_paths.map((img, i) => (
              <img key={i} src={String(img).startsWith('http') ? img : `/uploads/${img}`} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 12 }} />
            ))}
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#1e293b' }}>{reading.content}</div>
          </div>
        </div>
      )}

      {!loading && source === 'shares' && rows.map(a => {
        const lines = String(a.content || '').split('\n');
        const title = articleTitle(a.content);
        const shortText = lines.slice(1).join(' ').slice(0, 260);
        return (
          <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Student: {a.student_name} ({a.student_email})
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  School: {a.school || '—'} · Class: {a.class_name || '—'} · Teacher: {a.teacher_name || '—'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {new Date(a.created_at).toLocaleString()} · status: {a.status}
                </div>
              </div>
              {a.status === 'declined' && a.review_note && (
                <div style={{ fontSize: 12, color: '#991b1b', background: '#fee2e2', borderRadius: 6, padding: '6px 10px', maxWidth: 320 }}>
                  Decline reason: {a.review_note}
                </div>
              )}
            </div>

            <p style={{ marginTop: 8, color: '#334155', fontSize: 13, lineHeight: 1.55 }}>
              {shortText}{String(a.content || '').length > 260 ? '...' : ''}
            </p>

            {a.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="admin-input"
                  style={{ maxWidth: 360 }}
                  placeholder="Decline reason (required only if declining)"
                  value={reviewText[a.id] || ''}
                  onChange={e => setReviewText(prev => ({ ...prev, [a.id]: e.target.value }))}
                />
                <button className="btn-sm btn-success" disabled={savingId === a.id} onClick={() => moderate(a.id, 'approved')}>
                  Approve
                </button>
                <button className="btn-sm btn-danger" disabled={savingId === a.id} onClick={() => moderate(a.id, 'declined')}>
                  Decline
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
