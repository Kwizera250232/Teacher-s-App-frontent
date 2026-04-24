import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './ClassLeaderboard.css';

const BADGE_META = {
  perfect_score: { icon: '💯', label: 'Igisubizo Cyuzuye', color: '#f39c12' },
  excellence:    { icon: '⭐', label: 'Ubwiza',           color: '#9b59b6' },
  great_job:     { icon: '🏅', label: 'Akazi Keza',       color: '#27ae60' },
  top_student:   { icon: '🏆', label: 'Umunyeshuri #1',   color: '#e74c3c' },
  keep_going:    { icon: '💪', label: 'Komeza Wihatire',  color: '#3498db' },
};

export default function ClassLeaderboard({ classId }) {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api.get(`/classes/${classId}/leaderboard`, token)
      .then(data => { setEntries(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <div className="lb-loading">Gutegereza...</div>;
  if (entries.length === 0) return (
    <div className="lb-empty">
      <div style={{ fontSize: 50 }}>🏁</div>
      <p>Nta nyeshuri yazamuye ikizamini kandi igaragara hano ubu.</p>
    </div>
  );

  const top = entries[0];
  const hasScores = Number(top.total_score) > 0;

  return (
    <div className="lb-wrapper">
      {hasScores && (
        <div className="lb-hero">
          <div className="lb-trophy">🏆</div>
          <div className="lb-winner-name">{top.student_name}</div>
          <div className="lb-winner-score">{top.total_score} / {top.total_possible} amanota</div>
          <div className="lb-kinyarwanda">
            🎉 Umunyeshuri wagize amanota menshi ni <strong>{top.student_name}</strong> n'amanota ye{' '}
            <strong>{top.total_score}/{top.total_possible}</strong>!
          </div>
          <div className="lb-badge-row">
            {Object.entries(BADGE_META).slice(0, 3).map(([key, meta]) => (
              <span key={key} className="lb-badge" style={{ borderColor: meta.color }}>
                {meta.icon} {meta.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="lb-table-wrap">
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Izina</th>
              <th>Ikizamini</th>
              <th>Amanota Yose</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.student_id} className={i === 0 && hasScores ? 'lb-top-row' : ''}>
                <td>
                  {i === 0 && hasScores ? '🥇' :
                   i === 1 ? '🥈' :
                   i === 2 ? '🥉' :
                   i + 1}
                </td>
                <td>{e.student_name}</td>
                <td>{e.quizzes_taken}</td>
                <td>{e.total_score || 0} / {e.total_possible || 0}</td>
                <td>
                  <span className="lb-pct" style={{ background: pctColor(e.avg_percentage) }}>
                    {e.avg_percentage || 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pctColor(pct) {
  if (!pct) return '#eee';
  if (pct >= 90) return '#27ae60';
  if (pct >= 75) return '#f39c12';
  if (pct >= 50) return '#3498db';
  return '#e74c3c';
}
