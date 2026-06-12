import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const STATUS_CONTENT = {
  ok: {
    icon: '🎉',
    title: 'Imeyili yemejwe — Email Confirmed!',
    body: 'Murakoze! Your account is now fully active. You can create classes, quizzes, homework, send messages, and use every UClass feature.',
  },
  expired: {
    icon: '⏰',
    title: 'Link yarangiye — Link Expired',
    body: 'This confirmation link has expired. Sign in and tap "Resend email" in the yellow banner to get a fresh link.',
  },
  invalid: {
    icon: '❌',
    title: 'Link ntikora — Invalid Link',
    body: 'This confirmation link is not valid. Sign in and tap "Resend email" in the yellow banner to get a new one.',
  },
  error: {
    icon: '⚠️',
    title: 'Habaye ikibazo — Something went wrong',
    body: 'We could not confirm your email right now. Please try the link again in a moment, or resend a new email from the app.',
  },
};

export default function EmailConfirmed() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'ok';
  const { user, token, updateUser } = useAuth();
  const content = STATUS_CONTENT[status] || STATUS_CONTENT.error;

  // If the user is logged in in this browser, refresh their confirmed flag
  useEffect(() => {
    if (status !== 'ok' || !token || !user) return;
    api
      .get('/auth/me', token)
      .then((data) => {
        if (data?.user) updateUser({ ...user, ...data.user });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>{content.icon}</div>
        <h2 style={{ marginTop: 16 }}>{content.title}</h2>
        <p className="auth-sub" style={{ marginTop: 12, lineHeight: 1.6 }}>
          {content.body}
        </p>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {user ? (
            <Link to="/" className="btn btn-primary btn-full">
              Komeza muri UClass →
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-full">
              Injira — Sign in
            </Link>
          )}
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            “Technology in Rwandan Education is possible together. Let's Support it”
            <br />
            <strong>— KWIZERA Jean de Dieu</strong>, UMUNSI SITE LTD CEO / Founder
          </p>
        </div>
      </div>
    </div>
  );
}
