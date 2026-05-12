import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import '../pages/Dashboard.css';

export default function RecordCatMarks() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recordForm, setRecordForm] = useState({ test_number: 1, student_id: '', marks_obtained: '' });
  const [quizzes, setQuizzes] = useState([]);
  const [migrateQuiz, setMigrateQuiz] = useState({ quiz_id: '', test_number: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/classes/${id}/cat-marks/stats`, token).then(setStats),
      api.get(`/classes/${id}/quizzes`, token).then(setQuizzes),
    ])
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleRecordMark = async (e) => {
    e.preventDefault();
    if (!recordForm.student_id || !recordForm.marks_obtained || recordForm.marks_obtained < 0 || recordForm.marks_obtained > 100) {
      return setError('Valid student, test number, and marks (0-100) required.');
    }
    setSaving(true);
    try {
      await api.post(`/classes/${id}/cat-marks/mark`, {
        student_id: parseInt(recordForm.student_id),
        test_number: parseInt(recordForm.test_number),
        marks_obtained: parseInt(recordForm.marks_obtained),
        total_marks: 100,
      }, token);
      setRecordForm({ test_number: recordForm.test_number, student_id: '', marks_obtained: '' });
      setError('');
      api.get(`/classes/${id}/cat-marks/stats`, token).then(setStats);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMigrateQuiz = async (e) => {
    e.preventDefault();
    if (!migrateQuiz.quiz_id || !migrateQuiz.test_number) {
      return setError('Select a quiz and test number.');
    }
    setSaving(true);
    try {
      const res = await api.post(`/classes/${id}/cat-marks/migrate-quiz`, {
        quiz_id: parseInt(migrateQuiz.quiz_id),
        test_number: parseInt(migrateQuiz.test_number),
      }, token);
      setMigrateQuiz({ quiz_id: '', test_number: '' });
      setError('');
      api.get(`/classes/${id}/cat-marks/stats`, token).then(setStats);
      alert(`✅ Migrated ${res.migrated} quiz scores to CAT marks.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="class-page">
      <header className="dash-header">
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div className="dash-brand">📊 Record CAT Marks</div>
      </header>
      <main className="class-main">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Migrate from Quiz */}
        <div style={{ background: 'white', padding: '20px', borderRadius: 10, marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>📈 Migrate Quiz Marks to CAT</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>Automatically convert best quiz scores to CAT marks for a test number.</p>
          <form onSubmit={handleMigrateQuiz} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select 
              value={migrateQuiz.quiz_id} 
              onChange={e => setMigrateQuiz({ ...migrateQuiz, quiz_id: e.target.value })}
              style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14 }}
            >
              <option value="">Select Quiz...</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
            <input 
              type="number" 
              min="1" 
              max="10"
              value={migrateQuiz.test_number}
              onChange={e => setMigrateQuiz({ ...migrateQuiz, test_number: e.target.value })}
              placeholder="Test #"
              style={{ width: 100, padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14 }}
            />
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Migrating...' : '🔄 Migrate'}
            </button>
          </form>
        </div>

        {/* Record Individual Mark */}
        <div style={{ background: 'white', padding: '20px', borderRadius: 10, marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>✏️ Record Mark</h2>
          <form onSubmit={handleRecordMark} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label style={{ fontSize: 13 }}>Test Number *</label>
              <input 
                type="number" 
                min="1" 
                max="10"
                value={recordForm.test_number}
                onChange={e => setRecordForm({ ...recordForm, test_number: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14 }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 13 }}>Student *</label>
              <select 
                value={recordForm.student_id}
                onChange={e => setRecordForm({ ...recordForm, student_id: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14 }}
              >
                <option value="">Select...</option>
                {stats?.students.map(s => (
                  <option key={s.student_id} value={s.student_id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: 13 }}>Marks (0-100) *</label>
              <input 
                type="number" 
                min="0" 
                max="100"
                value={recordForm.marks_obtained}
                onChange={e => setRecordForm({ ...recordForm, marks_obtained: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-end' }}>
              {saving ? 'Saving...' : '💾 Record'}
            </button>
          </form>
        </div>

        {/* Stats Table */}
        <div style={{ background: 'white', padding: '20px', borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>📋 Class CAT Summary</h2>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>Loading...</p>
          ) : !stats || stats.students.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>No marks recorded yet.</p>
          ) : (
            <>
              <div style={{ marginBottom: 20, padding: '16px 20px', background: '#f0f4ff', borderRadius: 10, border: '2px solid #2563eb' }}>
                <strong style={{ fontSize: 16, color: '#2563eb' }}>Class Average: {stats.class_average}%</strong>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e8e8e8', background: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Student Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Tests Done</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Total Marks</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Percentage</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Avg %</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.students.map((s, i) => (
                    <tr key={s.student_id} style={{ borderBottom: '1px solid #e8e8e8', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '12px 16px' }}>{s.name}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{s.test_count}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{s.total_marks}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <strong style={{ color: s.percentage >= 70 ? '#10b981' : s.percentage >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {s.percentage}%
                        </strong>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{s.avg_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
