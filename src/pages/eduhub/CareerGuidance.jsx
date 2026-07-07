import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const HEADER_GRADIENT = 'linear-gradient(135deg, #0B5FFF 0%, #2563EB 50%, #1E40AF 100%)';

export default function CareerGuidance({ onNavigate }) {
  const { token } = useAuth();
  const [phase, setPhase] = useState('intro'); // intro | quiz | results
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (phase === 'quiz' && questions.length === 0) {
      api.get('/education-hub/career-questions', token)
        .then(data => {
          if (!data.questions || data.questions.length === 0) {
            setError('Career questions not configured yet. Please check back later.');
            setPhase('intro');
          } else {
            setQuestions(data.questions);
            setAnswers(new Array(data.questions.length).fill(null));
          }
        })
        .catch(() => { setError('Failed to load questions.'); setPhase('intro'); });
    }
  }, [phase, token]);

  const startQuiz = () => { setError(''); setPhase('quiz'); };

  const selectAnswer = (idx) => {
    const updated = [...answers];
    updated[current] = idx;
    setAnswers(updated);
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(current + 1), 200);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/education-hub/career-assessment', { answers }, token);
      setResults(data);
      setPhase('results');
    } catch (e) {
      setError(e.message || 'Failed to submit assessment.');
    } finally {
      setLoading(false);
    }
  };

  // ── INTRO ───────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ background: HEADER_GRADIENT, padding: '40px 20px', width: '100%' }}>
          <button onClick={() => onNavigate('home')} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>← Back to Hub</button>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🤖</div>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>AI Career Guidance</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: '0 0 24px' }}>Answer a series of questions about your interests and personality. Our AI will match you with the best career paths.</p>
          </div>
        </div>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Discover Your Perfect Career</h2>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: '0 0 20px' }}>Our assessment takes about 10 minutes. You'll answer questions about your interests, strengths, and preferences. Then we'll show you your top career matches with details about each one.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
              <div><div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB' }}>40+</div><div style={{ fontSize: 12, color: '#64748b' }}>Questions</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB' }}>~10</div><div style={{ fontSize: 12, color: '#64748b' }}>Minutes</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB' }}>5</div><div style={{ fontSize: 12, color: '#64748b' }}>Career Matches</div></div>
            </div>
            <button onClick={startQuiz} style={{ padding: '14px 32px', borderRadius: 16, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Start Assessment →</button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ────────────────────────────────────────────────────────────────────
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[current];
    const options = q.options || [];
    const answered = answers.filter(a => a !== null).length;
    const progress = ((current + 1) / questions.length) * 100;
    const allAnswered = answers.every(a => a !== null);

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Question {current + 1} of {questions.length}</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{answered}/{questions.length} answered</span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#2563EB', borderRadius: 3, transition: 'width .3s' }} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', lineHeight: 1.5 }}>{q.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map((opt, idx) => (
                <button key={idx} onClick={() => selectAnswer(idx)} style={{
                  padding: '14px 16px', borderRadius: 12, border: answers[current] === idx ? '2px solid #2563EB' : '2px solid #e2e8f0',
                  background: answers[current] === idx ? '#eef2ff' : '#fff', textAlign: 'left', cursor: 'pointer', fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s',
                }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: answers[current] === idx ? '#2563EB' : '#f1f5f9', color: answers[current] === idx ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{String.fromCharCode(65 + idx)}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: current === 0 ? 'default' : 'pointer', opacity: current === 0 ? 0.4 : 1 }}>← Previous</button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent(current + 1)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Next →</button>
            ) : (
              <button onClick={submit} disabled={!allAnswered || loading} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: allAnswered ? '#059669' : '#cbd5e1', color: '#fff', fontWeight: 700, cursor: allAnswered ? 'pointer' : 'default' }}>{loading ? 'Analyzing...' : 'Get Results ✓'}</button>
            )}
          </div>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginTop: 16, fontSize: 14 }}>{error}</div>}
        </div>
      </div>
    );
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  if (phase === 'results' && results) {
    const matches = results.career_matches || [];
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ background: HEADER_GRADIENT, padding: '32px 20px', width: '100%' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Your Career Matches</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>Based on your assessment, here are your top career recommendations</p>
          </div>
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px' }}>
          {matches.map((career, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 24, marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 28 }}>{i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{career.title}</h3>
                  </div>
                  {career.description && <p style={{ fontSize: 14, color: '#64748b', margin: '0' }}>{career.description}</p>}
                </div>
                <div style={{ textAlign: 'center', minWidth: 70 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: career.match_score >= 85 ? '#059669' : career.match_score >= 70 ? '#2563EB' : '#f59e0b' }}>{career.match_score}%</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Match</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                {career.skills_required && <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><strong style={{ color: '#334155' }}>Skills:</strong> {career.skills_required}</div>}
                {career.subjects_to_focus && <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><strong style={{ color: '#334155' }}>Subjects:</strong> {career.subjects_to_focus}</div>}
                {career.future_demand && <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><strong style={{ color: '#334155' }}>Demand:</strong> {career.future_demand}</div>}
                {career.estimated_salary && <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><strong style={{ color: '#334155' }}>Salary:</strong> {career.estimated_salary}</div>}
              </div>
              {career.video_url && <a href={career.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, color: '#2563EB', fontSize: 13, fontWeight: 600 }}>▶ Watch Career Video</a>}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button onClick={() => { setPhase('intro'); setResults(null); setAnswers([]); setCurrent(0); }} style={{ padding: '12px 24px', borderRadius: 16, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Retake Assessment</button>
            <button onClick={() => onNavigate('home')} style={{ padding: '12px 24px', borderRadius: 16, border: '2px solid #2563EB', background: '#fff', color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Back to Hub</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
