import { useState, useEffect } from 'react';
import { api } from '../../api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminTeachers({ token }) {
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState('');

  const load = () => {
    api.get('/admin/teachers', token).then(setTeachers).catch(() => {});
    api.get('/admin/schools', token).then(setSchools).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const toggle = async (t) => {
    await fetch(`${BASE}/admin/teachers/${t.id}/suspend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ suspended: !t.is_suspended }),
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Remove this teacher? All their classes will be deleted.')) return;
    await fetch(`${BASE}/admin/teachers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const assignSchool = async (id, school_id) => {
    await fetch(`${BASE}/admin/teachers/${id}/school`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ school_id: school_id || null }),
    });
    load();
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">👨‍🏫 Teachers ({teachers.length})</h2>
        <input className="admin-input" style={{ maxWidth: 240 }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>School</th><th>Classes</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="empty-text">No teachers found.</td></tr>}
            {filtered.map(t => (
              <tr key={t.id}>
                <td><strong>{t.name}</strong></td>
                <td>{t.email}</td>
                <td>
                  <select
                    className="admin-input"
                    style={{ padding: '0.3rem', minWidth: 120 }}
                    value={t.school_id || ''}
                    onChange={e => assignSchool(t.id, e.target.value)}
                  >
                    <option value="">— None —</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td>{t.class_count}</td>
                <td>
                  <span className={`badge ${t.is_suspended ? 'badge-red' : 'badge-green'}`}>
                    {t.is_suspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className={`btn-sm ${t.is_suspended ? 'btn-success' : 'btn-warning'}`} onClick={() => toggle(t)}>
                    {t.is_suspended ? '✅ Activate' : '⏸ Suspend'}
                  </button>
                  <button className="btn-sm btn-danger" onClick={() => remove(t.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
