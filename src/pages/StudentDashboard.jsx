import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import DonateButton from '../components/DonateButton';
import ParentInviteModal from '../components/ParentInviteModal';
import CompositionStatusPanel from '../components/CompositionStatusPanel';
import ClassMomentsFold from '../components/classMoments/ClassMomentsFold';
import QuizTeacherCommentPopup from '../components/quizReflection/QuizTeacherCommentPopup';
import AlumniWelcome from '../pages/alumni/AlumniWelcome';
import { useClassMomentAlerts } from '../hooks/useClassMomentAlerts';
import { classMomentDetailPath } from '../utils/classMomentPaths';
import '../components/classMoments/ClassMoments.css';
import './Dashboard.css';
import './MobileDashboard.css';
import './PremiumStudentTheme.css';
import './AdminDashboard.css';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect fill="%23e8eaf6" width="80" height="80"/%3E%3Ctext x="40" y="45" font-size="32" text-anchor="middle" fill="%23667eea"%3E👤%3C/text%3E%3C/svg%3E';

const TABS = [
  { id: 'classes', icon: '📚', label: 'My Classes' },
  { id: 'classnow', icon: '📸', label: 'Class Now' },
  { id: 'tools', icon: '⚡', label: 'Tools' },
  { id: 'profile', icon: '👤', label: 'Profile' },
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
  const [classesView, setClassesView] = useState('menu');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const openStatus = () => {
    setStatusPickerOpen(false);
    setShowCompositionStatus(true);
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
  useEffect(() => { setClassesView('menu'); }, [activeTab]);

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

  return (
    <div className="admin-layout">
      <QuizTeacherCommentPopup token={token} />
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-brand">
          <span className="admin-logo">🎓</span>
          {sidebarOpen && <span className="admin-brand-text">UClass Student</span>}
        </div>
        <nav className="admin-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={`admin-nav-item ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="admin-nav-icon">{t.icon}</span>
              {sidebarOpen && <span className="admin-nav-label">{t.label}</span>}
            </button>
          ))}
          <button
            type="button"
            className="admin-nav-item"
            onClick={() => setShowParentInvite(true)}
          >
            <span className="admin-nav-icon">👪</span>
            {sidebarOpen && <span className="admin-nav-label">Invite Parent</span>}
          </button>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <h1 className="admin-page-title">UClass Student</h1>
          <div className="admin-user-info">
            <span>👋 {user?.name}</span>
            <DonateButton />
            <button type="button" className="btn btn-sm btn-logout" onClick={logout}>Logout</button>
          </div>
        </header>

        <div className="admin-content student-dashboard-classic">
          {activeTab === 'classes' && (
            <>
              {classesView === 'menu' && (
                <>
                  <div className="dash-top">
                    <div>
                      <h1>Student</h1>
                      <p className="dash-sub">Choose a feature</p>
                    </div>
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}

                  <div className="student-tools-grid">
                    <button type="button" className="student-tool-card" onClick={() => setClassesView('list')}>
                      <span className="student-tool-icon">📚</span>
                      <span className="student-tool-label">My Classes</span>
                    </button>
                    <button type="button" className="student-tool-card" onClick={() => setShowJoin(true)}>
                      <span className="student-tool-icon">➕</span>
                      <span className="student-tool-label">Join Class</span>
                    </button>
                    <button type="button" className="student-tool-card" onClick={() => setShowParentInvite(true)}>
                      <span className="student-tool-icon">👪</span>
                      <span className="student-tool-label">Invite Parent</span>
                    </button>
                  </div>
                </>
              )}

              {classesView === 'list' && (
                <>
                  <div className="dash-top dash-top-actions-desktop">
                    <div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setClassesView('menu')}>← Back</button>
                      <h1 style={{ marginTop: 12 }}>My Classes</h1>
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

                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="student-parent-invite-banner">
                    <div>
                      <strong>👪 Invite your parent</strong>
                      <p>Share a link so they can see your quizzes, marks, and class work.</p>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowParentInvite(true)}>Get invite link</button>
                  </div>
                </>
              )}
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
              </div>
            </section>
          )}

        </div>
      </div>

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
