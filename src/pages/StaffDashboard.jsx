import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CreateClassModal from '../components/CreateClassModal';
import AddStudentsModal from '../components/AddStudentsModal';
import SchoolRequestBanner from '../components/SchoolRequestBanner';
import SchoolRequestsPanel from '../components/SchoolRequestsPanel';
import QuizTeacherShareInbox from '../components/QuizTeacherShareInbox';
import NoteTeacherShareInbox from '../components/NoteTeacherShareInbox';
import VerifiedBadge from '../components/VerifiedBadge';
import StaffQuickActions from '../components/StaffQuickActions';
import SchoolHubPanel from '../components/staff/SchoolHubPanel';
import AddTeacherModal from '../components/staff/AddTeacherModal';
import NotifyParentsModal from '../components/staff/NotifyParentsModal';
import ParentInvitesPickerModal from '../components/ParentInvitesPickerModal';
import StaffChatsPanel from '../components/staff/StaffChatsPanel';
import WeeklyDigestModal from '../components/staff/WeeklyDigestModal';
import MobileStaffHeader from '../components/MobileStaffHeader';
import DonateButton from '../components/DonateButton';
import './Dashboard.css';
import './ParentHub.css';
import './MobileDashboard.css';
import CompositionStatusList from '../components/CompositionStatusList';
import StaffClassNowPanel from '../components/staff/StaffClassNowPanel';
import ClassMomentsDashboardBlock from '../components/classMoments/ClassMomentsDashboardBlock';
import OnlineNowStrip from '../components/classMoments/OnlineNowStrip';
import { usePresence } from '../hooks/usePresence';
import '../components/classMoments/ClassMoments.css';
import TutorialVideo from '../components/TutorialVideo';
import StaleApiBanner from '../components/StaleApiBanner';
import TeacherSchoolBadge from '../components/TeacherSchoolBadge';
import GuestMarksPanel from '../components/GuestMarksPanel';
import StaffInyandikoDashboard from '../components/staff/StaffInyandikoDashboard';
import AppNotificationsBell from '../components/AppNotificationsBell';
import '../components/StudentNotifications.css';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function StaffDashboard({ roleLabel, basePath }) {
  const { user, token, logout, isImpersonating, stopImpersonation, updateUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  const [unread, setUnread] = useState(0);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showNotifyParents, setShowNotifyParents] = useState(false);
  const [showParentInvites, setShowParentInvites] = useState(false);
  const [hubTab, setHubTab] = useState('classes');
  const [showWeeklyDigest, setShowWeeklyDigest] = useState(false);
  const [momentPreview, setMomentPreview] = useState(null);
  const { online } = usePresence(token);
  const isHeadTeacher = roleLabel === 'Head Teacher';
  const hasSchool = Boolean(user?.school_id);
  const momentsFeedPath = `${basePath}/class-moments`;
  usePushNotifications(token);

  const dismissAnnouncement = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  useEffect(() => {
    if (!token) return;
    api.get('/class-moments/preview', token).then(setMomentPreview).catch(() => {});
  }, [token]);

  const loadClasses = () => {
    api.get('/classes', token).then(data => {
      setClasses(data);
      try { localStorage.setItem('cached_staff_classes', JSON.stringify(data)); } catch {}
    }).catch(e => {
      if (!navigator.onLine) {
        try { const c = JSON.parse(localStorage.getItem('cached_staff_classes') || '[]'); setClasses(c); } catch {}
      } else {
        setError(e.message);
      }
    });
  };

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (!token) return;
    api.get('/auth/me', token)
      .then((r) => {
        if (r?.user) updateUser(r.user);
      })
      .catch(() => {});
  }, [token, updateUser]);
  useEffect(() => {
    if (!isHeadTeacher && hubTab === 'school') setHubTab('classes');
  }, [isHeadTeacher, hubTab]);
  useEffect(() => {
    api.get('/admin/user-announcements', token).then(setAnnouncements).catch(() => {});
  }, []);
  useEffect(() => {
    api.get('/messages/unread-count', token).then(r => setUnread(r.count)).catch(() => {});
  }, []);

  const navTabs = [
    { id: 'classes', label: '📚 Classes' },
    ...(isHeadTeacher ? [{ id: 'school', label: '🏫 School' }] : []),
    ...(hasSchool ? [{ id: 'chats', label: '💬 Chats' }] : []),
    { id: 'classnow', label: '📸 Class Now' },
    { id: 'inyandiko', label: '✍️ Inyandiko' },
    { id: 'alumni', label: '🎓 Alumni' },
    { id: 'tools', label: '⚡ Tools' },
  ];

  return (
    <div className="dashboard staff-hub-page staff-dashboard-professional wa-theme">
      <header className="dash-header-professional">
        <div className="dash-header-left">
          <div className="brand-section">
            <span className="brand-logo">UClass</span>
            <span className="brand-role">{roleLabel}</span>
          </div>
        </div>
        <MobileStaffHeader
          basePath={basePath}
          user={user}
          roleLabel={roleLabel}
          onLogout={logout}
          isImpersonating={isImpersonating}
          stopImpersonation={stopImpersonation}
        />
        <div className="dash-header-right">
          <div className="user-greeting">
            <span className="greeting-icon">👋</span>
            <span className="greeting-name">{user?.name}</span>
            <VerifiedBadge size={15} info={{ items: [
              { icon: '👨‍🏫', label: 'Role', value: roleLabel },
              { icon: '📧', label: 'Email', value: user?.email },
            ] }} />
          </div>
          {isImpersonating && (
            <button className="btn-professional btn-professional-secondary" onClick={stopImpersonation}>↩ Return Admin</button>
          )}
          <div className="header-actions">
            <AppNotificationsBell className="notif-bell-professional" basePath={basePath} />
            <Link to="/messages" className="btn-professional btn-professional-icon" style={{ position: 'relative' }}>
              💬
              {unread > 0 && <span className="notification-badge">{unread}</span>}
            </Link>
            <Link to="/alumni/directory" className="btn-professional btn-professional-alumni">
              🎓 Alumni
            </Link>
            <DonateButton />
            <Link to="/profile" className="btn-professional btn-professional-icon">👤</Link>
            <button type="button" className="btn-professional btn-professional-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="mobile-donate-fab">
        <DonateButton compact fab />
      </div>

      <nav className="nav-tabs-professional">
        {navTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`nav-tab-professional ${hubTab === t.id ? 'active' : ''}`}
            onClick={() => setHubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className={`dash-main-professional${hubTab === 'chats' ? ' dash-main--chats-full' : ''}`}>
        <StaleApiBanner />
        <TutorialVideo
          compact
          title="How to use UClass (video)"
          subtitle="Signup, Dean AI, classes, notes, homework & feed"
        />
        {hubTab !== 'chats' && <SchoolRequestBanner token={token} user={user} />}
        {hasSchool && hubTab !== 'chats' && (
          <div className="school-badge-wrapper">
            <TeacherSchoolBadge user={user} className="school-badge-professional" />
          </div>
        )}
        {hasSchool && hubTab === 'classes' && (
          <div className="shared-content-section">
            <QuizTeacherShareInbox token={token} classes={classes} onChange={loadClasses} />
            <NoteTeacherShareInbox token={token} classes={classes} onChange={loadClasses} />
          </div>
        )}
        {isHeadTeacher && hubTab === 'school' && <SchoolRequestsPanel token={token} />}

        {error && <div className="alert alert-error-professional">{error}</div>}

        {hubTab === 'school' && hasSchool && (
          <>
            <SchoolHubPanel token={token} isHeadTeacher={isHeadTeacher} />
            {isHeadTeacher && (
              <section className="section-professional">
                <h2 className="section-title-professional">✍️ School — C. Status</h2>
                <CompositionStatusList token={token} schoolWide />
              </section>
            )}
          </>
        )}
        {hubTab === 'school' && !hasSchool && user?.role === 'teacher' && (
          <p className="muted-text-professional">Join a school from the banner above before posting announcements.</p>
        )}

        {hubTab === 'chats' && hasSchool && <StaffChatsPanel token={token} />}
        {hubTab === 'chats' && !hasSchool && (
          <p className="phub-muted">Link to a school to message parents.</p>
        )}

        {hubTab === 'classnow' && (
          <>
            <OnlineNowStrip online={online} />
            <StaffClassNowPanel token={token} classes={classes} />
          </>
        )}

        {hubTab === 'inyandiko' && (
          <StaffInyandikoDashboard token={token} basePath={basePath} />
        )}

        {hubTab === 'alumni' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>🎓 Alumni Management</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => window.open('/alumni/admin', '_blank')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  ⚙️ Manage Alumni Content
                </button>
                <button onClick={() => window.open('/alumni/graduation', '_blank')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  🎓 Graduate Students
                </button>
              </div>
            </div>
          </div>
        )}

        {hubTab === 'tools' && (
          <div style={{ marginBottom: 16 }}>
            {hasSchool && (
              <ClassMomentsDashboardBlock
                token={token}
                userRole={user?.role}
                preview={momentPreview}
                feedPath={momentsFeedPath}
                showOpenAll
              />
            )}
            {hasSchool && (
              <section style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, color: '#075e54', marginBottom: 10 }}>✍️ C. Status (school)</h2>
                <CompositionStatusList token={token} schoolWide />
              </section>
            )}
            <StaffQuickActions
              token={token}
              onAddStudents={() => setShowAddStudents(true)}
              onParentInvites={() => setShowParentInvites(true)}
            />
            <section style={{ marginTop: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, color: '#075e54', marginBottom: 10 }}>👤 Guest marks (share links)</h2>
              <GuestMarksPanel token={token} />
            </section>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNotifyParents(true)}>
                📢 Notify parents
              </button>
              {isHeadTeacher && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddTeacher(true)}>
                  👨‍🏫 Add teacher
                </button>
              )}
              {classes[0]?.id && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowWeeklyDigest(true)}>
                  📊 Weekly behavior digest
                </button>
              )}
            </div>
          </div>
        )}

        {hubTab === 'classes' && (
          <>
            <div className="classes-actions-professional">
              <button className="btn-professional btn-professional-primary" onClick={() => setShowCreate(true)}>
                + Fungura Ishuri
              </button>
              <button className="btn-professional btn-professional-secondary" onClick={() => setShowAddStudents(true)} disabled={user?.role === 'teacher' && !hasSchool}>
                👤 Add Students
              </button>
              <Link to="/alumni/graduation" className="btn-professional btn-professional-tertiary">
                🎓 Graduate Students
              </Link>
            </div>

            {announcements.filter(a => !dismissed.includes(a.id)).map(a => (
              <div key={a.id} className="announcement-card-professional">
                <div className="announcement-content">
                  <div className="announcement-header">
                    <span className="announcement-icon">📢</span>
                    <strong className="announcement-title">{a.title}</strong>
                    <span className="announcement-author">— {a.admin_name}</span>
                  </div>
                  <p className="announcement-text">{a.message}</p>
                  <span className="announcement-date">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => dismissAnnouncement(a.id)}
                  className="announcement-dismiss"
                  title="Dismiss"
                >✕</button>
              </div>
            ))}

            {classes.length === 0 ? (
              <div className="empty-state-professional">
                <div className="empty-icon-professional">📚</div>
                <h3>Nta madarasa</h3>
                <p>Fungura ishuri ryawe rya mbere utangire</p>
                <button className="btn-professional btn-professional-primary" onClick={() => setShowCreate(true)}>Fungura Ishuri</button>
              </div>
            ) : (
              <>
                <h2 className="section-title-professional">Your classes</h2>
                <div className="classes-grid classes-grid--professional">
                  {classes.map(cls => (
                    <Link key={cls.id} to={`${basePath}/classes/${cls.id}?tab=Students`} className="class-card class-card--professional">
                      <div className="class-card-icon-professional">{(cls.name || 'C').slice(0, 1)}</div>
                      <div className="class-card-content">
                        <h3 className="class-card-title">{cls.name}</h3>
                        {cls.subject && <span className="subject-tag-professional">{cls.subject}</span>}
                        <div className="class-card-meta">
                          <span className="class-card-code">Code {cls.class_code}</span>
                          <span className="class-card-students">👥 {cls.student_count}</span>
                        </div>
                      </div>
                      <div className="class-card-arrow">→</div>
                    </Link>
                  ))}
                </div>
                {classes[0] && (
                  <div className="quick-actions-professional">
                    <Link to={`${basePath}/classes/${classes[0].id}/record-marks`} className="action-pill-professional">
                      📊 CAT Marks
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <div className="mobile-staff-quick-bar">
        <button type="button" onClick={() => { setHubTab('classes'); setShowAddStudents(true); }}>
          👥 View students
        </button>
        <button type="button" onClick={() => setHubTab('classnow')}>
          📸 Class Now
        </button>
        <button type="button" onClick={() => setHubTab('inyandiko')}>
          ✍️ Inyandiko
        </button>
        <button type="button" onClick={() => setHubTab('tools')}>
          ✍️ C. Status
        </button>
        <button type="button" onClick={() => setShowParentInvites(true)}>
          👪 Parent invite
        </button>
      </div>

      {showCreate && (
        <CreateClassModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadClasses(); }}
        />
      )}

      {showAddStudents && (
        <AddStudentsModal
          token={token}
          onClose={() => setShowAddStudents(false)}
          onNeedJoinSchool={() => {
            setShowAddStudents(false);
            setHubTab('classes');
            setTimeout(() => {
              document.getElementById('school-join-banner')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      )}

      {showAddTeacher && (
        <AddTeacherModal
          token={token}
          onClose={() => setShowAddTeacher(false)}
          onCreated={() => setShowAddTeacher(false)}
        />
      )}

      {showNotifyParents && (
        <NotifyParentsModal
          token={token}
          classId={classes[0]?.id}
          onClose={() => setShowNotifyParents(false)}
        />
      )}

      {showParentInvites && (
        <ParentInvitesPickerModal
          token={token}
          onClose={() => setShowParentInvites(false)}
        />
      )}

      {showWeeklyDigest && classes[0]?.id && (
        <WeeklyDigestModal
          token={token}
          classId={classes[0].id}
          onClose={() => setShowWeeklyDigest(false)}
          onSent={() => setShowWeeklyDigest(false)}
        />
      )}
    </div>
  );
}
