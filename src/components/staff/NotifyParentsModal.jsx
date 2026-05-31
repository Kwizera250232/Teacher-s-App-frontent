import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function NotifyParentsModal({ token, classId, onClose }) {
  const [parents, setParents] = useState([]);
  const [audience, setAudience] = useState(classId ? 'class' : 'all');
  const [selected, setSelected] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('announcement');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const q = classId ? `?class_id=${classId}` : '';
    api.get(`/parent/school/parents${q}`, token).then(setParents).catch(() => {});
  }, [token, classId]);

  const send = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const r = await api.post('/parent/notify', {
        title,
        body,
        type,
        audience,
        class_id: classId || undefined,
        parent_ids: audience === 'selected' ? selected : undefined,
      }, token);
      setMsg(r.message);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2>Notify parents (in app)</h2>
        <form onSubmit={send}>
          <label className="form-group">
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="announcement">Announcement</option>
              <option value="weekly_digest">Weekly behavior</option>
              <option value="info">Info</option>
            </select>
          </label>
          <label className="form-group">
            Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="form-group">
            Message
            <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label className="form-group">
            Send to
            <select value={audience} onChange={(e) => setAudience(e.target.value)}>
              {classId && <option value="class">All parents in this class</option>}
              <option value="all">All parents in school</option>
              <option value="selected">Selected parents</option>
            </select>
          </label>
          {audience === 'selected' && (
            <div style={{ maxHeight: 160, overflow: 'auto', marginBottom: 12 }}>
              {parents.map((p) => (
                <label key={p.id} style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                  {' '}{p.name} ({p.student_name})
                </label>
              ))}
            </div>
          )}
          {msg && <p className="alert alert-success">{msg}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
