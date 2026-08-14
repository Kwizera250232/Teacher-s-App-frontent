import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import '../pages/Dashboard.css';

const CAT_NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SUBJECTS = [
  'English', 'Mathematics', 'Kinyarwanda', 'French', 'Science and Elementary Technology (SET)',
  'Social and Religious Studies (SST)', 'Creative Arts', 'Physical Education and Sports (PES)',
  'ICT', 'Entrepreneurship', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History',
  'Economics', 'Accounting', 'Literature in English', 'Kinyarwanda Literature', 'Religious Education',
  'General Studies', 'Other',
];

export default function RecordCatMarks({ embeddedClassId, embeddedToken }) {
  const { id: routeClassId } = useParams();
  const auth = useAuth();
  const token = embeddedToken || auth?.token;
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(routeClassId || embeddedClassId || '');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recordForm, setRecordForm] = useState({ test_number: 1, student_id: '', marks_obtained: '', total_marks: '' });
  const [quizzes, setQuizzes] = useState([]);
  const [migrateQuiz, setMigrateQuiz] = useState({ quiz_id: '', test_number: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [showMigrate, setShowMigrate] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const location = useLocation();
  const basePath = location.pathname.startsWith('/head-teacher') ? '/head-teacher' : '/teacher';
  const isEmbedded = Boolean(embeddedClassId);

  useEffect(() => {
    if (isEmbedded) return;
    api.get('/classes', token).then((list) => {
      setClasses(list);
      if (!classId && list.length > 0) setClassId(String(routeClassId || list[0].id));
    }).catch((e) => setError(e.message));
  }, [token, isEmbedded]);

  const loadData = () => {
    if (!classId) return;
    setLoading(true);
    const overviewUrl = selectedSubject
      ? `/catmarks/${classId}/overview?subject=${encodeURIComponent(selectedSubject)}`
      : `/catmarks/${classId}/overview`;
    Promise.all([
      api.get(overviewUrl, token).then(setStats),
      api.get(`/classes/${classId}/quizzes`, token).then(setQuizzes),
    ]).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [classId, token, selectedSubject]);

  const handleClassChange = (nextId) => {
    setClassId(nextId);
    setRecordForm({ test_number: 1, student_id: '', marks_obtained: '' });
    if (!isEmbedded) navigate(`${basePath}/classes/${nextId}/record-marks`, { replace: true });
  };

  const saveCellMark = async (studentId, testNumber, marksRaw) => {
    if (marksRaw === '' || marksRaw === '—') { setEditing(null); return; }
    const marks = parseInt(marksRaw, 10);
    const catTotal = stats?.cat_totals?.[testNumber] || 100;
    if (Number.isNaN(marks) || marks < 0 || marks > catTotal) {
      setError(`Marks must be 0–${catTotal}.`);
      return;
    }
    setSaving(true);
    try {
      await api.post(`/catmarks/${classId}/entry`, {
        student_id: studentId,
        test_number: testNumber,
        marks_obtained: marks,
        total_marks: catTotal,
        subject: selectedSubject || 'General',
      }, token);
      setEditing(null);
      setError('');
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteMark = async (studentId, testNumber) => {
    if (!window.confirm('Delete this mark?')) return;
    try {
      const subjParam = selectedSubject ? `?subject=${encodeURIComponent(selectedSubject)}` : '';
      await api.delete(`/catmarks/${classId}/entry/${studentId}/${testNumber}${subjParam}`, token);
      loadData();
    } catch (err) { setError(err.message); }
  };

  const roster = stats?.students || [];
  const filteredRoster = useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.toLowerCase();
    return roster.filter(s => s.name?.toLowerCase().includes(q));
  }, [roster, search]);

  const n = roster.length || 1;
  const classTotals = roster.reduce(
    (acc, s) => {
      acc.totalMarks += s.total_marks || 0;
      acc.pctSum += s.percentage || 0;
      acc.avgSum += s.avg_percentage || 0;
      return acc;
    },
    { totalMarks: 0, pctSum: 0, avgSum: 0 }
  );

  const catAverages = useMemo(() => {
    const sums = {};
    const counts = {};
    for (const s of roster) {
      for (const num of CAT_NUMS) {
        const val = s.cat?.[num];
        if (val != null) {
          sums[num] = (sums[num] || 0) + val;
          counts[num] = (counts[num] || 0) + 1;
        }
      }
    }
    return CAT_NUMS.map(num => counts[num] ? Math.round((sums[num] / counts[num]) * 10) / 10 : null);
  }, [roster]);

  const exportCSV = () => {
    const headers = ['Student', ...CAT_NUMS.map(n => `CAT ${n}`), 'Total', '%', 'Avg %'];
    const rows = roster.map(s => [
      `"${s.name}"`,
      ...CAT_NUMS.map(n => s.cat?.[n] ?? ''),
      s.total_marks,
      s.percentage,
      s.avg_percentage,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const subjSlug = selectedSubject ? `-${selectedSubject.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    a.download = `class-${classId}${subjSlug}-marks.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Wrapper = isEmbedded ? 'div' : 'section';
  const wrapperProps = isEmbedded ? {} : { className: 'class-page' };

  return (
    <Wrapper {...wrapperProps}>
      {!isEmbedded && (
        <header className="dash-header">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>Back</button>
          <span className="dash-brand">📊 Marks Sheet</span>
        </header>
      )}
      <main className={isEmbedded ? '' : 'class-main'}>
        {error && <p className="alert alert-error">{error}</p>}

        {/* Action bar */}
        <section className="cat-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {!isEmbedded && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
                Class
                <select value={classId} onChange={(e) => handleClassChange(e.target.value)}>
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            {/* Subject selector — pick subject before adding marks */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Subject
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{ borderColor: selectedSubject ? '#7c3aed' : '#e8e8e8', color: selectedSubject ? '#5b21b6' : '#1e293b' }}
              >
                <option value="">All subjects (mixed)</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                {stats?.subjects?.filter(s => !SUBJECTS.includes(s) && s !== 'General').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <input
              type="text"
              placeholder="🔍 Search student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14, minWidth: 180 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRecord(v => !v)}>
              ✏️ Record Mark
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMigrate(v => !v)}>
              📋 From Quiz
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportCSV} disabled={roster.length === 0}>
              ⬇️ Export CSV
            </button>
          </div>
        </section>

        {/* Subject banner — shows which subject is active */}
        {selectedSubject && (
          <div style={{
            background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            border: '1.5px solid #c4b5fd', borderRadius: 10,
            padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#5b21b6' }}>
              📚 Showing marks for: <span style={{ fontSize: 16 }}>{selectedSubject}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontSize: 11, padding: '3px 10px', color: '#7c3aed', borderColor: '#c4b5fd' }}
              onClick={() => setSelectedSubject('')}
            >
              Show all subjects
            </button>
          </div>
        )}

        {/* Migrate quiz to CAT */}
        {showMigrate && (
          <section className="cat-panel">
            <h2>Migrate quiz scores to CAT{selectedSubject && <span style={{ color: '#7c3aed', fontSize: 14 }}> — {selectedSubject}</span>}</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>Quiz scores will be imported with their original total marks (e.g., 25/30).</p>
            <form className="cat-form-row" onSubmit={async (e) => {
              e.preventDefault();
              if (!migrateQuiz.quiz_id || !migrateQuiz.test_number) return setError('Select quiz and CAT number.');
              setSaving(true);
              try {
                const res = await api.post(`/catmarks/${classId}/fromquiz`, {
                  quiz_id: parseInt(migrateQuiz.quiz_id, 10),
                  test_number: parseInt(migrateQuiz.test_number, 10),
                  subject: selectedSubject || 'General',
                }, token);
                setMigrateQuiz({ quiz_id: '', test_number: '' });
                setShowMigrate(false);
                setError('');
                loadData();
                alert(`Migrated ${res.migrated} scores.`);
              } catch (err) { setError(err.message); } finally { setSaving(false); }
            }}>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={migrateQuiz.quiz_id} onChange={(e) => setMigrateQuiz({ ...migrateQuiz, quiz_id: e.target.value })}>
                <option value="">Select quiz</option>
                {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
              </select>
              <input type="number" min="1" max="10" placeholder="CAT #" value={migrateQuiz.test_number} onChange={(e) => setMigrateQuiz({ ...migrateQuiz, test_number: e.target.value })} />
              <button type="submit" className="btn btn-primary" disabled={saving}>Migrate</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowMigrate(false)}>Cancel</button>
            </form>
          </section>
        )}

        {/* Record mark form */}
        {showRecord && (
          <section className="cat-panel">
            <h2>Record mark{selectedSubject && <span style={{ color: '#7c3aed', fontSize: 14 }}> — {selectedSubject}</span>}</h2>
            <form className="cat-form-grid" onSubmit={async (e) => {
              e.preventDefault();
              if (!recordForm.student_id || recordForm.marks_obtained === '') return setError('Select student and marks.');
              const totalMarks = parseInt(recordForm.total_marks, 10) || stats?.cat_totals?.[parseInt(recordForm.test_number, 10)] || 100;
              setSaving(true);
              try {
                await api.post(`/catmarks/${classId}/entry`, {
                  student_id: parseInt(recordForm.student_id, 10),
                  test_number: parseInt(recordForm.test_number, 10),
                  marks_obtained: parseInt(recordForm.marks_obtained, 10),
                  total_marks: totalMarks,
                  subject: selectedSubject || 'General',
                }, token);
                setRecordForm({ ...recordForm, student_id: '', marks_obtained: '', total_marks: '' });
                setShowRecord(false);
                setError('');
                loadData();
              } catch (err) { setError(err.message); } finally { setSaving(false); }
            }}>
              <label>Student<select value={recordForm.student_id} onChange={(e) => setRecordForm({ ...recordForm, student_id: e.target.value })}>
                <option value="">Select student</option>
                {roster.map((s) => <option key={s.student_id} value={s.student_id}>{s.name}</option>)}
              </select></label>
              <label>Subject
                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>CAT #<input type="number" min="1" max="10" value={recordForm.test_number} onChange={(e) => setRecordForm({ ...recordForm, test_number: e.target.value })} /></label>
              <label>Out of (total)<input type="number" min="1" placeholder={stats?.cat_totals?.[parseInt(recordForm.test_number, 10)] || '100'} value={recordForm.total_marks} onChange={(e) => setRecordForm({ ...recordForm, total_marks: e.target.value })} /></label>
              <label>Marks<input type="number" min="0" max={parseInt(recordForm.total_marks, 10) || stats?.cat_totals?.[parseInt(recordForm.test_number, 10)] || 100} value={recordForm.marks_obtained} onChange={(e) => setRecordForm({ ...recordForm, marks_obtained: e.target.value })} /></label>
              <button type="submit" className="btn btn-primary" disabled={saving}>Record</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRecord(false)}>Cancel</button>
            </form>
          </section>
        )}

        {/* Marks table */}
        <section className="cat-panel cat-table-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0 }}>
              Marks Sheet (CAT 1–10)
              {selectedSubject && <span style={{ color: '#7c3aed', fontSize: 14, marginLeft: 8 }}>— {selectedSubject}</span>}
            </h2>
            {stats && (
              <span className="cat-class-avg" style={{ margin: 0 }}>
                <strong>Class average:</strong> {stats?.class_average ?? 0}%
              </span>
            )}
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : roster.length === 0 ? (
            <p>No students in this class.</p>
          ) : filteredRoster.length === 0 ? (
            <p>No students match "{search}".</p>
          ) : (
            <table className="cat-marks-table">
              <thead>
                <tr>
                  <th>Student</th>
                  {CAT_NUMS.map((num) => {
                    const catTotal = stats?.cat_totals?.[num];
                    return <th key={num}>CAT {num}{catTotal ? <span style={{ fontSize: 10, color: '#94a3b8', display: 'block', fontWeight: 400 }}>/{catTotal}</span> : null}</th>;
                  })}
                  <th>Total</th>
                  <th>%</th>
                  <th>Avg %</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((s) => (
                  <tr key={s.student_id}>
                    <td className="cat-name">{s.name}</td>
                    {CAT_NUMS.map((num) => {
                      const val = s.cat?.[num];
                      const isEdit = editing?.studentId === s.student_id && editing?.num === num;
                      return (
                        <td
                          key={num}
                          className={!isEdit ? 'cat-cell-clickable' : ''}
                          style={{ position: 'relative' }}
                          title="Click to edit, right-click to delete"
                          onClick={() => !isEdit && setEditing({ studentId: s.student_id, num, value: val != null ? String(val) : '' })}
                          onContextMenu={(e) => { e.preventDefault(); if (val != null) deleteMark(s.student_id, num); }}
                        >
                          {isEdit ? (
                            <input
                              className="cat-cell-input"
                              type="number"
                              min={0}
                              max={stats?.cat_totals?.[num] || 100}
                              autoFocus
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              onBlur={() => saveCellMark(s.student_id, num, editing.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveCellMark(s.student_id, num, editing.value);
                                if (e.key === 'Escape') setEditing(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            val != null ? val : '—'
                          )}
                        </td>
                      );
                    })}
                    <td className="cat-total">{s.total_marks}{(() => {
                      // Calculate sum of all CAT totals for this student
                      let sumTotal = 0;
                      for (const n of CAT_NUMS) { if (s.cat?.[n] != null) sumTotal += (stats?.cat_totals?.[n] || 100); }
                      return sumTotal > 0 ? <span style={{ fontSize: 10, color: '#94a3b8' }}>/{sumTotal}</span> : null;
                    })()}</td>
                    <td className="cat-pct">{s.percentage}%</td>
                    <td>{s.avg_percentage}%</td>
                  </tr>
                ))}
                <tr className="cat-avg-row">
                  <td>Class average</td>
                  {catAverages.map((avg, i) => <td key={i}>{avg != null ? avg : '—'}</td>)}
                  <td>{Math.round(classTotals.totalMarks / n)}</td>
                  <td>{Math.round((classTotals.pctSum / n) * 10) / 10}%</td>
                  <td>{Math.round((classTotals.avgSum / n) * 10) / 10}%</td>
                </tr>
              </tbody>
            </table>
          )}
          {!loading && roster.length > 0 && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
              💡 Select a subject first to keep marks organized. Click a cell to edit. Right-click to delete. Use "From Quiz" to import quiz scores.
            </p>
          )}
        </section>
      </main>
    </Wrapper>
  );
}
