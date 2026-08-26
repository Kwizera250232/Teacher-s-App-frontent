import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

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

// Draw ruled lines on the whiteboard (like notebook paper for handwriting)
function drawRuledLines(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = '#c7e3f4';
  ctx.lineWidth = 1;
  const lineSpacing = 40;
  for (let y = lineSpacing; y < h; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // Red margin line on the left
  ctx.strokeStyle = '#f4c7c7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(50, h);
  ctx.stroke();
  ctx.restore();
}

// Initialize canvas with white background + ruled lines
function initCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRuledLines(ctx, canvas.width, canvas.height);
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

      {sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} classId={classId} token={token} onJoin={() => setActiveSession(s.id)} onError={onError} />
          ))}
        </div>
      )}

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

  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const midPos = useRef(null);
  const penColor = useRef('#1e293b');
  const penSize = useRef(3);

  // Load session detail
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/classes/${classId}/coaching-sessions/${sessionId}`, token);
        setSession(data);
        if (data.status === 'scheduled') {
          // Auto-start
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

  // Initialize canvas with ruled lines when whiteboard opens
  useEffect(() => {
    if (showWhiteboard && canvasRef.current && !state?.whiteboard_data) {
      initCanvas(canvasRef.current);
    }
  }, [showWhiteboard, state?.whiteboard_data]);

  // Load whiteboard data when it changes
  useEffect(() => {
    if (state?.whiteboard_data && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = state.whiteboard_data;
    }
  }, [state?.whiteboard_data]);

  const updateState = async (changes) => {
    try {
      await api.put(`/classes/${classId}/coaching-sessions/${sessionId}/state`, changes, token);
    } catch (e) {
      onError?.(e.message);
    }
  };

  const saveWhiteboard = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    await updateState({ whiteboard_data: dataUrl });
  };

  // Drawing handlers — smooth handwriting using quadratic curves
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0];
    const x = (touch ? touch.clientX : e.clientX) - rect.left;
    const y = (touch ? touch.clientY : e.clientY) - rect.top;
    return { x: x * (canvasRef.current.width / rect.width), y: y * (canvasRef.current.height / rect.height) };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    midPos.current = pos;
    // Draw a dot for single taps
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = penColor.current;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, penSize.current / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e) => {
    if (!isDrawing.current || !canvasRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    // Smooth stroke using quadratic curve through midpoint
    const mid = { x: (lastPos.current.x + pos.x) / 2, y: (lastPos.current.y + pos.y) / 2 };
    ctx.strokeStyle = penColor.current;
    ctx.lineWidth = penSize.current;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(midPos.current.x, midPos.current.y);
    ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, mid.x, mid.y);
    ctx.stroke();
    midPos.current = mid;
    lastPos.current = pos;
  };

  const endDraw = (e) => {
    if (isDrawing.current) {
      e?.preventDefault();
      isDrawing.current = false;
      saveWhiteboard();
    }
  };

  const clearBoard = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawRuledLines(ctx, canvasRef.current.width, canvasRef.current.height);
    saveWhiteboard();
  };

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

  return (
    <div style={{ padding: '8px 0', minHeight: '60vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f4c3a' }}>🎓 {session?.title}</h2>
          {session?.topic && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{session.topic}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            🔴 LIVE
          </span>
          <button style={{ ...btnOutline, ...btnSm }} onClick={() => setShowWhiteboard(!showWhiteboard)}>
            {showWhiteboard ? 'Hide Board' : 'Show Board'}
          </button>
          <button style={btnDanger} onClick={finishSession}>
            Finish
          </button>
          <button style={{ ...btnOutline, ...btnSm }} onClick={onExit}>Exit</button>
        </div>
      </div>

      {/* Main area: whiteboard or participants */}
      {showWhiteboard ? (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Whiteboard toolbar */}
          <div style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center' }}>
            {['#1e293b', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
              <button key={c} onClick={() => { penColor.current = c; }}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: penColor.current === c ? '3px solid #0f4c3a' : '2px solid #e2e8f0', cursor: 'pointer' }} />
            ))}
            <select onChange={e => { penSize.current = parseInt(e.target.value); }} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <option value="2">Fine pen</option>
              <option value="3" selected>Medium pen</option>
              <option value="5">Bold pen</option>
              <option value="10">Marker</option>
            </select>
            <button style={{ ...btnOutline, ...btnSm, fontSize: 12 }} onClick={clearBoard}>Clear</button>
            {penHolder && (
              <span style={{ fontSize: 12, color: '#6b21a8', marginLeft: 'auto' }}>
                ✍️ {state?.pen_holder_name} has the pen
              </span>
            )}
          </div>
          {/* Canvas — large writing surface with ruled lines */}
          <div style={{ position: 'relative', width: '100%', background: '#fff' }}>
            <canvas
              ref={canvasRef}
              width={1400}
              height={800}
              style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: canDraw ? 'crosshair' : 'default', background: '#fff' }}
              onMouseDown={canDraw ? startDraw : undefined}
              onMouseMove={canDraw ? draw : undefined}
              onMouseUp={canDraw ? endDraw : undefined}
              onMouseLeave={canDraw ? endDraw : undefined}
              onTouchStart={canDraw ? startDraw : undefined}
              onTouchMove={canDraw ? draw : undefined}
              onTouchEnd={canDraw ? endDraw : undefined}
            />
            {!canDraw && (
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: 12 }}>
                {state?.pen_holder_name} is drawing…
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Participants view */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 12, padding: 8 }}>
          {participants.length === 0 && (
            <p style={{ color: '#64748b', textAlign: 'center', gridColumn: '1 / -1' }}>Waiting for students to join…</p>
          )}
          {participants.map(p => (
            <div key={p.student_id} style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `linear-gradient(135deg, #6366f1, #764ba2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 auto 4px',
                border: penHolder === p.student_id ? '3px solid #f59e0b' : '3px solid transparent',
                position: 'relative',
              }}>
                {p.name?.charAt(0)?.toUpperCase()}
                {penHolder === p.student_id && (
                  <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 14 }}>✍️</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name?.split(' ')[0]}
              </div>
              <button
                onClick={() => updateState({ pen_holder_id: penHolder === p.student_id ? null : p.student_id })}
                style={{ fontSize: 10, padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: penHolder === p.student_id ? '#fef3c7' : '#fff', cursor: 'pointer', marginTop: 2 }}
              >
                {penHolder === p.student_id ? 'Revoke Pen' : 'Give Pen'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Question Controls */}
      {questions.length > 0 && (
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#0f4c3a' }}>
              Question {state?.current_question_index + 1 || 0} of {questions.length}
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={{ ...btnOutline, ...btnSm, opacity: (state?.current_question_index || 0) === 0 ? 0.5 : 1 }}
                disabled={(state?.current_question_index || 0) === 0}
                onClick={() => updateState({ current_question_index: (state?.current_question_index || 0) - 1, show_answer: false })}
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
                style={{ ...btnPrimary, ...btnSm, opacity: (state?.current_question_index || 0) >= questions.length - 1 ? 0.5 : 1 }}
                disabled={(state?.current_question_index || 0) >= questions.length - 1}
                onClick={() => updateState({ current_question_index: (state?.current_question_index || 0) + 1, show_answer: false })}
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
    // Leave on unmount
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
          // Reset answer when question changes
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

  // Initialize canvas with ruled lines if no saved data
  useEffect(() => {
    if (canvasRef.current && !state?.whiteboard_data) {
      initCanvas(canvasRef.current);
    }
  }, [state?.whiteboard_data]);

  // Render whiteboard
  useEffect(() => {
    if (state?.whiteboard_data && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = state.whiteboard_data;
    }
  }, [state?.whiteboard_data]);

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

  // Wait for state to load before deciding if live
  if (stateLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 16 }}>Loading live session…</div>;

  const currentQ = state?.current_question;
  const hasPen = state?.pen_holder_id === user.id;
  const canDraw = hasPen;
  const isLive = state?.status === 'live';

  // Drawing handlers for student with pen — smooth handwriting
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0];
    const x = (touch ? touch.clientX : e.clientX) - rect.left;
    const y = (touch ? touch.clientY : e.clientY) - rect.top;
    return { x: x * (canvasRef.current.width / rect.width), y: y * (canvasRef.current.height / rect.height) };
  };
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const midPos = useRef(null);

  const startDraw = (e) => {
    if (!canDraw) return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    midPos.current = pos;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  };
  const draw = (e) => {
    if (!canDraw || !isDrawing.current || !canvasRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    const mid = { x: (lastPos.current.x + pos.x) / 2, y: (lastPos.current.y + pos.y) / 2 };
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(midPos.current.x, midPos.current.y);
    ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, mid.x, mid.y);
    ctx.stroke();
    midPos.current = mid;
    lastPos.current = pos;
  };
  const endDraw = (e) => {
    if (isDrawing.current && canDraw) {
      e?.preventDefault();
      isDrawing.current = false;
      // Save whiteboard
      const dataUrl = canvasRef.current.toDataURL('image/png');
      api.put(`/classes/${classId}/coaching-sessions/${sessionId}/state`, { whiteboard_data: dataUrl }, token).catch(() => {});
    }
  };

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
          <span style={{ background: '#fef2f2', color: '#ef4444', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>🔴 LIVE</span>
        </div>
        <button style={{ ...btnOutline, ...btnSm }} onClick={onExit}>Leave</button>
      </div>

      {/* Whiteboard — large writing surface */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: 8, borderBottom: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
          {hasPen ? '✍️ You have the pen — write on the board!' : state?.pen_holder_name ? `${state.pen_holder_name} is writing…` : 'Watch the whiteboard'}
        </div>
        <canvas
          ref={canvasRef}
          width={1400}
          height={800}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: canDraw ? 'crosshair' : 'default', background: '#fff' }}
          onMouseDown={canDraw ? startDraw : undefined}
          onMouseMove={canDraw ? draw : undefined}
          onMouseUp={canDraw ? endDraw : undefined}
          onMouseLeave={canDraw ? endDraw : undefined}
          onTouchStart={canDraw ? startDraw : undefined}
          onTouchMove={canDraw ? draw : undefined}
          onTouchEnd={canDraw ? endDraw : undefined}
        />
      </div>

      {/* Current Question */}
      {currentQ && (
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
