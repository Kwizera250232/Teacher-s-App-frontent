import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniPastPapers() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [locked, setLocked] = useState(null); // { class_name, class_id, amount_rwf } when premium required
  const [phase, setPhase] = useState('browse'); // browse | exam | results
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [activeSubject, setActiveSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Exam state
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  // Results state
  const [result, setResult] = useState(null);

  // Document papers (uploaded docs — view or take as AI quiz)
  const [docPapers, setDocPapers] = useState([]);
  const [docLevel, setDocLevel] = useState('all'); // all | primary | secondary
  const [docQuiz, setDocQuiz] = useState(null); // { paper, questions }
  const [docAnswers, setDocAnswers] = useState({});
  const [docIdx, setDocIdx] = useState(0);
  const [docGenerating, setDocGenerating] = useState(null); // paper id

  // Load access + years on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const a = await api.get('/past-papers/access', token).catch(() => ({ premium_required: false }));
        if (!alive) return;
        if (a?.premium_required) { setLocked(a.classes?.[0] || {}); setLoading(false); return; }
        const data = await api.get('/past-papers/years', token);
        if (!alive) return;
        setYears(data.years || []);
        if (data.years?.length > 0) setActiveYear(String(data.years[0]));
        api.get('/alumni/past-papers', token)
          .then(d => { if (alive) setDocPapers(d.papers || []); })
          .catch(() => {});
      } catch {} finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  // Load subjects when year changes
  useEffect(() => {
    if (!activeYear) return;
    setSubjects([]);
    setActiveSubject('');
    api.get(`/past-papers/subjects/${activeYear}`, token)
      .then(data => setSubjects(data.subjects || []))
      .catch(() => {});
  }, [activeYear, token]);

  // Load exams when year + subject selected
  useEffect(() => {
    if (!activeYear || !activeSubject) { setExams([]); return; }
    api.get(`/past-papers/exams/${activeYear}/${activeSubject}`, token)
      .then(data => setExams(data.exams || []))
      .catch(() => setExams([]));
  }, [activeYear, activeSubject, token]);

  // Timer
  useEffect(() => {
    if (phase !== 'exam' || !timeLeft) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [phase, timeLeft]);

  const startExam = async (examId) => {
    setError('');
    try {
      const data = await api.get(`/past-papers/exam/${examId}`, token);
      setExamData(data);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setTimeLeft((data.exam.duration_minutes || 120) * 60);
      setPhase('exam');
    } catch (e) {
      setError(e.message || 'Failed to load exam.');
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearTimeout(timerRef.current);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    try {
      const data = await api.post(`/past-papers/exam/${examData.exam.id}/submit`, {
        answers,
        time_taken_seconds: timeTaken,
      }, token);
      setResult(data);
      setPhase('results');
    } catch (e) {
      setError(e.message || 'Failed to submit exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Doc paper quiz (AI-generated from the uploaded document) ───────────────
  const startDocQuiz = async (paper) => {
    setError('');
    setDocGenerating(paper.id);
    try {
      const data = await api.post(`/alumni/past-papers/${paper.id}/generate-quiz`, {}, token);
      setDocQuiz({ paper, questions: data.questions });
      setDocAnswers({});
      setDocIdx(0);
    } catch (e) {
      setError(e.message || 'Could not generate the quiz for this paper.');
    } finally {
      setDocGenerating(null);
    }
  };

  const docScore = docQuiz
    ? docQuiz.questions.reduce((s, q, i) => s + (docAnswers[i] === q.correct_answer ? 1 : 0), 0)
    : 0;

  // ── DOC QUIZ PHASE (AI quiz generated from an uploaded paper) ─────────────
  if (docQuiz) {
    const { paper, questions } = docQuiz;
    const q = questions[docIdx];
    const answered = Object.keys(docAnswers).length;
    const finished = answered === questions.length;
    const pct = Math.round((docScore / questions.length) * 100);

    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <strong style={{ fontSize: 16 }}>{paper.title}</strong>
            <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 8 }}>{paper.subject} · {paper.year} · AI Quiz</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>{answered}/{questions.length} answered</span>
            <button onClick={() => setDocQuiz(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>✕ Exit</button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {questions.map((qq, i) => (
              <button key={i} onClick={() => setDocIdx(i)} style={{
                width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: i === docIdx ? '#6366f1' : docAnswers[i] ? '#dcfce7' : '#fff',
                color: i === docIdx ? '#fff' : docAnswers[i] ? '#166534' : '#64748b',
                border: '1px solid #e2e8f0',
              }}>{i + 1}</button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 700, marginBottom: 8 }}>Question {docIdx + 1} of {questions.length}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', lineHeight: 1.5 }}>{q.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['a', 'b', 'c', 'd'].filter(k => q[`option_${k}`]).map(k => {
                const chosen = docAnswers[docIdx] === k;
                return (
                  <button key={k} onClick={() => setDocAnswers({ ...docAnswers, [docIdx]: k })} style={{
                    padding: '14px 16px', borderRadius: 10, border: chosen ? '2px solid #6366f1' : '2px solid #e2e8f0',
                    background: chosen ? '#eef2ff' : '#fff', textAlign: 'left', cursor: 'pointer', fontSize: 15,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: chosen ? '#6366f1' : '#f1f5f9', color: chosen ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{k.toUpperCase()}</span>
                    <span>{q[`option_${k}`]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setDocIdx(Math.max(0, docIdx - 1))} disabled={docIdx === 0} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: docIdx === 0 ? 'default' : 'pointer', opacity: docIdx === 0 ? 0.5 : 1 }}>← Previous</button>
            {docIdx < questions.length - 1 ? (
              <button onClick={() => setDocIdx(docIdx + 1)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Next →</button>
            ) : (
              <div style={{ padding: '10px 20px', borderRadius: 10, background: finished ? '#059669' : '#e2e8f0', color: finished ? '#fff' : '#64748b', fontWeight: 700 }}>
                {finished ? `Score: ${docScore}/${questions.length} (${pct}%)` : `Answer all questions (${questions.length - answered} left)`}
              </div>
            )}
          </div>

          {/* Review — appears once every question is answered */}
          {finished && (
            <div style={{ marginTop: 28 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 48 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '✅' : '📚'}</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{pct}%</div>
                <div style={{ color: '#64748b' }}>{docScore} of {questions.length} correct</div>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>Review Answers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions.map((qq, i) => {
                  const ok = docAnswers[i] === qq.correct_answer;
                  return (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 14, border: `2px solid ${ok ? '#bbf7d0' : '#fecaca'}` }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{ok ? '✅' : '❌'} Q{i + 1}. {qq.question}</div>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: '#166534', fontWeight: 700 }}>Correct: {qq[`option_${qq.correct_answer}`]}</span>
                        {!ok && <span style={{ color: '#dc2626', marginLeft: 8 }}>You: {qq[`option_${docAnswers[i]}`] || '—'}</span>}
                      </div>
                      {qq.explanation && <div style={{ marginTop: 6, fontSize: 12, color: '#1e40af', background: '#eff6ff', padding: '6px 10px', borderRadius: 6 }}>💡 {qq.explanation}</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button onClick={() => setDocQuiz(null)} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Back to Past Papers</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS PHASE ──────────────────────────────────────────────────────────
  if (phase === 'results' && result) {
    const { score, total, percentage, grade, performance_level, ai_feedback, detailed } = result;
    return (
      <AlumniLayout showTopWriters={false}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 0' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{percentage >= 80 ? '🏆' : percentage >= 50 ? '✅' : '📚'}</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800 }}>{percentage}%</h2>
            <p style={{ color: '#64748b', fontSize: 16, margin: '0 0 16px' }}>{score} / {total} correct · Grade: {grade} · {performance_level}</p>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '16px 20px', textAlign: 'left', fontSize: 14, lineHeight: 1.7, color: '#166534' }}>
              <strong style={{ display: 'block', marginBottom: 6 }}>🤖 AI Feedback</strong>
              {ai_feedback}
            </div>
          </div>

          {/* Question Review */}
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>Review Answers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {detailed.map((q, i) => (
              <div key={q.question_id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: `2px solid ${q.is_correct ? '#bbf7d0' : '#fecaca'}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{q.is_correct ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Q{i + 1}. {q.question}</div>
                    <div style={{ fontSize: 13, color: '#475569' }}>
                      {['a', 'b', 'c', 'd'].filter(k => q.options[k]).map(k => (
                        <div key={k} style={{
                          padding: '4px 8px', marginBottom: 2, borderRadius: 4,
                          background: k === q.correct_answer ? '#dcfce7' : k === q.student_answer && !q.is_correct ? '#fee2e2' : 'transparent',
                          fontWeight: k === q.correct_answer ? 700 : 400,
                          color: k === q.correct_answer ? '#166534' : k === q.student_answer && !q.is_correct ? '#dc2626' : '#64748b',
                        }}>
                          {k.toUpperCase()}. {q.options[k]}
                          {k === q.correct_answer && ' ✓'}
                          {k === q.student_answer && !q.is_correct && ' (your answer)'}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: '#eff6ff', borderRadius: 6, fontSize: 13, color: '#1e40af' }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
            <button onClick={() => { setPhase('browse'); setResult(null); }} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
              Back to Past Papers
            </button>
          </div>
        </div>
      </AlumniLayout>
    );
  }

  // ── EXAM PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'exam' && examData) {
    const questions = examData.questions;
    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const timeWarning = timeLeft < 60;

    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        {/* Timer bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 16 }}>{examData.exam.title}</strong>
            <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 8 }}>{examData.exam.subject} · {examData.exam.year}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>{answeredCount}/{questions.length} answered</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: timeWarning ? '#dc2626' : '#1e293b', fontFamily: 'monospace' }}>⏱ {formatTime(timeLeft)}</span>
            <button onClick={handleSubmit} disabled={submitting} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
          {/* Question navigator */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {questions.map((qq, i) => (
              <button key={qq.id} onClick={() => setCurrentQ(i)} style={{
                width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: i === currentQ ? '#6366f1' : answers[qq.id] ? '#dcfce7' : '#fff',
                color: i === currentQ ? '#fff' : answers[qq.id] ? '#166534' : '#64748b',
                border: '1px solid #e2e8f0',
              }}>
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 700, marginBottom: 8 }}>Question {currentQ + 1} of {questions.length}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', lineHeight: 1.5 }}>{q.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['a', 'b', 'c', 'd'].filter(k => q.options[k]).map(k => (
                <button key={k} onClick={() => setAnswers({ ...answers, [q.id]: k })} style={{
                  padding: '14px 16px', borderRadius: 10, border: answers[q.id] === k ? '2px solid #6366f1' : '2px solid #e2e8f0',
                  background: answers[q.id] === k ? '#eef2ff' : '#fff', textAlign: 'left', cursor: 'pointer', fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: answers[q.id] === k ? '#6366f1' : '#f1f5f9', color: answers[q.id] === k ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {k.toUpperCase()}
                  </span>
                  <span>{q.options[k]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: currentQ === 0 ? 'default' : 'pointer', opacity: currentQ === 0 ? 0.5 : 1 }}>
              ← Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(currentQ + 1)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Exam ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── BROWSE PHASE ───────────────────────────────────────────────────────────
  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>📄 Past Papers</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Practice with past national exams — get instant marks and AI feedback</p>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        {/* Premium lock banner */}
        {locked && (
          <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #fbbf24', borderRadius: 14, padding: '16px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28 }}>🔒</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong style={{ fontSize: 15 }}>Past Papers is a Premium feature of {locked.class_name || 'your class'}</strong>
              <div style={{ fontSize: 13, color: '#78350f', marginTop: 2 }}>Pay for class access to practice real national exams with instant marks and AI feedback.</div>
            </div>
            <button type="button" onClick={() => navigate(`/student/classes/${locked.class_id}`)} style={{ background: '#fbbf24', border: 'none', color: '#451a03', fontWeight: 800, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 14 }}>
              Pay {locked.amount_rwf ? `${Number(locked.amount_rwf).toLocaleString()} RWF` : 'for access'}
            </button>
          </div>
        )}

        {/* Step 1: Year selection */}
        {locked ? null : (<>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>1. Select Year</label>
          {loading ? (
            <span style={{ color: '#94a3b8', fontSize: 14 }}>Loading years...</span>
          ) : years.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
              <p>No past papers available yet. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {years.map(y => (
                <button key={y} onClick={() => setActiveYear(String(y))} style={{
                  padding: '8px 18px', borderRadius: 10, border: activeYear === String(y) ? '2px solid #6366f1' : '2px solid #e2e8f0',
                  background: activeYear === String(y) ? '#eef2ff' : '#fff', color: activeYear === String(y) ? '#6366f1' : '#64748b',
                  fontWeight: 700, cursor: 'pointer', fontSize: 15,
                }}>
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Subject selection */}
        {activeYear && subjects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>2. Select Subject</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {subjects.map(s => (
                <button key={s} onClick={() => setActiveSubject(s)} style={{
                  padding: '8px 18px', borderRadius: 10, border: activeSubject === s ? '2px solid #6366f1' : '2px solid #e2e8f0',
                  background: activeSubject === s ? '#eef2ff' : '#fff', color: activeSubject === s ? '#6366f1' : '#64748b',
                  fontWeight: 700, cursor: 'pointer', fontSize: 15,
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Exam list */}
        {activeYear && activeSubject && (
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>3. Available Exams</label>
            {exams.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                <p>No exams found for {activeSubject} in {activeYear}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {exams.map(exam => (
                  <div key={exam.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{exam.title}</h4>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        {exam.question_count} questions · {exam.duration_minutes} min
                        {exam.my_attempts > 0 && ` · ${exam.my_attempts} attempt(s)`}
                      </div>
                      {exam.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{exam.description}</div>}
                    </div>
                    <button onClick={() => startExam(exam.id)} style={{
                      padding: '10px 20px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap',
                    }}>
                      {exam.my_attempts > 0 ? 'Retake' : 'Start Exam'} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Document papers — view the original doc or take it as an AI quiz */}
        {docPapers.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>📄 Document Papers — read the original or take it as a quiz</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all', 'All'], ['primary', '📘 Primary'], ['secondary', '📗 Secondary']].map(([v, l]) => (
                  <button key={v} onClick={() => setDocLevel(v)} style={{
                    padding: '5px 12px', borderRadius: 8, border: docLevel === v ? '2px solid #6366f1' : '2px solid #e2e8f0',
                    background: docLevel === v ? '#eef2ff' : '#fff', color: docLevel === v ? '#6366f1' : '#64748b',
                    fontWeight: 700, cursor: 'pointer', fontSize: 12,
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docPapers.filter(p => docLevel === 'all' || (p.level || 'primary') === docLevel).map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {(p.level || 'primary') === 'secondary' ? '📗 Secondary' : '📘 Primary'} · {p.subject} · {p.year}
                      {Array.isArray(p.quiz_questions) && p.quiz_questions.length > 0 && ' · ✨ quiz ready'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {p.file_url && (
                      <a href={`${UPLOADS_BASE}${p.file_url}`} target="_blank" rel="noreferrer" style={{
                        padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff',
                        color: '#475569', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                      }}>📖 View Doc</a>
                    )}
                    {p.file_url && /\.(pdf|docx|txt)$/i.test(p.file_url) && (
                      <button onClick={() => startDocQuiz(p)} disabled={docGenerating === p.id} style={{
                        padding: '8px 14px', borderRadius: 8, border: 'none', background: '#6366f1',
                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: docGenerating === p.id ? 0.6 : 1,
                      }}>
                        {docGenerating === p.id ? '⏳ Building…' : '📝 Take as Quiz'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {docPapers.filter(p => docLevel === 'all' || (p.level || 'primary') === docLevel).length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 16 }}>No {docLevel} papers yet.</div>
              )}
            </div>
          </div>
        )}
        </>)}
      </div>
    </AlumniLayout>
  );
}
