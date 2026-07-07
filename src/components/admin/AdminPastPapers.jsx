import { useState, useEffect } from 'react';
import { api } from '../../api';

const EDUCATION_LEVELS = [
  { value: 'primary', label: 'Primary', icon: '📘' },
  { value: 'secondary', label: 'Secondary', icon: '📗' },
];
const PRIMARY_GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
const SECONDARY_GRADES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

const SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Kinyarwanda', 'French', 'Entrepreneurship', 'Computer Science', 'Economics', 'Religious Education', 'General Studies'];

const EMPTY_QUESTION = { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', explanation: '' };

export default function AdminPastPapers({ token }) {
  const [view, setView] = useState('list');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewExam, setViewExam] = useState(null);
  const [viewAttempts, setViewAttempts] = useState(null);

  // Create form state
  const [form, setForm] = useState({
    title: '', subject: 'English', year: new Date().getFullYear(), education_level: 'secondary', grade: 'S3',
    description: '', duration_minutes: 120,
  });
  const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION }]);
  const [saving, setSaving] = useState(false);

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await api.get('/past-papers/admin/exams', token);
      setExams(data.exams || []);
    } catch (e) {
      setError(e.message || 'Failed to load exams.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.get('/past-papers/admin/stats', token);
      setStats(data);
    } catch (e) {}
  };

  useEffect(() => {
    loadExams();
    loadStats();
  }, [token]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.subject.trim() || !form.year || !form.grade) {
      setError('Title, subject, year, and grade are required.');
      return;
    }
    const validQuestions = questions.filter(q => q.question.trim() && q.option_a.trim() && q.option_b.trim() && q.correct_answer);
    if (validQuestions.length === 0) {
      setError('At least one valid question is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/past-papers/admin/exams', {
        ...form,
        year: parseInt(form.year),
        duration_minutes: parseInt(form.duration_minutes) || 120,
        questions: validQuestions,
      }, token);
      setShowCreate(false);
      setForm({ title: '', subject: 'English', year: new Date().getFullYear(), education_level: 'secondary', grade: 'S3', description: '', duration_minutes: 120 });
      setQuestions([{ ...EMPTY_QUESTION }]);
      loadExams();
      loadStats();
    } catch (e) {
      setError(e.message || 'Failed to create exam.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam and all its questions? This cannot be undone.')) return;
    try {
      await api.delete(`/past-papers/admin/exams/${id}`, token);
      loadExams();
      loadStats();
    } catch (e) {
      setError(e.message || 'Failed to delete exam.');
    }
  };

  const handleViewExam = async (id) => {
    try {
      const data = await api.get(`/past-papers/admin/exams/${id}`, token);
      setViewExam(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleViewAttempts = async (id) => {
    try {
      const data = await api.get(`/past-papers/admin/exams/${id}/attempts`, token);
      setViewAttempts(data.attempts);
    } catch (e) {
      setError(e.message);
    }
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, { ...EMPTY_QUESTION }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 24px', minWidth: 140 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>{stats.total_exams || 0}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Total Exams</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 24px', minWidth: 140 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{stats.total_attempts || 0}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Total Attempts</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Past Paper Exams</h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          + Create Exam
        </button>
      </div>

      {/* Exam List */}
      {loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <p>No past paper exams yet. Click "Create Exam" to add one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {exams.map(exam => (
            <div key={exam.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>{exam.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {exam.subject} · {exam.year} {exam.class_level ? `· ${exam.class_level}` : ''} · {exam.question_count} questions · {exam.attempt_count} attempts
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Created by {exam.creator_name}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleViewExam(exam.id)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>View</button>
                <button onClick={() => handleViewAttempts(exam.id)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#10b981', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Attempts</button>
                <button onClick={() => handleDelete(exam.id)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '20px 0' }} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 800, width: '90%', padding: 24, margin: '20px 0' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700 }}>Create Past Paper Exam</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. O-Level English Paper 2" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Subject *</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Year *</label>
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} min="2000" max="2030" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Class Level</label>
                <input type="text" value={form.class_level} onChange={e => setForm({ ...form, class_level: e.target.value })} placeholder="e.g. O-Level, A-Level" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Duration (minutes)</label>
                <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 8px' }}>Questions</h3>
            {questions.map((q, idx) => (
              <div key={idx} style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#6366f1' }}>Question {idx + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(idx)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>
                  )}
                </div>
                <textarea value={q.question} onChange={e => updateQuestion(idx, 'question', e.target.value)} placeholder="Enter the question..." rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, marginBottom: 8, resize: 'vertical' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name={`correct-${idx}`} checked={q.correct_answer === 'a'} onChange={() => updateQuestion(idx, 'correct_answer', 'a')} />
                      <input type="text" value={q.option_a} onChange={e => updateQuestion(idx, 'option_a', e.target.value)} placeholder="Option A" style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name={`correct-${idx}`} checked={q.correct_answer === 'b'} onChange={() => updateQuestion(idx, 'correct_answer', 'b')} />
                      <input type="text" value={q.option_b} onChange={e => updateQuestion(idx, 'option_b', e.target.value)} placeholder="Option B" style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name={`correct-${idx}`} checked={q.correct_answer === 'c'} onChange={() => updateQuestion(idx, 'correct_answer', 'c')} />
                      <input type="text" value={q.option_c} onChange={e => updateQuestion(idx, 'option_c', e.target.value)} placeholder="Option C (optional)" style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name={`correct-${idx}`} checked={q.correct_answer === 'd'} onChange={() => updateQuestion(idx, 'correct_answer', 'd')} />
                      <input type="text" value={q.option_d} onChange={e => updateQuestion(idx, 'option_d', e.target.value)} placeholder="Option D (optional)" style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }} />
                    </div>
                  </div>
                </div>
                <input type="text" value={q.explanation} onChange={e => updateQuestion(idx, 'explanation', e.target.value)} placeholder="Explanation (optional)" style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }} />
              </div>
            ))}
            <button onClick={addQuestion} style={{ padding: '8px 16px', borderRadius: 8, border: '1px dashed #6366f1', background: 'transparent', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>+ Add Question</button>

            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Create Exam'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Exam Modal */}
      {viewExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '20px 0' }} onClick={e => e.target === e.currentTarget && setViewExam(null)}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 700, width: '90%', padding: 24, margin: '20px 0' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>{viewExam.exam.title}</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{viewExam.exam.subject} · {viewExam.exam.year} · {viewExam.questions.length} questions</p>
            {viewExam.questions.map((q, i) => (
              <div key={q.id} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Q{i + 1}. {q.question}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>
                  <div style={{ color: q.correct_answer === 'a' ? '#059669' : '#64748b', fontWeight: q.correct_answer === 'a' ? 700 : 400 }}>A. {q.option_a}</div>
                  <div style={{ color: q.correct_answer === 'b' ? '#059669' : '#64748b', fontWeight: q.correct_answer === 'b' ? 700 : 400 }}>B. {q.option_b}</div>
                  {q.option_c && <div style={{ color: q.correct_answer === 'c' ? '#059669' : '#64748b', fontWeight: q.correct_answer === 'c' ? 700 : 400 }}>C. {q.option_c}</div>}
                  {q.option_d && <div style={{ color: q.correct_answer === 'd' ? '#059669' : '#64748b', fontWeight: q.correct_answer === 'd' ? 700 : 400 }}>D. {q.option_d}</div>}
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button onClick={() => setViewExam(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Attempts Modal */}
      {viewAttempts && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '20px 0' }} onClick={e => e.target === e.currentTarget && setViewAttempts(null)}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 700, width: '90%', padding: 24, margin: '20px 0' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Student Attempts</h2>
            {viewAttempts.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No attempts yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewAttempts.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.student_name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(a.completed_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: a.percentage >= 50 ? '#059669' : '#dc2626' }}>{a.score}/{a.total} ({a.percentage}%)</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.time_taken_seconds ? `${Math.floor(a.time_taken_seconds / 60)}m ${a.time_taken_seconds % 60}s` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button onClick={() => setViewAttempts(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
