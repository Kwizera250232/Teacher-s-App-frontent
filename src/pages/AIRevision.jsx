import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import AlumniLayout from '../components/AlumniLayout';
import AIRevisionReflection from '../components/AIRevisionReflection';
import './AIRevision.css';

const EDUCATION_LEVELS = [
  { value: 'primary', label: 'Primary', icon: '📘' },
  { value: 'secondary', label: 'Secondary', icon: '📗' },
];

const PRIMARY_GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
const SECONDARY_GRADES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

const QUIZ_TYPES = [
  { value: 'past_papers', label: 'Past Papers', icon: '📄' },
  { value: 'practice', label: 'Practice Quiz', icon: '✏️' },
  { value: 'mixed_revision', label: 'Mixed Revision', icon: '🔀' },
  { value: 'topic_based', label: 'Topic-based', icon: '🎯' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', icon: '🟢' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'hard', label: 'Hard', icon: '🔴' },
  { value: 'mixed', label: 'Mixed', icon: '🔀' },
];

const QUESTION_COUNTS = [10, 20, 30, 50];

function renderMatchingReview(q) {
  let pairs = [];
  try { pairs = JSON.parse(q.passage || '[]'); } catch (e) {}
  const studentParts = (q.student_answer || '').split('|');
  return (
    <div>
      {pairs.map((pair, pi) => {
        const given = (studentParts[pi] || '').trim();
        const correct = pair.right.trim();
        const ok = given.toLowerCase() === correct.toLowerCase();
        return (
          <div key={pi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, fontSize: 13 }}>
            <span style={{ flex: 1, padding: '6px 10px', background: '#f1f5f9', borderRadius: 6, fontWeight: 600 }}>{pair.left}</span>
            <span style={{ color: ok ? '#10b981' : '#ef4444', fontWeight: 700 }}>{ok ? '✓' : '✗'}</span>
            <div style={{ flex: 1 }}>
              <div className={`ar-review-option ${ok ? 'ar-review-correct-opt' : 'ar-review-wrong-opt'}`} style={{ marginBottom: 2 }}>
                Your: <strong>{given || '—'}</strong>
              </div>
              {!ok && <div className="ar-review-option ar-review-correct-opt">Correct: <strong>{correct}</strong></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AIRevision() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();
  const [phase, setPhase] = useState('entry'); // entry | quiz | results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [quizShareUrl, setQuizShareUrl] = useState('');

  // Entry form state
  const [form, setForm] = useState({
    education_level: 'primary',
    grade: 'P1',
    subject: '',
    quiz_type: 'mixed_revision',
    difficulty: 'mixed',
    num_questions: 10,
    custom_count: '',
  });
  const [subjects, setSubjects] = useState([]);
  const [recommendation, setRecommendation] = useState(null);

  // Quiz state
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Results state
  const [result, setResult] = useState(null);

  // Load options and recommendation on mount
  useEffect(() => {
    if (!token) return;
    api.get('/ai-revision/options', token).then(data => {
      setSubjects(data.subjects || []);
      if (data.subjects?.length > 0 && !form.subject) {
        setForm(f => ({ ...f, subject: data.subjects[0] }));
      }
    }).catch(e => console.error(e));

    api.get('/ai-revision/recommend', token).then(data => {
      setRecommendation(data);
    }).catch(e => console.error(e));
  }, [token]);

  // Timer
  useEffect(() => {
    if (phase === 'quiz' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [phase, startTime]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleField = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'education_level') {
        next.grade = value === 'primary' ? 'P1' : 'S1';
      }
      return next;
    });
  };

  const handleShareQuiz = async () => {
    if (!form.subject) {
      setError('Please select a subject first.');
      return;
    }
    setSharing(true);
    setError('');
    try {
      const numQ = form.num_questions === 'custom'
        ? parseInt(form.custom_count) || 10
        : form.num_questions;
      const data = await api.post('/ai-revision/share-quiz', {
        education_level: form.education_level,
        grade: form.grade,
        subject: form.subject,
        quiz_type: form.quiz_type,
        difficulty: form.difficulty,
        num_questions: numQ,
      }, token);
      setQuizShareUrl(data.share_url);
    } catch (err) {
      setError(err.message);
    }
    setSharing(false);
  };

  const handleGenerate = async () => {
    if (!form.subject) {
      setError('Please select a subject.');
      return;
    }
    const numQ = form.num_questions === 'custom'
      ? parseInt(form.custom_count) || 10
      : form.num_questions;

    setLoading(true);
    setError('');
    try {
      const data = await api.post('/ai-revision/generate', {
        education_level: form.education_level,
        grade: form.grade,
        subject: form.subject,
        quiz_type: form.quiz_type,
        difficulty: form.difficulty,
        num_questions: numQ,
      }, token);

      setSessionId(data.session_id);
      setQuestions(data.questions);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setElapsed(0);
      setPhase('quiz');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qid, value) => {
    setAnswers(a => ({ ...a, [qid]: value }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) return;
    }
    setLoading(true);
    setError('');
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const data = await api.post('/ai-revision/submit', {
        session_id: sessionId,
        answers,
        time_taken_seconds: timeTaken,
      }, token);
      setResult(data);
      setPhase('results');
      setShowReflection(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setPhase('entry');
    setSessionId(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentQ(0);
    setError('');
    setShowReflection(false);
    setShowSummary(false);
  };

  const applyRecommendation = () => {
    if (!recommendation) return;
    setForm(f => ({
      ...f,
      difficulty: recommendation.recommended_difficulty || 'mixed',
      subject: recommendation.recommended_subject || f.subject,
      num_questions: recommendation.recommended_count || 10,
    }));
  };

  // ── ENTRY SCREEN ─────────────────────────────────────────────────────────────
  if (phase === 'entry') {
    const grades = form.education_level === 'primary' ? PRIMARY_GRADES : SECONDARY_GRADES;
    return (
      <div className="ar-page">
        <div className="ar-header">
          <button className="ar-header-back" onClick={() => navigate('/alumni/feed')}>← Back</button>
          <div className="ar-header-title">🤖 AI Assessment Revision</div>
        </div>

        <div className="ar-entry">
          <div className="ar-hero">
            <div className="ar-hero-icon">🎯</div>
            <h1>AI Assessment Revision</h1>
            <p>Practice with intelligent quiz selection, instant marking, and personalized AI feedback to prepare for your exams.</p>
          </div>

          {recommendation && recommendation.recent_average !== undefined && (
            <div className="ar-recommend" onClick={applyRecommendation} style={{ cursor: 'pointer' }}>
              <span className="ar-recommend-icon">💡</span>
              <div>
                <strong>AI Recommendation:</strong> {recommendation.reason}
                <br />
                <span style={{ fontSize: 12, opacity: 0.8 }}>Tap to apply automatically</span>
              </div>
            </div>
          )}

          <div className="ar-card">
            <h3 className="ar-card-title">📋 Configure Your Revision</h3>

            <div className="ar-field">
              <label className="ar-label">Education Level</label>
              <div className="ar-options-grid">
                {EDUCATION_LEVELS.map(opt => (
                  <div
                    key={opt.value}
                    className={`ar-option ${form.education_level === opt.value ? 'ar-selected' : ''}`}
                    onClick={() => handleField('education_level', opt.value)}
                  >
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-label">Grade / Class</label>
              <div className="ar-options-grid">
                {grades.map(g => (
                  <div
                    key={g}
                    className={`ar-option ${form.grade === g ? 'ar-selected' : ''}`}
                    onClick={() => handleField('grade', g)}
                  >
                    {g}
                  </div>
                ))}
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-label">Subject</label>
              {subjects.length > 0 ? (
                <select
                  className="ar-select"
                  value={form.subject}
                  onChange={e => handleField('subject', e.target.value)}
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  className="ar-select"
                  placeholder="Type a subject (e.g. Mathematics)"
                  value={form.subject}
                  onChange={e => handleField('subject', e.target.value)}
                />
              )}
            </div>

            <div className="ar-field">
              <label className="ar-label">Quiz Type</label>
              <div className="ar-options-grid">
                {QUIZ_TYPES.map(opt => (
                  <div
                    key={opt.value}
                    className={`ar-option ${form.quiz_type === opt.value ? 'ar-selected' : ''}`}
                    onClick={() => handleField('quiz_type', opt.value)}
                  >
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-label">Number of Questions</label>
              <div className="ar-options-grid">
                {QUESTION_COUNTS.map(n => (
                  <div
                    key={n}
                    className={`ar-option ${form.num_questions === n ? 'ar-selected' : ''}`}
                    onClick={() => handleField('num_questions', n)}
                  >
                    {n}
                  </div>
                ))}
                <div
                  className={`ar-option ${form.num_questions === 'custom' ? 'ar-selected' : ''}`}
                  onClick={() => handleField('num_questions', 'custom')}
                >
                  Custom
                </div>
              </div>
              {form.num_questions === 'custom' && (
                <input
                  className="ar-num-input"
                  type="number"
                  min="5"
                  max="100"
                  placeholder="e.g. 15"
                  value={form.custom_count}
                  onChange={e => handleField('custom_count', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <div className="ar-field">
              <label className="ar-label">Difficulty Level</label>
              <div className="ar-options-grid">
                {DIFFICULTIES.map(opt => (
                  <div
                    key={opt.value}
                    className={`ar-option ${form.difficulty === opt.value ? 'ar-selected' : ''}`}
                    onClick={() => handleField('difficulty', opt.value)}
                  >
                    {opt.icon} {opt.label}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>{error}</div>
            )}

            <button className="ar-generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? '⏳ Generating...' : '🚀 Start Revision Quiz'}
            </button>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="ar-action-btn ar-action-secondary"
                style={{ flex: 1 }}
                onClick={() => navigate('/alumni/ai-revision/progress')}
              >
                📊 View Progress
              </button>
              <button
                className="ar-action-btn ar-action-secondary"
                style={{ flex: 1 }}
                onClick={handleShareQuiz}
                disabled={sharing}
              >
                {sharing ? 'Sharing...' : '🔗 Share This Quiz'}
              </button>
            </div>

            {quizShareUrl && (
              <div style={{ marginTop: 12, padding: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#065f46' }}>✅ Quiz share link created!</p>
                <input
                  readOnly
                  value={quizShareUrl}
                  onClick={(e) => e.target.select()}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 13, color: '#065f46', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(quizShareUrl); }}
                    style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                  >
                    📋 Copy Link
                  </button>
                  <button
                    onClick={() => setQuizShareUrl('')}
                    style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e2e8f0', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ TAKING ─────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[currentQ];
    if (!q) return null;
    const answeredCount = Object.keys(answers).length;
    const progressPct = (answeredCount / questions.length) * 100;

    return (
      <div className="ar-page">
        <div className="ar-header">
          <button className="ar-header-back" onClick={() => {
            if (confirm('Leave this quiz? Your progress will be lost.')) {
              handleRestart();
            }
          }}>← Exit</button>
          <div className="ar-header-title">🤖 {form.subject} Revision</div>
        </div>

        <div className="ar-quiz">
          <div className="ar-quiz-topbar">
            <div className="ar-quiz-counter">{answeredCount}/{questions.length}</div>
            <div className="ar-quiz-progress">
              <div className="ar-quiz-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="ar-quiz-timer">⏱️ {formatTime(elapsed)}</div>
          </div>

          <div className="ar-question-card">
            <span className="ar-q-number">Question {q.display_number} of {questions.length}</span>
            {q.passage && q.question_type !== 'matching' && (
              <div className="ar-q-passage">{q.passage}</div>
            )}
            <p className="ar-q-text">{q.question}</p>

            {q.question_type === 'fill_blank' ? (
              <input
                className="ar-q-fill-input"
                placeholder="Type your answer..."
                value={answers[q.id] || ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
              />
            ) : q.question_type === 'matching' ? (
              <MatchingQuestion q={q} value={answers[q.id] || ''} onChange={v => handleAnswer(q.id, v)} />
            ) : (
              <div className="ar-q-options">
                {['a', 'b', 'c', 'd'].map(opt => {
                  const text = q[`option_${opt}`];
                  if (!text) return null;
                  return (
                    <div
                      key={opt}
                      className={`ar-q-option ${answers[q.id] === opt ? 'ar-q-selected' : ''}`}
                      onClick={() => handleAnswer(q.id, opt)}
                    >
                      <div className="ar-q-option-letter">{opt.toUpperCase()}</div>
                      <div className="ar-q-option-text">{text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ar-quiz-nav">
            <button
              className="ar-nav-btn"
              disabled={currentQ === 0}
              onClick={() => setCurrentQ(c => c - 1)}
            >← Previous</button>
            {currentQ < questions.length - 1 ? (
              <button
                className="ar-nav-btn"
                onClick={() => setCurrentQ(c => c + 1)}
              >Next →</button>
            ) : (
              <button
                className="ar-submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >{loading ? '⏳ Submitting...' : '✅ Submit Quiz'}</button>
            )}
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 12 }}>{error}</div>
          )}

          {/* Question navigator dots */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 20 }}>
            {questions.map((qq, i) => (
              <div
                key={qq.id}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: i === currentQ ? '#6366f1' : answers[qq.id] !== undefined ? '#10b981' : '#e2e8f0',
                  color: i === currentQ || answers[qq.id] !== undefined ? 'white' : '#94a3b8',
                }}
              >{i + 1}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  if (phase === 'results' && result) {
    const pct = result.percentage;
    const emoji = pct >= 90 ? '🏆' : pct >= 75 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '💪' : '📚';
    const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';

    return (
      <div className="ar-page">
        <div className="ar-header">
          <button className="ar-header-back" onClick={handleRestart}>← New Quiz</button>
          <div className="ar-header-title">📊 Results</div>
        </div>

        <div className="ar-results">
          <div className="ar-result-hero">
            <div className="ar-result-emoji">{emoji}</div>
            <div className="ar-result-score">
              <span className="ar-result-score-num">{result.score}</span>
              <span className="ar-result-score-sep">/</span>
              <span className="ar-result-score-total">{result.total}</span>
            </div>
            <div className="ar-result-pct" style={{ color }}>{pct}%</div>
            <div className="ar-result-grade" style={{ background: `${color}20`, color }}>
              Grade {result.grade}
            </div>
            <div className="ar-result-level">{result.performance_level}</div>

            <div className="ar-result-stats">
              <div className="ar-result-stat">
                <div className="ar-result-stat-num" style={{ color: '#10b981' }}>{result.correct_count}</div>
                <div className="ar-result-stat-label">Correct</div>
              </div>
              <div className="ar-result-stat">
                <div className="ar-result-stat-num" style={{ color: '#ef4444' }}>{result.wrong_count}</div>
                <div className="ar-result-stat-label">Wrong</div>
              </div>
              <div className="ar-result-stat">
                <div className="ar-result-stat-num" style={{ color: '#6366f1' }}>{formatTime(result.time_taken_seconds || elapsed)}</div>
                <div className="ar-result-stat-label">Time</div>
              </div>
            </div>
          </div>

          {result.ai_feedback && (
            <div className="ar-ai-feedback">
              <h3 className="ar-ai-feedback-title">🤖 AI Feedback</h3>
              <p className="ar-ai-feedback-text">{result.ai_feedback}</p>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px' }}>
              📝 Answer Review
            </h3>
            {result.detailed.map((q) => {
              const qtype = q.question_type || 'multiple_choice';
              return (
                <div key={q.question_id} className={`ar-review-card ${q.is_correct ? 'ar-correct' : 'ar-wrong'}`}>
                  <div className="ar-review-header">
                    <div className="ar-review-q">Q{q.number}: {q.question}</div>
                    <span className="ar-review-badge">{q.is_correct ? '✅' : '❌'}</span>
                  </div>

                  {(qtype === 'multiple_choice' || qtype === 'true_false') && ['a', 'b', 'c', 'd'].map(opt => {
                    const text = q[`option_${opt}`];
                    if (!text) return null;
                    const isCorrect = q.correct_answer === opt;
                    const isGiven = q.student_answer === opt;
                    let cls = '';
                    if (isCorrect) cls = 'ar-review-correct-opt';
                    else if (isGiven && !isCorrect) cls = 'ar-review-wrong-opt';
                    return (
                      <div key={opt} className={`ar-review-option ${cls}`}>
                        <strong>{opt.toUpperCase()}.</strong> {text}
                        {isCorrect && <span style={{ float: 'right', color: '#10b981', fontWeight: 700 }}>✓ Correct</span>}
                        {isGiven && !isCorrect && <span style={{ float: 'right', color: '#ef4444', fontWeight: 700 }}>✗ Your answer</span>}
                      </div>
                    );
                  })}

                  {qtype === 'fill_blank' && (
                    <div>
                      <div className="ar-review-label" style={{ color: '#ef4444' }}>Your answer:</div>
                      <div className="ar-review-option ar-review-wrong-opt">
                        <strong>{q.student_answer || '(blank)'}</strong>
                      </div>
                      {!q.is_correct && (
                        <>
                          <div className="ar-review-label" style={{ color: '#10b981' }}>Correct answer:</div>
                          <div className="ar-review-option ar-review-correct-opt">
                            <strong>{q.correct_answer}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {qtype === 'matching' && renderMatchingReview(q)}
                </div>
              );
            })}
          </div>

          {/* Summary Notes for Difficult Topics */}
          {result.summary_notes && (
            <div className="ar-ai-feedback" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <h3 className="ar-ai-feedback-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📝 Summary Notes — Difficult Topics</span>
                <button
                  onClick={() => setShowSummary(s => !s)}
                  style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: '1px solid #8b5cf6', background: 'transparent', color: '#8b5cf6', cursor: 'pointer', fontWeight: 700 }}
                >
                  {showSummary ? 'Hide' : 'Show'}
                </button>
              </h3>
              {showSummary && (
                <div className="ar-ai-feedback-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {result.summary_notes}
                </div>
              )}
              {showSummary && (
                <button
                  onClick={() => {
                    const blob = new Blob([result.summary_notes], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `AI_Revision_Notes_${form.subject}_${Date.now()}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ marginTop: 12, fontSize: 13, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                >
                  📥 Download Notes
                </button>
              )}
            </div>
          )}

          {/* Download Marks */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <button
              onClick={() => {
                const marksText = `AI Assessment Revision — Results\n\nSubject: ${form.subject}\nGrade: ${form.grade}\nDifficulty: ${form.difficulty}\nDate: ${new Date().toLocaleString()}\n\nScore: ${result.score}/${result.total} (${result.percentage}%)\nGrade: ${result.grade}\nPerformance: ${result.performance_level}\nCorrect: ${result.correct_count}\nWrong: ${result.wrong_count}\nTime: ${formatTime(result.time_taken_seconds || elapsed)}\n\n${result.ai_feedback || ''}`;
                const blob = new Blob([marksText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `AI_Revision_Marks_${form.subject}_${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{ fontSize: 13, padding: '10px 20px', borderRadius: 10, border: '1px solid #6366f1', background: 'transparent', color: '#6366f1', cursor: 'pointer', fontWeight: 700 }}
            >
              📥 Download Marks
            </button>
          </div>

          <div className="ar-results-actions">
            <button className="ar-action-btn ar-action-primary" onClick={handleRestart}>
              🔄 New Revision Quiz
            </button>
            <button className="ar-action-btn ar-action-secondary" onClick={() => setShowReflection(true)}>
              💬 Give Feedback
            </button>
            <button className="ar-action-btn ar-action-secondary" onClick={() => navigate('/alumni/ai-revision/progress')}>
              📊 View Progress
            </button>
            <button className="ar-action-btn ar-action-secondary" onClick={() => navigate('/alumni/feed')}>
              🏠 Dashboard
            </button>
            <button
              className="ar-action-btn ar-action-secondary"
              onClick={async () => {
                setSharing(true);
                try {
                  const data = await api.post('/ai-revision/share', { session_id: sessionId }, token);
                  setShareUrl(data.share_url);
                } catch (err) {
                  setError(err.message);
                }
                setSharing(false);
              }}
              disabled={sharing}
            >
              {sharing ? 'Sharing...' : '🔗 Share Results'}
            </button>
          </div>

          {shareUrl && (
            <div style={{ marginTop: 12, padding: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#065f46' }}>✅ Share link created!</p>
              <input
                readOnly
                value={shareUrl}
                onClick={(e) => e.target.select()}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 13, color: '#065f46', marginBottom: 8 }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                }}
                style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 700 }}
              >
                📋 Copy Link
              </button>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                Anyone who opens this link can sign up and try AI Revision quizzes.
              </p>
            </div>
          )}
        </div>

        {showReflection && (
          <AIRevisionReflection
            sessionId={sessionId}
            token={token}
            subject={form.subject}
            score={result.score}
            total={result.total}
            onComplete={() => setShowReflection(false)}
            onSkip={() => setShowReflection(false)}
          />
        )}
      </div>
    );
  }

  return null;
}

// ── Matching Question Component ───────────────────────────────────────────────
function MatchingQuestion({ q, value, onChange }) {
  let pairs = [];
  try { pairs = JSON.parse(q.passage || '[]'); } catch (e) {}
  const parts = (value || '').split('|');
  const rights = pairs.map(p => p.right).sort(() => Math.random() - 0.5);

  return (
    <div>
      {pairs.map((pair, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ flex: 1, padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            {pair.left}
          </span>
          <span style={{ color: '#6366f1', fontWeight: 700 }}>→</span>
          <select
            className="ar-select"
            style={{ flex: 1 }}
            value={parts[i] || ''}
            onChange={e => {
              const next = [...parts];
              next[i] = e.target.value;
              onChange(next.join('|'));
            }}
          >
            <option value="">Select...</option>
            {rights.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
