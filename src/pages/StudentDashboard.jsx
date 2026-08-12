import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import VerifiedBadge from '../components/VerifiedBadge';
import DonateButton from '../components/DonateButton';
import ParentInviteModal from '../components/ParentInviteModal';
import MobileStudentHeader from '../components/MobileStudentHeader';
import MobileBottomBar from '../components/MobileBottomBar';
import CompositionStatusPanel from '../components/CompositionStatusPanel';
import CompositionStatusFeed from '../components/CompositionStatusFeed';
import ClassMomentsFold from '../components/classMoments/ClassMomentsFold';
import StudentNotificationsBell from '../components/StudentNotificationsBell';
import QuizTeacherCommentPopup from '../components/quizReflection/QuizTeacherCommentPopup';
import AlumniWelcome from '../pages/alumni/AlumniWelcome';
import { useClassMomentAlerts } from '../hooks/useClassMomentAlerts';
import { classMomentDetailPath } from '../utils/classMomentPaths';
import '../components/classMoments/ClassMoments.css';
import './Dashboard.css';
import './MobileDashboard.css';
import './PremiumStudentTheme.css';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect fill="%23e8eaf6" width="80" height="80"/%3E%3Ctext x="40" y="45" font-size="32" text-anchor="middle" fill="%23667eea"%3E👤%3C/text%3E%3C/svg%3E';

