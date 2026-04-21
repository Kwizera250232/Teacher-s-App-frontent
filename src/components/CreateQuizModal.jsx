import { useState } from 'react';
import { api } from '../api';

const EMPTY_QUESTION = { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' };

export default function CreateQuizModal({ token, classId, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addQuestion = () => setQuestions([...questions, { ...EMPTY_QUESTION }]);

  const updateQuestion = (i, field, value) => {
    const updated = [...questions];
    updated[i] = { ...updated[i], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (i) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    for (const q of questions) {
      if (!q.question || !q.option_a || !q.option_b) {
        setError('Each question needs at least a question text, option A and option B.');
        return;
      }
    }
    setLoading(true);
    try {
      await api.post(`/classes/${classId}/quizzes`, { title, description, questions }, token);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>❓ Create Quiz</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Quiz Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 Quiz" required />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 10 questions, 20 marks" />
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#f0f0f0' }} />

          {questions.map((q, i) => (
            <div key={i} style={{ background: '#f8f9ff', borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong style={{ fontSize: 14 }}>Question {i + 1}</strong>
                {questions.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(i)}>Remove</button>
                )}
              </div>
              <div className="form-group">
                <label>Question *</label>
                <input type="text" value={q.question} onChange={e => updateQuestion(i, 'question', e.target.value)} placeholder="Enter question" required />
              </div>
              {['a', 'b', 'c', 'd'].map(opt => (
                <div className="form-group" key={opt}>
                  <label>Option {opt.toUpperCase()} {opt === 'a' || opt === 'b' ? '*' : '(optional)'}</label>
                  <input
                    type="text"
                    value={q[`option_${opt}`]}
                    onChange={e => updateQuestion(i, `option_${opt}`, e.target.value)}
                    placeholder={`Option ${opt.toUpperCase()}`}
                    required={opt === 'a' || opt === 'b'}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Correct Answer *</label>
                <select value={q.correct_answer} onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}>
                  <option value="a">A</option>
                  <option value="b">B</option>
                  {q.option_c && <option value="c">C</option>}
                  {q.option_d && <option value="d">D</option>}
                </select>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-full" onClick={addQuestion} style={{ marginBottom: 16 }}>
            + Add Question
          </button>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : `Create Quiz (${questions.length} questions)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
