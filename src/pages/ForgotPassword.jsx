import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState(1); // 1: enter email, 2: set new password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/check-email', { email });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Hari ikibazo. Ongera ugerageze.');
    }
    setLoading(false);
  }

  async function handleResetDirect(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirm) {
      return setError('Ijambobanga rishya ntirihuye. Ongera ugerageze.');
    }
    if (newPassword.length < 8) {
      return setError('Ijambobanga rigomba kuba nibura inyuguti 8 kandi ririmo imibare.');
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password-direct', { email, newPassword });
      setSuccess('Ijambobanga ryahinduwe neza. Injira ukoresheje rishya.');
    } catch (err) {
      setError(err.message || 'Hari ikibazo. Ongera ugerageze.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">Gusubiza Ijambobanga</h1>

        {step === 1 && (
          <>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 20, fontSize: 14 }}>
              Injiza imeyili wakoresheje gukora konti. Niba ibonetse, uhite ushyiraho ijambobanga rishya.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Imeyili</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="imeyili@example.com"
                  required
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Gutegereza...' : 'Komeza'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleResetDirect}>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 16, fontSize: 14 }}>
              Imeri yemejwe. Shyiramo ijambobanga rishya.
            </p>
            <div className="form-group">
              <label>Imeyili</label>
              <input type="email" value={email} readOnly />
            </div>
            <div className="form-group">
              <label>Ijambobanga Rishya</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nibura inyuguti 8"
                required
              />
            </div>
            <div className="form-group">
              <label>Ongera Ijambobanga</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Subiramo ijambobanga"
                required
              />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Gutegereza...' : 'Hindura Ijambobanga'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: '#667eea', fontSize: 14 }}>← Subira ku Kwinjira</Link>
        </div>
      </div>
    </div>
  );
}
