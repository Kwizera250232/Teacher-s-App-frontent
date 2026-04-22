import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CreateClassModal from '../components/CreateClassModal';
import './Dashboard.css';

export default function TeacherDashboard() {
  const { user, token, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const loadClasses = () => {
    api.get('/classes', token).then(setClasses).catch(e => setError(e.message));
  };

  useEffect(() => { loadClasses(); }, []);

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎓 UClass</div>
        <div className="dash-user">
          <span>👋 {user?.name}</span>
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
              <Link key={cls.id} to={`/teacher/classes/${cls.id}`} className="class-card">
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
    </div>
  );
}
