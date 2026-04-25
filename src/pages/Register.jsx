import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';
  const classCode = searchParams.get('code') || '';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole, school_id: '', newSchool: '', phone: '' });
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
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
        phone: form.phone || undefined,
      });
      // Teacher accounts need admin approval first
      if (data.pending) {
        setPending(true);
        return;
      }
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

        {pending ? (
          <>
            <h2>✅ Konti Yoherejwe!</h2>
            <p className="auth-sub" style={{ marginTop: 12, lineHeight: 1.6 }}>
              Konti yawe y'umwarimu yoherejwe. <strong>Tegereza ko umuyobozi ayemera</strong> mbere yo kwinjira mu rubuga.
              Uzabona imeyili iyo uruhushya ruguye.
            </p>
            <div style={{ marginTop: 24 }}>
              <a href="/login" className="btn btn-primary btn-full">Subira ku Kwinjira</a>
            </div>
          </>
        ) : (
          <>
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
            <label>Inomero ya Telefoni <span style={{color:'#94a3b8',fontWeight:400}}>(optional)</span></label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+250 7XX XXX XXX" />
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
          </>
        )}
      </div>
    </div>
  );
}
