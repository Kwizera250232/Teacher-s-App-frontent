import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import ClassmateProfileModal from '../components/ClassmateProfileModal';
import VerifiedBadge from '../components/VerifiedBadge';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user, token, logout, isImpersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  // Quick note state: { classId, open, text, saving }
  const [quickNote, setQuickNote] = useState(null);
  const [classmatesClassId, setClassmatesClassId] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [classmatesLoading, setClassmatesLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const loadClasses = () => {
    api.get('/classes/my', token).then(setClasses).catch(e => setError(e.message));
  };

  const dismissAnnouncement = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    api.get('/admin/user-announcements', token).then(setAnnouncements).catch(() => {});
  }, []);
  useEffect(() => {
    if (classes.length > 0 && !classmatesClassId) {
      setClassmatesClassId(classes[0].id);
    }
  }, [classes, classmatesClassId]);
  useEffect(() => {
    if (!classmatesClassId || !token) return;
    setClassmatesLoading(true);
    api.get(`/classes/${classmatesClassId}/classmates`, token)
      .then(res => setClassmates(res.filter(p => p.id !== user?.id)))
      .catch(() => setClassmates([]))
      .finally(() => setClassmatesLoading(false));
  }, [classmatesClassId, token, user?.id]);

  const saveQuickNote = async () => {
    if (!quickNote?.text?.trim()) return;
    setQuickNote(q => ({ ...q, saving: true }));
    try {
      await api.post('/student/notes', {
        title: quickNote.text.trim().slice(0, 60) || 'Note',
        content: quickNote.text.trim(),
        color: '#fff9c4',
      }, token);
      setQuickNote(null);
    } catch (_) {
      setQuickNote(q => ({ ...q, saving: false }));
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎓 UClass</div>
        <div className="dash-user">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>👋 {user?.name}<VerifiedBadge size={15} info={{ items: [
            { icon: '👩‍🎓', label: 'Role', value: 'Student' },
            { icon: '📧', label: 'Email', value: user?.email },
          ] }} /></span>
          {isImpersonating && (
            <button className="btn btn-secondary btn-sm" onClick={stopImpersonation}>↩ Return Admin</button>
          )}
          <Link to="/profile" className="btn btn-secondary btn-sm">👤 Profile</Link>
          <Link to="/student/notes" className="btn btn-secondary btn-sm">📝 Amateka Yanjye</Link>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>Amashuri Yanjye</h1>
            <p className="dash-sub">Injira mu mashuri yawe</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowJoin(true)}>
            + Injira mu Ishuri
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Admin Announcements */}
        {announcements.filter(a => !dismissed.includes(a.id)).map(a => (
          <div key={a.id} style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '1px solid #93c5fd',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span>📢</span>
                <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>{a.title}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>— {a.admin_name}</span>
              </div>
              <p style={{ margin: 0, color: '#374151', fontSize: '0.9rem' }}>{a.message}</p>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <button
              onClick={() => dismissAnnouncement(a.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem', padding: 0, lineHeight: 1, flexShrink: 0 }}
              title="Siba iri tangazo"
            >✕</button>
          </div>
        ))}

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎒</div>
            <h3>Nta mashuri ufite</h3>
            <p>Injira mu ishuri ukoresheje kode umwarimu wawe yakuguye</p>
            <button className="btn btn-primary" onClick={() => setShowJoin(true)}>Injira mu Ishuri</button>
          </div>
        ) : (
          <>
          <div className="classes-grid">
            {classes.map(cls => (
              <div key={cls.id} className="class-card-wrap">
                <Link to={`/student/classes/${cls.id}`} className="class-card">
                  <div className="class-card-header">
                    <h3>{cls.name}</h3>
                    {cls.subject && <span className="subject-tag">{cls.subject}</span>}
                  </div>
                  <div className="class-teacher">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>👨‍🏫 {cls.teacher_name}<VerifiedBadge size={13} info={{ items: [
                      { icon: '📚', label: 'Class', value: cls.name },
                      { icon: '📖', label: 'Subject', value: cls.subject || '—' },
                      { icon: '🏷️', label: 'Code', value: cls.class_code },
                    ] }} /></span>
                  </div>
                  <div className="class-card-footer">
                    <span>Tap to enter</span>
                    <span className="arrow">→</span>
                  </div>
                </Link>
                {/* Summary button — visually separate from card */}
                <button
                  className="class-card-note-btn"
                  onClick={e => { e.stopPropagation(); setQuickNote({ classId: cls.id, open: true, text: '', saving: false }); }}
                >
                  📝 Muri make ibyo twize
                </button>
              </div>
            ))}
          </div>

          <section style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>👥 Classmates</h2>
                <p className="dash-sub" style={{ margin: '4px 0 0' }}>Reba abanyeshuri bari kumwe nawe</p>
              </div>
              {classes.length > 1 && (
                <select
                  value={classmatesClassId || ''}
                  onChange={e => setClassmatesClassId(Number(e.target.value))}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              )}
            </div>
            {classmatesLoading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading classmates...</p>
            ) : (
              <div className="classmate-grid">
                {classmates.length === 0 && (
                  <p style={{ color: '#888', textAlign: 'center', gridColumn: '1 / -1' }}>No classmates in this class yet.</p>
                )}
                {classmates.map(p => {
                  const initials = p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div key={p.id} className="classmate-card" onClick={() => setSelectedPerson(p)}>
                      {p.avatar_path
                        ? <img src={`${UPLOADS_BASE}${p.avatar_path}`} alt={p.name} className="classmate-avatar" />
                        : <div className="classmate-initials">{initials}</div>}
                      <div className="classmate-info">
                        <div className="classmate-name">
                          {p.name}
                          <span className="cm-static-badge" title="Verified">✓</span>
                        </div>
                        <span className={`cm-role-badge ${p.role}`}>{p.role}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          </>
        )}
      </main>

      {selectedPerson && (
        <ClassmateProfileModal
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onMessage={(uid) => { setSelectedPerson(null); navigate('/messages', { state: { toUserId: uid } }); }}
        />
      )}

      {showJoin && (
        <JoinClassModal
          token={token}
          onClose={() => setShowJoin(false)}
          onJoined={() => { setShowJoin(false); loadClasses(); }}
        />
      )}

      {/* Quick note modal */}
      {quickNote?.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setQuickNote(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 4, fontSize: 18 }}>📝 Note zanjye</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>Andika inshamake y'isomo mwize uyu munsi</p>
            <textarea
              autoFocus
              rows={5}
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Uyu munsi twize... Ibisanzwe...  Nize..."
              value={quickNote.text}
              onChange={e => setQuickNote(q => ({ ...q, text: e.target.value }))}
              onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') saveQuickNote(); }}
            />
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Ctrl+Enter gufunga</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setQuickNote(null)}>Reka</button>
              <button
                className="btn btn-primary"
                disabled={quickNote.saving || !quickNote.text.trim()}
                onClick={saveQuickNote}
              >
                {quickNote.saving ? 'Kubika...' : '💾 Bika Inshamake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
