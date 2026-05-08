import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [searchParams] = useSearchParams();
  const classCode = searchParams.get('code') || '';
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', form);
      login(data.token, data.user);
      if (data.user.role === 'student' && classCode) {
        try {
          const joined = await api.post('/classes/join', { class_code: classCode }, data.token);
          navigate(`/student/classes/${joined.class.id}`);
        } catch {
          navigate('/student/dashboard');
        }
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'head_teacher') {
        navigate('/school-board');
      } else {
        navigate(data.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h2>Murakaza Neza</h2>
        <p className="auth-sub">Injira muri konti yawe</p>
        <div className="alert alert-info" style={{ marginBottom: 14 }}>
          Koresha imeyili y'ishuri gusa (nka @brightschool.edu). Gmail, Yahoo n'izindi ntizemerewe. Hamagara School IT niba ubikeneye.
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Imeyili</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@brightschool.edu"
              required
            />
          </div>
          <div className="form-group">
            <label>Ijambo Banga</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 18, padding: 2, color: '#888',
                }}
                aria-label={showPwd ? 'Hisha ijambobanga' : 'Erekana ijambobanga'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Gutegereza...' : 'Injira'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 10 }}>
          <Link to="/forgot-password" style={{ color: '#667eea', fontSize: 13 }}>Wibagiwe ijambobanga?</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/register?role=head_teacher" style={{ color: '#0ea5e9', fontSize: 13, fontWeight: 700 }}>
            Sign up as Head Teacher
          </Link>
        </p>
        <p className="auth-link">Nta konti ufite? <Link to="/register">Iyandikishe</Link></p>
      </div>
    </div>
  );
}
