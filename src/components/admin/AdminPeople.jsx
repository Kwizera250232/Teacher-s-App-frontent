import { useState, useEffect } from 'react';
import { api } from '../../api';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export function AdminHeadTeachers({ token }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/head-teachers', token).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const q = search.toLowerCase();
  const filtered = rows.filter((r) => [r.name, r.email, r.phone, r.school_name].some((v) => String(v || '').toLowerCase().includes(q)));

  return (
    <div className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">🏫 Head Teachers ({rows.length})</h2>
        <input className="admin-input" style={{ maxWidth: 280 }} placeholder="Search name, email, school…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>School</th><th>Teachers</th><th>Students</th><th>Joined</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="empty-text">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="empty-text">No head teachers yet.</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.email}</td>
                <td>{r.phone || '—'}</td>
                <td>{r.school_name || '—'}</td>
                <td>{r.teacher_count ?? 0}</td>
                <td>{r.student_count ?? 0}</td>
                <td>{fmtDate(r.created_at)}</td>
                <td><span className={`badge ${r.is_suspended ? 'badge-red' : 'badge-green'}`}>{r.is_suspended ? 'Suspended' : 'Active'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminParents({ token }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/parents', token).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const q = search.toLowerCase();
  const text = (r) => [r.name, r.email, r.phone, ...(r.children || []).flatMap((c) => [c.name, c.school, ...(c.classes || [])])].join(' ').toLowerCase();
  const filtered = rows.filter((r) => text(r).includes(q));
  const childCount = rows.reduce((n, r) => n + (r.children?.length || 0), 0);

  return (
    <div className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">👨‍👩‍👧 Parents ({rows.length}) · {childCount} linked students</h2>
        <input className="admin-input" style={{ maxWidth: 280 }} placeholder="Search parent, student, class, school…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Parent</th><th>Email</th><th>Phone</th><th>Students, class &amp; school</th><th>Joined</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="empty-text">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="empty-text">No parents yet.</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.email}</td>
                <td>{r.phone || '—'}</td>
                <td>
                  {(r.children || []).length === 0 ? '—' : r.children.map((c) => (
                    <div key={c.id} style={{ marginBottom: 4, fontSize: 13 }}>
                      <strong>{c.name}</strong>
                      <span style={{ color: '#64748b' }}> · {(c.classes || []).join(', ') || 'no class'} · {c.school || 'no school'}</span>
                    </div>
                  ))}
                </td>
                <td>{fmtDate(r.created_at)}</td>
                <td><span className={`badge ${r.is_suspended ? 'badge-red' : 'badge-green'}`}>{r.is_suspended ? 'Suspended' : 'Active'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
