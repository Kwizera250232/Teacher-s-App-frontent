import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PremiumSidebar from '../components/PremiumSidebar';
import PremiumClassCard from '../components/PremiumClassCard';
import CreateClassModal from '../components/CreateClassModal';
import AddStudentsModal from '../components/AddStudentsModal';
import ParentInvitesPickerModal from '../components/ParentInvitesPickerModal';
import QuizTeacherShareInbox from '../components/QuizTeacherShareInbox';
import NoteTeacherShareInbox from '../components/NoteTeacherShareInbox';
import StaffQuickActions from '../components/StaffQuickActions';
import GuestMarksPanel from '../components/GuestMarksPanel';
import CompositionStatusList from '../components/CompositionStatusList';
import AppNotificationsBell from '../components/AppNotificationsBell';
import StaffChatsPanel from '../components/staff/StaffChatsPanel';
import StaffClassNowPanel from '../components/staff/StaffClassNowPanel';
import StaffInyandikoDashboard from '../components/staff/StaffInyandikoDashboard';
import AddTeacherModal from '../components/staff/AddTeacherModal';
import NotifyParentsModal from '../components/staff/NotifyParentsModal';
import WeeklyDigestModal from '../components/staff/WeeklyDigestModal';
import WeeklyQuizReport from '../components/staff/WeeklyQuizReport';
import AIQuizGenerator from '../components/staff/AIQuizGenerator';
import ClassMomentsDashboardBlock from '../components/classMoments/ClassMomentsDashboardBlock';
import OnlineNowStrip from '../components/classMoments/OnlineNowStrip';
import { usePresence } from '../hooks/usePresence';
import { usePushNotifications } from '../hooks/usePushNotifications';
import TeacherMobileMenu from '../components/TeacherMobileMenu';
import '../components/classMoments/ClassMoments.css';
import '../components/StudentNotifications.css';
import './PremiumDashboard.css';

