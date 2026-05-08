import { useState, useEffect } from 'react';
import { api } from '../../api';
import VerifiedBadge from '../VerifiedBadge';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminTeachers({ token }) {
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    school_id: '',
    email_local_part: '',
    email: '',
    password: '',
    phone: '',
    auto_generate_email: true,
    is_school_it: false,
  });
  const [createMsg, setCreateMsg] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedSchool = schools.find((school) => String(school.id) === String(createForm.school_id || ''));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, s] = await Promise.all([
        api.get('/admin/teachers', token),
        api.get('/admin/schools', token),
      ]);
      setTeachers(Array.isArray(t) ? t : []);
      setSchools(Array.isArray(s) ? s : []);
    } catch (e) {
      setError(e.message || 'Ntibyakunze gufungura amakuru y\'abarimu.');
    }
    setLoading(false);
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

  const approve = async (id) => {
    await fetch(`${BASE}/admin/teachers/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
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

  const createTeacher = async () => {
    setError('');
    setCreateMsg('');
    setCreatedCredentials([]);

    if (!createForm.name.trim()) return setError('Teacher full name is required.');
    if (!createForm.school_id) return setError('Select school first.');

    try {
      const created = await api.post('/admin/teachers', {
        name: createForm.name.trim(),
        school_id: Number(createForm.school_id),
        email_local_part: createForm.email_local_part.trim(),
        email: createForm.auto_generate_email ? '' : createForm.email.trim(),
        auto_generate_email: createForm.auto_generate_email,
        password: createForm.password.trim(),
        phone: createForm.phone.trim(),
        is_school_it: createForm.is_school_it,
      }, token);

      if (created?.credentials) {
        setCreatedCredentials([
          {
            name: created.teacher?.name,
            email: created.credentials.email,
            password: created.credentials.password,
          },
        ]);
      }
      setCreateMsg('Teacher account created.');
      setCreateForm((f) => ({
        ...f,
        name: '',
        email_local_part: '',
        email: '',
        password: '',
        phone: '',
        is_school_it: false,
      }));
      load();
    } catch (e) {
      setError(e.message || 'Failed to create teacher account.');
    }
  };

  const q = search.toLowerCase();
  const pending = teachers.filter(t => !t.is_approved);
  const approved = teachers.filter(t => t.is_approved &&
    ((t.name || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q))
  );

  if (error) return (
    <div className="admin-card">
      <div style={{ color: '#ef4444', marginBottom: 12 }}>⚠️ {error}</div>
      <button className="btn btn-primary btn-sm" onClick={load}>↺ Ongera Gerageza</button>
    </div>
  );

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h2 className="admin-section-title">➕ Create Teacher (School Email)</h2>
        {selectedSchool && (
          <p style={{ margin: '0.4rem 0 0.9rem', color: '#475569', fontSize: '0.9rem' }}>
            Email domain: <strong>{selectedSchool.email_domain || `${(selectedSchool.name || 'school').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'school'}.edu`}</strong>
          </p>
        )}
        {createMsg && <div style={{ marginBottom: 12, color: '#16a34a' }}>{createMsg}</div>}
        <div className="admin-form-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input
            className="admin-input"
            placeholder="Teacher full name"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="admin-input"
            value={createForm.school_id}
            onChange={(e) => setCreateForm((f) => ({ ...f, school_id: e.target.value }))}
          >
            <option value="">Select school...</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input
            className="admin-input"
            placeholder="Email username (before @domain)"
            value={createForm.email_local_part}
            onChange={(e) => setCreateForm((f) => ({ ...f, email_local_part: e.target.value }))}
          />
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={createForm.is_school_it}
              onChange={(e) => setCreateForm((f) => ({ ...f, is_school_it: e.target.checked }))}
            />
            Grant School IT authority
          </label>
          {!createForm.auto_generate_email && (
            <input
              className="admin-input"
              placeholder="Manual email (must match school domain)"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}
          <button className="btn-sm btn-primary" onClick={createTeacher}>Create Teacher</button>
        </div>

        {createdCredentials.length > 0 && (
          <div className="admin-table-wrap" style={{ marginTop: 12 }}>
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
        )}
      </div>

      {pending.length > 0 && (
        <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: 20 }}>
          <div className="admin-section-header">
            <h2 className="admin-section-title">
              ⏳ Abarimu Bategereje Uruhushya
              <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 13, fontWeight: 700,
                borderRadius: 20, padding: '2px 10px', marginLeft: 10 }}>
                {pending.length}
              </span>
            </h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Amazina</th><th>Imeyili</th><th>Telefoni</th><th>Binjiye</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pending.map(t => (
                  <tr key={t.id} style={{ background: '#fffbeb' }}>
                    <td><strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{t.name}<VerifiedBadge size={13} info={{ items: [
                      { icon: '📧', label: 'Email', value: t.email },
                      { icon: '📞', label: 'Phone', value: t.phone || '—' },
                      { icon: '📅', label: 'Joined', value: new Date(t.created_at).toLocaleDateString() },
                    ] }} /></strong></td>
                    <td>{t.email}</td>
                    <td>{t.phone || <span style={{color:'#94a3b8'}}>—</span>}</td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button className="btn-sm btn-success" onClick={() => approve(t.id)}>✅ Emera</button>
                      <button className="btn-sm btn-danger" onClick={() => remove(t.id)}>🗑️ Siba</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-section-header">
          <h2 className="admin-section-title">👨‍🏫 Abarimu ({teachers.filter(t => t.is_approved).length})</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="admin-input" style={{ maxWidth: 240 }} placeholder="Shakisha izina cyangwa imeyili..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn-sm btn-outline" onClick={load} disabled={loading}>{loading ? '...' : '↺'}</button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Amazina</th><th>Imeyili</th><th>Telefoni</th><th>Ishuri</th>
                <th style={{textAlign:'center'}}>Classes</th>
                <th style={{textAlign:'center'}}>Notes</th>
                <th style={{textAlign:'center'}}>HW</th>
                <th style={{textAlign:'center'}}>Quiz</th>
                <th>Status</th><th>Binjiye</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="empty-text">Gutegereza...</td></tr>}
              {!loading && approved.length === 0 && <tr><td colSpan={11} className="empty-text">Nta mwarimu ubonetse.</td></tr>}
              {approved.map(t => (
                <tr key={t.id}>
                  <td>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {t.name}
                      <VerifiedBadge size={13} info={{ items: [
                        { icon: '📧', label: 'Email', value: t.email },
                        { icon: '📞', label: 'Phone', value: t.phone || '—' },
                        { icon: '📅', label: 'Joined', value: new Date(t.created_at).toLocaleDateString() },
                        { icon: '📚', label: 'Classes', value: String(t.class_count) },
                        { icon: '📄', label: 'Notes', value: String(t.notes_count) },
                        { icon: '📋', label: 'Homework', value: String(t.homework_count) },
                        { icon: '📝', label: 'Quizzes', value: String(t.quiz_count) },
                      ] }} />
                    </strong>
                  </td>
                  <td>{t.email}</td>
                  <td>{t.phone || <span style={{color:'#94a3b8'}}>—</span>}</td>
                  <td>
                    <select className="admin-input" style={{ padding: '0.3rem', minWidth: 120 }}
                      value={t.school_id || ''} onChange={e => assignSchool(t.id, e.target.value)}>
                      <option value="">— None —</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td style={{textAlign:'center'}}><span className="badge badge-blue">{t.class_count}</span></td>
                  <td style={{textAlign:'center'}}><span className={t.notes_count > 0 ? 'badge badge-green' : ''} style={t.notes_count == 0 ? {color:'#94a3b8'} : {}}>{t.notes_count}</span></td>
                  <td style={{textAlign:'center'}}><span className={t.homework_count > 0 ? 'badge badge-green' : ''} style={t.homework_count == 0 ? {color:'#94a3b8'} : {}}>{t.homework_count}</span></td>
                  <td style={{textAlign:'center'}}><span className={t.quiz_count > 0 ? 'badge badge-green' : ''} style={t.quiz_count == 0 ? {color:'#94a3b8'} : {}}>{t.quiz_count}</span></td>
                  <td><span className={`badge ${t.is_suspended ? 'badge-red' : 'badge-green'}`}>{t.is_suspended ? 'Suspended' : 'Active'}</span></td>
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
    </div>
  );
}
