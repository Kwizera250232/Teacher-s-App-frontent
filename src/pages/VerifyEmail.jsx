import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const { token, updateUser } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!tokenParam) {
      setStatus('error');
      setMessage('Invalid confirmation link.');
      return;
    }
    (async () => {
      try {
        const data = await api.post('/auth/verify-email', { token: tokenParam });
        setStatus('success');
        setMessage(data.message || 'Email confirmed.');
        if (token) {
          try {
            const me = await api.get('/auth/me', token);
            updateUser(me.user);
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        setStatus('error');
        setMessage(e.message || 'Confirmation failed.');
      }
    })();
  }, [tokenParam, token, updateUser]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">{status === 'success' ? '✅' : status === 'loading' ? '⏳' : '⚠️'}</div>
        <h2>Email confirmation</h2>
        {status === 'loading' && <p className="auth-sub">Confirming your email…</p>}
        {status !== 'loading' && (
          <p className="auth-sub" style={{ lineHeight: 1.6 }}>
            {message}
          </p>
        )}
        <div style={{ marginTop: 24 }}>
          <Link to="/login" className="btn btn-primary btn-full">
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
