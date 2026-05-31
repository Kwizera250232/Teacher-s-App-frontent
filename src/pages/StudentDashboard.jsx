import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import VerifiedBadge from '../components/VerifiedBadge';
import DonateButton from '../components/DonateButton';
import ParentInviteModal from '../components/ParentInviteModal';
import MobileStudentHeader from '../components/MobileStudentHeader';
import MobileBottomBar from '../components/MobileBottomBar';
import StudentCompositionWall from '../components/StudentCompositionWall';
import './Dashboard.css';
import './MobileDashboard.css';

export default function StudentDashboard() {
  const { user, token, logout, isImpersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  const [quickNote, setQuickNote] = useState(null);
  const [showParentInvite, setShowParentInvite] = useState(false);
  const compositionsRef = useRef(null);
  const classesRef = useRef(null);

  const loadClasses = () => {
    api.get('/classes/my', token).then(data => {
      setClasses(data);
      try { localStorage.setItem('cached_classes', JSON.stringify(data)); } catch {}
    }).catch(e => {
      if (!navigator.onLine) {
        try { const c = JSON.parse(localStorage.getItem('cached_classes') || '[]'); setClasses(c); } catch {}
      } else {
        setError(e.message);
      }
    });
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

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="dashboard student-wa-dashboard wa-theme">
      <header className="dash-header dash-header--student">
        <div className="dash-header-desktop-brand dash-brand">🎓 UClass</div>
        <MobileStudentHeader
          user={user}
          onLogout={logout}
          onParentInvite={() => setShowParentInvite(true)}
          isImpersonating={isImpersonating}
          stopImpersonation={stopImpersonation}
        />
        <div className="dash-header-desktop-actions dash-user">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>👋 {user?.name}<VerifiedBadge size={15} info={{ items: [
            { icon: '👩‍🎓', label: 'Role', value: 'Student' },
            { icon: '📧', label: 'Email', value: user?.email },
          ] }} /></span>
          {isImpersonating && (
            <button className="btn btn-secondary btn-sm" onClick={stopImpersonation}>↩ Return Admin</button>
          )}
          <Link to="/profile" className="btn btn-secondary btn-sm">👤 Profile</Link>
          <Link to="/student/notes" className="btn btn-secondary btn-sm">📝 My Notes</Link>
          <DonateButton />
          <button type="button" className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowParentInvite(true)}
            title="Invite parent"
          >
            👪 Invite parent
          </button>
        </div>
      </header>

      <div className="mobile-donate-fab">
        <DonateButton compact fab />
      </div>

      <main className="dash-main">
        <div className="dash-top dash-top-actions-desktop" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowJoin(true)}>
            + Join class
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowParentInvite(true)}>
            👪 Invite parent
          </button>
        </div>

        <div className="wa-invite-banner">
          <strong>Invite your parent</strong>
          <p>Share a link so your parent sees only your quizzes, marks, and class work.</p>
          <button type="button" onClick={() => setShowParentInvite(true)}>
            Get parent invite link
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {announcements.filter(a => !dismissed.includes(a.id)).map(a => (
          <div key={a.id} className="wa-invite-banner" style={{ background: '#e8f0fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <strong style={{ color: '#1e40af' }}>📢 {a.title}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}>{a.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissAnnouncement(a.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >✕</button>
            </div>
          </div>
        ))}

        <div ref={classesRef}>
          <div className="wa-search-bar">
            <span>🔍</span>
            <span>My classes — tap to open chat &amp; work</span>
          </div>

          {classes.length === 0 ? (
            <div className="empty-state" style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
              <div className="empty-icon">🎒</div>
              <h3>No classes yet</h3>
              <p>Join a class with the code from your teacher</p>
              <button className="btn btn-primary" onClick={() => setShowJoin(true)}>Join class</button>
            </div>
          ) : (
            <div className="wa-class-list">
              {classes.map(cls => (
                <Link key={cls.id} to={`/student/classes/${cls.id}`} className="wa-class-row">
                  <div className="wa-class-avatar">{(cls.name || 'C').slice(0, 1)}</div>
                  <div className="wa-class-body">
                    <strong>{cls.name}</strong>
                    <span>{cls.subject ? `${cls.subject} · ` : ''}👨‍🏫 {cls.teacher_name}</span>
                  </div>
                  <span className="wa-class-arrow">›</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div ref={compositionsRef}>
          <StudentCompositionWall
            token={token}
            onWriteClick={() => navigate('/profile')}
          />
        </div>

        {classes.length > 0 && (
          <div className="classes-grid" style={{ display: 'none' }}>
            {classes.map(cls => (
              <div key={cls.id} className="class-card-wrap">
                <Link to={`/student/classes/${cls.id}`} className="class-card">
                  <div className="class-card-header">
                    <h3>{cls.name}</h3>
                    {cls.subject && <span className="subject-tag">{cls.subject}</span>}
                  </div>
                </Link>
                <button
                  className="class-card-note-btn"
                  type="button"
                  onClick={() => setQuickNote({ classId: cls.id, open: true, text: '', saving: false })}
                >
                  📝 Quick summary note
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileBottomBar
        items={[
          { id: 'classes', icon: '📚', label: 'Classes', onClick: () => scrollTo(classesRef), active: true },
          { id: 'compositions', icon: '✍️', label: 'Compositions', onClick: () => scrollTo(compositionsRef) },
          { id: 'notes', icon: '📝', label: 'My Notes', to: '/student/notes' },
          { id: 'parent', icon: '👪', label: 'Parent', onClick: () => setShowParentInvite(true) },
          { id: 'profile', icon: '👤', label: 'Profile', to: '/profile' },
        ]}
      />

      {showJoin && (
        <JoinClassModal
          token={token}
          onClose={() => setShowJoin(false)}
          onJoined={() => { setShowJoin(false); loadClasses(); }}
        />
      )}

      {showParentInvite && user?.name && (
        <ParentInviteModal
          token={token}
          selfStudentId={user.id}
          studentName={user.name}
          onClose={() => setShowParentInvite(false)}
        />
      )}

      {quickNote?.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setQuickNote(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 4, fontSize: 18 }}>📝 Quick note</h3>
            <textarea
              autoFocus
              rows={5}
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="What did you learn today?"
              value={quickNote.text}
              onChange={e => setQuickNote(q => ({ ...q, text: e.target.value }))}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setQuickNote(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={quickNote.saving || !quickNote.text.trim()}
                onClick={saveQuickNote}
              >
                {quickNote.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
