import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function AdminSchools({ token }) {
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ name: '', location: '', code: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/admin/schools', token).then(setSchools).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return setError('School name is required.');
    try {
      if (editing) {
        await api.post(`/admin/schools/${editing}`, form, token, 'PUT');
      } else {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/schools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
      }
      setForm({ name: '', location: '', code: '' });
      setEditing(null);
      setError('');
      load();
    } catch (e) { setError(e.message); }
  };

  const del = async (id) => {
    if (!confirm('Delete this school?')) return;
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/schools/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const edit = (s) => { setEditing(s.id); setForm({ name: s.name, location: s.location || '', code: s.code || '' }); };

  return (
    <div className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">🏫 Schools</h2>
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

      <div className="admin-form-row">
        <input className="admin-input" placeholder="School Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="admin-input" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        <input className="admin-input" placeholder="Code (optional)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
        <button className="btn-sm btn-primary" onClick={save}>{editing ? 'Update' : '+ Add School'}</button>
        {editing && <button className="btn-sm btn-outline" onClick={() => { setEditing(null); setForm({ name: '', location: '', code: '' }); }}>Cancel</button>}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Name</th><th>Location</th><th>Code</th><th>Users</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {schools.length === 0 && <tr><td colSpan={7} className="empty-text">No schools yet.</td></tr>}
            {schools.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td><strong>{s.name}</strong></td>
                <td>{s.location || '—'}</td>
                <td>{s.code ? <span className="badge badge-blue">{s.code}</span> : '—'}</td>
                <td>{s.user_count}</td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn-sm btn-warning" onClick={() => edit(s)}>✏️ Edit</button>
                  <button className="btn-sm btn-danger" onClick={() => del(s.id)}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
