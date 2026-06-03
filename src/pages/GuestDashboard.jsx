import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import GuestShell from '../components/GuestShell';
import './Dashboard.css';
import './GuestDashboard.css';

export default function GuestDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [hub, setHub] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get('/guest/hub', token)
      .then(setHub)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <GuestShell title="Guest home">
      <div
        style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <strong style={{ color: '#065f46' }}>Guest access</strong>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#047857', lineHeight: 1.5 }}>
          View shared class materials (announcements, notes, homework) and take quizzes. You are
          not on the class roster, leaderboard, or student discussions.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && hub && (
        <>
          <h2 style={{ fontSize: 17, marginBottom: 12 }}>Classes from shared links</h2>
          {hub.classes.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              Open a quiz share link from a teacher to unlock a class here.
            </p>
          ) : (
            <div className="guest-class-grid">
              {hub.classes.map((cls) => (
                <div key={cls.class_id} className="guest-class-card">
                  <h3>{cls.class_name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    {cls.subject ? `${cls.subject} · ` : ''}
                    {cls.teacher_name}
                  </p>
                  <div className="guest-pill-row">
                    <span className="guest-pill">📢 {cls.counts?.announcements || 0}</span>
                    <span className="guest-pill">📄 {cls.counts?.notes || 0}</span>
                    <span className="guest-pill">📝 {cls.counts?.homework || 0}</span>
                    <span className="guest-pill">❓ {cls.counts?.quizzes || 0}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    style={{ marginTop: 12 }}
                    onClick={() => navigate(`/guest/classes/${cls.class_id}`)}
                  >
                    Open class →
                  </button>
                </div>
              ))}
            </div>
          )}

          {hub.attempts?.length > 0 && (
            <>
              <h2 style={{ fontSize: 17, marginTop: 28, marginBottom: 12 }}>Recent quiz results</h2>
              {hub.attempts.slice(0, 8).map((a) => (
                <div key={a.id} className="item-card" style={{ marginBottom: 8 }}>
                  <div className="item-card-body">
                    <strong>{a.quiz_title}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                      {a.class_name} · {a.score}/{a.total} ·{' '}
                      {new Date(a.attempted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="item-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        navigate(`/guest/classes/${a.class_id}/quizzes/${a.quiz_id}`)
                      }
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </GuestShell>
  );
}
