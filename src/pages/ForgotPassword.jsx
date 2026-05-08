import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function ForgotPassword() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState(1); // 1: enter email, 2: set new password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleCheckEmail(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/check-email', { email });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Imeyili ntaboneka. Reba neza uyandike neza.');
    }
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      return setError('Ijambobanga rishya ntirihuye. Ongera ugerageze.');
    }
    if (newPassword.length < 8) {
      return setError('Ijambobanga rigomba kuba nibura inyuguti 8.');
    }
    setLoading(true);
    try {
      // 1. Reset the password
      await api.post('/auth/reset-password-direct', { email, newPassword });
      // 2. Auto-login so the user goes straight to their dashboard
      const data = await api.post('/auth/login', { email, password: newPassword });
      login(data.token, data.user);
      // 3. Navigate immediately — no extra screen
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'head_teacher') navigate('/school-board');
      else if (data.user.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Hari ikibazo. Ongera ugerageze.');
      setLoading(false);
    }
  }

  const eyeBtn = (show, toggle) => (
    <button
      type="button"
      onClick={toggle}
      tabIndex={-1}
      aria-label={show ? 'Hisha ijambobanga' : 'Erekana ijambobanga'}
      style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)',
        background: 'none', border: 'none',
        cursor: 'pointer', fontSize: 18, padding: 2, color: '#888',
      }}
    >
      {show ? '🙈' : '👁️'}
    </button>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h2>Wibagiwe Ijambobanga?</h2>
        <p className="auth-sub">
          {step === 1
            ? 'Injiza imeyili wakoresheje gukora konti'
            : 'Shyiramo ijambobanga rishya'}
        </p>

        {step === 1 && (
          <form onSubmit={handleCheckEmail}>
            <div className="form-group">
              <label>Imeyili</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="imeyili@example.com"
                autoFocus
                required
              />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Gutegereza...' : 'Komeza →'}
            </button>
            <p className="auth-link" style={{ marginTop: 16 }}>
              <Link to="/login">← Subira ku Kwinjira</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>Imeyili Yemejwe ✓</label>
              <input
                type="email"
                value={email}
                readOnly
                style={{ background: '#f0f4ff', cursor: 'default' }}
              />
            </div>

            <div className="form-group">
              <label>Ijambobanga Rishya</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nibura inyuguti 8"
                  autoFocus
                  required
                  style={{ paddingRight: 44 }}
                />
                {eyeBtn(showNew, () => setShowNew(v => !v))}
              </div>
            </div>

            <div className="form-group">
              <label>Subiramo Ijambobanga</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Subiramo ijambobanga"
                  required
                  style={{ paddingRight: 44 }}
                />
                {eyeBtn(showConfirm, () => setShowConfirm(v => !v))}
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Gutegereza...' : '✅ Hindura Ijambobanga & Injira'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: 13 }}
              >
                ← Hindura imeyili
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
