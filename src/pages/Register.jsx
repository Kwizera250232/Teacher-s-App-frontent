import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [searchParams] = useSearchParams();
  const searchRole = searchParams.get('role');
  const classCode = searchParams.get('code') || '';

  // step: 'role' → 'code' (if teacher/HT) → 'form'
  const [step, setStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState(
    ['head_teacher', 'teacher'].includes(searchRole) ? searchRole : 'student'
  );
  const [codeInput, setCodeInput] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [verifiedSchool, setVerifiedSchool] = useState(null); // {id, name, email_domain}

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    school_id: '',
    // Legacy HT school-profile fields kept for the optional "create school" path
    school_name: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    student_count: '',
    head_teacher_name: '',
    head_teacher_phone: '',
    head_teacher_email: '',
    email_domain: '',
  });

  const [createSchoolProfile, setCreateSchoolProfile] = useState(false);
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

  // Advance from role step
  const handleRoleNext = () => {
    if (selectedRole === 'teacher' || selectedRole === 'head_teacher') {
      setStep('code');
    } else {
      setStep('form');
    }
  };

  // Validate school code
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setCodeError('');
    if (!codeInput.trim()) { setCodeError('Please enter the school code.'); return; }
    setCodeLoading(true);
    try {
      const data = await api.get(`/auth/validate-school-code?code=${encodeURIComponent(codeInput.trim().toUpperCase())}`);
      if (selectedRole === 'head_teacher' && data.school.has_head_teacher) {
        setCodeError('This school already has a Head Teacher. If you are a teacher, select the Teacher role.');
        setCodeLoading(false);
        return;
      }
      setVerifiedSchool(data.school);
      setStep('form');
    } catch (err) {
      setCodeError(err.message || 'Invalid code. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const needsSchoolProfile = selectedRole === 'head_teacher' && createSchoolProfile && !verifiedSchool;

      if (needsSchoolProfile) {
        const requiredSchoolFields = [
          form.school_name, form.district, form.sector, form.cell, form.village,
          form.head_teacher_name, form.head_teacher_phone, form.head_teacher_email,
        ];
        if (requiredSchoolFields.some((v) => !String(v || '').trim())) {
          throw new Error('Complete all school onboarding fields.');
        }
      }

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: selectedRole,
        school_id: verifiedSchool ? verifiedSchool.id : (form.school_id || null),
        phone: form.phone || undefined,
        school_code: verifiedSchool ? codeInput.trim().toUpperCase() : undefined,
      };

      if (needsSchoolProfile) {
        payload.school_profile = {
          name: form.school_name,
          district: form.district,
          sector: form.sector,
          cell: form.cell,
          village: form.village,
          student_count: form.student_count || 0,
          head_teacher_name: form.head_teacher_name,
          head_teacher_phone: form.head_teacher_phone,
          head_teacher_email: form.head_teacher_email,
          email_domain: form.email_domain,
        };
      }

      const data = await api.post('/auth/register', payload);

      setSchoolWelcome(data.school_welcome_message || '');
      setSchoolCode(data.school_code || '');

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

        {pending ? (
          <>
            <h2>✅ Konti Yoherejwe!</h2>
            <p className="auth-sub" style={{ marginTop: 12, lineHeight: 1.6 }}>
              Konti yawe y'umwarimu yoherejwe. <strong>Tegereza ko umuyobozi w'ishuri ayemera</strong> mbere yo
              kwinjira mu rubuga.
            </p>
            {schoolCode && (
              <div className="auth-school-welcome">
                <p className="welcome-label">School Code</p>
                <h3>{schoolCode}</h3>
                {schoolWelcome && <p>{schoolWelcome}</p>}
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <a href="/login" className="btn btn-primary btn-full">
                Subira ku Kwinjira
              </a>
            </div>
          </>
        ) : step === 'role' ? (
          <>
            <h2>Fungura Konti</h2>
            <p className="auth-sub">Hitamo uwo uri we</p>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Ndi</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ fontSize: '1rem', padding: '0.6rem' }}
              >
                <option value="student">👨‍🎓 Umunyeshuri (Student)</option>
                <option value="head_teacher">🏫 Umuyobozi w'Ishuri (Head Teacher)</option>
                <option value="teacher">👨‍🏫 Umwarimu (Teacher)</option>
              </select>
            </div>

            {selectedRole === 'student' && (
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
                Students select their school from the list in the next step.
              </p>
            )}
            {selectedRole === 'head_teacher' && (
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
                You need the <strong>School Code</strong> from your school admin.
              </p>
            )}
            {selectedRole === 'teacher' && (
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
                You need the <strong>School Code</strong> from your Head Teacher.
              </p>
            )}

            <button className="btn btn-primary btn-full" style={{ marginTop: 20 }} onClick={handleRoleNext}>
              Komeza →
            </button>
            <p className="auth-link" style={{ marginTop: 16 }}>
              Usanzwe ufite konti? <Link to="/login">Injira</Link>
            </p>
          </>
        ) : step === 'code' ? (
          <>
            <h2>
              {selectedRole === 'head_teacher' ? '🏫 Head Teacher Signup' : '👨‍🏫 Teacher Signup'}
            </h2>
            <p className="auth-sub">
              {selectedRole === 'head_teacher'
                ? 'Enter the School Code given to you by the system admin'
                : 'Enter the School Code shared by your Head Teacher'}
            </p>

            {codeError && <div className="alert alert-error">{codeError}</div>}

            <form onSubmit={handleCodeSubmit}>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>School Code</label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. AB3X7YQ2"
                  maxLength={12}
                  style={{ letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={codeLoading}>
                {codeLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <p className="auth-link" style={{ marginTop: 12 }}>
              <button type="button" onClick={() => { setStep('role'); setCodeError(''); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}>
                ← Subira inyuma
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Fungura Konti</h2>
            <p className="auth-sub">Injira mu rubuga rw'inyigisho</p>

            {verifiedSchool && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ margin: 0, color: '#166534', fontWeight: 600 }}>
                  🏫 {verifiedSchool.name}
                </p>
                <p style={{ margin: '2px 0 0', color: '#15803d', fontSize: '0.8rem' }}>
                  School email domain: {verifiedSchool.email_domain}
                </p>
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Amazina Yuzuye</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Amazina yawe yuzuye"
                  required
                />
              </div>

              <div className="form-group">
                <label>Imeyili</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={verifiedSchool ? `you@example.com` : 'you@brightschool.edu'}
                  required
                />
                {verifiedSchool && (
                  <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
                    Use any valid email. A school email ({verifiedSchool.email_domain}) will be generated for you when needed.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>
                  Inomero ya Telefoni <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+250 7XX XXX XXX"
                />
              </div>

              <div className="form-group">
                <label>Ijambo Banga</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Nibura inyuguti 8, inyuguti n'imibare"
                  minLength={8}
                  required
                />
              </div>

              {selectedRole === 'student' && (
                <div className="form-group">
                  <label>Ishuri</label>
                  <select
                    value={form.school_id}
                    onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                    required
                  >
                    <option value="">Hitamo ishuri...</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRole === 'head_teacher' && !verifiedSchool && (
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
                        <input type="text" value={form.school_name}
                          onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                          placeholder="e.g. GS Nyamirambo" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>District</label>
                        <input type="text" value={form.district}
                          onChange={(e) => setForm({ ...form, district: e.target.value })}
                          placeholder="District" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>Sector</label>
                        <input type="text" value={form.sector}
                          onChange={(e) => setForm({ ...form, sector: e.target.value })}
                          placeholder="Sector" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>Cell</label>
                        <input type="text" value={form.cell}
                          onChange={(e) => setForm({ ...form, cell: e.target.value })}
                          placeholder="Cell" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>Village</label>
                        <input type="text" value={form.village}
                          onChange={(e) => setForm({ ...form, village: e.target.value })}
                          placeholder="Village" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>Number of Students</label>
                        <input type="number" min="0" value={form.student_count}
                          onChange={(e) => setForm({ ...form, student_count: e.target.value })}
                          placeholder="e.g. 540" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>Name of Head Teacher</label>
                        <input type="text" value={form.head_teacher_name}
                          onChange={(e) => setForm({ ...form, head_teacher_name: e.target.value })}
                          placeholder="Head Teacher Name" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>Head Teacher Telephone</label>
                        <input type="tel" value={form.head_teacher_phone}
                          onChange={(e) => setForm({ ...form, head_teacher_phone: e.target.value })}
                          placeholder="+250 7XX XXX XXX" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>School Email (HT Email)</label>
                        <input type="email" value={form.head_teacher_email}
                          onChange={(e) => setForm({ ...form, head_teacher_email: e.target.value })}
                          placeholder="headteacher@school.rw" required={createSchoolProfile} />
                      </div>
                      <div className="form-group">
                        <label>School Email Domain</label>
                        <input type="text" value={form.email_domain}
                          onChange={(e) => setForm({ ...form, email_domain: e.target.value })}
                          placeholder="brightschool.edu" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Gutegereza...' : 'Fungura Konti'}
              </button>
            </form>

            <p className="auth-link">
              <button type="button" onClick={() => { setStep(verifiedSchool ? 'code' : 'role'); setError(''); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}>
                ← Subira inyuma
              </button>
              {' · '}
              Usanzwe ufite konti? <Link to="/login">Injira</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
