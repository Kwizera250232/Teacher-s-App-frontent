import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * Shown to HT / Teacher / Guest accounts that haven't confirmed their email.
 * They can explore the app, but writes are blocked by the API until confirmed.
 */
export default function EmailConfirmBanner() {
  const { user, token, updateUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const needsConfirm =
    user &&
    user.email_confirmed === false &&
    ['head_teacher', 'teacher', 'guest'].includes(user.role);

  // Refresh the flag from the server (catches "confirmed in another tab/email click")
  useEffect(() => {
    if (!needsConfirm || !token) return;
    let cancelled = false;
    const check = async () => {
      try {
        const data = await api.get('/auth/me', token);
        if (!cancelled && data?.user && data.user.email_confirmed !== false) {
          updateUser({ ...user, ...data.user });
        }
      } catch {
        /* ignore */
      }
    };
    check();
    const t = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsConfirm, token]);

  if (!needsConfirm) return null;

  const resend = async () => {
    setSending(true);
    setNotice('');
    try {
      const r = await api.post('/auth/resend-confirmation', {}, token);
      if (r.already_confirmed) {
        updateUser({ ...user, email_confirmed: true });
        return;
      }
      setNotice(r.sent ? '✅ Email sent — check your inbox (and spam).' : '⚠️ Could not send right now. Try again shortly.');
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderBottom: '1px solid #f59e0b',
        padding: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 13.5,
        color: '#78350f',
        lineHeight: 1.5,
        textAlign: 'center',
      }}
    >
      <span>
        📧 <strong>Emeza imeyili yawe</strong> — we sent a confirmation link to{' '}
        <strong>{user.email}</strong>. You can explore, but you need to confirm before you can do
        anything.
      </span>
      <button
        type="button"
        onClick={resend}
        disabled={sending}
        style={{
          border: 'none',
          background: '#92400e',
          color: '#fff',
          borderRadius: 999,
          padding: '6px 16px',
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
          opacity: sending ? 0.6 : 1,
        }}
      >
        {sending ? 'Sending…' : 'Resend email'}
      </button>
      {notice && <span style={{ width: '100%', fontSize: 12 }}>{notice}</span>}
    </div>
  );
}
