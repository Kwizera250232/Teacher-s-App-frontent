import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');

  const loadClasses = () => {
    api.get('/classes/my', token).then(setClasses).catch(e => setError(e.message));
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
            <h1>My Classes</h1>
            <p className="dash-sub">Access your learning materials</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowJoin(true)}>
            + Injira mu Ishuri
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎒</div>
            <h3>Nta madarasa nawe</h3>
            <p>Injira mu ishuri ukoresheje kode umwarimu wawe yakuguye</p>
            <button className="btn btn-primary" onClick={() => setShowJoin(true)}>Injira mu Ishuri</button>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(cls => (
              <Link key={cls.id} to={`/student/classes/${cls.id}`} className="class-card">
                <div className="class-card-header">
                  <h3>{cls.name}</h3>
                  {cls.subject && <span className="subject-tag">{cls.subject}</span>}
                </div>
                <div className="class-teacher">
                  <span>👨‍🏫 {cls.teacher_name}</span>
                </div>
                <div className="class-card-footer">
                  <span>Tap to enter</span>
                  <span className="arrow">→</span>
                </div>
              </Link>
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
    </div>
  );
}
