import { useState, useEffect } from 'react';
import { api } from '../../api';
import VerifiedBadge from '../VerifiedBadge';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminStudents({ token }) {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState('');
  const [resetId, setResetId] = useState(null);
  const [newPwd, setNewPwd] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email_local_part: '',
    school_id: '',
    email: '',
    password: '',
    phone: '',
    auto_generate_email: true,
  });
  const [bulkForm, setBulkForm] = useState({
    school_id: '',
    names_text: '',
    default_password: '',
    phone: '',
  });
  const [createdCredentials, setCreatedCredentials] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedSchool = schools.find((school) => String(school.id) === String(createForm.school_id || bulkForm.school_id || ''));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/admin/students', token);
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    api.get('/admin/schools', token)
      .then((rows) => setSchools(Array.isArray(rows) ? rows : []))
      .catch(() => setSchools([]));
  }, []);

  const createStudent = async () => {
    setError('');
    setMsg('');
    setCreatedCredentials([]);
    if (!createForm.name.trim()) return setError('Student name is required.');
    if (!createForm.school_id) return setError('Select school first.');

    try {
      const payload = {
        name: createForm.name.trim(),
        email_local_part: createForm.email_local_part.trim(),
        school_id: Number(createForm.school_id),
        auto_generate_email: createForm.auto_generate_email,
        email: createForm.auto_generate_email ? '' : createForm.email.trim(),
        password: createForm.password.trim(),
        phone: createForm.phone.trim(),
      };

      const created = await api.post('/admin/students', payload, token);
      if (created?.credentials) {
        setCreatedCredentials([
          {
            name: created.student?.name,
            email: created.credentials.email,
            password: created.credentials.password,
          },
        ]);
      }
      setMsg('Student account created.');
      setCreateForm((f) => ({ ...f, name: '', email_local_part: '', email: '', password: '', phone: '' }));
      load();
    } catch (e) {
      setError(e.message || 'Failed to create student.');
    }
  };

  const createStudentsBulk = async () => {
    setError('');
    setMsg('');
    setCreatedCredentials([]);
    if (!bulkForm.school_id) return setError('Select school for bulk create.');
    if (!bulkForm.names_text.trim()) return setError('Enter student names (one per line).');

    try {
      const result = await api.post('/admin/students/bulk-create', {
        school_id: Number(bulkForm.school_id),
        names_text: bulkForm.names_text,
        default_password: bulkForm.default_password.trim(),
        phone: bulkForm.phone.trim(),
      }, token);

      setCreatedCredentials(Array.isArray(result.created)
        ? result.created.map((s) => ({ name: s.name, email: s.email, password: s.password }))
        : []);

      setMsg(`Bulk create done: ${result.created_count} created, ${result.skipped_count} skipped.`);
      setBulkForm((f) => ({ ...f, names_text: '' }));
      load();
    } catch (e) {
      setError(e.message || 'Failed bulk student creation.');
    }
  };

  const toggle = async (s) => {
    await fetch(`${BASE}/admin/students/${s.id}/suspend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ suspended: !s.is_suspended }),
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Remove this student?')) return;
    await fetch(`${BASE}/admin/students/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const editStudentName = async (student) => {
    const nextName = prompt('Edit student full name', student.name || '');
    if (nextName === null) return;
    const name = String(nextName).trim();
    if (!name) return setError('Student name is required.');

    try {
      await api.put(`/admin/students/${student.id}`, { name }, token);
      setMsg('Student name updated.');
      setError('');
      load();
    } catch (e) {
      setError(e.message || 'Failed to update student name.');
    }
  };

  const resetPassword = async () => {
    if (newPwd.length < 6) return setMsg('Password must be at least 6 characters.');
    const res = await fetch(`${BASE}/admin/students/${resetId}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ new_password: newPwd }),
    });
    const data = await res.json();
    if (data.success) { setMsg('Password reset!'); setResetId(null); setNewPwd(''); }
    else setMsg(data.error);
  };

  const q = search.toLowerCase();
  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q)
  );

  return (
    <div className="admin-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">👩‍🎓 Students ({students.length})</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="admin-input" style={{ maxWidth: 240 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn-sm btn-outline" onClick={load} disabled={loading}>{loading ? '...' : '↺'}</button>
        </div>
      </div>

      {msg && <div style={{ marginBottom: '1rem', color: '#16a34a', fontSize: '0.875rem' }}>{msg}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem' }}>Create Student (Auto School Email)</h3>
        {selectedSchool && (
          <p style={{ margin: '0 0 0.75rem', color: '#475569', fontSize: '0.9rem' }}>
            Generated address domain: <strong>{selectedSchool.email_domain || `${(selectedSchool.name || 'school').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'school'}.edu`}</strong>
          </p>
        )}
        <div className="admin-form-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input
            className="admin-input"
            placeholder="Student full name"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Email username (before @domain)"
            value={createForm.email_local_part}
            onChange={(e) => setCreateForm((f) => ({ ...f, email_local_part: e.target.value }))}
          />
          <select
            className="admin-input"
            value={createForm.school_id}
            onChange={(e) => {
              const schoolId = e.target.value;
              setCreateForm((f) => ({ ...f, school_id: schoolId }));
              setBulkForm((f) => ({ ...f, school_id: schoolId }));
            }}
          >
            <option value="">Select school...</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input
            className="admin-input"
            placeholder="Phone (optional)"
            value={createForm.phone}
            onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Password (optional, auto if empty)"
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={createForm.auto_generate_email}
              onChange={(e) => setCreateForm((f) => ({ ...f, auto_generate_email: e.target.checked }))}
            />
            Auto-generate school email
          </label>
          {!createForm.auto_generate_email && (
            <input
              className="admin-input"
              placeholder="Manual email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}
          <button className="btn-sm btn-primary" onClick={createStudent}>Create Student</button>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem' }}>Bulk Student Signup</h3>
        <div className="admin-form-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <textarea
            className="admin-input"
            style={{ width: '100%', minHeight: 110 }}
            placeholder="Enter one student name per line"
            value={bulkForm.names_text}
            onChange={(e) => setBulkForm((f) => ({ ...f, names_text: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Default password for all (optional)"
            value={bulkForm.default_password}
            onChange={(e) => setBulkForm((f) => ({ ...f, default_password: e.target.value }))}
          />
          <input
            className="admin-input"
            placeholder="Phone (optional for all)"
            value={bulkForm.phone}
            onChange={(e) => setBulkForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <button className="btn-sm btn-primary" onClick={createStudentsBulk}>Bulk Create</button>
        </div>
      </div>

      {createdCredentials.length > 0 && (
        <div className="admin-card" style={{ marginBottom: '1rem', padding: '0.9rem' }}>
          <h3 style={{ marginTop: 0 }}>Generated Sign-up Credentials</h3>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>
            These accounts work in this app immediately. External email delivery through Gmail or other platforms still needs a real mail provider for that domain.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Password</th></tr>
              </thead>
              <tbody>
                {createdCredentials.map((c, i) => (
                  <tr key={`${c.email}-${i}`}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resetId && (
        <div className="admin-form-row" style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#475569', alignSelf: 'center' }}>New password for student:</span>
          <input className="admin-input" type="password" placeholder="New password (min 6)" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          <button className="btn-sm btn-primary" onClick={resetPassword}>Set Password</button>
          <button className="btn-sm btn-outline" onClick={() => setResetId(null)}>Cancel</button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>School</th><th>Classes</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="empty-text">Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="empty-text">No students found.</td></tr>}
            {filtered.map(s => (
              <tr key={s.id}>
                <td><strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{s.name}<VerifiedBadge size={13} info={{ items: [
                  { icon: '📧', label: 'Email', value: s.email },
                  { icon: '📞', label: 'Phone', value: s.phone || '—' },
                  { icon: '🏣', label: 'School', value: s.school_name || '—' },
                  { icon: '📅', label: 'Joined', value: new Date(s.created_at).toLocaleDateString() },
                ] }} /></strong></td>
                <td>{s.email}</td>
                <td>{s.phone || <span style={{color:'#94a3b8'}}>—</span>}</td>
                <td>{s.school_name || '—'}</td>
                <td>{s.class_count}</td>
                <td><span className={`badge ${s.is_suspended ? 'badge-red' : 'badge-green'}`}>{s.is_suspended ? 'Suspended' : 'Active'}</span></td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className="btn-sm btn-outline" onClick={() => editStudentName(s)} title="Edit name">
                    ✏️
                  </button>
                  <button className={`btn-sm ${s.is_suspended ? 'btn-success' : 'btn-warning'}`} onClick={() => toggle(s)}>
                    {s.is_suspended ? '✅' : '⏸'}
                  </button>
                  <button className="btn-sm btn-outline" onClick={() => { setResetId(s.id); setMsg(''); }}>🔑</button>
                  <button className="btn-sm btn-danger" onClick={() => remove(s.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
