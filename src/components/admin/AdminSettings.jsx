import { useState, useEffect } from 'react';
import { api } from '../../api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminSettings({ token }) {
  const [settings, setSettings] = useState({ platform_name: '', logo_url: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/settings', token).then(setSettings).catch(() => {});
  }, []);

  const save = async () => {
    await fetch(`${BASE}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
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
  );
}
