import { useState, useEffect } from 'react';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';
import './TeacherShareInbox.css';

export default function QuizTeacherShareInbox({ token, classes = [], onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [classByShare, setClassByShare] = useState({});

  const load = () => {
    setLoading(true);
    api.get('/quiz-teacher-shares/inbox', token)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const accept = async (id) => {
    const targetClassId = classByShare[id] || (classes[0] && String(classes[0].id));
    if (!targetClassId) {
      alert('Create a class first, then choose where students should see this quiz.');
      return;
    }
    setActionLoading(id);
    try {
      await api.put(`/quiz-teacher-shares/${id}/accept`, { target_class_id: Number(targetClassId) }, token);
      load();
      onChange?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const decline = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/quiz-teacher-shares/${id}/decline`, {}, token);
      load();
      onChange?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <p className="phub-muted" style={{ marginBottom: 12, fontSize: 13 }}>Loading quiz shares…</p>;
  }

  return (
    <div className="share-inbox share-inbox--quiz">
      <div className="share-inbox__header">
        <span className="share-inbox__icon">❓</span>
        <strong className="share-inbox__title">
          Quiz shares from colleagues ({items.length})
        </strong>
      </div>
      {items.length === 0 ? (
        <p className="share-inbox__empty">
          When another teacher at your school shares a quiz, it appears here for you to accept or decline.
        </p>
      ) : (
        <div className="share-inbox__list">
          {items.map((r) => (
            <div key={r.id} className="share-card">
              <div>
                <p className="share-card__title">{r.quiz_title}</p>
                <div className="share-card__meta">
                  From
                  {' '}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {r.source_teacher_name}
                    {r.source_teacher_verified && (
                      <VerifiedBadge
                        size={12}
                        info={{
                          items: [
                            { icon: '✓', label: 'Verified teacher', value: 'Approved at your school' },
                            { icon: '📚', label: 'Class', value: r.source_class_name },
                          ],
                        }}
                      />
                    )}
                  </span>
                  {' · '}{r.source_class_name}
                  {r.source_class_subject ? ` · ${r.source_class_subject}` : ''}
                </div>
                {r.message && (
                  <div className="share-card__msg">&ldquo;{r.message}&rdquo;</div>
                )}
              </div>
              <div className="share-card__actions">
                <label className="share-card__select-wrap">
                  Class:
                  <select
                    className="share-card__select"
                    value={classByShare[r.id] || (classes[0] ? String(classes[0].id) : '')}
                    onChange={(e) => setClassByShare((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    disabled={!classes.length || actionLoading === r.id}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="share-card__btn share-card__btn--accept"
                  onClick={() => accept(r.id)}
                  disabled={actionLoading === r.id || !classes.length}
                >
                  ✓ Accept
                </button>
                <button
                  type="button"
                  className="share-card__btn share-card__btn--decline"
                  onClick={() => decline(r.id)}
                  disabled={actionLoading === r.id}
                >
                  ✕ Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
