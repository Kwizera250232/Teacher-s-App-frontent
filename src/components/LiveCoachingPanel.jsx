import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import Whiteboard from './Whiteboard';

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

  const updateState = async (changes) => {
    try {
      await api.put(`/classes/${classId}/coaching-sessions/${sessionId}/state`, changes, token);
    } catch (e) {
      onError?.(e.message);
    }
  };

  // Debounced whiteboard save — only save after drawing stops for 500ms
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

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading session…</div>;

  const questions = session?.questions || [];
  const currentQ = state?.current_question;
  const participants = state?.participants || [];
  const penHolder = state?.pen_holder_id;
  const canDraw = !penHolder || penHolder === user.id;
  const isPaused = state?.is_paused;
  const groupSize = state?.question_group_size || 5;
  const currentIdx = state?.current_question_index || 0;
  const currentGroup = Math.floor(currentIdx / groupSize);
  const groupStart = currentGroup * groupSize;
  const groupEnd = Math.min(groupStart + groupSize, questions.length);
  const groupQuestions = questions.slice(groupStart, groupEnd);

  return (
    <div style={{ padding: '8px 0', minHeight: '60vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f4c3a' }}>🎓 {session?.title}</h2>
          {session?.topic && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{session.topic}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            {isPaused ? '⏸ PAUSED' : '🔴 LIVE'}
          </span>
          <button style={{ ...btnOutline, ...btnSm }} onClick={() => setShowWhiteboard(!showWhiteboard)}>
            {showWhiteboard ? 'Hide Board' : 'Show Board'}
          </button>
          <button style={{ ...btnOutline, ...btnSm }} onClick={() => updateState({ is_paused: !isPaused })}>
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button style={btnDanger} onClick={finishSession}>
            Finish
          </button>
          <button style={{ ...btnOutline, ...btnSm }} onClick={onExit}>Exit</button>
        </div>
      </div>

      {/* Main area: whiteboard (auto-maximizes) + minimized participants */}
      <div style={{ display: 'flex', gap: 12, flexDirection: showWhiteboard ? 'row' : 'column' }}>
        {showWhiteboard && (
          <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
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
          </div>
        )}

        {/* Participants — minimized when whiteboard is open, full grid when closed */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 8,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          minWidth: showWhiteboard ? 120 : '100%',
          maxWidth: showWhiteboard ? 180 : '100%',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'center' }}>
            👥 {participants.length}
          </div>
          <div style={{
            display: showWhiteboard ? 'flex' : 'grid',
            flexDirection: 'column',
            gridTemplateColumns: showWhiteboard ? 'none' : 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: showWhiteboard ? 6 : 12,
            overflowY: showWhiteboard ? 'auto' : 'visible',
            maxHeight: showWhiteboard ? 480 : 'none',
          }}>
            {participants.length === 0 && (
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: 12 }}>Waiting…</p>
            )}
            {participants.map(p => (
              <div key={p.student_id} style={{ textAlign: 'center' }}>
                <div style={{
                  width: showWhiteboard ? 36 : 56, height: showWhiteboard ? 36 : 56, borderRadius: '50%',
                  background: `linear-gradient(135deg, #6366f1, #764ba2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: showWhiteboard ? 14 : 18, margin: '0 auto 4px',
                  border: penHolder === p.student_id ? '3px solid #f59e0b' : '3px solid transparent',
                  position: 'relative',
                }}>
                  {p.name?.charAt(0)?.toUpperCase()}
                  {penHolder === p.student_id && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 10 }}>✍️</span>
                  )}
                </div>
                {!showWhiteboard && (
                  <>
                    <div style={{ fontSize: 11, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name?.split(' ')[0]}
                    </div>
                    <button
                      onClick={() => updateState({ pen_holder_id: penHolder === p.student_id ? null : p.student_id })}
                      style={{ fontSize: 10, padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: penHolder === p.student_id ? '#fef3c7' : '#fff', cursor: 'pointer', marginTop: 2 }}
                    >
                      {penHolder === p.student_id ? 'Revoke Pen' : 'Give Pen'}
                    </button>
                  </>
                )}
                {showWhiteboard && penHolder === p.student_id && (
                  <button
                    onClick={() => updateState({ pen_holder_id: null })}
                    style={{ fontSize: 9, padding: '1px 4px', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fef3c7', cursor: 'pointer' }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
          {!showWhiteboard && participants.length > 0 && (
            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4 }}>
              Click a student to give/revoke pen
            </div>
          )}
        </div>
      </div>

      {/* Question Controls with progressive grouping */}
      {questions.length > 0 && (
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#0f4c3a' }}>
              Question {currentIdx + 1} of {questions.length}
              {questions.length > groupSize && (
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                  (Group {currentGroup + 1}: Q{groupStart + 1}–Q{groupEnd})
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                style={{ ...btnOutline, ...btnSm, opacity: currentIdx === 0 ? 0.5 : 1 }}
                disabled={currentIdx === 0}
                onClick={() => updateState({ current_question_index: currentIdx - 1, show_answer: false })}
              >
                ← Prev
              </button>
              <button
                style={{ ...btnOutline, ...btnSm }}
                onClick={() => updateState({ show_answer: !state?.show_answer })}
              >
                {state?.show_answer ? 'Hide Answer' : 'Show Answer'}
              </button>
              <button
                style={{ ...btnOutline, ...btnSm }}
                onClick={() => updateState({ is_paused: !isPaused })}
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                style={{ ...btnPrimary, ...btnSm, opacity: currentIdx >= questions.length - 1 ? 0.5 : 1 }}
                disabled={currentIdx >= questions.length - 1}
                onClick={() => updateState({ current_question_index: currentIdx + 1, show_answer: false })}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Current Question Display */}
          {currentQ && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>{currentQ.question}</p>
              {currentQ.question_type === 'multiple_choice' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  {['a', 'b', 'c', 'd'].map(letter => {
                    const opt = currentQ[`option_${letter}`];
                    if (!opt) return null;
                    const isCorrect = state?.show_answer && currentQ.correct_answer === letter;
                    return (
                      <div key={letter} style={{
                        padding: '10px 14px', borderRadius: 8, border: `2px solid ${isCorrect ? '#10b981' : '#e2e8f0'}`,
                        background: isCorrect ? '#f0fdf4' : '#fff', fontSize: 14,
                      }}>
                        <strong>{letter.toUpperCase()}.</strong> {opt}
                        {isCorrect && <span style={{ marginLeft: 8, color: '#10b981' }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {state?.show_answer && currentQ.correct_answer && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 14, color: '#10b981', fontWeight: 600 }}>
                  ✓ Correct Answer: {currentQ.correct_answer}
                </div>
              )}
            </div>
          )}

          {/* Progressive group preview — show which questions are in current group */}
          {questions.length > groupSize && (
            <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {groupQuestions.map((q, i) => {
                const qIdx = groupStart + i;
                return (
                  <button
                    key={qIdx}
                    onClick={() => updateState({ current_question_index: qIdx, show_answer: false })}
                    style={{
                      width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: qIdx === currentIdx ? '2px solid #0f4c3a' : '1px solid #e2e8f0',
                      background: qIdx === currentIdx ? '#0f4c3a' : '#fff',
                      color: qIdx === currentIdx ? '#fff' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
              {groupEnd < questions.length && (
                <button
                  onClick={() => updateState({ current_question_index: groupEnd, show_answer: false })}
                  style={{
                    width: 'auto', height: 32, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: '1px solid #667eea', background: '#f0f2ff', color: '#667eea', cursor: 'pointer',
                  }}
                >
                  Next group →
                </button>
              )}
            </div>
          )}
        </div>
      )}
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 16 }}>Joining session…</div>;
  if (stateLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 16 }}>Loading live session…</div>;

  const currentQ = state?.current_question;
  const hasPen = state?.pen_holder_id === user.id;
  const canDraw = hasPen;
  const isLive = state?.status === 'live';
  const isPaused = state?.is_paused;

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f4c3a' }}>🎓 {session?.title}</h2>
          <span style={{
            background: isPaused ? '#fef3c7' : '#fef2f2',
            color: isPaused ? '#92400e' : '#ef4444',
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
          }}>
            {isPaused ? '⏸ PAUSED' : '🔴 LIVE'}
          </span>
        </div>
        <button style={{ ...btnOutline, ...btnSm }} onClick={onExit}>Leave</button>
      </div>

      {/* Whiteboard — uses existing Whiteboard component */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: 8, borderBottom: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
          {hasPen ? '✍️ You have the pen — write on the board!' : state?.pen_holder_name ? `${state.pen_holder_name} is writing…` : 'Watch the whiteboard'}
        </div>
        <Whiteboard
          live
          canDraw={canDraw}
          externalCanvasRef={canvasRef}
          onDataChange={onWhiteboardChange}
          initialData={state?.whiteboard_data}
          height={500}
        />
      </div>

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
