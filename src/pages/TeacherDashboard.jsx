import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CreateClassModal from '../components/CreateClassModal';
import VerifiedBadge from '../components/VerifiedBadge';
import UmunsiAiModal from '../components/UmunsiAiModal';
import './Dashboard.css';

export default function TeacherDashboard() {
  const { user, token, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  const [aiModal, setAiModal] = useState(null); // { classId, className }

  const dismissAnnouncement = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  const loadClasses = () => {
    api.get('/classes', token).then(setClasses).catch(e => setError(e.message));
  };

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    api.get('/admin/user-announcements', token).then(setAnnouncements).catch(() => {});
  }, []);

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎓 UClass</div>
        <div className="dash-user">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>👋 {user?.name}<VerifiedBadge size={15} info={{ items: [
            { icon: '👨‍🏫', label: 'Role', value: 'Teacher' },
            { icon: '📧', label: 'Email', value: user?.email },
          ] }} /></span>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>Amashuri yanjye</h1>
            <p className="dash-sub">Gucunga amashuri n'abanyeshuri bawe</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Fungura Ishuri
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
            <div className="empty-icon">📚</div>
            <h3>Nta madarasa nawe</h3>
            <p>Fungura ishuri ryawe rya mbere utangire</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Fungura Ishuri</button>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(cls => (
              <div key={cls.id} className="class-card-wrap">
                <Link to={`/teacher/classes/${cls.id}`} className="class-card">
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
                {/* AI button for teacher */}
                <button
                  className="class-card-note-btn"
                  onClick={() => setAiModal({ classId: cls.id, className: cls.name })}
                >
                  🤖 Baza Umunsi AI
                </button>
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
