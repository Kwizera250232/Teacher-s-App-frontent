import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import VerifiedBadge from '../components/VerifiedBadge';
import UmunsiAiModal from '../components/UmunsiAiModal';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  // Quick note state: { classId, open, text, saving }
  const [quickNote, setQuickNote] = useState(null);
  const [aiModal, setAiModal] = useState(null); // { classId, className }
  const [unread, setUnread] = useState(0);

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
    api.get('/messages/unread-count', token).then(r => setUnread(r.count)).catch(() => {});
  }, []);

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
          <Link to="/student/notes" className="btn btn-secondary btn-sm">📝 Amateka Yanjye</Link>
          <Link to="/messages" className="btn btn-secondary btn-sm" style={{ position: 'relative' }}>
            💬 Messages{unread > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 11, fontWeight: 700, padding: '1px 6px', marginLeft: 4 }}>{unread}</span>}
          </Link>
          <Link to="/profile" className="btn btn-secondary btn-sm">👤 Profile</Link>
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
                {/* AI button */}
                <button
                  className="class-card-note-btn"
                  onClick={e => { e.stopPropagation(); setAiModal({ classId: cls.id, className: cls.name }); }}
                >
                  🤖 Baza Umunsi AI
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

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

      {/* Baza Umunsi Student AI modal */}
      {aiModal && (
        <UmunsiAiModal
          classId={aiModal.classId}
          className={aiModal.className}
          token={token}
          onClose={() => setAiModal(null)}
        />
      )}
    </div>
  );
}
