import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function InviteSignup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { login } = useAuth();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    new_school_name: '',
    new_school_location: '',
  });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('Missing invitation token.');
      setLoadingPreview(false);
      return;
    }
    api.get(`/auth/invite-preview?token=${encodeURIComponent(token)}`)
      .then(setPreview)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoadingPreview(false));
  }, [token]);

  const roleLabel = preview?.role === 'head_teacher'
    ? 'Head Teacher'
    : preview?.role === 'teacher'
      ? 'Teacher'
      : 'User';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: preview.role,
        invite_token: token,
        new_school_name: preview.can_create_school ? form.new_school_name : undefined,
        new_school_location: preview.can_create_school ? form.new_school_location : undefined,
      });

      if (data.pending) {
        setPending(true);
        return;
      }

      login(data.token, data.user);
      navigate(preview.role === 'student' ? '/student/dashboard' : '/teacher/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPreview) {
    return (
      <section className="auth-container">
        <section className="auth-card"><p>Loading invitation...</p></section>
      </section>
    );
  }

  if (loadError || !preview) {
    return (
      <section className="auth-container">
        <section className="auth-card">
          <h2>Invalid invitation</h2>
          <p className="auth-sub">{loadError || 'This link is not valid.'}</p>
          <Link to="/register" className="btn btn-primary btn-full">Go to signup</Link>
        </section>
      </section>
    );
  }

  return (
    <section className="auth-container">
      <section className="auth-card">
        <section className="auth-logo">🎓</section>
        {pending ? (
          <>
            <h2>Account submitted</h2>
            <p className="auth-sub">
              Your {roleLabel} account is waiting for approval. You will be able to log in once approved.
            </p>
            <Link to="/login" className="btn btn-primary btn-full">Go to login</Link>
          </>
        ) : (
          <>
            <h2>{roleLabel} signup</h2>
            <p className="auth-sub">Complete your account using this school invitation.</p>

            <section style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              {preview.can_create_school ? (
                <p style={{ margin: 0, color: '#1e40af' }}>
                  <strong>Create your school</strong> — you are registering as Head Teacher for a new school on UClass.
                </p>
              ) : (
                <p style={{ margin: 0, color: '#1e40af' }}>
                  <strong>School:</strong> {preview.school_name}
                  {preview.school_code && (
                    <><br /><strong>School code:</strong> {preview.school_code}</>
                  )}
                </p>
              )}
            </section>

            {error && <p className="alert alert-error">{error}</p>}

            <form onSubmit={handleSubmit}>
              {preview.can_create_school && (
                <>
                  <label className="form-group">
                    School name *
                    <input
                      required
                      value={form.new_school_name}
                      onChange={(e) => setForm({ ...form, new_school_name: e.target.value })}
                      placeholder="e.g. Bright Future Academy"
                    />
                  </label>
                  <label className="form-group">
                    School location
                    <input
                      value={form.new_school_location}
                      onChange={(e) => setForm({ ...form, new_school_location: e.target.value })}
                      placeholder="City / district"
                    />
                  </label>
                </>
              )}
              <label className="form-group">
                Full name *
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="form-group">
                Email *
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="form-group">
                Password *
                <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              <label className="form-group">
                Phone (optional)
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
          </>
        )}
      </section>
    </section>
  );
}
