import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';
  const classCode = searchParams.get('code') || '';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole, school_id: '', newSchool: '' });
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/schools').then(setSchools).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let schoolId = form.school_id;
      if (form.newSchool.trim()) {
        const school = await api.post('/auth/schools', { name: form.newSchool.trim() });
        schoolId = school.id;
      }
      const data = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        school_id: schoolId || null,
      });
      login(data.token, data.user);
      if (data.user.role === 'student' && classCode) {
        try {
          const joined = await api.post('/classes/join', { class_code: classCode }, data.token);
          navigate(`/student/classes/${joined.class.id}`);
        } catch {
          navigate('/student/dashboard');
        }
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
        <h2>Fungura Konti</h2>
        <p className="auth-sub">Injira mu rubuga rw'inyigisho</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amazina Yuzuye</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Amazina yawe yuzuye" required />
          </div>
          <div className="form-group">
            <label>Imeyili</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Ijambo Banga</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Nibura inyuguti 8" minLength={8} required />
          </div>
          <div className="form-group">
            <label>Ndi</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="student">Umunyeshuri</option>
              <option value="teacher">Umwarimu</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ishuri</label>
            <select value={form.school_id} onChange={e => setForm({ ...form, school_id: e.target.value, newSchool: '' })}>
              <option value="">Hitamo ishuri...</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Cyangwa ongeraho ishuri rishya</label>
            <input type="text" value={form.newSchool} onChange={e => setForm({ ...form, newSchool: e.target.value, school_id: '' })} placeholder="Andika izina ry'ishuri rishya" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Gutegereza...' : 'Fungura Konti'}
          </button>
        </form>
        <p className="auth-link">Usanzwe ufite konti? <Link to="/login">Injira</Link></p>
      </div>
    </div>
  );
}