export default function PremiumStaffDashboard({ roleLabel = 'Teacher', basePath = '/teacher' }) {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [momentPreview, setMomentPreview] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [showParentInvites, setShowParentInvites] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showNotifyParents, setShowNotifyParents] = useState(false);
  const [showWeeklyDigest, setShowWeeklyDigest] = useState(false);
  const [selectedReportClass, setSelectedReportClass] = useState(null);
  const { online } = usePresence(token);
  const isHeadTeacher = roleLabel === 'Head Teacher';
  const hasSchool = Boolean(user?.school_id);
  usePushNotifications(token);

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes', token);
      const list = Array.isArray(res) ? res : [];
      setClasses(list);
      try { localStorage.setItem('cached_staff_classes', JSON.stringify(list)); } catch {}
    } catch (err) {
      if (!navigator.onLine) {
        try { setClasses(JSON.parse(localStorage.getItem('cached_staff_classes') || '[]')); } catch {}
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadClasses();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.get('/class-moments/preview', token).then(setMomentPreview).catch(() => {});
  }, [token]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  if (loading) {
    return (
      <div className="premium-dashboard">
        <div className="premium-main">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ fontSize: '18px', color: '#6B7280' }}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-dashboard">
      <TeacherMobileMenu
        user={user}
        roleLabel={roleLabel}
        hubTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={logout}
        basePath={basePath}
      />
      <PremiumSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={logout}
        basePath={basePath}
      />

      <main className="premium-main">
        <nav className="premium-top-nav">
          <div className="welcome-section">
            <h1>
              Welcome back,<br />
              <span className="greeting">{user?.name} 👋</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user?.school_name && (
              <div className="school-selector">🏫 {user.school_name}</div>
            )}
            <AppNotificationsBell basePath={basePath} />
            <Link to="/messages" className="profile-avatar" title="Messages">💬</Link>
            <Link to="/profile" className="profile-avatar">
              {user?.name?.charAt(0) || 'U'}
            </Link>
            <button type="button" className="mobile-logout-btn" onClick={logout} title="Logout">
              🚪
            </button>
          </div>
        </nav>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: 10, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {activeTab === 'classes' && (
          <>
            <div className="premium-actions-row">
              <button type="button" className="premium-action-button premium-action-button--create" onClick={() => setShowCreate(true)}>
                + Fungura Ishuri
              </button>
              <button
                type="button"
                className="premium-action-button premium-action-button--add"
                onClick={() => setShowAddStudents(true)}
                disabled={user?.role === 'teacher' && !hasSchool}
              >
                👤 Add Students
              </button>
              <Link to="/alumni/graduation" className="premium-action-button premium-action-button--graduate">🎓 Graduate Students</Link>
            </div>

            {hasSchool && (
              <>
                <QuizTeacherShareInbox token={token} classes={classes} onChange={loadClasses} />
                <NoteTeacherShareInbox token={token} classes={classes} onChange={loadClasses} />
              </>
            )}

            {classes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <h2 style={{ fontSize: 22, color: '#111827', marginBottom: 8 }}>Nta madarasa</h2>
                <p style={{ color: '#6B7280', marginBottom: 16 }}>Fungura ishuri ryawe rya mbere utangire</p>
                <button type="button" className="premium-action-button" onClick={() => setShowCreate(true)}>
                  Fungura Ishuri
                </button>
              </div>
            ) : (
              classes.map((cls) => (
                <PremiumClassCard
                  key={cls.id}
                  classData={cls}
                  studentCount={Number(cls.student_count) || 0}
                  graduatedCount={Number(cls.graduated_count) || 0}
                  basePath={basePath}
                />
              ))
            )}

            <footer className="premium-footer">
              <div className="footer-date">📅 {getDayName()}</div>
              <div className="footer-quote">
                "Education is the most powerful weapon which you can use to change the world."
              </div>
              <div className="footer-brand">❤️ Made for Teachers in Rwanda</div>
            </footer>
          </>
        )}

        {activeTab === 'chats' && (
          hasSchool
            ? <StaffChatsPanel token={token} />
            : <p style={{ color: '#6B7280', padding: '40px 20px', textAlign: 'center' }}>Link to a school to message parents.</p>
        )}

        {activeTab === 'class-now' && (
          <>
            <OnlineNowStrip online={online} />
            <StaffClassNowPanel token={token} classes={classes} />
          </>
        )}

        {activeTab === 'quiz-reports' && (
          <div style={{ padding: '8px 0' }}>
            <h2 style={{ fontSize: 22, color: '#111827', marginBottom: 16 }}>📊 Weekly Quiz Reports</h2>
            {classes.length === 0 ? (
              <p style={{ color: '#6B7280', padding: '20px', textAlign: 'center' }}>Create a class first to use quiz reports.</p>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <select
                    value={selectedReportClass || ''}
                    onChange={e => setSelectedReportClass(parseInt(e.target.value, 10))}
                    style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, minWidth: 240 }}
                  >
                    <option value="">— Select a class —</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.subject ? ` (${c.subject})` : ''}</option>
                    ))}
                  </select>
                </div>
                {selectedReportClass && (
                  <WeeklyQuizReport token={token} classId={selectedReportClass} />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'inyandiko' && (
          <StaffInyandikoDashboard token={token} basePath={basePath} />
        )}

        {activeTab === 'ai-quiz' && (
          <AIQuizGenerator token={token} classId={selectedReportClass} classes={classes} />
        )}

        {activeTab === 'alumni' && (
          <div style={{ padding: '8px 0' }}>
            <h2 style={{ fontSize: 22, color: '#111827', marginBottom: 16 }}>🎓 Alumni</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/alumni/directory" className="premium-action-button">🔍 Alumni Directory</Link>
              <Link to="/alumni/graduation" className="premium-action-button">🎓 Graduate Students</Link>
              <Link to="/alumni/admin" className="premium-action-button">⚙️ Manage Alumni Content</Link>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div style={{ padding: '8px 0' }}>
            {!hasSchool && (
              <p style={{ color: '#6B7280', marginBottom: 16 }}>Some tools require linking to a school.</p>
            )}
            {hasSchool && (
              <ClassMomentsDashboardBlock
                token={token}
                userRole={user?.role}
                preview={momentPreview}
                feedPath={`${basePath}/class-moments`}
                showOpenAll
              />
            )}
            {hasSchool && (
              <section style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, color: '#111827', marginBottom: 10 }}>✍️ C. Status (school)</h2>
                <CompositionStatusList token={token} schoolWide />
              </section>
            )}
            <StaffQuickActions
              token={token}
              onAddStudents={() => setShowAddStudents(true)}
              onParentInvites={() => setShowParentInvites(true)}
            />
            <section style={{ marginTop: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, color: '#111827', marginBottom: 10 }}>👤 Guest marks (share links)</h2>
              <GuestMarksPanel token={token} />
            </section>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="premium-action-button" onClick={() => setShowNotifyParents(true)}>
                📢 Notify parents
              </button>
              {isHeadTeacher && (
                <button type="button" className="premium-action-button" onClick={() => setShowAddTeacher(true)}>
                  👨‍🏫 Add teacher
                </button>
              )}
              {classes[0]?.id && (
                <button type="button" className="premium-action-button" onClick={() => setShowWeeklyDigest(true)}>
                  📊 Weekly behavior digest
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '8px 0' }}>
            <h2 style={{ fontSize: 22, color: '#111827', marginBottom: 16 }}>⚙ Settings</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/profile" className="premium-action-button">👤 My Profile</Link>
              <Link to="/messages" className="premium-action-button">💬 Messages</Link>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '12px' }}>Help</h2>
            <p style={{ color: '#6B7280' }}>Watch the tutorial video to get started</p>
          </div>
        )}
      </main>

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
          onClose={() => { setShowAddStudents(false); loadClasses(); }}
          onNeedJoinSchool={() => { setShowAddStudents(false); setActiveTab('classes'); }}
        />
      )}
      {showParentInvites && (
        <ParentInvitesPickerModal token={token} onClose={() => setShowParentInvites(false)} />
      )}
      {showAddTeacher && (
        <AddTeacherModal
          token={token}
          onClose={() => setShowAddTeacher(false)}
          onCreated={() => setShowAddTeacher(false)}
        />
      )}
      {showNotifyParents && classes[0]?.id && (
        <NotifyParentsModal
          token={token}
          classId={parseInt(classes[0].id, 10)}
          onClose={() => setShowNotifyParents(false)}
        />
      )}
      {showWeeklyDigest && classes[0]?.id && (
        <WeeklyDigestModal
          token={token}
          classId={parseInt(classes[0].id, 10)}
          onClose={() => setShowWeeklyDigest(false)}
          onSent={() => setShowWeeklyDigest(false)}
        />
      )}
    </div>
  );
}
