import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './SchoolBoard.css';

function StatCard({ label, value, tone }) {
  return (
    <article className={`school-stat-card ${tone || ''}`}>
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

export default function SchoolBoard() {
  const { token, user, logout } = useAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provisionForm, setProvisionForm] = useState({
    name: '',
    email_local_part: '',
    email: '',
    password: '',
    phone: '',
    auto_generate_email: true,
  });
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email_local_part: '',
    email: '',
    password: '',
    phone: '',
    auto_generate_email: true,
    is_school_it: false,
  });
  const [provisionMsg, setProvisionMsg] = useState('');
  const [provisionError, setProvisionError] = useState('');
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [delegatingId, setDelegatingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const isHeadTeacher = user?.role === 'head_teacher';

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError('');
        if (isHeadTeacher) {
          const board = await api.get('/admin/my-school-board', token);
          if (!active) return;
          const ownSchoolId = String(board?.school?.id || '');
          setSchools(board?.school ? [board.school] : []);
          setSelectedSchoolId(ownSchoolId);
          setData(board);
          setLoading(false);
          return;
        }

        setLoading(false);
        setError('School Dashboard is restricted to Head Teachers only.');
      } catch (e) {
        if (!active) return;
        setError(e.message || 'Failed to load school board.');
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isHeadTeacher, token]);

  const onSchoolChange = async (nextId) => {
    if (isHeadTeacher) return;
    setSelectedSchoolId(nextId);
    setLoading(true);
    setError('');
    try {
      const board = await api.get(`/admin/my-school-board?school_id=${nextId}`, token);
      setData(board);
    } catch (e) {
      setError(e.message || 'Failed to switch school.');
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};
  const school = data?.school;

  const statCards = useMemo(() => ([
    { label: 'Teachers', value: summary.teachers ?? 0, tone: 't1' },
    { label: 'Students', value: summary.students ?? 0, tone: 't2' },
    { label: 'Classes', value: summary.classes ?? 0, tone: 't3' },
    { label: 'Notes', value: summary.notes ?? 0, tone: 't4' },
    { label: 'Homework', value: summary.homework ?? 0, tone: 't5' },
    { label: 'Quizzes', value: summary.quizzes ?? 0, tone: 't6' },
    { label: 'CAT Sheets', value: summary.cat_sheets ?? 0, tone: 't7' },
    { label: 'Avg CAT %', value: `${summary.average_cat_percentage ?? 0}%`, tone: 't8' },
  ]), [summary]);

  const createStudentProvision = async () => {
    setProvisionError('');
    setProvisionMsg('');
    if (!provisionForm.name.trim()) {
      setProvisionError('Student full name is required.');
      return;
    }

    try {
      setProvisionLoading(true);
      const result = await api.post('/admin/school/students', {
        name: provisionForm.name.trim(),
        email_local_part: provisionForm.email_local_part.trim(),
        email: provisionForm.auto_generate_email ? '' : provisionForm.email.trim(),
        auto_generate_email: provisionForm.auto_generate_email,
        password: provisionForm.password.trim(),
        phone: provisionForm.phone.trim(),
      }, token);

      setProvisionMsg(`Student created: ${result?.student?.name} (${result?.credentials?.email})`);
      setProvisionForm((f) => ({ ...f, name: '', email_local_part: '', email: '', password: '', phone: '' }));
      const board = await api.get('/admin/my-school-board', token);
      setData(board);
    } catch (e) {
      setProvisionError(e.message || 'Failed to create student account.');
    } finally {
      setProvisionLoading(false);
    }
  };

  const createTeacherProvision = async () => {
    setProvisionError('');
    setProvisionMsg('');
    if (!teacherForm.name.trim()) {
      setProvisionError('Teacher full name is required.');
      return;
    }

    try {
      setProvisionLoading(true);
      const result = await api.post('/admin/school/teachers', {
        name: teacherForm.name.trim(),
        email_local_part: teacherForm.email_local_part.trim(),
        email: teacherForm.auto_generate_email ? '' : teacherForm.email.trim(),
        auto_generate_email: teacherForm.auto_generate_email,
        password: teacherForm.password.trim(),
        phone: teacherForm.phone.trim(),
        is_school_it: teacherForm.is_school_it,
      }, token);

      setProvisionMsg(`Teacher created: ${result?.teacher?.name} (${result?.credentials?.email})`);
      setTeacherForm((f) => ({
        ...f,
        name: '',
        email_local_part: '',
        email: '',
        password: '',
        phone: '',
        is_school_it: false,
      }));
      const board = await api.get('/admin/my-school-board', token);
      setData(board);
    } catch (e) {
      setProvisionError(e.message || 'Failed to create teacher account.');
    } finally {
      setProvisionLoading(false);
    }
  };

  const toggleSchoolIT = async (teacher) => {
    setProvisionError('');
    setProvisionMsg('');
    try {
      setDelegatingId(teacher.id);
      const updated = await api.put(`/admin/school/teachers/${teacher.id}/school-it`, {
        enabled: !teacher.is_school_it,
      }, token);
      setProvisionMsg(`${updated.name} is now ${updated.is_school_it ? 'authorized' : 'removed'} as School IT.`);
      const board = await api.get('/admin/my-school-board', token);
      setData(board);
    } catch (e) {
      setProvisionError(e.message || 'Failed to update School IT authority.');
    } finally {
      setDelegatingId(null);
    }
  };

  const approveTeacher = async (teacher, approve) => {
    setProvisionError('');
    setProvisionMsg('');
    try {
      setApprovingId(teacher.id);
      await api.put(`/admin/school/teachers/${teacher.id}/approve`, { approve }, token);
      setProvisionMsg(`${teacher.name} has been ${approve ? 'approved' : 'rejected'}.`);
      const board = await api.get('/admin/my-school-board', token);
      setData(board);
    } catch (e) {
      setProvisionError(e.message || 'Failed to update teacher status.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="school-board-page">
      <header className="school-board-header">
        <div>
          <p className="eyebrow">School Dashboard</p>
          <h1>{school?.name || 'School Board'}</h1>
          <p className="muted">Manage teachers, class work, notes, homework, quizzes, and CAT marks in one board.</p>
        </div>
        <div className="school-board-actions">
          {!isHeadTeacher && <Link to="/admin" className="btn btn-outline">Back</Link>}
          {isHeadTeacher && <Link to="/welcome" className="btn btn-outline">Home</Link>}
          {!isHeadTeacher && (
            <select value={selectedSchoolId} onChange={(e) => onSchoolChange(e.target.value)}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button type="button" className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      {loading && <div className="school-card">Loading school analytics...</div>}
      {error && <div className="school-card error">{error}</div>}

      {!isHeadTeacher && !loading && (
        <div style={{ marginTop: 12 }}>
          <Link to="/welcome" className="btn btn-outline">Go Home</Link>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="school-hero">
            <div>
              <p className="hero-tag">Welcome Message</p>
              <h2>{school?.welcome_message || `Murakaza neza kuri ${school?.name || 'iri shuri'}!`}</h2>
            </div>
            <div className="hero-code-wrap">
              <span>School Code</span>
              <strong>{school?.code || 'PENDING'}</strong>
            </div>
          </section>

          <section className="school-stats-grid">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section className="school-card split">
            <div>
              <h2>School Details</h2>
              <p><strong>District:</strong> {school?.district || 'Not set'}</p>
              <p><strong>Sector:</strong> {school?.sector || 'Not set'}</p>
              <p><strong>Cell:</strong> {school?.cell || 'Not set'}</p>
              <p><strong>Village:</strong> {school?.village || 'Not set'}</p>
              <p><strong>Number of Students:</strong> {school?.student_count ?? summary.students ?? 0}</p>
              <p><strong>Head Teacher:</strong> {school?.head_teacher_name || 'Not set'}</p>
              <p><strong>Head Teacher Phone:</strong> {school?.head_teacher_phone || 'Not set'}</p>
              <p><strong>School Email (HT):</strong> {school?.head_teacher_email || 'Not set'}</p>
              <p><strong>Student Email Domain:</strong> {school?.email_domain || 'Auto generated from school name'}</p>
            </div>
            <div>
              <h2>Quality Goals</h2>
              <ul>
                <li>Teachers should have active classes and weekly content.</li>
                <li>Every class should track CAT marks for performance visibility.</li>
                <li>Monitor low-performing classes using CAT average percentages.</li>
              </ul>
            </div>
          </section>

          <section className="school-card">
            <h2>Create Student Account (Head Teacher / School IT)</h2>
            {provisionMsg && <p style={{ color: '#16a34a' }}>{provisionMsg}</p>}
            {provisionError && <p style={{ color: '#dc2626' }}>{provisionError}</p>}
            <div className="admin-form-row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <input
                className="admin-input"
                placeholder="Student full name"
                value={provisionForm.name}
                onChange={(e) => setProvisionForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="admin-input"
                placeholder="Email username (before @domain)"
                value={provisionForm.email_local_part}
                onChange={(e) => setProvisionForm((f) => ({ ...f, email_local_part: e.target.value }))}
              />
              <input
                className="admin-input"
                placeholder="Phone (optional)"
                value={provisionForm.phone}
                onChange={(e) => setProvisionForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <input
                className="admin-input"
                placeholder="Password (optional, auto if empty)"
                value={provisionForm.password}
                onChange={(e) => setProvisionForm((f) => ({ ...f, password: e.target.value }))}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={provisionForm.auto_generate_email}
                  onChange={(e) => setProvisionForm((f) => ({ ...f, auto_generate_email: e.target.checked }))}
                />
                Auto-generate school email
              </label>
              {!provisionForm.auto_generate_email && (
                <input
                  className="admin-input"
                  placeholder={`Manual email (must end with @${school?.email_domain || 'school.edu'})`}
                  value={provisionForm.email}
                  onChange={(e) => setProvisionForm((f) => ({ ...f, email: e.target.value }))}
                />
              )}
              <button type="button" className="btn btn-primary" onClick={createStudentProvision} disabled={provisionLoading}>
                {provisionLoading ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </section>

          <section className="school-card">
            <h2>Create Teacher Account (Head Teacher)</h2>
            <div className="admin-form-row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <input
                className="admin-input"
                placeholder="Teacher full name"
                value={teacherForm.name}
                onChange={(e) => setTeacherForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="admin-input"
                placeholder="Email username (before @domain)"
                value={teacherForm.email_local_part}
                onChange={(e) => setTeacherForm((f) => ({ ...f, email_local_part: e.target.value }))}
              />
              <input
                className="admin-input"
                placeholder="Phone (optional)"
                value={teacherForm.phone}
                onChange={(e) => setTeacherForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <input
                className="admin-input"
                placeholder="Password (optional, auto if empty)"
                value={teacherForm.password}
                onChange={(e) => setTeacherForm((f) => ({ ...f, password: e.target.value }))}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={teacherForm.auto_generate_email}
                  onChange={(e) => setTeacherForm((f) => ({ ...f, auto_generate_email: e.target.checked }))}
                />
                Auto-generate school email
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={teacherForm.is_school_it}
                  onChange={(e) => setTeacherForm((f) => ({ ...f, is_school_it: e.target.checked }))}
                />
                Grant School IT authority
              </label>
              {!teacherForm.auto_generate_email && (
                <input
                  className="admin-input"
                  placeholder={`Manual email (must end with @${school?.email_domain || 'school.edu'})`}
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm((f) => ({ ...f, email: e.target.value }))}
                />
              )}
              <button type="button" className="btn btn-primary" onClick={createTeacherProvision} disabled={provisionLoading}>
                {provisionLoading ? 'Creating...' : 'Create Teacher'}
              </button>
            </div>
          </section>

          {data.pending_teachers && data.pending_teachers.length > 0 && (
            <section className="school-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h2>⏳ Pending Teacher Approvals ({data.pending_teachers.length})</h2>
              <p style={{ color: '#92400e', fontSize: '0.875rem', marginBottom: 12 }}>
                These teachers signed up with the school code and are waiting for your approval.
              </p>
              {provisionMsg && <p style={{ color: '#16a34a' }}>{provisionMsg}</p>}
              {provisionError && <p style={{ color: '#dc2626' }}>{provisionError}</p>}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Signed Up</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pending_teachers.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>{t.email}</td>
                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                            disabled={approvingId === t.id}
                            onClick={() => approveTeacher(t, true)}
                          >
                            {approvingId === t.id ? '...' : '✅ Approve'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#dc2626', borderColor: '#dc2626' }}
                            disabled={approvingId === t.id}
                            onClick={() => approveTeacher(t, false)}
                          >
                            {approvingId === t.id ? '...' : '❌ Reject'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="school-card">
            <h2>Teachers Activity</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Classes</th>
                    <th>Notes</th>
                    <th>Homework</th>
                    <th>Quizzes</th>
                    <th>CAT Sheets</th>
                    <th>School IT</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teachers.length === 0 && (
                    <tr><td colSpan={9}>No teachers found.</td></tr>
                  )}
                  {data.teachers.map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.email}</td>
                      <td>{t.classes_count}</td>
                      <td>{t.notes_count}</td>
                      <td>{t.homework_count}</td>
                      <td>{t.quizzes_count}</td>
                      <td>{t.cat_sheets_count}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => toggleSchoolIT(t)}
                          disabled={delegatingId === t.id}
                        >
                          {delegatingId === t.id ? 'Saving...' : t.is_school_it ? 'Revoke School IT' : 'Grant School IT'}
                        </button>
                      </td>
                      <td>
                        {t.is_suspended ? 'Suspended' : t.is_approved ? 'Active' : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="school-card">
            <h2>Class-by-Class Academic Board</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Students</th>
                    <th>Notes</th>
                    <th>Homework</th>
                    <th>Quizzes</th>
                    <th>CAT Sheets</th>
                    <th>CAT Avg %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.classes.length === 0 && (
                    <tr><td colSpan={8}>No classes found.</td></tr>
                  )}
                  {data.classes.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.teacher_name}</td>
                      <td>{c.students_count}</td>
                      <td>{c.notes_count}</td>
                      <td>{c.homework_count}</td>
                      <td>{c.quizzes_count}</td>
                      <td>{c.cat_sheets_count}</td>
                      <td>{c.cat_avg_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
