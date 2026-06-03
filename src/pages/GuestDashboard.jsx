import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import GuestShell from '../components/GuestShell';
import GuestUpgradeModal from '../components/GuestUpgradeModal';
import './Dashboard.css';
import './GuestDashboard.css';
import '../components/GuestUpgradeModal.css';

export default function GuestDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [hub, setHub] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get('/guest/hub', token)
      .then(setHub)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const openQuiz = (classId, quizId) => {
    navigate(`/guest/classes/${classId}/quizzes/${quizId}`);
  };

  return (
    <GuestShell title="Guest home">
      <div className="guest-limits-banner">
        <strong>Guest mode — limited access</strong>
        <ul>
          <li>✅ Take quizzes, view announcements, notes & homework from shared classes</li>
          <li>❌ No class roster, leaderboard, discussions, or homework submission</li>
          <li>❌ Not visible as a enrolled student to your teacher</li>
        </ul>
      </div>

      <div className="guest-upgrade-cta">
        <p>
          <strong>Are you a teacher or student?</strong> Upgrade your account to unlock the full dashboard
          and keep your quiz scores.
        </p>
        <button type="button" className="btn btn-full" onClick={() => setShowUpgrade(true)}>
          Upgrade account →
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && hub && (
        <>
          {hub.quiz_access_note && (
            <p
              style={{
                fontSize: 13,
                color: '#065f46',
                fontWeight: 600,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 16,
              }}
            >
              {hub.quiz_access_note}
            </p>
          )}

          {hub.quizzes_pending?.length > 0 && (
            <section className="guest-quiz-section">
              <h2>❓ Quizzes to take ({hub.quizzes_pending.length})</h2>
              <div className="guest-quiz-list">
                {hub.quizzes_pending.map((q) => (
                  <div key={`${q.class_id}-${q.id}`} className="guest-quiz-row">
                    <div className="guest-quiz-row__meta">
                      <strong>{q.title}</strong>
                      <small>
                        {q.class_name}
                        {q.teacher_name ? ` · ${q.teacher_name}` : ''}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openQuiz(q.class_id, q.id)}
                    >
                      Take quiz →
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <h2 style={{ fontSize: 17, marginTop: 24, marginBottom: 12 }}>Classes from shared links</h2>
          {hub.classes.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              Open a quiz share link from a teacher to unlock classes here.
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

          {(hub.attempts?.length > 0 || hub.quizzes_completed?.length > 0) && (
            <section className="guest-quiz-section">
              <h2>✅ Completed quizzes</h2>
              <div className="guest-quiz-list">
                {(hub.attempts || []).slice(0, 12).map((a) => (
                  <div key={a.id} className="guest-quiz-row">
                    <div className="guest-quiz-row__meta">
                      <strong>{a.quiz_title}</strong>
                      <small>
                        {a.class_name} · {a.score}/{a.total} ·{' '}
                        {new Date(a.attempted_at).toLocaleString()}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openQuiz(a.class_id, a.quiz_id)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <GuestUpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </GuestShell>
  );
}