const TABS = [
  { id: 'classes', icon: '📚', label: 'My Classes' },
  { id: 'classnow', icon: '📸', label: 'Class Now' },
  { id: 'tools', icon: '⚡', label: 'Tools' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

const MOBILE_NAV = (handlers) => [
  { id: 'classes', icon: '📚', label: 'Classes', onClick: handlers.switchTabClasses, active: true },
  { id: 'classnow', icon: '📸', label: 'Class Now', onClick: handlers.switchTabClassNow },
  { id: 'notes', icon: '📝', label: 'Notes', to: '/student/notes' },
  { id: 'reports', icon: '📋', label: 'Reports', to: '/student/quiz-reports' },
  { id: 'profile', icon: '👤', label: 'Profile', to: '/profile' },
];

export default function StudentDashboard() {
  const { user, token, logout, isImpersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [momentPreview, setMomentPreview] = useState(null);
  const [classes, setClasses] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  const [quickNote, setQuickNote] = useState(null);
  const [showParentInvite, setShowParentInvite] = useState(false);
  const [showCompositionStatus, setShowCompositionStatus] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');

  const openStatus = () => {
    setStatusPickerOpen(false);
    setShowCompositionStatus(true);
  };

  const navHandlers = {
    switchTabClasses: () => setActiveTab('classes'),
    switchTabClassNow: () => setActiveTab('classnow'),
    openStatus,
    openParent: () => setShowParentInvite(true),
  };

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

  useClassMomentAlerts(token, user?.role);

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    api.get('/admin/user-announcements', token).then(setAnnouncements).catch(() => {});
  }, []);
  useEffect(() => {
    api.get('/class-moments/preview', token).then(setMomentPreview).catch(() => {});
  }, [token]);
  useEffect(() => {
    if (user?.is_alumni && !localStorage.getItem('alumni_welcomed')) {
      setShowOnboarding(true);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === '1') {
      setShowCompositionStatus(true);
      setStatusPickerOpen(true);
      window.history.replaceState({}, '', '/student/dashboard');
    }
  }, [user]);
  useEffect(() => {
    const momentId = searchParams.get('moment');
    if (momentId) {
      navigate(classMomentDetailPath('student', momentId), { replace: true });
    }
  }, [searchParams, navigate]);

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
    } catch {
      setQuickNote(q => ({ ...q, saving: false }));
    }
  };

  const mobileNavItems = MOBILE_NAV(navHandlers);
  return (
    <div className="dashboard student-dashboard-classic">
      <QuizTeacherCommentPopup token={token} />
      <header className="dash-header dash-header--student">
        <div className="dash-header-desktop-brand dash-brand">🎓 UClass</div>
        <MobileStudentHeader
          user={user}
          onLogout={logout}
          onParentInvite={() => setShowParentInvite(true)}
          onOpenStatus={openStatus}
          isImpersonating={isImpersonating}
          stopImpersonation={stopImpersonation}
        />
        <div className="dash-header-desktop-actions dash-user">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            👋 {user?.name}
            <VerifiedBadge size={15} info={{ items: [
              { icon: '👩‍🎓', label: 'Role', value: 'Student' },
              { icon: '📧', label: 'Email', value: user?.email },
            ] }} />
          </span>
          {isImpersonating && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={stopImpersonation}>↩ Return Admin</button>
          )}
          <StudentNotificationsBell className="student-notif-bell--header" />
          <DonateButton />
          <button type="button" className="btn btn-sm btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="mobile-donate-fab">
        <DonateButton compact fab />
      </div>

      <nav className="nav-tabs-professional nav-tabs-student" aria-label="Dashboard tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`nav-tab-professional${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main className="dash-main dash-main-professional">
        {activeTab === 'classes' && (
          <>
            <div className="dash-top dash-top-actions-desktop">
              <div>
                <h1>My Classes</h1>
                <p className="dash-sub">Open a class for homework, quizzes, notes, and more</p>
              </div>
              <div className="student-dash-actions">
                <button type="button" className="btn btn-primary" onClick={() => setShowJoin(true)}>+ Join class</button>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {announcements.filter(a => !dismissed.includes(a.id)).map(a => (
              <div key={a.id} className="student-announcement">
                <div>
                  <strong>📢 {a.title}</strong>
                  <p>{a.message}</p>
                </div>
                <button type="button" onClick={() => dismissAnnouncement(a.id)} aria-label="Dismiss">✕</button>
              </div>
            ))}

            <section className="student-classes-section" aria-labelledby="student-classes-heading">
              <h2 id="student-classes-heading" className="student-classes-heading">My Classes</h2>
              {classes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎒</div>
                  <h3>No classes yet</h3>
                  <p>Join a class with the code from your teacher</p>
                  <button type="button" className="btn btn-primary" onClick={() => setShowJoin(true)}>Join class</button>
                </div>
              ) : (
                <div className="classes-grid classes-grid--square">
                  {classes.map(cls => (
                    <div key={cls.id} className="class-card-wrap class-card-wrap--square">
                      <Link
                        to={`/student/classes/${cls.id}`}
                        className="class-card class-card--square"
                      >
                        <div className="class-card-icon">{(cls.name || 'C').slice(0, 1)}</div>
                        <div className="class-card-header">
                          <h3>{cls.name}</h3>
                          {cls.subject && <span className="subject-tag">{cls.subject}</span>}
                        </div>
                        {cls.class_code && (
                          <div className="class-code-display">
                            <span className="code-label">Code</span>
                            <span className="code-value">{cls.class_code}</span>
                          </div>
                        )}
                        <p className="class-teacher">👨‍🏫 {cls.teacher_name || 'Teacher'}</p>
                        <div className="class-card-footer">
                          <span>Open class</span>
                          <span className="arrow">→</span>
                        </div>
                      </Link>
                      <div className="class-card-quick-actions">
                        <Link to={`/student/classes/${cls.id}?tab=Quizzes`} className="class-card-quick-btn class-card-quick-btn--quiz">
                          ❓ Quiz
                        </Link>
                        <Link to={`/student/classes/${cls.id}?tab=Homework`} className="class-card-quick-btn class-card-quick-btn--hw">
                          📝 Homework
                        </Link>
                        <Link to={`/student/classes/${cls.id}?tab=Notes`} className="class-card-quick-btn class-card-quick-btn--notes">
                          📄 Notes
                        </Link>
                        <Link to={`/student/classes/${cls.id}?tab=Groups`} className="class-card-quick-btn class-card-quick-btn--groups">
                          👥 Groups
                        </Link>
                        <button
                          type="button"
                          className="class-card-quick-btn class-card-quick-btn--note"
                          onClick={() => setQuickNote({ classId: cls.id, open: true, text: '', saving: false })}
                        >
                          ✏️ Quick Note
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="student-parent-invite-banner">
              <strong>👪 Invite your parent</strong>
              <p>Share a link so they can see your quizzes, marks, and class work.</p>
              <button type="button" onClick={() => setShowParentInvite(true)}>Get invite link</button>
            </div>

            <CompositionStatusFeed token={token} />
          </>
        )}

        {activeTab === 'classnow' && (
          <section className="student-classnow-section">
            <h2 className="student-classes-heading">📸 Class Now</h2>
            <ClassMomentsFold
              preview={momentPreview}
              feedPath="/student/class-moments"
              defaultOpen
              token={token}
              userRole={user?.role || 'student'}
            />
            <div className="student-tools-grid" style={{ marginTop: 20 }}>
              <button type="button" className="student-tool-card" onClick={openStatus}>
                <span className="student-tool-icon">✍️</span>
                <span className="student-tool-label">Composition Status</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === 'tools' && (
          <section className="student-tools-section">
            <h2 className="student-classes-heading">⚡ Quick Tools</h2>
            <div className="student-tools-grid">
              <Link to="/student/notes" className="student-tool-card">
                <span className="student-tool-icon">📝</span>
                <span className="student-tool-label">My Notes</span>
              </Link>
              <Link to="/student/quiz-reports" className="student-tool-card">
                <span className="student-tool-icon">📋</span>
                <span className="student-tool-label">Quiz Reports</span>
              </Link>
              <button type="button" className="student-tool-card" onClick={openStatus}>
                <span className="student-tool-icon">✍️</span>
                <span className="student-tool-label">Composition Status</span>
              </button>
              <button type="button" className="student-tool-card" onClick={() => setShowParentInvite(true)}>
                <span className="student-tool-icon">👪</span>
                <span className="student-tool-label">Invite Parent</span>
              </button>
              <button type="button" className="student-tool-card" onClick={() => setShowJoin(true)}>
                <span className="student-tool-icon">➕</span>
                <span className="student-tool-label">Join Class</span>
              </button>
              <Link to="/messages" className="student-tool-card">
                <span className="student-tool-icon">💬</span>
                <span className="student-tool-label">Messages</span>
              </Link>
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="student-profile-tab">
            <h2 className="student-classes-heading">👤 My Profile</h2>
            <div className="student-profile-card">
              <div className="student-profile-avatar-wrap">
                <img
                  src={user?.avatar_path ? `${UPLOADS_BASE}${user.avatar_path}` : DEFAULT_AVATAR}
                  alt="avatar"
                  className="student-profile-avatar"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
              </div>
              <div className="student-profile-info">
                <h3>{user?.name}</h3>
                <span className="student-profile-role">Student</span>
                <p className="student-profile-email">✉️ {user?.email}</p>
              </div>
              <Link to="/profile" className="btn btn-primary btn-sm student-profile-edit-btn">✏️ Edit Profile</Link>
            </div>
            <div className="student-tools-grid" style={{ marginTop: 16 }}>
              <Link to="/profile" className="student-tool-card">
                <span className="student-tool-icon">📋</span>
                <span className="student-tool-label">Full Profile</span>
              </Link>
              <Link to="/student/notes" className="student-tool-card">
                <span className="student-tool-icon">📝</span>
                <span className="student-tool-label">My Notes</span>
              </Link>
              <Link to="/student/quiz-reports" className="student-tool-card">
                <span className="student-tool-icon">📊</span>
                <span className="student-tool-label">Quiz Reports</span>
              </Link>
              <button type="button" className="student-tool-card" onClick={() => setShowParentInvite(true)}>
                <span className="student-tool-icon">👪</span>
                <span className="student-tool-label">Invite Parent</span>
              </button>
            </div>
          </section>
        )}

      </main>

      <MobileBottomBar items={mobileNavItems} className="student-bottom-nav" />

      {showJoin && (
        <JoinClassModal token={token} onClose={() => setShowJoin(false)} onJoined={() => { setShowJoin(false); loadClasses(); }} />
      )}
      {showParentInvite && user?.name && (
        <ParentInviteModal token={token} selfStudentId={user.id} studentName={user.name} onClose={() => setShowParentInvite(false)} />
      )}
      {showOnboarding && (
        <AlumniWelcome onComplete={() => { setShowOnboarding(false); localStorage.setItem('alumni_welcomed', '1'); }} />
      )}
      {showCompositionStatus && (
        <CompositionStatusPanel token={token} openPickerInitially={statusPickerOpen} onClose={() => setShowCompositionStatus(false)} />
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
              <button type="button" className="btn btn-primary" disabled={quickNote.saving || !quickNote.text.trim()} onClick={saveQuickNote}>
                {quickNote.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
