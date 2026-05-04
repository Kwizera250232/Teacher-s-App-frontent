import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';

import './Auth.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: params.get('email') || '',
    newPassword: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirm) {
      return setError('Ijambobanga nshya ntirihuye. Ongera ugerageze.');
    }
    if (form.newPassword.length < 6) {
      return setError('Ijambobanga rigomba kuba nibura inyuguti 6.');
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password-direct', {
        email: form.email,
        newPassword: form.newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Ntibyakunze guhindura ijambobanga.');
    }
    setLoading(false);
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, margin: '10px 0' }}>✅</div>
        <h2 style={{ marginBottom: 10 }}>Ijambobanga Ryahinduwe!</h2>
        <p style={{ color: '#666', marginBottom: 20 }}>Ubu ushobora kwinjira n'ijambobanga rishya.</p>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/login')}>
          Injira Ubu
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔐</div>
        <h1 className="auth-title">Shyira Ijambobanga Rishya</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Imeyili</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="imeyili@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Ijambobanga Rishya</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Nibura inyuguti 8"
              required
            />
          </div>
          <div className="form-group">
            <label>Ongera Ijambobanga</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Subiramo ijambobanga"
              required
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Gutegereza...' : 'Hindura Ijambobanga'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/forgot-password" style={{ color: '#667eea', fontSize: 13 }}>← Subira ku rupapuro rwo guhindura ijambobanga</Link>
        </div>
      </div>
    </div>
  );
}
