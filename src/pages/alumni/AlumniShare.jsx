import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AuthBackLink from '../../components/AuthBackLink';
import '../Auth.css';

export default function AlumniShare() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    parentGmail: '',
    parentPhone: '',
    schoolName: '',
    district: '',
    sector: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.password.trim()) {
      setError('Name and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        password: form.password,
        role,
        is_external: true,
        alumni_share: true,
        district: form.district.trim(),
        sector: form.sector.trim(),
      };

      if (role === 'teacher') {
        payload.email = form.email.trim().toLowerCase();
        if (!payload.email) {
          setError('Email (Gmail) is required for teachers.');
          setLoading(false);
          return;
        }
        payload.phone = form.parentPhone.trim();
      } else {
        // Student — use parent/guardian gmail as login email
        if (!form.parentGmail.trim()) {
          setError('Parent/Guardian Gmail is required for students.');
          setLoading(false);
          return;
        }
        payload.parent_gmail = form.parentGmail.trim().toLowerCase();
        payload.parent_phone = form.parentPhone.trim();
        payload.school_name_text = form.schoolName.trim();
        payload.email = form.parentGmail.trim().toLowerCase();
      }

      const data = await api.post('/auth/register', payload);

      if (data.pending) {
        setError('Account pending approval. Please wait for your school to approve.');
        setLoading(false);
        return;
      }

      login(data.token, data.user);
      navigate('/alumni/feed', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <AuthBackLink />
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Join UClass Alumni</h1>
          <p className="auth-subtitle">Sign up to read and engage with alumni compositions and posts</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${role === 'student' ? 'auth-tab-active' : ''}`}
              onClick={() => setRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`auth-tab ${role === 'teacher' ? 'auth-tab-active' : ''}`}
              onClick={() => setRole('teacher')}
            >
              Teacher
            </button>
          </div>

          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input
              type="text"
              className="auth-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a password (min 8 characters)"
              required
              minLength={8}
            />
          </div>

          {role === 'teacher' ? (
            <>
              <div className="auth-field">
                <label className="auth-label">Email (Gmail)</label>
                <input
                  type="email"
                  className="auth-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="yourname@gmail.com"
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Phone</label>
                <input
                  type="tel"
                  className="auth-input"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="07..."
                />
              </div>
            </>
          ) : (
            <>
              <div className="auth-field">
                <label className="auth-label">Parent/Guardian Gmail</label>
                <input
                  type="email"
                  className="auth-input"
                  value={form.parentGmail}
                  onChange={(e) => setForm({ ...form, parentGmail: e.target.value })}
                  placeholder="parent@gmail.com"
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Parent Phone</label>
                <input
                  type="tel"
                  className="auth-input"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="07..."
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">School Name</label>
                <input
                  type="text"
                  className="auth-input"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  placeholder="Your school name"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">District</label>
                <input
                  type="text"
                  className="auth-input"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="Your district"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Sector</label>
                <input
                  type="text"
                  className="auth-input"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  placeholder="Your sector"
                />
              </div>
            </>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="auth-footer">
            Already have an account?{' '}
            <button type="button" className="auth-link" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
