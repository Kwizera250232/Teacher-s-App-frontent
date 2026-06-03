import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function GuestDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [hub, setHub] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .get('/guest/hub', token)
      .then(setHub)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header" style={{ background: '#128c7e' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, color: '#fff' }}>UClass Guest</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
            {user?.name} · {user?.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/welcome" className="btn btn-secondary btn-sm" style={{ background: '#fff' }}>
            About UClass
          </Link>
          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <strong style={{ color: '#065f46' }}>Guest account</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#047857', lineHeight: 1.5 }}>
            You are not in any school class and you do not appear on leaderboards. You can take
            quizzes shared with you by teachers.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

        {!loading && hub && (
          <>
            <h2 style={{ fontSize: 17, marginBottom: 12 }}>Quizzes you can try</h2>
            {hub.classes.length === 0 ? (
              <p style={{ color: '#64748b' }}>
                Open a quiz share link from a teacher to unlock quizzes here.
              </p>
            ) : (
              hub.classes.map((cls) => (
                <section key={cls.class_id} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>
                    {cls.class_name}
                    <span style={{ fontWeight: 400, color: '#64748b', fontSize: 13 }}>
                      {' '}
                      · {cls.teacher_name}
                    </span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {(cls.quizzes || []).map((q) => (
                      <div key={q.id} className="item-card">
                        <div className="item-card-body">
                          <h3 style={{ margin: 0, fontSize: 15 }}>❓ {q.title}</h3>
                          {q.description && (
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                              {q.description}
                            </p>
                          )}
                          <span className="meta">
                            {q.attempted ? '✓ Already taken' : 'Not taken yet'}
                          </span>
                        </div>
                        <div className="item-card-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              navigate(`/guest/classes/${cls.class_id}/quizzes/${q.id}`)
                            }
                          >
                            {q.attempted ? 'View result' : 'Take quiz'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}

            {hub.attempts?.length > 0 && (
              <>
                <h2 style={{ fontSize: 17, marginTop: 28, marginBottom: 12 }}>Your quiz history</h2>
                {hub.attempts.map((a) => (
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
      </main>
    </div>
  );
}
