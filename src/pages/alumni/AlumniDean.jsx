import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniDean() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Initial greeting
    setMessages([
      {
        from: 'dean',
        text: `Hello ${user?.name || 'there'}! I'm Dean AI. I can prepare quizzes for you and give you marks instantly with feedback!\n\nJust tell me what subject and grade you want to practice. For example:\n"Prepare me a quiz on Mathematics for Primary 6"`,
        time: new Date(),
      },
    ]);
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedQuiz]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userMsg, time: new Date() }]);
    setLoading(true);

    try {
      // Parse the request - extract subject and grade
      const lower = userMsg.toLowerCase();
      let subject = null;
      let grade = null;

      // Common subjects
      const subjects = ['mathematics', 'math', 'english', 'kinyarwanda', 'science', 'social studies', 'french', 'ict', 'religion', 'geography', 'history', 'biology', 'chemistry', 'physics'];
      for (const s of subjects) {
        if (lower.includes(s)) {
          subject = s === 'math' ? 'mathematics' : s;
          break;
        }
      }

      // Common grades
      const gradeMatch = lower.match(/primary\s*(\d+)|p(\d+)|grade\s*(\d+)|level\s*(\d+)|(\d+)(?:th|rd|nd|st)?\s*grade/i);
      if (gradeMatch) {
        const num = gradeMatch[1] || gradeMatch[2] || gradeMatch[3] || gradeMatch[4] || gradeMatch[5];
        grade = `Primary ${num}`;
      }

      // Search for quizzes using dean-quizzes endpoint
      let quizzes = [];
      try {
        const searchRes = await api.get(`/alumni/dean-quizzes/search?grade=${encodeURIComponent(grade || '')}&subject=${encodeURIComponent(subject || '')}`, token);
        quizzes = searchRes.quizzes || [];
      } catch (e) {
        // Fallback: get all visible quizzes
        try {
          const allRes = await api.get('/alumni/dean-quizzes', token);
          quizzes = (allRes.quizzes || []).filter(q => {
            if (!subject) return true;
            const qSubject = (q.subject || q.title || q.category || '').toLowerCase();
            return qSubject.includes(subject);
          });
        } catch (e2) {}
      }

      if (quizzes.length > 0) {
        setMessages(prev => [...prev, {
          from: 'dean',
          text: `Great! I found ${quizzes.length} quiz${quizzes.length > 1 ? 'zes' : ''} for you. Click on any quiz below to start!`,
          quizzes: quizzes.slice(0, 5),
          time: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          from: 'dean',
          text: `I couldn't find any quizzes matching "${subject || 'that subject'}" ${grade ? `for ${grade}` : ''} in our database right now.\n\nTry asking with a different subject like:\n"Prepare me a quiz on Science for Primary 5"`,
          time: new Date(),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        from: 'dean',
        text: 'Sorry, I had trouble searching for quizzes. Please try again!',
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setResult(null);
    try {
      // Use dean-quizzes endpoint
      const data = await api.get(`/alumni/dean-quizzes/${quiz.id}`, token);
      setSelectedQuiz(data.quiz || quiz);
      setQuestions(data.questions || []);
    } catch (e) {
      alert('Failed to load quiz questions');
      setSelectedQuiz(null);
    }
  };

  const selectAnswer = (qId, answer) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    const feedback = questions.map((q) => ({
      question: q.question_text || q.question,
      yourAnswer: answers[q.id] || 'No answer',
      correctAnswer: q.correct_answer,
      isCorrect: answers[q.id] === q.correct_answer,
      explanation: q.explanation || 'Keep learning!',
    }));

    setResult({ score, correct, total: questions.length, feedback });

    try {
      await api.post('/alumni/dean-quizzes/submit', { quiz_id: selectedQuiz.id, answers, score }, token);
    } catch (e) { console.error('Save result failed:', e); }
  };

  const resetChat = () => {
    setSelectedQuiz(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
  };

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤖</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Dean AI</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Quiz preparation assistant</p>
          </div>
          {selectedQuiz && (
            <button onClick={resetChat} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              ← Back to Chat
            </button>
          )}
        </div>

        {/* Chat / Quiz Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {!selectedQuiz ? (
            <>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: msg.from === 'dean' ? 'linear-gradient(135deg, #667eea, #764ba2)' : `hsl(${(user?.id || 1) * 137 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {msg.from === 'dean' ? '🤖' : (user?.name || 'U')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 14 }}>{msg.from === 'dean' ? 'Dean AI' : user?.name || 'You'}</strong>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ background: msg.from === 'dean' ? '#f8fafc' : '#fff', borderRadius: 12, padding: '12px 16px', border: `1px solid ${msg.from === 'dean' ? '#e2e8f0' : '#667eea'}`, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#1e293b' }}>
                      {msg.text}
                    </div>
                    {/* Quiz Cards */}
                    {msg.quizzes && msg.quizzes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                        {msg.quizzes.map((quiz) => (
                          <button key={quiz.id} onClick={() => startQuiz(quiz)} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, flexShrink: 0 }}>📝</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{quiz.title || 'Quiz'}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>{quiz.subject || 'General'} · {quiz.grade || 'All levels'} · {quiz.questions_count || '?'} questions</div>
                            </div>
                            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>Start →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, flexShrink: 0 }}>🤖</div>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite 0.2s' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite 0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </>
          ) : (
            <>
              {/* Quiz Taking View */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {result ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 56, marginBottom: 12 }}>{result.score >= 70 ? '🎉' : result.score >= 50 ? '👍' : '📚'}</div>
                      <h3 style={{ margin: '0 0 8px', fontSize: 24 }}>You scored {result.score}%</h3>
                      <p style={{ color: '#64748b' }}>{result.correct} out of {result.total} correct</p>
                      <div style={{ display: 'inline-block', marginTop: 8, padding: '6px 16px', borderRadius: 20, background: result.score >= 70 ? '#dcfce7' : result.score >= 50 ? '#fef3c7' : '#fee2e2', color: result.score >= 70 ? '#166534' : result.score >= 50 ? '#92400e' : '#991b1b', fontWeight: 700 }}>
                        {result.score >= 70 ? 'Excellent!' : result.score >= 50 ? 'Good effort!' : 'Keep studying!'}
                      </div>
                    </div>
                    <h4 style={{ margin: '20px 0 12px', fontSize: 16 }}>📋 Review Your Answers</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {result.feedback.map((f, i) => (
                        <div key={i} style={{ padding: 14, borderRadius: 12, background: f.isCorrect ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${f.isCorrect ? '#86efac' : '#fecaca'}` }}>
                          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{i + 1}. {f.question}</div>
                          <div style={{ fontSize: 13, color: f.isCorrect ? '#166534' : '#991b1b' }}>Your answer: {f.yourAnswer} {f.isCorrect ? '✅' : '❌'}</div>
                          {!f.isCorrect && <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>Correct: {f.correctAnswer}</div>}
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>💡 {f.explanation}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
                      <button onClick={resetChat} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                        Try Another Quiz
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedQuiz.title || 'Quiz'}</h3>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{Object.keys(answers).length}/{questions.length} answered</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {questions.map((q, i) => (
                        <div key={q.id} style={{ padding: 16, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fafafa' }}>
                          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>{i + 1}. {q.question_text || q.question}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(q.options || []).map((opt) => (
                              <button key={opt} onClick={() => selectAnswer(q.id, opt)} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: answers[q.id] === opt ? '2px solid #667eea' : '1.5px solid #e2e8f0', background: answers[q.id] === opt ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 14, color: '#1e293b' }}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={submitQuiz} disabled={Object.keys(answers).length < questions.length} style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 12, border: 'none', background: Object.keys(answers).length < questions.length ? '#cbd5e1' : '#667eea', color: '#fff', fontWeight: 700, fontSize: 16, cursor: Object.keys(answers).length < questions.length ? 'not-allowed' : 'pointer' }}>
                      {Object.keys(answers).length < questions.length ? `Answer all questions (${Object.keys(answers).length}/${questions.length})` : 'Submit Quiz'}
                    </button>
                  </>
                )}
              </div>
              <div ref={scrollRef} />
            </>
          )}
        </div>

        {/* Input */}
        {!selectedQuiz && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 0', borderTop: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="Ask Dean to prepare a quiz..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: '1.5px solid #e2e8f0', fontSize: 15, outline: 'none' }}
            />
            <button onClick={sendMessage} disabled={loading} style={{ padding: '12px 24px', borderRadius: 24, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {loading ? '...' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
