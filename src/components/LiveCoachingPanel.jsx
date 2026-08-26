import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import Whiteboard from './Whiteboard';
import { useCoachingAudio } from '../hooks/useCoachingAudio';

const POLL_MS = 3000;

// Shared button styles — explicit inline so CSS !important doesn't hide them
const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: '#667eea', color: '#fff', border: 'none', borderRadius: 8,
  padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  transition: 'background 0.2s', textDecoration: 'none',
};
const btnOutline = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'transparent', color: '#667eea', border: '2px solid #667eea',
  borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.2s', textDecoration: 'none',
};
const btnSm = { padding: '5px 12px', fontSize: 13 };
const btnDanger = { ...btnPrimary, ...btnSm, background: '#ef4444' };

// ── Audio Controls (mic + volume) ────────────────────────────────────────────
function AudioControls({ micOn, volume, audioEnabled, onToggleMic, onVolume, onToggleAudio, canSpeak, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {canSpeak && (
        <button
          onClick={onToggleMic}
          style={{
            ...btnSm, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
            background: micOn ? '#10b981' : '#e2e8f0', color: micOn ? '#fff' : '#64748b',
            border: 'none', borderRadius: 6, fontWeight: 700,
          }}
          title={micOn ? 'Mic is ON' : 'Mic is OFF'}
        >
          {micOn ? '🎙 ON' : '🔇 OFF'}
        </button>
      )}
      <button
        onClick={onToggleAudio}
        style={{
          ...btnSm, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
          background: audioEnabled ? '#3b82f6' : '#e2e8f0', color: audioEnabled ? '#fff' : '#64748b',
          border: 'none', borderRadius: 6, fontWeight: 700,
        }}
        title={audioEnabled ? 'Speaker ON' : 'Speaker OFF'}
      >
        {audioEnabled ? '🔊' : '🔈'}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => onVolume(Math.max(0, volume - 0.1))} style={{ ...btnSm, padding: '2px 8px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>−</button>
        <div style={{ width: 50, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${volume * 100}%`, height: '100%', background: '#3b82f6' }} />
        </div>
        <button onClick={() => onVolume(Math.min(1, volume + 0.1))} style={{ ...btnSm, padding: '2px 8px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>+</button>
      </div>
    </div>
  );
}

// ── Answer Timer ─────────────────────────────────────────────────────────────
function AnswerTimer({ seconds, startedAt }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!seconds || !startedAt) { setRemaining(0); return; }
    const calc = () => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setRemaining(Math.max(0, seconds - elapsed));
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [seconds, startedAt]);

  if (!seconds || !startedAt) return null;
  const pct = (remaining / seconds) * 100;
  const color = remaining <= 5 ? '#ef4444' : remaining <= 15 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <span style={{ fontSize: 16, fontWeight: 700, color }}>⏱ {remaining}s</span>
      <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 1s linear' }} />
      </div>
    </div>
  );
}

// ── Participant Avatar (used in grid and sidebar) ────────────────────────────
// ── Exercise displayed as original quiz UI (same as TakeQuiz) ─────────────────
function ExerciseOnBoard({ question, index, total, showAnswer, selectedAnswer, onSelectAnswer, onNext, isTeacher, answers = [] }) {
  if (!question) return null;
  const qtype = question.question_type || 'multiple_choice';
  const letters = ['a', 'b', 'c', 'd'].filter(l => question[`option_${l}`]);

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 10,
      overflowY: 'auto',
      padding: '16px 20px',
      boxSizing: 'border-box',
      background: 'rgba(255,255,255,0.98)',
    }}>
      <div className="quiz-question" style={{ marginBottom: 0 }}>
        {/* Reading passage */}
        {question.passage && qtype !== 'matching' && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 14, color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            <strong style={{ fontSize: 12, color: '#0369a1', display: 'block', marginBottom: 6 }}>Reading Passage</strong>
            {question.passage}
          </div>
        )}

        {/* Question header — same as quiz */}
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
          Q{index + 1}{total ? ` of ${total}` : ''}: {question.question}
        </h3>

        {/* Multiple choice — same as quiz system */}
        {qtype === 'multiple_choice' && (
          <div className="quiz-options">
            {letters.map(opt => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = showAnswer && question.correct_answer === opt;
              const isWrong = showAnswer && isSelected && !isCorrect;
              let cls = 'quiz-option';
              if (isSelected) cls += ' selected';
              if (isCorrect) cls += ' correct';
              if (isWrong) cls += ' wrong';
              return (
                <label key={opt} className={cls} onClick={() => !isTeacher && onSelectAnswer?.(opt)} style={isTeacher ? { cursor: 'default' } : {}}>
                  <span className="quiz-option-text">
                    <strong>{opt.toUpperCase()}.</strong> {question[`option_${opt}`]}
                  </span>
                  {isSelected && !showAnswer && (
                    <span className="quiz-option-check" aria-label="Selected">V</span>
                  )}
                  {isCorrect && <span style={{ color: '#27ae60', fontWeight: 700 }}>✅</span>}
                  {isWrong && <span style={{ color: '#e74c3c', fontWeight: 700 }}>❌</span>}
                </label>
              );
            })}
          </div>
        )}

        {/* True / False — same as quiz */}
        {qtype === 'true_false' && (
          <div className="quiz-options">
            {[{ val: 'a', label: 'True' }, { val: 'b', label: 'False' }].map(({ val, label }) => {
              const isSelected = selectedAnswer === val;
              const isCorrect = showAnswer && question.correct_answer === val;
              const isWrong = showAnswer && isSelected && !isCorrect;
              let cls = 'quiz-option';
              if (isSelected) cls += ' selected';
              if (isCorrect) cls += ' correct';
              if (isWrong) cls += ' wrong';
              return (
                <label key={val} className={cls} onClick={() => !isTeacher && onSelectAnswer?.(val)} style={{ fontSize: 15, fontWeight: 600, ...(isTeacher ? { cursor: 'default' } : {}) }}>
                  <span className="quiz-option-text">{label}</span>
                  {isSelected && !showAnswer && <span className="quiz-option-check" aria-label="Selected">V</span>}
                  {isCorrect && <span style={{ color: '#27ae60', fontWeight: 700 }}>✅</span>}
                  {isWrong && <span style={{ color: '#e74c3c', fontWeight: 700 }}>❌</span>}
                </label>
              );
            })}
          </div>
        )}

        {/* Fill in blank — same as quiz */}
        {qtype === 'fill_blank' && !isTeacher && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              value={selectedAnswer || ''}
              onChange={e => onSelectAnswer?.(e.target.value)}
              placeholder="Type your answer here..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: `2px solid ${selectedAnswer && selectedAnswer.trim() ? '#128c7e' : '#e2e8f0'}`, borderRadius: 9, fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        )}

        {/* Fill in blank — teacher view (read-only) */}
        {qtype === 'fill_blank' && isTeacher && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 9, border: '2px solid #e2e8f0', fontSize: 14, color: '#64748b' }}>
            Students type their answer here...
          </div>
        )}

        {/* Answer reveal for fill_blank */}
        {showAnswer && question.correct_answer && qtype === 'fill_blank' && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fff4', borderRadius: 6, border: '1px solid #27ae60', fontSize: 14 }}>
            Correct Answer: <strong>{question.correct_answer}</strong> ✅
          </div>
        )}

        {/* Submit + Next row — same as quiz flow */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          {!isTeacher && (
            <button
              onClick={onNext}
              style={{
                padding: '10px 24px', borderRadius: 9, border: 'none',
                background: '#128c7e', color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(18,140,126,0.3)',
              }}
            >
              Next →
            </button>
          )}
          {isTeacher && (
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Question {index + 1}{total ? ` of ${total}` : ''} — students answer and press Next
            </span>
          )}
          {showAnswer && (
            <span style={{ fontSize: 13, color: '#27ae60', fontWeight: 700 }}>✓ Answer revealed</span>
          )}
        </div>

        {/* Student answers + marks/feedback - visible to everyone on the board */}
        {answers.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f4c3a', marginBottom: 8 }}>
              Student Answers & Marks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {answers.map((a, i) => {
                const fb = a.requires_review ? 'review' : (a.is_correct ? 'correct' : 'incorrect');
                const fbColor = fb === 'correct' ? '#27ae60' : fb === 'incorrect' ? '#e74c3c' : '#f59e0b';
                const fbIcon = fb === 'correct' ? '✅' : fb === 'incorrect' ? '❌' : '⏳';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    background: fb === 'correct' ? '#f0fff4' : fb === 'incorrect' ? '#fff0f0' : '#fffbeb',
                    border: '1px solid ' + fbColor + '33',
                    fontSize: 14,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{a.name}</span>
                      <span style={{ color: '#64748b', fontSize: 13 }}>
                        Answer: <strong>{a.answer}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{fbIcon}</span>
                      <span style={{ fontWeight: 700, color: fbColor, fontSize: 14 }}>
                        {a.awarded_marks}/1 mark
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantAvatar({ p, size = 56, penHolder, speakPermission, handRaised, isSelf, onGivePen, onRevokePen, onGiveSpeak, onRevokeSpeak, isTeacher, compact }) {
  const hasPen = penHolder === p.student_id;
  const canSpeak = speakPermission === p.student_id;
  const raised = handRaised?.includes(p.student_id);
  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, #6366f1, #764ba2)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size > 40 ? 18 : 14, margin: '0 auto 4px',
        border: hasPen ? '3px solid #f59e0b' : canSpeak ? '3px solid #10b981' : '3px solid transparent',
        position: 'relative',
        boxShadow: canSpeak ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
      }}>
        {p.name?.charAt(0)?.toUpperCase()}
        {hasPen && <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: size > 40 ? 14 : 10 }}>✍️</span>}
        {canSpeak && <span style={{ position: 'absolute', top: -2, left: -2, fontSize: size > 40 ? 14 : 10 }}>🎙️</span>}
        {raised && <span style={{ position: 'absolute', top: -4, right: -4, fontSize: size > 40 ? 16 : 12, animation: 'bounce 1s infinite' }}>✋</span>}
      </div>
      {!compact && (
        <>
          <div style={{ fontSize: 11, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: size + 10 }}>
            {p.name?.split(' ')[0]}{isSelf && ' (You)'}
          </div>
          {isTeacher && (
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 2, flexWrap: 'wrap' }}>
              <button onClick={() => hasPen ? onRevokePen?.(p.student_id) : onGivePen?.(p.student_id)}
                style={{ fontSize: 9, padding: '1px 5px', border: '1px solid #e2e8f0', borderRadius: 4, background: hasPen ? '#fef3c7' : '#fff', cursor: 'pointer' }}>
                {hasPen ? 'Revoke Pen' : 'Give Pen'}
              </button>
              <button onClick={() => canSpeak ? onRevokeSpeak?.(p.student_id) : onGiveSpeak?.(p.student_id)}
                style={{ fontSize: 9, padding: '1px 5px', border: '1px solid #e2e8f0', borderRadius: 4, background: canSpeak ? '#d1fae5' : '#fff', cursor: 'pointer' }}>
                {canSpeak ? 'Mute' : 'Speak'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============ Teacher Panel: List + Create ============
export function LiveCoachingTeacherPanel({ classId, token, user, onError, onSuccess }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/classes/${classId}/coaching-sessions`, token);
      setSessions(data || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [classId, token]);

  useEffect(() => { load(); }, [load]);

  const loadCreateData = useCallback(async () => {
    try {
      const [qz, studs] = await Promise.all([
        api.get(`/classes/${classId}/quizzes`, token),
        api.get(`/classes/${classId}/classroom`, token),
      ]);
      setQuizzes(qz || []);
      setStudents(studs?.students || []);
    } catch (e) {
      onError?.(e.message || 'Could not load data.');
    }
  }, [classId, token]);

  useEffect(() => {
    if (showCreate) loadCreateData();
  }, [showCreate, loadCreateData]);

  if (activeSession) {
    return (
      <LiveCoachingWorkspace
        classId={classId}
        sessionId={activeSession}
        token={token}
        user={user}
        onExit={() => { setActiveSession(null); load(); }}
        onError={onError}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#0f4c3a' }}>🎓 Live Coaching Session</h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{ ...btnPrimary, fontSize: 14, padding: '8px 16px' }}
        >
          + New Session
        </button>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading sessions…</p>}

      {!loading && sessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <p>No coaching sessions yet. Create one to start a live session with your class.</p>
        </div>
      )}

      {sessions.length > 0 && (() => {
        const liveSessions = sessions.filter(s => s.status === 'live');
        const upcoming = sessions.filter(s => s.status === 'scheduled');
        const completed = sessions.filter(s => s.status === 'completed');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {liveSessions.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, color: '#ef4444', margin: '0 0 8px', fontWeight: 700 }}>🔴 Live Now ({liveSessions.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {liveSessions.map(s => <SessionCard key={s.id} session={s} classId={classId} token={token} onJoin={() => setActiveSession(s.id)} onError={onError} />)}
                </div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, color: '#3b82f6', margin: '0 0 8px', fontWeight: 700 }}>📅 Upcoming ({upcoming.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcoming.map(s => <SessionCard key={s.id} session={s} classId={classId} token={token} onJoin={() => setActiveSession(s.id)} onError={onError} />)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, color: '#10b981', margin: '0 0 8px', fontWeight: 700 }}>✓ Completed ({completed.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {completed.map(s => <SessionCard key={s.id} session={s} classId={classId} token={token} onJoin={() => setActiveSession(s.id)} onError={onError} />)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {showCreate && (
        <CreateSessionModal
          classId={classId}
          token={token}
          quizzes={quizzes}
          students={students}
          onClose={() => setShowCreate(false)}
          onCreated={(sid) => { setShowCreate(false); setActiveSession(sid); load(); }}
          onError={onError}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}

function SessionCard({ session, classId, token, onJoin, onError }) {
  const [results, setResults] = useState(null);
  const statusColor = {
    scheduled: '#3b82f6',
    live: '#ef4444',
    completed: '#10b981',
  };
  const statusBg = {
    scheduled: '#eff6ff',
    live: '#fef2f2',
    completed: '#f0fdf4',
  };

  const loadResults = async () => {
    try {
      const r = await api.get(`/classes/${classId}/coaching-sessions/${session.id}/results`, token);
      setResults(r);
    } catch (e) {
      onError?.(e.message);
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: `2px solid ${statusColor[session.status] || '#e2e8f0'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 17, color: '#1e293b' }}>{session.title}</h3>
          {session.topic && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Topic: {session.topic}</p>}
          {session.quiz_title && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b21a8' }}>Exercise: {session.quiz_title}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{
              background: statusBg[session.status] || '#f1f5f9',
              color: statusColor[session.status] || '#64748b',
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {session.status === 'live' && '🔴 '}{session.status?.toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: '#64748b', padding: '3px 8px' }}>
              👥 {session.participant_count || 0} attended
            </span>
            {session.scheduled_at && (
              <span style={{ fontSize: 12, color: '#64748b', padding: '3px 8px' }}>
                📅 {new Date(session.scheduled_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {session.status === 'scheduled' && (
            <button onClick={onJoin} style={btnPrimary}>Start Session</button>
          )}
          {session.status === 'live' && (
            <button onClick={onJoin} style={{ ...btnPrimary, background: '#ef4444' }}>Enter Session</button>
          )}
          {session.status === 'completed' && (
            <button onClick={loadResults} style={btnOutline}>View Results</button>
          )}
        </div>
      </div>

      {results && (
        <SessionResults results={results} />
      )}
    </div>
  );
}

function SessionResults({ results }) {
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f4c3a' }}>{results.attended_count}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Attended</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{results.total_questions}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Questions</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{results.class_average}%</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Class Average</div>
        </div>
      </div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>Student</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>Answered</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>Correct</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>Score</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {results.students.map((s, i) => (
            <tr key={i}>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{s.name}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{s.total_answered}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{s.correct_count}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{s.total_marks}/{results.total_questions}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: s.percentage >= 80 ? '#10b981' : s.percentage >= 50 ? '#f59e0b' : '#ef4444' }}>{s.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateSessionModal({ classId, token, quizzes, students, onClose, onCreated, onError, onSuccess }) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [quizId, setQuizId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [countOfficial, setCountOfficial] = useState(false);
  const [saving, setSaving] = useState(false);
  // AI question generation
  const [showAI, setShowAI] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [aiGrade, setAiGrade] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiApproved, setAiApproved] = useState(false);

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Generate AI questions for preview
  const generateAIPreview = async () => {
    if (!aiSubject.trim() || !aiGrade.trim()) {
      onError?.('Please select subject and grade for AI generation.');
      return;
    }
    setAiLoading(true);
    setAiApproved(false);
    try {
      const r = await api.post(`/classes/${classId}/ai-quiz/preview`, {
        content: `Generate ${aiNumQuestions} ${aiSubject} questions for ${aiGrade} level. Topic: ${topic || title || 'general'}.`,
        grade_level: aiGrade,
        subject: aiSubject,
      }, token);
      setAiPreview(r.questions || []);
    } catch (e) {
      onError?.(e.message || 'AI generation failed. You can still pick an existing quiz.');
    } finally {
      setAiLoading(false);
    }
  };

  // Create quiz from approved AI questions and link to session
  const createQuizFromAI = async () => {
    if (!aiPreview || aiPreview.length === 0) return;
    setAiLoading(true);
    try {
      const r = await api.post(`/classes/${classId}/ai-quiz/generate`, {
        content: `Generate ${aiPreview.length} ${aiSubject} questions for ${aiGrade} level. Topic: ${topic || title}.`,
        title: `${title || 'Coaching'} — AI Questions`,
        description: `AI-generated for coaching session: ${topic || title}`,
        subject: aiSubject,
        grade_level: aiGrade,
      }, token);
      // Link the new quiz
      if (r.quiz?.id) {
        setQuizId(String(r.quiz.id));
        setAiApproved(true);
        onSuccess?.(`AI quiz created with ${r.questions?.length || aiPreview.length} questions. Review complete — linked to session.`);
      }
    } catch (e) {
      onError?.(e.message || 'Could not create AI quiz.');
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) { onError?.('Please enter a session title.'); return; }
    setSaving(true);
    try {
      const result = await api.post(`/classes/${classId}/coaching-sessions`, {
        title: title.trim(),
        topic: topic.trim() || undefined,
        description: description.trim() || undefined,
        scheduled_at: scheduledAt || undefined,
        quiz_id: quizId ? parseInt(quizId) : undefined,
        invited_student_ids: selectedStudents.size > 0 ? [...selectedStudents] : undefined,
        count_toward_official: countOfficial,
      }, token);
      onSuccess?.('Session created. Students notified.');
      onCreated(result.id);
    } catch (e) {
      onError?.(e.message || 'Could not create session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px', color: '#0f4c3a' }}>Create Coaching Session</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Session Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Fractions Practice"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Topic</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Mathematics – Fractions"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will be covered?"
            rows={2}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Exercise / Quiz (optional)</label>
          <select
            value={quizId}
            onChange={e => setQuizId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
          >
            <option value="">No exercise (whiteboard only)</option>
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
          {quizId && (
            <p style={{ fontSize: 11, color: '#10b981', margin: '4px 0 0' }}>✓ Linked to existing quiz (original quiz won't be modified)</p>
          )}
        </div>

        {/* AI Question Generation */}
        <div style={{ marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setShowAI(!showAI)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #667eea', background: '#f0f2ff', color: '#667eea', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            🤖 Generate AI Questions {showAI ? '▲' : '▼'}
          </button>
          {showAI && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
                AI generates questions → you review & approve → quiz is created and linked to this session.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <select value={aiSubject} onChange={e => setAiSubject(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  <option value="">Subject…</option>
                  <option>Mathematics</option>
                  <option>English</option>
                  <option>Kinyarwanda</option>
                  <option>Science and Elementary Technology (SET)</option>
                  <option>Social and Religious Studies (SST)</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>Geography</option>
                  <option>History</option>
                </select>
                <select value={aiGrade} onChange={e => setAiGrade(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  <option value="">Grade…</option>
                  {['P1','P2','P3','P4','P5','P6','S1','S2','S3','S4','S5','S6'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: '#64748b' }}>Questions:</label>
                <select value={aiNumQuestions} onChange={e => setAiNumQuestions(parseInt(e.target.value))} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={generateAIPreview} disabled={aiLoading} style={{ ...btnPrimary, ...btnSm, marginLeft: 'auto' }}>
                  {aiLoading ? 'Generating…' : 'Preview Questions'}
                </button>
              </div>

              {/* AI Preview — teacher reviews before approving */}
              {aiPreview && aiPreview.length > 0 && (
                <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0f4c3a', margin: '0 0 8px' }}>
                    📋 Review {aiPreview.length} AI-generated questions:
                  </p>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {aiPreview.map((q, i) => (
                      <div key={i} style={{ padding: '6px 0', borderBottom: i < aiPreview.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12 }}>
                        <strong>Q{i + 1}.</strong> {q.question}
                        {q.correct_answer && <span style={{ color: '#10b981', marginLeft: 8 }}>→ {q.correct_answer}</span>}
                      </div>
                    ))}
                  </div>
                  {!aiApproved ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={createQuizFromAI} disabled={aiLoading} style={{ ...btnPrimary, ...btnSm }}>
                        {aiLoading ? 'Creating…' : '✓ Approve & Create Quiz'}
                      </button>
                      <button onClick={() => setAiPreview(null)} style={{ ...btnOutline, ...btnSm }}>Discard</button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#10b981', fontWeight: 600, margin: '8px 0 0' }}>
                      ✓ Approved! AI quiz created and linked to this session.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Invite Students (leave empty to invite whole class)
          </label>
          <div style={{ maxHeight: 150, overflowY: 'auto', border: '2px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
            {students.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={selectedStudents.has(s.id)}
                  onChange={() => toggleStudent(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={countOfficial} onChange={e => setCountOfficial(e.target.checked)} />
          Count toward official assessment
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btnOutline} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={submit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Teacher Live Session Workspace ============
function LiveCoachingWorkspace({ classId, sessionId, token, user, onExit, onError, onSuccess }) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWhiteboard, setShowWhiteboard] = useState(true);
  const [showExercises, setShowExercises] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const canvasRef = useRef(null);
  const saveTimer = useRef(null);

  // Load session detail
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/classes/${classId}/coaching-sessions/${sessionId}`, token);
        setSession(data);
        if (data.status === 'scheduled') {
          await api.put(`/classes/${classId}/coaching-sessions/${sessionId}`, { status: 'live' }, token);
        }
      } catch (e) {
        onError?.(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, sessionId, token]);

  // Poll state
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const s = await api.get(`/classes/${classId}/coaching-sessions/${sessionId}/state`, token);
        if (active) setState(s);
      } catch (e) { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => { active = false; clearInterval(interval); };
  }, [classId, sessionId, token]);

  const participants = state?.participants || [];
  const canSpeak = true; // Teacher can always speak

  // WebRTC audio
  const audio = useCoachingAudio({
    classId, sessionId, token, user, canSpeak, participants, isTeacher: true,
  });

  const updateState = async (changes) => {
    try {
      await api.put(`/classes/${classId}/coaching-sessions/${sessionId}/state`, changes, token);
    } catch (e) {
      onError?.(e.message);
    }
  };

  // Debounced whiteboard save
  const onWhiteboardChange = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        await updateState({ whiteboard_data: dataUrl });
      }
    }, 500);
  }, []);

  const finishSession = async () => {
    if (!confirm('Finish this coaching session? Results will be available.')) return;
    try {
      await api.post(`/classes/${classId}/coaching-sessions/${sessionId}/save-results`, {}, token);
      await api.put(`/classes/${classId}/coaching-sessions/${sessionId}`, { status: 'completed' }, token);
      onSuccess?.('Session completed and results saved.');
      onExit();
    } catch (e) {
      onError?.(e.message);
    }
  };

  const deleteSession = async () => {
    if (!confirm('DELETE this coaching session permanently? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? All data will be lost.')) return;
    try {
      await api.delete(`/classes/${classId}/coaching-sessions/${sessionId}`, token);
      onSuccess?.('Session deleted.');
      onExit();
    } catch (e) {
      onError?.(e.message);
    }
  };

  // Hand raise management
  const handRaised = state?.hand_raised ? (typeof state.hand_raised === 'string' ? JSON.parse(state.hand_raised) : state.hand_raised) : [];

  const startTimer = (secs) => {
    setTimerSeconds(secs);
    updateState({ answer_timer_seconds: secs, answer_timer_started_at: new Date().toISOString() });
  };
  const stopTimer = () => {
    setTimerSeconds(0);
    updateState({ answer_timer_seconds: null, answer_timer_started_at: null });
  };

  const toggleExercises = () => {
    const next = !showExercises;
    setShowExercises(next);
    updateState({ show_exercises: next });
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading session…</div>;

  const questions = session?.questions || [];
  const currentQ = state?.current_question;
  const penHolder = state?.pen_holder_id;
  const canDraw = !penHolder || penHolder === user.id;
  const isPaused = state?.is_paused;
  const groupSize = state?.question_group_size || 5;
  const currentIdx = state?.current_question_index || 0;
  const currentGroup = Math.floor(currentIdx / groupSize);
  const groupStart = currentGroup * groupSize;
  const groupEnd = Math.min(groupStart + groupSize, questions.length);
  const groupQuestions = questions.slice(groupStart, groupEnd);
  const speakPermission = state?.speak_permission_id;

  return (
    <div style={{ padding: '8px 0', minHeight: '60vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f4c3a' }}>🎓 {session?.title}</h2>
          {session?.topic && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{session.topic}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: isPaused ? '#fef3c7' : '#fef2f2', color: isPaused ? '#92400e' : '#ef4444', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            {isPaused ? '⏸ PAUSED' : '🔴 LIVE'}
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>👥 {participants.length}</span>
          {audio.connected && <span style={{ fontSize: 11, color: '#10b981' }}>🎙 {audio.peerCount}</span>}
        </div>
      </div>

      {/* Control bar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, padding: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <AudioControls
          micOn={audio.micOn} volume={audio.volume} audioEnabled={audio.audioEnabled}
          onToggleMic={audio.toggleMic} onVolume={audio.changeVolume} onToggleAudio={audio.toggleAudio}
          canSpeak={true} label="Teacher"
        />
        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
        <button style={{ ...btnOutline, ...btnSm }} onClick={() => setShowWhiteboard(!showWhiteboard)}>
          {showWhiteboard ? 'Hide Board' : 'Show Board'}
        </button>
        {questions.length > 0 && (
          <button style={{ ...btnSm, padding: '4px 10px', fontSize: 12, border: 'none', borderRadius: 6, cursor: 'pointer', background: showExercises ? '#667eea' : '#e2e8f0', color: showExercises ? '#fff' : '#64748b', fontWeight: 700 }} onClick={toggleExercises}>
            {showExercises ? '📋 Hide Exercises' : '📋 Show Exercises'}
          </button>
        )}
        <button style={{ ...btnOutline, ...btnSm }} onClick={() => updateState({ is_paused: !isPaused })}>
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        {/* Timer controls */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[30, 60, 120, 300].map(s => (
            <button key={s} onClick={() => startTimer(s)} style={{ ...btnSm, padding: '3px 8px', fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4, background: timerSeconds === s ? '#dbeafe' : '#fff', cursor: 'pointer' }}>
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
          {state?.answer_timer_seconds && <button onClick={stopTimer} style={{ ...btnSm, padding: '3px 8px', fontSize: 11, border: '1px solid #ef4444', borderRadius: 4, background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>Stop</button>}
        </div>
        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
        <button style={btnDanger} onClick={finishSession}>Finish</button>
        <button style={{ ...btnOutline, ...btnSm }} onClick={onExit}>Exit</button>
        <button style={{ ...btnSm, padding: '4px 10px', fontSize: 11, border: '1px solid #ef4444', borderRadius: 6, background: '#fff', color: '#ef4444', cursor: 'pointer' }} onClick={deleteSession}>🗑 Delete</button>
      </div>

      {/* Timer display */}
      {state?.answer_timer_seconds && state?.answer_timer_started_at && (
        <div style={{ marginBottom: 12 }}>
          <AnswerTimer seconds={state.answer_timer_seconds} startedAt={state.answer_timer_started_at} />
        </div>
      )}

      {/* Main area: whiteboard + participants */}
      <div style={{ display: 'flex', gap: 12, flexDirection: showWhiteboard ? 'row' : 'column' }}>
        {showWhiteboard && (
          <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative' }}>
            <Whiteboard
              live
              canDraw={canDraw}
              externalCanvasRef={canvasRef}
              onDataChange={onWhiteboardChange}
              initialData={state?.whiteboard_data}
              height={500}
            />
            {!canDraw && (
              <div style={{ padding: '6px 12px', background: '#fef3c7', fontSize: 12, color: '#92400e', textAlign: 'center' }}>
                ✍️ {state?.pen_holder_name} has the pen
              </div>
            )}

            {/* Exercises overlay ON the whiteboard */}
            {showExercises && currentQ && (
              <ExerciseOnBoard
                question={currentQ}
                index={currentIdx}
                total={questions.length}
                showAnswer={state?.show_answer}
                isTeacher={true}
              />
            )}
          </div>
        )}

        {/* Participants panel */}
        <div style={{
          padding: 8, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          minWidth: showWhiteboard ? 140 : '100%', maxWidth: showWhiteboard ? 200 : '100%',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'center', marginBottom: 8 }}>
            👥 Online ({participants.length})
          </div>
          <div style={{
            display: showWhiteboard ? 'flex' : 'grid',
            flexDirection: 'column',
            gridTemplateColumns: showWhiteboard ? 'none' : 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: showWhiteboard ? 8 : 16,
            overflowY: showWhiteboard ? 'auto' : 'visible',
            maxHeight: showWhiteboard ? 480 : 'none',
          }}>
            {participants.length === 0 && (
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: 12 }}>Waiting…</p>
            )}
            {participants.map(p => (
              <ParticipantAvatar
                key={p.student_id}
                p={p}
                size={showWhiteboard ? 40 : 64}
                penHolder={penHolder}
                speakPermission={speakPermission}
                handRaised={handRaised}
                isTeacher={true}
                compact={showWhiteboard}
                onGivePen={(sid) => updateState({ pen_holder_id: sid })}
                onRevokePen={() => updateState({ pen_holder_id: null })}
                onGiveSpeak={(sid) => updateState({ speak_permission_id: sid })}
                onRevokeSpeak={() => updateState({ speak_permission_id: null })}
              />
            ))}
          </div>
          {/* Hand-raised queue */}
          {handRaised.length > 0 && (
            <div style={{ marginTop: 8, padding: 6, background: '#fef3c7', borderRadius: 6, fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>✋ Raised hands:</div>
              {handRaised.map(sid => {
                const stu = participants.find(p => p.student_id === sid);
                return (
                  <div key={sid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                    <span>{stu?.name?.split(' ')[0] || 'Student'}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { updateState({ speak_permission_id: sid, hand_raised: handRaised.filter(id => id !== sid) }); }} style={{ fontSize: 9, padding: '1px 5px', border: '1px solid #10b981', borderRadius: 3, background: '#d1fae5', cursor: 'pointer' }}>Allow</button>
                      <button onClick={() => updateState({ hand_raised: handRaised.filter(id => id !== sid) })} style={{ fontSize: 9, padding: '1px 5px', border: '1px solid #e2e8f0', borderRadius: 3, background: '#fff', cursor: 'pointer' }}>Clear</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ============ Student Panel ============
export function LiveCoachingStudentPanel({ classId, token, user, onError, onSuccess }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/classes/${classId}/coaching-sessions`, token);
      setSessions(data || []);
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  }, [classId, token]);

  useEffect(() => { load(); }, [load]);

  if (activeSession) {
    return (
      <LiveCoachingStudentView
        classId={classId}
        sessionId={activeSession}
        token={token}
        user={user}
        onExit={() => { setActiveSession(null); load(); }}
        onError={onError}
      />
    );
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 22, color: '#0f4c3a' }}>🎓 Live Coaching Sessions</h2>

      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && sessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <p>No coaching sessions yet. When your teacher creates one, you'll see it here.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sessions.map(s => (
          <StudentSessionCard key={s.id} session={s} onJoin={() => setActiveSession(s.id)} />
        ))}
      </div>
    </div>
  );
}

function StudentSessionCard({ session, onJoin }) {
  const statusColor = { scheduled: '#3b82f6', live: '#ef4444', completed: '#10b981' };
  const statusBg = { scheduled: '#eff6ff', live: '#fef2f2', completed: '#f0fdf4' };

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: `2px solid ${session.is_invited ? statusColor[session.status] || '#e2e8f0' : '#f1f5f9'}`,
      opacity: session.is_invited ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{session.title}</h3>
          {session.topic && <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{session.topic}</p>}
          <span style={{
            background: statusBg[session.status], color: statusColor[session.status],
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-block', marginTop: 6,
          }}>
            {session.status === 'live' && '🔴 '}{session.status?.toUpperCase()}
          </span>
        </div>
        <div>
          {session.status === 'live' && session.is_invited && (
            <button style={{ ...btnPrimary, background: '#ef4444' }} onClick={onJoin}>Join Now</button>
          )}
          {session.status === 'scheduled' && session.is_invited && (
            <span style={{ fontSize: 13, color: '#3b82f6' }}>📅 Invited</span>
          )}
          {session.status === 'completed' && (
            <span style={{ fontSize: 13, color: '#10b981' }}>✓ Completed</span>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveCoachingStudentView({ classId, sessionId, token, user, onExit, onError }) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stateLoading, setStateLoading] = useState(true);
  const [myAnswer, setMyAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [handRaised, setHandRaised] = useState(false);
  const canvasRef = useRef(null);
  const saveTimer = useRef(null);

  // Join session
  useEffect(() => {
    (async () => {
      try {
        await api.post(`/classes/${classId}/coaching-sessions/${sessionId}/join`, {}, token);
        const data = await api.get(`/classes/${classId}/coaching-sessions/${sessionId}`, token);
        setSession(data);
      } catch (e) {
        onError?.(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      api.post(`/classes/${classId}/coaching-sessions/${sessionId}/leave`, {}, token).catch(() => {});
    };
  }, [classId, sessionId, token]);

  // Poll state
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const s = await api.get(`/classes/${classId}/coaching-sessions/${sessionId}/state`, token);
        if (active) {
          setState(s);
          setStateLoading(false);
          if (s.current_question?.id !== state?.current_question?.id) {
            setMyAnswer('');
            setFeedback(null);
          }
        }
      } catch (e) { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => { active = false; clearInterval(interval); };
  }, [classId, sessionId, token]);

  const participants = state?.participants || [];
  const hasSpeakPermission = state?.speak_permission_id === user.id;
  const handRaisedList = state?.hand_raised ? (typeof state.hand_raised === 'string' ? JSON.parse(state.hand_raised) : state.hand_raised) : [];

  // WebRTC audio — only connect if we have speak permission
  const audio = useCoachingAudio({
    classId, sessionId, token, user, canSpeak: hasSpeakPermission, participants, isTeacher: false,
  });

  // Debounced whiteboard save for student with pen
  const onWhiteboardChange = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        api.put(`/classes/${classId}/coaching-sessions/${sessionId}/state`, { whiteboard_data: dataUrl }, token).catch(() => {});
      }
    }, 500);
  }, [classId, sessionId, token]);

  const submitAnswer = async () => {
    if (!myAnswer.trim() || !state?.current_question) return;
    try {
      const result = await api.post(`/classes/${classId}/coaching-sessions/${sessionId}/answer`, {
        question_id: state.current_question.id,
        answer: myAnswer.trim(),
      }, token);
      setFeedback(result);
    } catch (e) {
      onError?.(e.message);
    }
  };

  // Hand raise
  const toggleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    const currentList = handRaisedList.filter(id => id !== user.id);
    if (next) currentList.push(user.id);
    api.put(`/classes/${classId}/coaching-sessions/${sessionId}/state`, { hand_raised: currentList }, token).catch(() => {});
  };

  // Student Next button — advance to next question via dedicated endpoint
  const studentNext = async () => {
    try {
      await api.post(`/classes/${classId}/coaching-sessions/${sessionId}/next-question`, {}, token);
    } catch (e) {
      onError?.(e.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 16 }}>Joining session…</div>;
  if (stateLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 16 }}>Loading live session…</div>;

  const currentQ = state?.current_question;
  const hasPen = state?.pen_holder_id === user.id;
  const canDraw = hasPen;
  const isLive = state?.status === 'live';
  const isPaused = state?.is_paused;
  const showExercises = state?.show_exercises;
  const penHolder = state?.pen_holder_id;
  const speakPermission = state?.speak_permission_id;

  if (!isLive) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 18, color: '#64748b' }}>This session is not live.</p>
        <button style={{ ...btnOutline, marginTop: 12 }} onClick={onExit}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0', minHeight: '60vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f4c3a' }}>🎓 {session?.title}</h2>
          <span style={{ background: isPaused ? '#fef3c7' : '#fef2f2', color: isPaused ? '#92400e' : '#ef4444', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            {isPaused ? '⏸ PAUSED' : '🔴 LIVE'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>👥 {participants.length} online</span>
          {audio.connected && <span style={{ fontSize: 11, color: '#10b981' }}>🎙 on</span>}
          <button style={{ ...btnSm, padding: '4px 10px', fontSize: 12, border: handRaised ? 'none' : '1px solid #f59e0b', borderRadius: 6, background: handRaised ? '#f59e0b' : '#fff', color: handRaised ? '#fff' : '#f59e0b', cursor: 'pointer', fontWeight: 700 }} onClick={toggleHandRaise}>
            {handRaised ? '✋ Lower' : '✋ Raise Hand'}
          </button>
          <button style={{ ...btnOutline, ...btnSm }} onClick={onExit}>Leave</button>
        </div>
      </div>

      {/* Audio controls + timer */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, padding: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <AudioControls
          micOn={audio.micOn} volume={audio.volume} audioEnabled={audio.audioEnabled}
          onToggleMic={audio.toggleMic} onVolume={audio.changeVolume} onToggleAudio={audio.toggleAudio}
          canSpeak={hasSpeakPermission}
        />
        {!hasSpeakPermission && <span style={{ fontSize: 11, color: '#94a3b8' }}>Raise hand to speak</span>}
        {hasSpeakPermission && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>🎙️ You can speak!</span>}
        {state?.answer_timer_seconds && state?.answer_timer_started_at && (
          <AnswerTimer seconds={state.answer_timer_seconds} startedAt={state.answer_timer_started_at} />
        )}
      </div>

      {/* Paused indicator */}
      {isPaused && (
        <div style={{ textAlign: 'center', padding: 20, color: '#92400e', fontSize: 16, fontWeight: 600 }}>
          ⏸ Session paused by teacher. Please wait…
        </div>
      )}

      {/* Whiteboard with exercises overlay */}
      {!isPaused && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
          <div style={{ padding: 8, borderBottom: '1px solid #e2e8f0', fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{hasPen ? '✍️ You have the pen!' : state?.pen_holder_name ? `${state.pen_holder_name} is writing…` : 'Watch the whiteboard'}</span>
            {hasSpeakPermission && <span style={{ color: '#10b981', fontWeight: 600 }}>🎙️ Speaking</span>}
          </div>
          <Whiteboard
            live
            canDraw={canDraw}
            externalCanvasRef={canvasRef}
            onDataChange={onWhiteboardChange}
            initialData={state?.whiteboard_data}
            height={500}
          />

          {/* Exercises overlay ON the whiteboard */}
          {showExercises && currentQ && (
            <ExerciseOnBoard
              question={currentQ}
              index={state?.current_question_index || 0}
              total={state?.total_questions}
              showAnswer={state?.show_answer}
              selectedAnswer={myAnswer}
              onSelectAnswer={setMyAnswer}
              onNext={studentNext}
              isTeacher={false}
            />
          )}
        </div>
      )}

      {/* Online participants grid — students see each other */}
      {!isPaused && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f4c3a' }}>👥 Online ({participants.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 12 }}>
            {participants.map(p => (
              <ParticipantAvatar
                key={p.student_id}
                p={p}
                size={48}
                penHolder={penHolder}
                speakPermission={speakPermission}
                handRaised={handRaisedList}
                isSelf={p.student_id === user.id}
                isTeacher={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paused indicator */}
      {isPaused && (
        <div style={{ textAlign: 'center', padding: 20, color: '#92400e', fontSize: 16, fontWeight: 600 }}>
          ⏸ Session paused by teacher. Please wait…
        </div>
      )}

      {/* Current Question */}
      {currentQ && !isPaused && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f4c3a' }}>Question {state.current_question_index + 1}</h3>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{currentQ.question}</p>

          {currentQ.question_type === 'multiple_choice' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {['a', 'b', 'c', 'd'].map(letter => {
                const opt = currentQ[`option_${letter}`];
                if (!opt) return null;
                return (
                  <button
                    key={letter}
                    onClick={() => setMyAnswer(letter)}
                    style={{
                      padding: '10px 14px', borderRadius: 8, border: `2px solid ${myAnswer === letter ? '#0f4c3a' : '#e2e8f0'}`,
                      background: myAnswer === letter ? '#f0fdf4' : '#fff', fontSize: 14, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <strong>{letter.toUpperCase()}.</strong> {opt}
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.question_type !== 'multiple_choice' && (
            <input
              type="text"
              value={myAnswer}
              onChange={e => setMyAnswer(e.target.value)}
              placeholder="Type your answer…"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
            />
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              style={{ ...btnPrimary, opacity: (!myAnswer.trim() || feedback) ? 0.6 : 1 }}
              onClick={submitAnswer}
              disabled={!myAnswer.trim() || feedback}
            >
              {feedback ? 'Submitted' : 'Submit Answer'}
            </button>

            {feedback?.feedback === 'correct' && (
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>✅ Correct! +1 mark</span>
            )}
            {feedback?.feedback === 'incorrect' && (
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 16 }}>❌ Incorrect</span>
            )}
            {feedback?.feedback === 'review' && (
              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>⏳ Waiting for teacher review</span>
            )}
          </div>

          {/* Show correct answer if teacher revealed it */}
          {state?.show_answer && currentQ.correct_answer && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 14, color: '#10b981', fontWeight: 600 }}>
              ✓ Correct Answer: {currentQ.correct_answer}
            </div>
          )}
        </div>
      )}

      {!currentQ && (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
          Waiting for teacher to show a question…
        </div>
      )}
    </div>
  );
}
