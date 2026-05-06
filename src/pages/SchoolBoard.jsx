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
  const { user, token } = useAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError('');
        if (isAdmin) {
          const schoolRows = await api.get('/admin/schools', token);
          if (!active) return;
          setSchools(schoolRows || []);
          if (!schoolRows?.length) {
            setLoading(false);
            setError('No schools found. Create at least one school first.');
            return;
          }
          const firstSchoolId = String(schoolRows[0].id);
          setSelectedSchoolId(firstSchoolId);
          const board = await api.get(`/admin/my-school-board?school_id=${firstSchoolId}`, token);
          if (!active) return;
          setData(board);
          setLoading(false);
          return;
        }

        const board = await api.get('/admin/my-school-board', token);
        if (!active) return;
        setData(board);
        setLoading(false);
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
  }, [isAdmin, token]);

  const onSchoolChange = async (nextId) => {
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

  return (
    <div className="school-board-page">
      <header className="school-board-header">
        <div>
          <p className="eyebrow">School Dashboard</p>
          <h1>{school?.name || 'School Board'}</h1>
          <p className="muted">Manage teachers, class work, notes, homework, quizzes, and CAT marks in one board.</p>
        </div>
        <div className="school-board-actions">
          <Link to={isAdmin ? '/admin' : '/teacher/dashboard'} className="btn btn-outline">Back</Link>
          {isAdmin && (
            <select value={selectedSchoolId} onChange={(e) => onSchoolChange(e.target.value)}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {loading && <div className="school-card">Loading school analytics...</div>}
      {error && <div className="school-card error">{error}</div>}

      {!loading && !error && data && (
        <>
          <section className="school-stats-grid">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section className="school-card split">
            <div>
              <h2>School Details</h2>
              <p><strong>Location:</strong> {school?.location || 'Not set'}</p>
              <p><strong>Head Teacher Code:</strong> {school?.code || 'Not configured'}</p>
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
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teachers.length === 0 && (
                    <tr><td colSpan={8}>No teachers found.</td></tr>
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
