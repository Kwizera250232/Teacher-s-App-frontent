import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './EmailVerificationModal.css';

export default function EmailVerificationModal({ open, onClose, featureLabel }) {
  const { token, user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const resend = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const data = await api.post('/auth/resend-verification', {}, token);
      setMsg(data.message || 'Confirmation email sent.');
      if (data.dev_verify_url) {
        setMsg((m) => `${m} (Dev link: ${data.dev_verify_url})`);
      }
    } catch (e) {
      setError(e.message || 'Could not send email.');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/auth/me', token);
      updateUser(data.user);
      if (data.user?.email_verified) {
        setMsg('Email confirmed! You can continue.');
        setTimeout(() => onClose?.(), 800);
      } else {
        setMsg('Still waiting for confirmation. Check your inbox.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-verify-overlay" role="dialog" aria-modal="true">
      <div className="email-verify-modal">
        <button type="button" className="email-verify-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="email-verify-icon">✉️</div>
        <h2>Confirm your email</h2>
        <p>
          {featureLabel
            ? `To use ${featureLabel}, please confirm the email on your account`
            : 'Please confirm the email on your account'}
          {user?.email ? (
            <>
              : <strong>{user.email}</strong>
            </>
          ) : (
            '.'
          )}
        </p>
        <p className="email-verify-hint">
          We sent a confirmation link when you signed up. If you did not receive it, request another below.
          We will remind you once per day until you confirm.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="email-verify-actions">
          <button type="button" className="btn btn-primary btn-full" disabled={loading} onClick={resend}>
            {loading ? 'Sending…' : 'Resend confirmation email'}
          </button>
          <button type="button" className="btn btn-secondary btn-full" disabled={loading} onClick={refreshStatus}>
            I already confirmed
          </button>
        </div>
      </div>
    </div>
  );
}
