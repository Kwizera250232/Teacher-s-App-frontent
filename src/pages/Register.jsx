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
  const [verifiedSchool, setVerifiedSchool] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    school_id: '',
    newSchool: '',
  });

  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/schools').then(setSchools).catch(() => {});
  }, []);

  const handleRoleNext = () => {
    if (selectedRole === 'teacher' || selectedRole === 'head_teacher') {
      setStep('code');
    } else {
      setStep('form');
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setCodeError('');
    if (!codeInput.trim()) {
      setCodeError('Please enter the school code.');
      return;
    }
    setCodeLoading(true);
    try {
      const data = await api.get(
        `/auth/validate-school-code?code=${encodeURIComponent(codeInput.trim().toUpperCase())}`
      );
      if (selectedRole === 'head_teacher' && data.school.has_head_teacher) {
        setCodeError(
          'This school already has a Head Teacher. If you are a teacher, select the Teacher role.'
        );
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
      let schoolId = form.school_id;
      if (form.newSchool.trim() && selectedRole === 'student') {
        const school = await api.post('/auth/schools', { name: form.newSchool.trim() });
        schoolId = school.id;
      }

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: selectedRole,
        school_id: verifiedSchool ? verifiedSchool.id : (schoolId || null),
        phone: form.phone || undefined,
      };

      if (verifiedSchool) {
        payload.school_code = codeInput.trim().toUpperCase();
      }

      const data = await api.post('/auth/register', payload);

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
      } else if (data.user.role === 'head_teacher' || data.user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
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
              Konti yawe y'umwarimu yoherejwe.{' '}
              <strong>Tegereza ko umuyobozi w'ishuri ayemera</strong> mbere yo kwinjira mu rubuga.
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
        ) : step === 'code' ? (
          <>
            <h2>{selectedRole === 'head_teacher' ? '🏫 Head Teacher Signup' : '👨‍🏫 Teacher Signup'}</h2>
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
              <button
                type="button"
                onClick={() => {
                  setStep('role');
                  setCodeError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Subira inyuma
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Fungura Konti</h2>
            <p className="auth-sub">Injira mu rubuga rw'inyigisho</p>
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
                  placeholder="you@example.com"
                  required
                />
              </div>
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
              {selectedRole === 'student' && (
                <>
                  <div className="form-group">
                    <label>Ishuri</label>
                    <select
                      value={form.school_id}
                      onChange={(e) => setForm({ ...form, school_id: e.target.value, newSchool: '' })}
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
                </>
              )}
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

