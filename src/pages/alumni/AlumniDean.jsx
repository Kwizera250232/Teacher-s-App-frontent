import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const SUGGESTIONS = [
  { icon: '📚', text: 'Prepare me a quiz on Mathematics for Primary 6' },
  { icon: '🔬', text: 'Give me a Science quiz for Primary 5' },
  { icon: '🌍', text: 'Quiz me on Social Studies for Primary 4' },
  { icon: '🗣️', text: 'Help me practice English for Primary 3' },
  { icon: '🧮', text: 'Prepare a Math quiz on fractions' },
  { icon: '🇷🇼', text: 'Quiz me on Kinyarwanda grammar' },
  { icon: '💡', text: 'Explain photosynthesis in simple terms' },
  { icon: '📖', text: 'What is the water cycle?' },
];

export default function AlumniDean() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        from: 'dean',
        text: `Murakaza neza ${user?.name || ''}! 👋\n\nI'm Dean AI — your smart learning companion on UClass. I can:\n\n📚 Answer any question about your subjects\n🎯 Prepare quizzes on any topic & grade\n💡 Explain concepts simply\n📖 Help with homework step by step\n\nAsk me anything or try a suggestion below!`,
        time: new Date(),
      },
    ]);
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedQuiz, currentQ]);

  const sendMessage = async (overrideMsg) => {
    const userMsg = (overrideMsg || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userMsg, time: new Date() }]);
    setLoading(true);

    try {
      const lower = userMsg.toLowerCase();
      const isQuizRequest = /quiz|test|practice|prepare|exam|exercise|questions/i.test(userMsg);

      // Extract subject and grade
      let subject = null;
      let grade = null;
      let topic = null;

      const subjects = ['mathematics', 'math', 'english', 'kinyarwanda', 'science', 'social studies', 'social', 'french', 'ict', 'religion', 'geography', 'history', 'biology', 'chemistry', 'physics', 'entrepreneurship', 'photosynthesis', 'fractions', 'grammar', 'water cycle'];
      for (const s of subjects) {
        if (lower.includes(s)) {
          subject = s === 'math' ? 'mathematics' : s === 'social' ? 'social studies' : s;
          break;
        }
      }

      const gradeMatch = lower.match(/primary\s*(\d+)|p(\d+)|grade\s*(\d+)|level\s*(\d+)|(\d+)(?:th|rd|nd|st)?\s*grade/i);
      if (gradeMatch) {
        const num = gradeMatch[1] || gradeMatch[2] || gradeMatch[3] || gradeMatch[4] || gradeMatch[5];
        grade = `Primary ${num}`;
      }

      // Extract topic (e.g., "on fractions", "about photosynthesis")
      const topicMatch = userMsg.match(/(?:on|about|regarding)\s+([a-z\s]+)/i);
      if (topicMatch) topic = topicMatch[1].trim();

      if (isQuizRequest) {
        // ── QUIZ FLOW: First search teacher quizzes, then generate with AI ──
        setGenerating(true);
        setMessages(prev => [...prev, {
          from: 'dean',
          text: `Let me find the best quiz for you${subject ? ` on ${subject}` : ''}${grade ? ` · ${grade}` : ''}... 🔍\n\nSearching UClass teacher quizzes first, then I'll generate one with AI if needed!`,
          time: new Date(),
        }]);

        // 1. Search existing teacher quizzes
        let teacherQuizzes = [];
        try {
          const searchRes = await api.get(`/dean-ai/search-quizzes?subject=${encodeURIComponent(subject || '')}&grade=${encodeURIComponent(grade || '')}`, token);
          teacherQuizzes = searchRes.quizzes || [];
        } catch (e) { console.error('Search failed:', e.message); }

        if (teacherQuizzes.length > 0) {
          setGenerating(false);
          setMessages(prev => [...prev, {
            from: 'dean',
            text: `I found ${teacherQuizzes.length} quiz${teacherQuizzes.length > 1 ? 'zes' : ''} from UClass teachers! 🎯\n\nYou can take one of these, or I can generate a new AI quiz for you:`,
            quizzes: teacherQuizzes.slice(0, 4),
            canGenerate: true,
            genSubject: subject,
            genGrade: grade,
            genTopic: topic,
            time: new Date(),
          }]);
        } else {
          // No teacher quizzes found — generate with AI
          await generateAIQuiz(subject, grade, topic);
        }
      } else {
        // ── CHAT FLOW: Answer any question with AI ──
        try {
          const res = await api.post('/dean-ai/chat', { message: userMsg, history: messages.slice(-5).map(m => ({ role: m.from === 'dean' ? 'assistant' : 'user', content: m.text })) }, token);
          setMessages(prev => [...prev, {
            from: 'dean',
            text: res.reply || 'Sorry, I could not generate an answer. Please try again!',
            time: new Date(),
          }]);
        } catch (err) {
          setMessages(prev => [...prev, {
            from: 'dean',
            text: `I had trouble connecting to my AI brain. 😔\n\nPlease try again, or ask me to "Prepare a quiz" instead!`,
            time: new Date(),
          }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        from: 'dean',
        text: 'Sorry, something went wrong. Please try again! 🙏',
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  // ── Generate AI Quiz ──
  const generateAIQuiz = async (subject, grade, topic) => {
    setGenerating(true);
    try {
      setMessages(prev => [...prev, {
        from: 'dean',
        text: `No teacher quizzes found — I'll generate a smart quiz for you using AI! ✨\n\nCreating questions${subject ? ` on ${subject}` : ''}${grade ? ` for ${grade}` : ''}${topic ? ` · topic: ${topic}` : ''}...`,
        time: new Date(),
      }]);

      const res = await api.post('/dean-ai/generate-quiz', {
        subject: subject || 'General Knowledge',
        grade: grade || 'Primary 6',
        topic: topic || null,
        count: 5,
      }, token);

      if (res.quiz && res.questions) {
        setMessages(prev => [...prev, {
          from: 'dean',
          text: `✅ Your AI quiz is ready! 🎉\n\n"${res.quiz.title}"\n${res.questions.length} questions · ${subject || 'General'}${grade ? ` · ${grade}` : ''}\n\nClick below to start!`,
          aiQuiz: res.quiz,
          aiQuestions: res.questions,
          time: new Date(),
        }]);
      } else {
        throw new Error('No quiz returned');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        from: 'dean',
        text: `I couldn't generate a quiz right now. 😔\n\nError: ${err.message}\n\nPlease try again with a different subject!`,
        time: new Date(),
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const startQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setResult(null);
    setCurrentQ(0);
    setShowReview(false);
    try {
      const data = await api.get(`/dean-ai/quiz/${quiz.id}/questions`, token);
      setSelectedQuiz(data.quiz || quiz);
      setQuestions(data.questions || []);
    } catch (e) {
      alert('Failed to load quiz questions');
      setSelectedQuiz(null);
    }
  };

  // Start AI-generated quiz (questions already in message)
  const startAIQuiz = (quiz, quizQuestions) => {
    setSelectedQuiz(quiz);
    setQuestions(quizQuestions);
    setAnswers({});
    setResult(null);
    setCurrentQ(0);
    setShowReview(false);
  };

  const selectAnswer = (qId, answer) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const goNext = () => { if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1); };
  const goPrev = () => { if (currentQ > 0) setCurrentQ(currentQ - 1); };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    let correct = 0;
    questions.forEach((q) => {
      const correctAns = q.correct_answer || q.correctAnswer;
      if (answers[q.id] === correctAns) correct++;
    });
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    const feedback = questions.map((q) => {
      const correctAns = q.correct_answer || q.correctAnswer;
      return {
        question: q.question_text || q.question,
        yourAnswer: answers[q.id] || 'No answer',
        correctAnswer: correctAns,
        isCorrect: answers[q.id] === correctAns,
        explanation: q.explanation || 'Keep learning!',
        options: q.options || [],
      };
    });

    setResult({ score, correct, total: questions.length, feedback });
    setShowReview(true);
  };

  const resetChat = () => {
    setSelectedQuiz(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentQ(0);
    setShowReview(false);
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  // ── RESULT SCREEN ──
  const renderResult = () => {
    const pct = result.score;
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : pct >= 40 ? '👍' : '📚';
    const msg = pct >= 80 ? 'Superbe! Excellent work!' : pct >= 60 ? 'Wabigenje neza! Good job!' : pct >= 40 ? 'Gerageza cyane! Keep trying!' : 'Komeza wihatire! Study more!';
    const color = pct >= 70 ? '#27ae60' : pct >= 50 ? '#f59e0b' : '#e74c3c';
    const bgColor = pct >= 70 ? '#f0fff4' : pct >= 50 ? '#fffbeb' : '#fff0f0';

    return (
      <div style={DStyles.resultCard}>
        <div style={{ fontSize: 64, textAlign: 'center', marginBottom: 12 }}>{emoji}</div>
        <h2 style={DStyles.resultTitle}>{selectedQuiz?.title || 'Quiz'}</h2>
        <p style={DStyles.resultSub}>Dean AI Quiz · {result.total} questions</p>

        <div style={{ ...DStyles.scoreBox, background: bgColor, border: `3px solid ${color}` }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: '#222' }}>{result.correct}</span>
          <span style={{ fontSize: 24, color: '#888', margin: '0 6px' }}>/</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#555' }}>{result.total}</span>
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 6 }}>{pct}%</div>
        <div style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>{msg}</div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          <button onClick={() => setShowReview(r => !r)} style={DStyles.reviewBtn}>
            {showReview ? '▲ Hide Review' : '📋 Review My Answers'}
          </button>
          <button onClick={resetChat} style={DStyles.tryAgainBtn}>
            🔄 Try Another Quiz
          </button>
        </div>

        {showReview && (
          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#1e293b' }}>
              📋 Answer Review ({result.correct}/{result.total})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.feedback.map((f, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 12, padding: '16px 18px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  borderLeft: `4px solid ${f.isCorrect ? '#27ae60' : '#e74c3c'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ fontSize: 14 }}>Q{i + 1}: {f.question}</strong>
                    <span style={{ fontSize: 20 }}>{f.isCorrect ? '✅' : '❌'}</span>
                  </div>
                  {f.options.length > 0 ? f.options.map((opt) => {
                    const isCorrect = opt === f.correctAnswer;
                    const isGiven = opt === f.yourAnswer;
                    let bg = 'transparent', border = '#eee';
                    if (isCorrect) { bg = '#f0fff4'; border = '#27ae60'; }
                    else if (isGiven && !isCorrect) { bg = '#fff0f0'; border = '#e74c3c'; }
                    return (
                      <div key={opt} style={{ padding: '8px 12px', borderRadius: 7, background: bg, border: `1px solid ${border}`, marginBottom: 4, fontSize: 13 }}>
                        {opt}
                        {isCorrect && <span style={{ float: 'right', color: '#27ae60', fontWeight: 700 }}>✓ Correct</span>}
                        {isGiven && !isCorrect && <span style={{ float: 'right', color: '#e74c3c', fontWeight: 700 }}>✗ Your answer</span>}
                      </div>
                    );
                  }) : (
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      <div style={{ padding: '7px 12px', borderRadius: 7, background: f.isCorrect ? '#f0fff4' : '#fff0f0', border: `1px solid ${f.isCorrect ? '#27ae60' : '#e74c3c'}`, marginBottom: 4 }}>
                        Your answer: <strong>{f.yourAnswer}</strong>
                      </div>
                      {!f.isCorrect && (
                        <div style={{ padding: '7px 12px', borderRadius: 7, background: '#f0fff4', border: '1px solid #27ae60' }}>
                          Correct answer: <strong>{f.correctAnswer}</strong>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' }}>💡 {f.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── QUIZ TAKING VIEW ──
  const renderQuizTaking = () => {
    const q = questions[currentQ];
    if (!q) return null;
    const answered = !!answers[q.id];
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <div style={DStyles.quizContainer}>
        <div style={DStyles.quizHeader}>
          <div>
            <h3 style={DStyles.quizTitle}>{selectedQuiz?.title || 'Quiz'}</h3>
            <p style={DStyles.quizMeta}>{selectedQuiz?.is_ai_generated ? '✨ AI Generated' : 'Teacher Quiz'} · {questions.length} questions</p>
          </div>
          <button onClick={resetChat} style={DStyles.exitBtn}>✕ Exit</button>
        </div>

        <div style={DStyles.progressBar}>
          <div style={{ ...DStyles.progressFill, width: `${progress}%` }} />
        </div>

        <div style={DStyles.progressText}>
          Question {currentQ + 1} of {questions.length} · {answeredCount} answered
        </div>

        <div style={DStyles.questionCard}>
          <div style={DStyles.questionNumber}>Q{currentQ + 1}</div>
          <h3 style={DStyles.questionText}>{q.question_text || q.question}</h3>
          <div style={DStyles.optionsList}>
            {(q.options || []).map((opt, idx) => {
              const isSelected = answers[q.id] === opt;
              const letter = String.fromCharCode(65 + idx);
              return (
                <button
                  key={opt}
                  onClick={() => selectAnswer(q.id, opt)}
                  style={{
                    ...DStyles.optionBtn,
                    border: isSelected ? '2.5px solid #667eea' : '2px solid #e2e8f0',
                    background: isSelected ? '#eff6ff' : '#fff',
                  }}
                >
                  <span style={{
                    ...DStyles.optionLetter,
                    background: isSelected ? '#667eea' : '#f1f5f9',
                    color: isSelected ? '#fff' : '#64748b',
                  }}>{letter}</span>
                  <span style={{ fontSize: 15, color: '#1e293b' }}>{opt}</span>
                  {isSelected && <span style={{ marginLeft: 'auto', color: '#667eea', fontSize: 18 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={DStyles.navBar}>
          <button onClick={goPrev} disabled={currentQ === 0} style={{ ...DStyles.navBtn, opacity: currentQ === 0 ? 0.4 : 1, cursor: currentQ === 0 ? 'not-allowed' : 'pointer' }}>
            ← Previous
          </button>
          {currentQ < questions.length - 1 ? (
            <button onClick={goNext} disabled={!answered} style={{ ...DStyles.navBtnPrimary, opacity: !answered ? 0.4 : 1, cursor: !answered ? 'not-allowed' : 'pointer' }}>
              Next →
            </button>
          ) : (
            <button onClick={submitQuiz} disabled={!allAnswered} style={{ ...DStyles.submitBtn, opacity: !allAnswered ? 0.5 : 1, cursor: !allAnswered ? 'not-allowed' : 'pointer' }}>
              {allAnswered ? '✓ Submit Quiz' : `${answeredCount}/${questions.length} answered`}
            </button>
          )}
        </div>

        <div style={DStyles.dotsRow}>
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setCurrentQ(i)}
              style={{
                ...DStyles.dot,
                background: i === currentQ ? '#667eea' : answers[qq.id] ? '#27ae60' : '#e2e8f0',
                width: i === currentQ ? 28 : 10,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={DStyles.container}>
        {/* Header */}
        <div style={DStyles.header}>
          <div style={DStyles.headerAvatar}>🤖</div>
          <div>
            <h2 style={DStyles.headerTitle}>Dean AI</h2>
            <p style={DStyles.headerSub}>Your UClass smart learning companion ✨</p>
          </div>
          {selectedQuiz && (
            <button onClick={resetChat} style={DStyles.backBtn}>← Back to Chat</button>
          )}
        </div>

        {/* Content Area */}
        <div style={DStyles.contentArea}>
          {!selectedQuiz ? (
            <>
              {messages.map((msg, i) => (
                <div key={i} style={DStyles.msgRow}>
                  <div style={{ ...DStyles.msgAvatar, background: msg.from === 'dean' ? 'linear-gradient(135deg, #667eea, #764ba2)' : `hsl(${(user?.id || 1) * 137 % 360}, 60%, 50%)` }}>
                    {msg.from === 'dean' ? '🤖' : (user?.name || 'U')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={DStyles.msgMeta}>
                      <strong style={{ fontSize: 14 }}>{msg.from === 'dean' ? 'Dean AI' : user?.name || 'You'}</strong>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{
                      ...DStyles.msgBubble,
                      background: msg.from === 'dean' ? '#f8fafc' : '#eff6ff',
                      border: `1px solid ${msg.from === 'dean' ? '#e2e8f0' : '#bfdbfe'}`,
                    }}>
                      {msg.text}
                    </div>

                    {/* Teacher Quiz Cards */}
                    {msg.quizzes && msg.quizzes.length > 0 && (
                      <div style={DStyles.quizList}>
                        {msg.quizzes.map((quiz) => (
                          <button key={quiz.id} onClick={() => startQuiz(quiz)} style={DStyles.quizCard}>
                            <div style={DStyles.quizIcon}>🎯</div>
                            <div style={{ flex: 1 }}>
                              <div style={DStyles.quizCardTitle}>{quiz.title || quiz.subject || 'Quiz'}</div>
                              <div style={DStyles.quizCardMeta}>
                                {quiz.subject && <span>📚 {quiz.subject}</span>}
                                {quiz.question_count && <span> · {quiz.question_count} questions</span>}
                                {quiz.class_name && <span> · {quiz.class_name}</span>}
                              </div>
                            </div>
                            <span style={DStyles.quizStartBtn}>Start →</span>
                          </button>
                        ))}
                        {msg.canGenerate && (
                          <button onClick={() => generateAIQuiz(msg.genSubject, msg.genGrade, msg.genTopic)} style={{ ...DStyles.quizCard, border: '1.5px solid #a78bfa', background: '#f5f3ff' }}>
                            <div style={{ ...DStyles.quizIcon, background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>✨</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ ...DStyles.quizCardTitle, color: '#6d28d9' }}>Generate AI Quiz</div>
                              <div style={DStyles.quizCardMeta}>Let Dean AI create a custom quiz for you</div>
                            </div>
                            <span style={{ ...DStyles.quizStartBtn, color: '#7c3aed' }}>Generate →</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* AI Generated Quiz Card */}
                    {msg.aiQuiz && msg.aiQuestions && (
                      <div style={DStyles.quizList}>
                        <button onClick={() => startAIQuiz(msg.aiQuiz, msg.aiQuestions)} style={{ ...DStyles.quizCard, border: '2px solid #a78bfa', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }}>
                          <div style={{ ...DStyles.quizIcon, background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>✨</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...DStyles.quizCardTitle, color: '#6d28d9' }}>{msg.aiQuiz.title}</div>
                            <div style={DStyles.quizCardMeta}>🤖 AI Generated · {msg.aiQuestions.length} questions</div>
                          </div>
                          <span style={{ ...DStyles.quizStartBtn, color: '#7c3aed' }}>Start →</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={DStyles.msgRow}>
                  <div style={{ ...DStyles.msgAvatar, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>🤖</div>
                  <div style={DStyles.typingBubble}>
                    {generating ? (
                      <span style={{ fontSize: 14, color: '#64748b' }}>✨ Generating with AI...</span>
                    ) : (
                      <>
                        <div style={DStyles.typingDot} />
                        <div style={{ ...DStyles.typingDot, animationDelay: '0.2s' }} />
                        <div style={{ ...DStyles.typingDot, animationDelay: '0.4s' }} />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {messages.length <= 1 && !loading && (
                <div style={DStyles.suggestionsWrap}>
                  <p style={DStyles.suggestionsTitle}>💡 Try asking Dean AI:</p>
                  <div style={DStyles.suggestionsGrid}>
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s.text)} style={DStyles.suggestionBtn}>
                        <span style={{ fontSize: 20 }}>{s.icon}</span>
                        <span style={{ fontSize: 13, color: '#475569' }}>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </>
          ) : (
            <>
              {result ? renderResult() : renderQuizTaking()}
              <div ref={scrollRef} />
            </>
          )}
        </div>

        {/* Input */}
        {!selectedQuiz && (
          <div style={DStyles.inputBar}>
            <input
              type="text"
              placeholder="Ask Dean AI anything, or say 'Prepare a quiz on Math'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={DStyles.input}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={DStyles.sendBtn}>
              {loading ? '⏳' : '🚀'}
            </button>
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}

const DStyles = {
  container: { maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },

  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc, #fff)' },
  headerAvatar: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' },
  headerSub: { margin: 0, fontSize: 13, color: '#94a3b8' },
  backBtn: { marginLeft: 'auto', padding: '8px 16px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' },

  contentArea: { flex: 1, overflowY: 'auto', padding: 20 },

  msgRow: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' },
  msgAvatar: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  msgMeta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  msgBubble: { borderRadius: 16, padding: '14px 18px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: '#1e293b' },

  quizList: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 },
  quizCard: { display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  quizIcon: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  quizCardTitle: { fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 },
  quizCardMeta: { fontSize: 12, color: '#94a3b8' },
  quizStartBtn: { color: '#667eea', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' },

  typingBubble: { background: '#f8fafc', borderRadius: 16, padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', gap: 5, alignItems: 'center' },
  typingDot: { width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite' },

  suggestionsWrap: { marginTop: 12, padding: 16, background: '#f8fafc', borderRadius: 14 },
  suggestionsTitle: { fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 12 },
  suggestionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  suggestionBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'left' },

  inputBar: { display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #f1f5f9', background: '#fff' },
  input: { flex: 1, padding: '14px 18px', borderRadius: 24, border: '1.5px solid #e2e8f0', fontSize: 15, outline: 'none' },
  sendBtn: { padding: '14px 20px', borderRadius: 24, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 18 },

  quizContainer: { maxWidth: 640, margin: '0 auto' },
  quizHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  quizTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' },
  quizMeta: { margin: 0, fontSize: 13, color: '#94a3b8' },
  exitBtn: { padding: '8px 14px', borderRadius: 20, border: '1.5px solid #fecaca', background: '#fff', color: '#e74c3c', cursor: 'pointer', fontSize: 13, fontWeight: 600 },

  progressBar: { height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 3, transition: 'width 0.3s' },
  progressText: { fontSize: 13, color: '#64748b', marginBottom: 20, textAlign: 'center' },

  questionCard: { background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', marginBottom: 20 },
  questionNumber: { display: 'inline-block', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', padding: '4px 14px', borderRadius: 16, fontSize: 13, fontWeight: 700, marginBottom: 14 },
  questionText: { fontSize: 18, fontWeight: 700, color: '#1e293b', lineHeight: 1.5, margin: '0 0 20px' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  optionBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  optionLetter: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },

  navBar: { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  navBtn: { padding: '12px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 14 },
  navBtnPrimary: { padding: '12px 24px', borderRadius: 12, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, fontSize: 14 },
  submitBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #27ae60, #219a52)', color: '#fff', fontWeight: 700, fontSize: 15 },

  dotsRow: { display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' },
  dot: { height: 10, borderRadius: 5, border: 'none', cursor: 'pointer', transition: 'all 0.2s' },

  resultCard: { maxWidth: 580, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' },
  resultTitle: { margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#1e293b' },
  resultSub: { color: '#888', fontSize: 13, marginBottom: 20 },
  scoreBox: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20, padding: '18px 40px', marginBottom: 16 },
  reviewBtn: { padding: '10px 20px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  tryAgainBtn: { padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
};
