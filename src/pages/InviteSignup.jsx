import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function InviteSignup() {
  const [searchParams] = useSearchParams();
  const tokenParam = String(searchParams.get('token') || '').trim();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [invite, setInvite] = useState(null);

  const [form, setForm] = useState({
    name: '',
    password: '',
    phone: '',
    school_name: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadInvite() {
      if (!tokenParam) {
        setInviteError('Invitation link is missing token.');
        setLoadingInvite(false);
        return;
      }

      try {
        const data = await api.get(`/auth/validate-invite?token=${encodeURIComponent(tokenParam)}`);
        if (!active) return;
        setInvite(data.invite);
      } catch (err) {
        if (!active) return;
        setInviteError(err.message || 'Invalid invitation link.');
      } finally {
        if (active) setLoadingInvite(false);
      }
    }

    loadInvite();
    return () => {
      active = false;
    };
  }, [tokenParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!form.name.trim()) {
      setSubmitError('Full name is required.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }
    if (invite?.can_create_school && !form.school_name.trim()) {
      setSubmitError('School name is required.');
      return;
    }

    try {
      setSubmitLoading(true);
      const data = await api.post('/auth/register-from-invite', {
        token: tokenParam,
        name: form.name.trim(),
        password: form.password,
        phone: form.phone.trim(),
        school_name: invite?.can_create_school ? form.school_name.trim() : undefined,
      });

      setCreatedInfo({
        professional_email: data.professional_email,
        school_code: data.school_code,
        school_name: data.school_name,
        school_email_domain: data.school_email_domain,
      });

      login(data.token, data.user);
      if (data.user.role === 'head_teacher') {
        navigate('/school-board');
        return;
      }
      navigate('/teacher/dashboard');
    } catch (err) {
      setSubmitError(err.message || 'Failed to create account from invitation.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">UClass</div>

        {loadingInvite && <p className="auth-sub">Validating invitation...</p>}

        {!loadingInvite && inviteError && (
          <>
            <h2>Invitation Error</h2>
            <div className="alert alert-error">{inviteError}</div>
            <p className="auth-link">
              <Link to="/login">Go to login</Link>
            </p>
          </>
        )}

        {!loadingInvite && !inviteError && invite && (
          <>
            <h2>{invite.role === 'head_teacher' ? 'Head Teacher Invitation' : 'Teacher Invitation'}</h2>
            <p className="auth-sub">Complete this form to create your professional school account.</p>

            {invite.school && (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{invite.school.name}</p>
                <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.85rem' }}>
                  School domain: {invite.school.email_domain}
                </p>
                {invite.school.code && (
                  <p style={{ margin: '4px 0 0', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 600 }}>
                    School Code: {invite.school.code}
                  </p>
                )}
              </div>
            )}

            {createdInfo && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <p style={{ margin: 0, color: '#166534', fontWeight: 700 }}>Account created successfully</p>
                <p style={{ margin: '4px 0 0', color: '#166534' }}>
                  Professional email: {createdInfo.professional_email}
                </p>
                <p style={{ margin: '4px 0 0', color: '#166534' }}>
                  School code: {createdInfo.school_code}
                </p>
              </div>
            )}

            {submitError && <div className="alert alert-error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  required
                />
              </div>

              {invite.can_create_school && (
                <div className="form-group">
                  <label>School Name</label>
                  <input
                    type="text"
                    value={form.school_name}
                    onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value }))}
                    placeholder="e.g. GS Nyamirambo"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+250 7XX XXX XXX"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters with letters and numbers"
                  minLength={8}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitLoading}>
                {submitLoading ? 'Creating account...' : 'Create Professional Account'}
              </button>
            </form>

            <p className="auth-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
