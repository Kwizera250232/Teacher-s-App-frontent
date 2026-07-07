import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/roles';
import AuthBackLink from '../components/AuthBackLink';
import './Auth.css';

export default function AIRevisionShare() {
  const { token: shareToken } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [shareInfo, setShareInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    api.get(`/ai-revision/share/${shareToken}`)
      .then((data) => setShareInfo(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingInfo(false));
  }, [shareToken]);

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
        ai_revision_share: shareToken,
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

      if (data.ai_revision_share) {
        navigate('/alumni/ai-revision', { replace: true });
      } else {
        navigate(dashboardPath(data.user.role));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">🤖</div>
          <p className="auth-sub">Loading shared quiz...</p>
        </div>
      </div>
    );
  }

  if (!shareInfo && error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <AuthBackLink />
          <div className="auth-logo">🤖</div>
          <h2>Link Not Found</h2>
          <p className="auth-sub">{error}</p>
          <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <AuthBackLink />
        <div className="auth-logo">🤖</div>
        <h2>AI Assessment Revision</h2>
        <p className="auth-sub">
          {shareInfo && (
            <>Shared by <strong>{shareInfo.student_name}</strong>{shareInfo.is_quiz_only ? <> — Try this quiz!</> : <> — {shareInfo.subject} ({shareInfo.grade})</>}</>
          )}
        </p>

        {shareInfo && !shareInfo.is_quiz_only && (
          <div style={{
            background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#3730a3',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>📊 Score:</span>
              <strong>{shareInfo.score}/{shareInfo.total} ({shareInfo.percentage}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🏆 Grade:</span>
              <strong>{shareInfo.grade_letter} — {shareInfo.performance_level}</strong>
            </div>
          </div>
        )}

        {shareInfo && shareInfo.is_quiz_only && (
          <div style={{
            background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#3730a3',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 Quiz Configuration:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Subject:</span><strong>{shareInfo.subject}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Grade:</span><strong>{shareInfo.grade}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Type:</span><strong>{shareInfo.quiz_type?.replace(/_/g, ' ')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Difficulty:</span><strong>{shareInfo.difficulty}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Questions:</span><strong>{shareInfo.num_questions}</strong>
            </div>
          </div>
        )}

        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10,
          padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#065f46',
        }}>
          Sign up to try AI Revision quizzes — practice with past papers, get instant marking, AI feedback, and summary notes!
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role selection */}
          <div className="form-group">
            <label>I am a</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.6rem' }}
            >
              <option value="student">👨‍🎓 Student</option>
              <option value="teacher">👨‍🏫 Teacher</option>
            </select>
          </div>

          {/* Full names */}
          <div className="form-group">
            <label>Full Names</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="First and Last Name"
              required
            />
          </div>

          {/* Email (only for teachers) */}
          {role === 'teacher' && (
            <div className="form-group">
              <label>Your Gmail (Login)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="yourname@gmail.com"
                required
              />
            </div>
          )}

          {/* Student-specific fields */}
          {role === 'student' && (
            <>
              <div className="form-group">
                <label>Parent / Guardian Gmail (This is your login)</label>
                <input
                  type="email"
                  value={form.parentGmail}
                  onChange={(e) => setForm({ ...form, parentGmail: e.target.value })}
                  placeholder="parent@gmail.com"
                  required
                />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  This Gmail will be used to log in to your account.
                </p>
              </div>
              <div className="form-group">
                <label>Parent Telephone</label>
                <input
                  type="tel"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  placeholder="+250 78 123 4567"
                  required
                />
              </div>
              <div className="form-group">
                <label>School</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  placeholder="Type your school name"
                  required
                />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Just type your school name — no selection needed.
                </p>
              </div>
            </>
          )}

          {/* Teacher-specific fields */}
          {role === 'teacher' && (
            <div className="form-group">
              <label>Telephone</label>
              <input
                type="tel"
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                placeholder="+250 78 123 4567"
              />
            </div>
          )}

          {/* District & Sector (both roles) */}
          <div className="form-group">
            <label>District</label>
            <input
              type="text"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="e.g. Gasabo"
              required
            />
          </div>
          <div className="form-group">
            <label>Sector</label>
            <input
              type="text"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              placeholder="e.g. Kimironko"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up & Try AI Revision'}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
