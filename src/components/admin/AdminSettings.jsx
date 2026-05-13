import { useState, useEffect } from 'react';
import { api } from '../../api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminSettings({ token }) {
  const [settings, setSettings] = useState({ platform_name: '', logo_url: '' });
  const [saved, setSaved] = useState(false);
  const [schools, setSchools] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student', school_id: '' });
  const [createdUser, setCreatedUser] = useState(null);

  useEffect(() => {
    api.get('/admin/settings', token).then(setSettings).catch(() => {});
    api.get('/admin/schools', token).then(data => setSchools(data)).catch(() => {});
  }, [token]);

  const save = async () => {
    await fetch(`${BASE}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.role) return alert('Name and role required.');
    try {
      const res = await api.post('/admin/users', newUser, token);
      setCreatedUser(res);
      setNewUser({ name: '', email: '', role: 'student', school_id: '' });
      alert('User created! Temporary password: ' + res.temp_password);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="admin-card" style={{ maxWidth: 560 }}>
        <h2 className="admin-section-title" style={{ marginBottom: '1.5rem' }}>⚙️ Platform Settings</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>Platform Name</label>
            <input
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={settings.platform_name || ''}
              onChange={e => setSettings(s => ({ ...s, platform_name: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>Logo URL (optional)</label>
            <input
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="https://..."
              value={settings.logo_url || ''}
              onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))}
            />
            {settings.logo_url && (
              <img src={settings.logo_url} alt="logo preview" style={{ marginTop: '0.5rem', height: 60, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            )}
          </div>

          <button className="btn-sm btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }} onClick={save}>
            💾 Save Settings
          </button>
          {saved && <span style={{ color: '#16a34a', fontSize: '0.875rem' }}>✅ Saved!</span>}
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 560 }}>
        <h2 className="admin-section-title" style={{ marginBottom: '1.5rem' }}>👤 Create User Account</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          Create student or teacher accounts. Email will be auto-generated if not provided (must be @brightschool.edu).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>Full Name *</label>
            <input
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={newUser.name}
              onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>Email (optional - auto-generated if empty)</label>
            <input
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={newUser.email}
              onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
              placeholder="name@brightschool.edu"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>Role *</label>
            <select
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={newUser.role}
              onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>School *</label>
            <select
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={newUser.school_id}
              onChange={e => setNewUser(u => ({ ...u, school_id: e.target.value }))}
            >
              <option value="">Select School</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button className="btn-sm btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }} onClick={createUser}>
            ➕ Create User
          </button>
          {createdUser && (
            <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
              <strong>✅ User Created!</strong><br />
              Name: {createdUser.user.name}<br />
              Email: {createdUser.user.email}<br />
              Temp Password: <code>{createdUser.temp_password}</code><br />
              <small>Share the password securely with the user.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
