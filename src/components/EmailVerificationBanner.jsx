import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { needsEmailVerification } from '../utils/emailVerification';

export default function EmailVerificationBanner() {
  const { user, token, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!needsEmailVerification(user)) return null;

  const resend = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await api.post('/auth/resend-verification', {}, token);
      setMsg(data.message || 'Sent.');
      if (data.dev_verify_url) setMsg(`${data.message} Dev: ${data.dev_verify_url}`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAgain = async () => {
    setLoading(true);
    try {
      const data = await api.get('/auth/me', token);
      updateUser(data.user);
      if (data.user?.email_verified) setMsg('Email confirmed!');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16,
        color: '#92400e',
      }}
    >
      <strong>Confirm your email</strong>
      <p style={{ margin: '6px 0 10px', fontSize: 14, lineHeight: 1.5 }}>
        Check <strong>{user.email}</strong> for the confirmation link. Homework, quizzes, and other class
        tools stay locked until you confirm. We send a reminder once per day if needed.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={resend}>
          Resend email
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={checkAgain}>
          I confirmed
        </button>
      </div>
      {msg && <p style={{ marginTop: 8, fontSize: 13 }}>{msg}</p>}
    </div>
  );
}
