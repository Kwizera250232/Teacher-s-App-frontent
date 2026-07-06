import { useState } from 'react';
import { api } from '../api';
import './quizReflection/QuizReflectionForm.css';

export default function AIRevisionReflection({
  sessionId,
  token,
  subject,
  score,
  total,
  onComplete,
  onSkip,
}) {
  const [difficulty, setDifficulty] = useState('');
  const [improvement, setImprovement] = useState('');
  const [studentQuestion, setStudentQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/ai-revision/reflection', {
        session_id: sessionId,
        difficulty,
        improvement,
        student_question: studentQuestion,
      }, token);
      onComplete?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="qr-wizard-backdrop">
      <div className="qr-wizard">
        <div className="qr-hero">
          <div className="qr-hero-emoji">🌟</div>
          <h2>Reflect on your revision</h2>
          <p>Tell us what you learned — your feedback helps improve your learning!</p>
          {score != null && (
            <span className="qr-score-pill">You scored {score}/{total} ({pct}%)</span>
          )}
        </div>
        <div className="qr-body">
          <div className="qr-subject-chip">
            📚 {subject}
          </div>
          {error && <div className="alert alert-error">{error}</div>}

          <section className="qr-section">
            <h3 className="qr-section-title">💡 Your reflection</h3>
            <textarea
              className="qr-textarea"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              placeholder="What was difficult in this quiz?"
              rows={2}
            />
            <textarea
              className="qr-textarea"
              style={{ marginTop: 10 }}
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
              placeholder="What did you gain or improve after this quiz?"
              rows={2}
            />
            <textarea
              className="qr-textarea"
              style={{ marginTop: 10 }}
              value={studentQuestion}
              onChange={(e) => setStudentQuestion(e.target.value)}
              placeholder="Any question for your teacher?"
              rows={2}
            />
          </section>

          <button type="button" className="qr-wear-btn" disabled={submitting} onClick={submit}>
            {submitting ? 'Sending…' : '✨ Send feedback'}
          </button>
          <button type="button" className="qr-skip" onClick={() => onSkip?.()}>Skip</button>
        </div>
      </div>
    </div>
  );
}
