import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { downloadCatSheetWord } from '../utils/downloadResult';
import './Dashboard.css';

const SUBJECTS = [
  'English',
  'Kinyarwanda',
  'Mathematics',
  'Social and Religious Studies',
  'SET',
];

function toInputValue(v) {
  return v == null ? '' : String(v);
}

export default function RecordCatMarks() {
  const { token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/classes/cat/classes', token)
      .then(setClasses)
      .catch((e) => setError(e.message));
  }, [token]);

  const recalcRow = (cats) => {
    const cleanCats = cats.map((v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return null;
      if (n < 0) return 0;
      if (n > 10) return 10;
      return Math.round(n * 100) / 100;
    });
    const total = cleanCats.reduce((sum, v) => sum + (v == null ? 0 : v), 0);
    const percentage = (total / 100) * 100;
    return {
      cats: cleanCats,
      total: Math.round(total * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  };

  const loadSheet = async () => {
    if (!classId || !subject) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/classes/cat/${classId}/sheet?subject=${encodeURIComponent(subject)}`, token);
      setMeta(res.meta || null);
      setLessonTitle(res.sheet?.lesson_title || '');
      setLessonTopic(res.sheet?.lesson_topic || '');
      setRows((res.rows || []).map((r) => {
        const cats = Array.isArray(r.cats) ? r.cats.slice(0, 10) : [];
        while (cats.length < 10) cats.push(null);
        return { ...r, cats, total: r.total ?? 0, percentage: r.percentage ?? 0 };
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!classId || !subject) {
      setRows([]);
      return;
    }
    loadSheet();
  }, [classId, subject]);

  const selectedClassName = useMemo(() => {
    const cls = classes.find((c) => String(c.id) === String(classId));
    return cls?.name || '';
  }, [classes, classId]);

  const updateCat = (idx, catIndex, raw) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const cats = [...r.cats];
      cats[catIndex] = raw;
      const rec = recalcRow(cats);
      return { ...r, ...rec };
    }));
  };

  const save = async () => {
    if (!classId || !subject) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/classes/cat/${classId}/sheet`, {
        subject,
        lesson_title: lessonTitle,
        lesson_topic: lessonTopic,
        marks: rows.map((r) => ({
          student_id: r.student_id,
          cats: r.cats,
        })),
      }, token);
      await loadSheet();
      setSuccess('CAT marks saved successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    if (!rows.length) return;
    const fileTag = `${selectedClassName || 'class'}_${subject || 'subject'}_CAT`;
    downloadCatSheetWord(fileTag.replace(/\s+/g, '_'), {
      school_name: meta?.school_name || '',
      teacher_name: meta?.teacher_name || '',
      class_name: meta?.class_name || selectedClassName,
      class_subject: meta?.class_subject || '',
      subject,
      lesson_title: lessonTitle,
      lesson_topic: lessonTopic,
      rows,
    });
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎓 UClass</div>
        <Link to="/teacher/dashboard" className="btn btn-outline btn-sm">← Back</Link>
      </header>

      <main className="dash-main">
        <div className="dash-top" style={{ marginBottom: 16 }}>
          <div>
            <h1>Record students quizzes marks</h1>
            <p className="dash-sub">CAT (Continuous Assessment during Term)</p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Choose Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name} ({cls.class_code})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Choose Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">-- Select Subject --</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Lesson Title</label>
              <input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. Fractions CAT" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Lesson Topic</label>
              <input value={lessonTopic} onChange={(e) => setLessonTopic(e.target.value)} placeholder="e.g. Adding fractions" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={save} disabled={!classId || !subject || saving || loading}>
              {saving ? 'Saving...' : 'Save CAT Marks'}
            </button>
            <button className="btn btn-secondary" onClick={loadSheet} disabled={!classId || !subject || loading}>
              {loading ? 'Loading...' : 'View marks of students'}
            </button>
            <button className="btn btn-secondary" onClick={download} disabled={!rows.length}>⬇ Download marks</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!!rows.length && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
            <table className="students-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  {Array.from({ length: 10 }, (_, i) => <th key={i}>Quiz {i + 1}</th>)}
                  <th>Total</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.student_id}>
                    <td>{r.number || idx + 1}</td>
                    <td style={{ minWidth: 180, fontWeight: 600 }}>{r.student_name}</td>
                    {Array.from({ length: 10 }, (_, c) => (
                      <td key={c}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={toInputValue(r.cats[c])}
                          onChange={(e) => updateCat(idx, c, e.target.value)}
                          style={{ width: 70, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 8 }}
                        />
                      </td>
                    ))}
                    <td style={{ fontWeight: 700 }}>{r.total ?? 0}</td>
                    <td style={{ fontWeight: 700 }}>{r.percentage ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
