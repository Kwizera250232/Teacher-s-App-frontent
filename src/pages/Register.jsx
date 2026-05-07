import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = ['teacher', 'head_teacher'].includes(searchParams.get('role')) ? searchParams.get('role') : 'student';
  const classCode = searchParams.get('code') || '';
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    school_id: '',
    phone: '',
    school_name: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    student_count: '',
    head_teacher_name: '',
    head_teacher_phone: '',
    head_teacher_email: '',
  });
  const [createSchoolProfile, setCreateSchoolProfile] = useState(defaultRole === 'teacher' || defaultRole === 'head_teacher');
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [schoolWelcome, setSchoolWelcome] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
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
    if ((form.role === 'teacher' || form.role === 'head_teacher') && createSchoolProfile) {
        const requiredSchoolFields = [
          form.school_name,
          form.district,
          form.sector,
          form.cell,
          form.village,
          if ((form.role === 'teacher' || form.role === 'head_teacher') && createSchoolProfile) {
          form.head_teacher_phone,
          form.head_teacher_email,
        ];
        if (requiredSchoolFields.some((v) => !String(v || '').trim())) {
          throw new Error('Complete all school onboarding fields for teacher signup.');
        }
      }

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        school_id: form.school_id || null,
        phone: form.phone || undefined,
      };

      if (form.role === 'teacher' && createSchoolProfile) {
        payload.school_profile = {
          name: form.school_name,
      if ((form.role === 'teacher' || form.role === 'head_teacher') && createSchoolProfile) {
          sector: form.sector,
          cell: form.cell,
          village: form.village,
          student_count: form.student_count || 0,
          head_teacher_name: form.head_teacher_name,
          head_teacher_phone: form.head_teacher_phone,
          head_teacher_email: form.head_teacher_email,
        };
      }

      const data = await api.post('/auth/register', payload);

      setSchoolWelcome(data.school_welcome_message || '');
      setSchoolCode(data.school_code || '');

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
        if (data.user.role === 'head_teacher') {
          navigate('/school-board');
        } else {
          navigate(data.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
        }
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
            {schoolCode && (
              <div className="auth-school-welcome">
                <p className="welcome-label">School Code</p>
                <h3>{schoolCode}</h3>
                {schoolWelcome && <p>{schoolWelcome}</p>}
              </div>
            )}
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
            <select value={form.role} onChange={e => {
              const nextRole = e.target.value;
              setForm({ ...form, role: nextRole });
                if (nextRole === 'teacher' || nextRole === 'head_teacher') setCreateSchoolProfile(true);
                else setCreateSchoolProfile(false);
            }}>
              <option value="student">Umunyeshuri</option>
              <option value="teacher">Umwarimu</option>
                <option value="head_teacher">Ndi umuyobozi w'ishuri</option>
            </select>
          </div>
          <div className="form-group">
            <label>Ishuri</label>
            <select value={form.school_id} onChange={e => setForm({ ...form, school_id: e.target.value })} disabled={(form.role === 'teacher' || form.role === 'head_teacher') && createSchoolProfile}>
              <option value="">Hitamo ishuri...</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {(form.role === 'teacher' || form.role === 'head_teacher') && (
            <div className="register-school-panel">
              <div className="register-school-header">
                <h3>🏫 School Onboarding</h3>
                <label className="toggle-wrap">
                  <input
                    type="checkbox"
                    checked={createSchoolProfile}
                    onChange={(e) => setCreateSchoolProfile(e.target.checked)}
                  />
                  <span>Create full school profile</span>
                </label>
              </div>

              {createSchoolProfile && (
                <div className="register-school-grid">
                  <div className="form-group">
                    <label>Name of School</label>
                    <input type="text" value={form.school_name} onChange={e => setForm({ ...form, school_name: e.target.value, school_id: '' })} placeholder="e.g. GS Nyamirambo" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <input type="text" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="District" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>Sector</label>
                    <input type="text" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Sector" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>Cell</label>
                    <input type="text" value={form.cell} onChange={e => setForm({ ...form, cell: e.target.value })} placeholder="Cell" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>Village</label>
                    <input type="text" value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} placeholder="Village" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>Number of Students</label>
                    <input type="number" min="0" value={form.student_count} onChange={e => setForm({ ...form, student_count: e.target.value })} placeholder="e.g. 540" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>Name of Head Teacher</label>
                    <input type="text" value={form.head_teacher_name} onChange={e => setForm({ ...form, head_teacher_name: e.target.value })} placeholder="Head Teacher Name" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>Head Teacher Telephone</label>
                    <input type="tel" value={form.head_teacher_phone} onChange={e => setForm({ ...form, head_teacher_phone: e.target.value })} placeholder="+250 7XX XXX XXX" required={createSchoolProfile} />
                  </div>
                  <div className="form-group">
                    <label>School Email (HT Email)</label>
                    <input type="email" value={form.head_teacher_email} onChange={e => setForm({ ...form, head_teacher_email: e.target.value })} placeholder="headteacher@school.rw" required={createSchoolProfile} />
                  </div>
                </div>
              )}
            </div>
          )}

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
