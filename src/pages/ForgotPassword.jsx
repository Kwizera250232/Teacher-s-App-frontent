import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1: enter email, 2: show code
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      if (data.token) {
        setCode(data.token);
        setStep(2);
      } else {
        setError('Imeyili idahari mu sisitemu.');
      }
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
              Injiza imeyili yawe kugira ngo ubone kode yo gusubiza ijambobanga.
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
                {loading ? 'Gutegereza...' : 'Ohereza Kode'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, margin: '10px 0' }}>📩</div>
            <p style={{ color: '#333', marginBottom: 8, fontSize: 15 }}>Kode yawe yo gusubiza ijambobanga ni:</p>
            <div style={{
              fontSize: 38, fontWeight: 800, letterSpacing: 8,
              color: '#667eea', background: '#f0f4ff',
              padding: '16px 24px', borderRadius: 12, margin: '10px 0 20px'
            }}>
              {code}
            </div>
            <p style={{ color: '#888', fontSize: 12, marginBottom: 20 }}>
              Kode iramara iminota 15. Yandike kode hanyuma ujye ku rupapuro rwo gusubiza ijambobanga.
            </p>
            <Link
              to={`/reset-password?email=${encodeURIComponent(email)}`}
              className="btn btn-primary btn-full"
            >
              Injira Gusubiza Ijambobanga →
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: '#667eea', fontSize: 14 }}>← Subira ku Kwinjira</Link>
        </div>
      </div>
    </div>
  );
}
