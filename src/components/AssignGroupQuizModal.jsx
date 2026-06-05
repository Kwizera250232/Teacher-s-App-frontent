import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AssignGroupQuizModal({ classId, token, quiz, onClose, onAssigned }) {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/classes/${classId}/classroom`, token)
      .then((data) => setGroups(data.groups || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [classId, token]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selected.size) {
      setError('Pick at least one group.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post(
        `/classes/${classId}/group-quizzes`,
        { quiz_id: quiz.id, group_ids: [...selected] },
        token
      );
      onAssigned?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2>Assign to groups</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 14 }}>
          Quiz: <strong>{quiz?.title}</strong> — group members open their group and start working together.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <p style={{ padding: 16, color: '#888' }}>Loading groups…</p>
        ) : groups.length === 0 ? (
          <p style={{ padding: 16, color: '#888' }}>
            No groups yet. Create groups on the <strong>Students</strong> tab first.
          </p>
        ) : (
          <form onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {groups.map((g) => (
                <label
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    border: selected.has(g.id) ? '2px solid #667eea' : '1px solid #e5e7eb',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: selected.has(g.id) ? '#f8f9ff' : '#fff',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(g.id)}
                    onChange={() => toggle(g.id)}
                  />
                  <span style={{ fontWeight: 600 }}>{g.name}</span>
                  <span style={{ fontSize: 12, color: '#888' }}>
                    {g.student_ids?.length || 0} students
                  </span>
                </label>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving || !selected.size}>
              {saving ? 'Assigning…' : 'Assign quiz to selected groups'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
