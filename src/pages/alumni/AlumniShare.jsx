import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AuthBackLink from '../../components/AuthBackLink';

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <AuthBackLink />
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>Join UClass Alumni</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Sign up to read and engage with alumni compositions and posts</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: role === 'student' ? '#667eea' : '#f1f5f9', color: role === 'student' ? '#fff' : '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              onClick={() => setRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: role === 'teacher' ? '#667eea' : '#f1f5f9', color: role === 'teacher' ? '#fff' : '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              onClick={() => setRole('teacher')}
            >
              Teacher
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Full Name</label>
            <input
              type="text"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a password (min 8 characters)"
              required
              minLength={8}
            />
          </div>

          {role === 'teacher' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email (Gmail)</label>
                <input
                  type="email"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="yourname@gmail.com"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Phone</label>
                <input
                  type="tel"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="07..."
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Parent/Guardian Gmail</label>
                <input
                  type="email"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  value={form.parentGmail}
                  onChange={(e) => setForm({ ...form, parentGmail: e.target.value })}
                  placeholder="parent@gmail.com"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Parent Phone</label>
                <input
                  type="tel"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="07..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>School Name</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  placeholder="Your school name"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>District</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="Your district"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Sector</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  placeholder="Your sector"
                />
              </div>
            </>
          )}

          <button type="submit" style={{ padding: 14, borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            Already have an account?{' '}
            <button type="button" style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
