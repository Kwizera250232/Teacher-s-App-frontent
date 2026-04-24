import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { downloadWord } from '../utils/downloadResult';
import '../pages/Dashboard.css';

export default function TakeQuiz() {
  const { classId, quizId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/classes/${classId}/quizzes/${quizId}/questions`, token)
      .then(setQuestions)
      .catch(e => setError(e.message));
  }, []);

  const handleAnswer = (questionId, option) => {
    if (submitted) return;
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/classes/${classId}/quizzes/${quizId}/submit`, { answers }, token);
      setResult(res);
      setSubmitted(true);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && result) {
    const percentage = Math.round((result.score / result.total) * 100);
    return (
      <div className="class-page">
        <header className="dash-header">
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div className="dash-brand">🎓 UClass</div>
        </header>
        <main className="class-main" style={{ maxWidth: 600 }}>
          <div className="score-card">
            <div style={{ fontSize: 48 }}>{percentage >= 70 ? '🎉' : percentage >= 50 ? '👍' : '📚'}</div>
            <h2>Quiz Complete!</h2>
            <div className="score-big">{result.score}/{result.total}</div>
            <div className="score-sub">{percentage}% — {percentage >= 70 ? 'Great job!' : percentage >= 50 ? 'Good effort!' : 'Keep studying!'}</div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Review Answers</h3>
            {questions.map((q, i) => {
              const qResult = result.results[q.id];
              return (
                <div key={q.id} style={{ background: 'white', borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  <strong style={{ fontSize: 14 }}>Q{i + 1}: {q.question}</strong>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    {['a', 'b', 'c', 'd'].map(opt => {
                      if (!q[`option_${opt}`]) return null;
                      const isCorrect = qResult?.correct === opt;
                      const isGiven = qResult?.given === opt;
                      let bg = 'transparent';
                      if (isCorrect) bg = '#f0fff4';
                      else if (isGiven && !isCorrect) bg = '#fff0f0';
                      return (
                        <div key={opt} style={{ padding: '6px 10px', borderRadius: 6, background: bg, marginBottom: 4, border: `1px solid ${isCorrect ? '#27ae60' : isGiven ? '#e74c3c' : '#eee'}` }}>
                          <strong>{opt.toUpperCase()}.</strong> {q[`option_${opt}`]}
                          {isCorrect && ' ✅'}
                          {isGiven && !isCorrect && ' ❌'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1 }}
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  const data = await api.get(`/classes/${classId}/quizzes/${quizId}/my-result`, token);
                  const safeName = data.student_name.replace(/[^a-z0-9]/gi, '_');
                  downloadWord(`${data.quiz_title}_${safeName}`, data);
                } catch (e) {
                  setError(e.message);
                } finally {
                  setDownloading(false);
                }
              }}
            >
              {downloading ? 'Generating…' : '⬇ Download My Result'}
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(-1)}>
              Back to Class
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="class-page">
      <header className="dash-header">
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div className="dash-brand">🎓 UClass</div>
      </header>
      <main className="class-main" style={{ maxWidth: 700 }}>
        <h2 style={{ marginBottom: 8 }}>Quiz</h2>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>{questions.length} questions · Answer all before submitting</p>

        {error && <div className="alert alert-error">{error}</div>}

        {questions.map((q, i) => (
          <div key={q.id} className="quiz-question">
            <h3>Q{i + 1}: {q.question}</h3>
            <div className="quiz-options">
              {['a', 'b', 'c', 'd'].map(opt => {
                if (!q[`option_${opt}`]) return null;
                return (
                  <label key={opt} className={`quiz-option ${answers[q.id] === opt ? 'selected' : ''}`} onClick={() => handleAnswer(q.id, opt)}>
                    <strong>{opt.toUpperCase()}.</strong> {q[`option_${opt}`]}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {questions.length > 0 && (
          <button
            className="btn btn-primary btn-full"
            onClick={handleSubmit}
            disabled={loading || Object.keys(answers).length < questions.length}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Submitting...' : `Submit Quiz (${Object.keys(answers).length}/${questions.length} answered)`}
          </button>
        )}
      </main>
    </div>
  );
}
