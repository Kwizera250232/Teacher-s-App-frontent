import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ClassmateProfileModal from './ClassmateProfileModal';

/** WhatsApp-style list of classmates across the student's classes. */
export default function StudentClassmatesList({ token, classes }) {
  const { user } = useAuth();
  const [mates, setMates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!classes?.length) {
      setMates([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const byId = new Map();
      await Promise.all(
        classes.map(async (cls) => {
          try {
            const students = await api.get(`/classes/${cls.id}/students`, token);
            (students || []).forEach((s) => {
              if (s.id === user?.id) return;
              const key = s.id;
              if (!byId.has(key)) {
                byId.set(key, {
                  id: s.id,
                  name: s.name,
                  class_name: cls.name,
                  class_id: cls.id,
                });
              }
            });
          } catch {
            /* skip */
          }
        })
      );
      if (!cancelled) {
        setMates([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classes, token, user?.id]);

  if (loading) return <p className="wa-section-hint">Loading classmates…</p>;
  if (!mates.length) return null;

  return (
    <section className="wa-chat-section">
      <div className="wa-section-title">Classmates</div>
      <div className="wa-class-list">
        {mates.map((m) => (
          <button
            key={m.id}
            type="button"
            className="wa-class-row wa-class-row--mate"
            onClick={() => setSelected({ id: m.id, name: m.name, role: 'student' })}
          >
            <div className="wa-class-avatar wa-class-avatar--mate">
              {(m.name || '?').slice(0, 1)}
            </div>
            <div className="wa-class-body">
              <strong>{m.name}</strong>
              <span>{m.class_name} · Tap to view</span>
            </div>
            <span className="wa-class-time">›</span>
          </button>
        ))}
      </div>
      {selected && (
        <ClassmateProfileModal
          person={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
