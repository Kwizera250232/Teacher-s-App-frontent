import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CreateClassModal from '../components/CreateClassModal';
import AddStudentsModal from '../components/AddStudentsModal';
import SchoolRequestBanner from '../components/SchoolRequestBanner';
import SchoolRequestsPanel from '../components/SchoolRequestsPanel';
import VerifiedBadge from '../components/VerifiedBadge';
import UmunsiAiModal from '../components/UmunsiAiModal';
import DonateButton from '../components/DonateButton';
import StaffQuickActions from '../components/StaffQuickActions';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import './Dashboard.css';

export default function StaffDashboard({ roleLabel, basePath }) {
  const { user, token, logout, isImpersonating, stopImpersonation } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  const [aiModal, setAiModal] = useState(null);
  const [unread, setUnread] = useState(0);

  const dismissAnnouncement = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

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
    api.get('/admin/user-announcements', token).then(setAnnouncements).catch(() => {});
  }, []);
  useEffect(() => {
    api.get('/messages/unread-count', token).then(r => setUnread(r.count)).catch(() => {});
  }, []);

  const subtitle = roleLabel === 'Head Teacher'
    ? 'Gucunga amashuri y\'ishuri ryawe'
    : 'Gucunga amashuri n\'abanyeshuri bawe';

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎓 UClass</div>
        <div className="dash-user">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            👋 {user?.name}
            <VerifiedBadge size={15} info={{ items: [
              { icon: '👨‍🏫', label: 'Role', value: roleLabel },
              { icon: '📧', label: 'Email', value: user?.email },
            ] }} />
          </span>
          {isImpersonating && (
            <button className="btn btn-secondary btn-sm" onClick={stopImpersonation}>↩ Return Admin</button>
          )}
          <Link to="/messages" className="btn btn-secondary btn-sm" style={{ position: 'relative' }}>
            💬 Messages{unread > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 11, fontWeight: 700, padding: '1px 6px', marginLeft: 4 }}>{unread}</span>}
          </Link>
          <DonateButton />
          <Link to="/profile" className="btn btn-secondary btn-sm">👤 Profile</Link>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>{roleLabel} Dashboard</h1>
            <p className="dash-sub">{subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + Fungura Ishuri
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddStudents(true)}>
              👤 Add Students
            </button>
          </div>
        </div>

        <SchoolRequestBanner token={token} user={user} />
        <EmailVerificationBanner />
        {roleLabel === 'Head Teacher' && <SchoolRequestsPanel token={token} />}

        {error && <div className="alert alert-error">{error}</div>}

        <StaffQuickActions token={token} basePath={basePath} firstClassId={classes[0]?.id} onAddStudents={() => setShowAddStudents(true)} />

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
              title="Dismiss"
            >✕</button>
          </div>
        ))}

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Nta madarasa</h3>
            <p>Fungura ishuri ryawe rya mbere utangire</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Fungura Ishuri</button>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(cls => (
              <div key={cls.id} className="class-card-wrap">
                <Link to={`${basePath}/classes/${cls.id}`} className="class-card">
                  <div className="class-card-header">
                    <h3>{cls.name}</h3>
                    {cls.subject && <span className="subject-tag">{cls.subject}</span>}
                  </div>
                  <div className="class-code-display">
                    <span className="code-label">Class Code</span>
                    <span className="code-value">{cls.class_code}</span>
                  </div>
                  <div className="class-card-footer">
                    <span>👥 {cls.student_count} students</span>
                    <span className="arrow">→</span>
                  </div>
                </Link>
                <button
                  className="class-card-note-btn"
                  onClick={() => setAiModal({ classId: cls.id, className: cls.name })}
                >
                  🎓 Baza Umunsi AI
                </button>
                <Link to={`${basePath}/classes/${cls.id}/record-marks`} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 8, textAlign: 'center' }}>
                  📊 Record CAT Marks
                </Link>
              </div>
            ))}
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
          onClose={() => setShowAddStudents(false)}
        />
      )}

      {aiModal && (
        <UmunsiAiModal
          classId={aiModal.classId}
          className={aiModal.className}
          token={token}
          isTeacher={true}
          onClose={() => setAiModal(null)}
        />
      )}
    </div>
  );
}
