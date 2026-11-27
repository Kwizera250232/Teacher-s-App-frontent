import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/roles';
import { signupEmailDomain, buildSchoolEmailPreview } from '../utils/schoolDomain';
import { SCHOOL_EMAIL_IN_APP_HELP, STUDENT_SCHOOL_EMAIL_HELP } from '../utils/schoolEmailHelp';
import AuthBackLink from '../components/AuthBackLink';
import './Auth.css';

export default function Register() {
  const [searchParams] = useSearchParams();
  const searchRole = searchParams.get('role');
  const classCode = searchParams.get('code') || '';
  const quizShareToken = searchParams.get('quiz_share') || '';
  const prefSchoolId = searchParams.get('school_id') || '';

  // step: 'role' → 'code' (if teacher/HT) → 'form'
  const [step, setStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState(
    ['head_teacher', 'teacher', 'guest'].includes(searchRole) ? searchRole : 'student'
  );
  const [verifiedSchool, setVerifiedSchool] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    studentEmailLocal: '',
    staffSchoolName: '',
    staffSchoolId: '',
    password: '',
    phone: '',
    school_id: '',
    newSchool: '',
  });
  const [schoolEmailPreview, setSchoolEmailPreview] = useState('');
  const [schoolEmailStatus, setSchoolEmailStatus] = useState('');
  const [studentEmailStatus, setStudentEmailStatus] = useState('');

  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/schools').then(setSchools).catch(() => {});
  }, []);

  useEffect(() => {
    if (prefSchoolId) {
      setForm((f) => ({ ...f, school_id: prefSchoolId }));
      setSelectedRole((r) => (r === 'student' ? r : 'student'));
      setStep('form');
    }
  }, [prefSchoolId]);

  useEffect(() => {
    if (quizShareToken && ['student', 'teacher', 'head_teacher'].includes(searchRole)) {
      setSelectedRole(searchRole);
      setStep('form');
    } else if (quizShareToken) {
      setStep('form');
      setSelectedRole('student');
    }
  }, [quizShareToken, searchRole]);

  useEffect(() => {
    if (['head_teacher', 'teacher', 'guest'].includes(searchRole)) {
      setSelectedRole(searchRole);
      setStep('form');
    }
  }, [searchRole]);

  const handleRoleNext = () => {
    setStep('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let schoolId = form.school_id;
      if (form.newSchool.trim() && selectedRole === 'student') {
        const school = await api.post('/auth/schools', { name: form.newSchool.trim() });
        schoolId = school.id;
      }

      const isStaff = selectedRole === 'teacher' || selectedRole === 'head_teacher';

      if (isStaff) {
        if (!form.email.trim()) {
          setError('Andika imeyili yawe (e.g. Gmail).');
          setLoading(false);
          return;
        }
        if (!verifiedSchool && !form.staffSchoolName.trim()) {
          setError('Andika izina ry\'ishuri.');
          setLoading(false);
          return;
        }
      } else if (selectedRole === 'student') {
        if (!form.email.trim()) {
          setError('Andika imeyili.');
          setLoading(false);
          return;
        }
        if (!schoolId && !verifiedSchool?.id) {
          setError('Hitamo ishuri.');
          setLoading(false);
          return;
        }
      } else if (selectedRole === 'guest') {
        if (!form.email.trim()) {
          setError('Andika imeyili yawe (e.g. Gmail).');
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: form.name,
        password: form.password,
        role: selectedRole,
        school_id: verifiedSchool ? verifiedSchool.id : (schoolId || null),
        phone: form.phone || undefined,
      };

      if (isStaff) {
        payload.email = form.email.trim().toLowerCase();
        if (!verifiedSchool && form.staffSchoolId) {
          payload.school_id = parseInt(form.staffSchoolId, 10) || null;
        }
        if (!verifiedSchool && !form.staffSchoolId && form.staffSchoolName.trim()) {
          payload.staff_school_name = form.staffSchoolName.trim();
        }
      } else if (selectedRole === 'student') {
        payload.email = form.email.trim().toLowerCase();
      } else if (selectedRole === 'guest') {
        payload.email = form.email.trim().toLowerCase();
      }

      if (verifiedSchool?.code) {
        payload.school_code = String(verifiedSchool.code).trim().toUpperCase();
      }
      if (quizShareToken) {
        payload.quiz_share_token = quizShareToken;
      }

      const data = await api.post('/auth/register', payload);

      if (data.pending) {
        if (data.login_email) setSchoolEmailPreview(data.login_email);
        setPending(true);
        return;
      }

      login(data.token, data.user);
      const shareRedir = data.guest_share_redirect;
      if (shareRedir?.class_id && shareRedir?.quiz_id) {
        if (data.user.role === 'guest') {
          navigate(`/guest/classes/${shareRedir.class_id}/quizzes/${shareRedir.quiz_id}`, { replace: true });
          return;
        }
        if (data.user.role === 'student') {
          navigate(`/student/classes/${shareRedir.class_id}/quizzes/${shareRedir.quiz_id}`, { replace: true });
          return;
        }
      }
      if (data.user.role === 'guest') {
        navigate('/guest/dashboard', { replace: true });
        return;
      }
      if (data.user.role === 'student' && classCode) {
        try {
          const joined = await api.post('/classes/join', { class_code: classCode }, data.token);
          navigate(`/student/classes/${joined.class.id}`);
        } catch {
          navigate('/student/dashboard');
        }
      } else {
        navigate(dashboardPath(data.user.role));
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
        <AuthBackLink />
        <div className="auth-logo">🎓</div>

        {pending ? (
          <>
            <h2>✅ Konti Yoherejwe!</h2>
            <p className="auth-sub" style={{ marginTop: 12, lineHeight: 1.6 }}>
              Konti yawe y'umwarimu yoherejwe.{' '}
              <strong>Tegereza ko umuyobozi w'ishuri ayemera</strong> mbere yo kwinjira.
              {schoolEmailPreview && (
                <>
                  <br />
                  Injira ukoresheje: <strong>{schoolEmailPreview}</strong>
                </>
              )}
              <br />
              <span style={{ fontSize: 13, color: '#64748b' }}>{SCHOOL_EMAIL_IN_APP_HELP}</span>
            </p>
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
                <option value="head_teacher">🏫 Umuyobozi w'Ikigo (Head Teacher)</option>
                <option value="teacher">👨‍🏫 Umwarimu (Teacher)</option>
                <option value="guest">🔗 Guest (quiz share link)</option>
              </select>
            </div>

            {selectedRole === 'student' && (
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
                Students select their school from the list in the next step.
              </p>
            )}
            {(selectedRole === 'head_teacher' || selectedRole === 'teacher') && (
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
                Choose or type your school, then sign up with your personal email (e.g. Gmail).
              </p>
            )}
            {selectedRole === 'guest' && (
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
                Sign up with your personal email. Open a teacher&apos;s quiz share link to unlock classes.
              </p>
            )}

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 20 }}
              onClick={handleRoleNext}
            >
              Komeza →
            </button>
            <p className="auth-link" style={{ marginTop: 16 }}>
              Usanzwe ufite konti? <Link to="/login">Injira</Link>
            </p>
          </>
        ) : (
          <>
            <h2>Fungura Konti</h2>
            <p className="auth-sub">Injira mu rubuga rw'inyigisho</p>
            {quizShareToken && (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 12,
                  fontSize: 13,
                  color: '#065f46',
                  lineHeight: 1.45,
                }}
              >
                You opened a <strong>shared quiz</strong> link. After signup you can take the quiz in your
                dashboard (students join the class; guests use a separate guest account on the share page).
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
              {(selectedRole === 'teacher' || selectedRole === 'head_teacher') ? (
                <>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Izina ry&apos;ishuri *</label>
                  <input
                    type="text"
                    value={verifiedSchool ? verifiedSchool.name : form.staffSchoolName}
                    onChange={(e) => {
                      if (verifiedSchool) return;
                      setForm({ ...form, staffSchoolName: e.target.value, staffSchoolId: '', newSchool: '' });
                      setSchoolEmailStatus('');
                    }}
                    readOnly={Boolean(verifiedSchool)}
                    placeholder="Andika izina ry'ishuri ryawe"
                    required={!verifiedSchool}
                    autoComplete="off"
                    style={verifiedSchool ? { background: '#f1f5f9' } : undefined}
                  />
                  {/* Typeahead: only matching schools appear as you type — the full
                      school list is never shown. If nothing matches, the typed
                      name is saved as a new school. */}
                  {!verifiedSchool && !form.staffSchoolId && form.staffSchoolName.trim().length >= 2 && (() => {
                    const q = form.staffSchoolName.trim().toLowerCase();
                    const matches = schools.filter((s) => (s.name || '').toLowerCase().includes(q)).slice(0, 6);
                    const exact = schools.some((s) => (s.name || '').toLowerCase() === q);
                    if (!matches.length && exact) return null;
                    return (
                      <div style={{
                        position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 20,
                        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(15,23,42,0.12)', marginTop: 4, overflow: 'hidden',
                      }}>
                        {matches.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, staffSchoolId: String(s.id), staffSchoolName: s.name });
                              setSchoolEmailStatus('');
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                              padding: '10px 14px', border: 'none', background: '#fff', cursor: 'pointer',
                              fontSize: 14, fontWeight: 600, color: '#1e293b',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                          >
                            <span style={{ color: '#7c3aed' }}>🏫</span> {s.name}
                          </button>
                        ))}
                        {!exact && (
                          <div style={{ padding: '8px 14px', fontSize: 12, color: '#64748b', borderTop: matches.length ? '1px solid #f1f5f9' : 'none' }}>
                            ➕ &quot;{form.staffSchoolName.trim()}&quot; izongerwa nk&apos;ishuri rishya
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {form.staffSchoolId && (
                    <p style={{ fontSize: 12, marginTop: 4, color: '#059669', fontWeight: 600 }}>
                      ✓ Ishuri ryatoranyijwe — {form.staffSchoolName}
                    </p>
                  )}
                  {!verifiedSchool && !form.staffSchoolId && (
                    <p style={{ fontSize: 12, marginTop: 4, color: '#64748b' }}>
                      Andika izina ry&apos;ishuri — niba ririba, uhitemo; niba ritariho, ryongerwaho.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Imeyili yawe (login)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="yourname@gmail.com"
                    required
                    autoComplete="email"
                  />
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.4 }}>
                    Koresha imeyili yawe bwite (e.g. Gmail). Uzayikoresha winjira muri app.
                  </p>
                </div>
                </>
              ) : selectedRole === 'guest' ? (
                <>
                  <div className="form-group">
                    <label>Imeyili yawe (login)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="yourname@gmail.com"
                      required
                      autoComplete="email"
                    />
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.4 }}>
                      Use your personal email. Open a quiz share link from your teacher to unlock classes after signup.
                    </p>
                  </div>
                </>
              ) : (
                <>
              <div className="form-group">
                <label>Ishuri</label>
                <select
                  value={form.school_id}
                  onChange={(e) => {
                    setForm({ ...form, school_id: e.target.value, newSchool: '' });
                    setStudentEmailStatus('');
                  }}
                  required={!form.newSchool.trim()}
                >
                  <option value="">Hitamo ishuri...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cyangwa ongeraho ishuri rishya</label>
                <input
                  type="text"
                  value={form.newSchool}
                  onChange={(e) => setForm({ ...form, newSchool: e.target.value, school_id: '' })}
                  placeholder="Andika izina ry'ishuri rishya"
                />
              </div>
              <div className="form-group">
                <label>Imeyili (Gmail cyangwa iy&apos;umubyeyi)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setStudentEmailStatus('');
                    setSchoolEmailPreview('');
                  }}
                  placeholder="parent@gmail.com"
                  required
                />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.4 }}>
                  If your teacher already added you, use the school email they gave you. Otherwise use a Gmail or parent/guardian email.
                </p>
                {schoolEmailPreview && (
                  <p style={{ fontSize: 12, marginTop: 4, color: '#0f766e' }}>
                    Imeyili yo kwinjira: <strong>{schoolEmailPreview}</strong>
                  </p>
                )}
                {studentEmailStatus && (
                  <p style={{ fontSize: 12, marginTop: 4, color: studentEmailStatus.startsWith('✓') ? '#059669' : '#dc2626' }}>
                    {studentEmailStatus}
                  </p>
                )}
              </div>
                </>
              )}
              <div className="form-group">
                <label>Ijambo Banga</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Nibura inyuguti 8"
                  minLength={8}
                  required
                />
              </div>
              {(selectedRole === 'teacher' || selectedRole === 'head_teacher') && verifiedSchool && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#e0e7ff',
                    borderRadius: 8,
                    marginBottom: 16,
                    color: '#3730a3',
                    fontWeight: 600,
                  }}
                >
                  🏫 School: <strong>{verifiedSchool.name}</strong>
                  {selectedRole === 'teacher' && (
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 400, marginTop: 4 }}>
                      Your account may need Head Teacher approval before login.
                    </span>
                  )}
                </div>
              )}
              <div className="form-group">
                <label>Terefone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+250 78 123 4567"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Gutegereza...' : 'Fungura Konti'}
              </button>
            </form>
            <p className="auth-link">
              Usanzwe ufite konti? <Link to="/login">Injira</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

