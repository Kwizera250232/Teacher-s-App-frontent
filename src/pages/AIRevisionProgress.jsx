import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './AIRevision.css';

export default function AIRevisionProgress() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai-revision/progress', token).then(d => {
      setData(d);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="ar-page">
        <div className="ar-header">
          <button className="ar-header-back" onClick={() => navigate('/alumni/feed')}>← Back</button>
          <div className="ar-header-title">📊 My Progress</div>
        </div>
        <div className="ar-loading">Loading progress...</div>
      </div>
    );
  }

  if (!data || data.sessions.length === 0) {
    return (
      <div className="ar-page">
        <div className="ar-header">
          <button className="ar-header-back" onClick={() => navigate('/alumni/feed')}>← Back</button>
          <div className="ar-header-title">📊 My Progress</div>
        </div>
        <div className="ar-progress">
          <div className="ar-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            No revision sessions yet.
            <br />
            Take your first AI Assessment Revision to start tracking progress!
            <br /><br />
            <button className="ar-action-btn ar-action-primary" onClick={() => navigate('/alumni/ai-revision')}>
              🚀 Start Revision
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { sessions, stats } = data;
  const progressData = stats.progress_over_time.slice(-15);

  return (
    <div className="ar-page">
      <div className="ar-header">
        <button className="ar-header-back" onClick={() => navigate('/alumni/feed')}>← Back</button>
        <div className="ar-header-title">📊 My Revision Progress</div>
      </div>

      <div className="ar-progress">
        {/* Summary stats */}
        <div className="ar-progress-stats">
          <div className="ar-stat-card">
            <div className="ar-stat-card-num">{stats.total_attempts}</div>
            <div className="ar-stat-card-label">Quizzes Taken</div>
          </div>
          <div className="ar-stat-card">
            <div className="ar-stat-card-num">{stats.average_score}%</div>
            <div className="ar-stat-card-label">Average</div>
          </div>
          <div className="ar-stat-card">
            <div className="ar-stat-card-num">{stats.best_score}%</div>
            <div className="ar-stat-card-label">Best Score</div>
          </div>
        </div>

        {/* Progress chart */}
        {progressData.length > 0 && (
          <div className="ar-chart-card">
            <h3 className="ar-chart-title">📈 Score Over Time</h3>
            <div className="ar-chart">
              {progressData.map((p, i) => (
                <div
                  key={i}
                  className="ar-chart-bar"
                  style={{ height: `${Math.max(p.percentage, 4)}%` }}
                >
                  <span className="ar-chart-bar-value">{p.percentage}</span>
                  <span className="ar-chart-bar-label">
                    {new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject breakdown */}
        {stats.subject_stats.length > 0 && (
          <div className="ar-chart-card">
            <h3 className="ar-chart-title">📚 Subject Performance</h3>
            {stats.subject_stats.map(s => (
              <div key={s.subject} className="ar-subject-row">
                <div className="ar-subject-name">{s.subject}</div>
                <div className="ar-subject-bar">
                  <div className="ar-subject-bar-fill" style={{ width: `${s.average}%` }} />
                </div>
                <div className="ar-subject-avg">{s.average}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Strongest & Weakest */}
        {(stats.strongest_subjects.length > 0 || stats.weakest_subjects.length > 0) && (
          <div className="ar-chart-card">
            <h3 className="ar-chart-title">💪 Strengths & Weaknesses</h3>
            {stats.strongest_subjects.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>✅ Strong Areas</div>
                {stats.strongest_subjects.map(s => (
                  <div key={s.subject} className="ar-subject-row">
                    <div className="ar-subject-name">{s.subject}</div>
                    <div className="ar-subject-avg" style={{ color: '#10b981' }}>{s.average}% avg</div>
                  </div>
                ))}
              </div>
            )}
            {stats.weakest_subjects.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>⚠️ Needs Work</div>
                {stats.weakest_subjects.map(s => (
                  <div key={s.subject} className="ar-subject-row">
                    <div className="ar-subject-name">{s.subject}</div>
                    <div className="ar-subject-avg" style={{ color: '#ef4444' }}>{s.average}% avg</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="ar-chart-card">
          <h3 className="ar-chart-title">🕐 Recent Sessions</h3>
          {sessions.slice(0, 20).map(s => {
            const pct = s.percentage;
            const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
            const bgColor = pct >= 75 ? '#f0fdf4' : pct >= 60 ? '#fffbeb' : '#fef2f2';
            return (
              <div key={s.id} className="ar-history-item">
                <div className="ar-history-icon" style={{ background: bgColor, color }}>
                  {pct >= 75 ? '🏆' : pct >= 60 ? '👍' : '📚'}
                </div>
                <div className="ar-history-info">
                  <div className="ar-history-subject">{s.subject}</div>
                  <div className="ar-history-meta">
                    {s.quiz_type.replace(/_/g, ' ')} · {s.difficulty} · {new Date(s.completed_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="ar-history-score" style={{ color }}>
                  {s.score}/{s.total}
                </div>
              </div>
            );
          })}
        </div>

        <div className="ar-results-actions">
          <button className="ar-action-btn ar-action-primary" onClick={() => navigate('/alumni/ai-revision')}>
            🚀 New Revision Quiz
          </button>
          <button className="ar-action-btn ar-action-secondary" onClick={() => navigate('/alumni/feed')}>
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
