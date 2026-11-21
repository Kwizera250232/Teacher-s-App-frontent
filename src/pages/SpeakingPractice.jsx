import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, uploadFile } from '../api';

const LEVELS = [
  { id: 'easy', icon: '🌱', label: 'Easy' },
  { id: 'medium', icon: '🌿', label: 'Medium' },
  { id: 'hard', icon: '🌳', label: 'Hard' },
];

function ScoreRing({ score }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ width: 110, height: 110, borderRadius: '50%', margin: '0 auto',
      background: `conic-gradient(${color} ${score * 3.6}deg, #e2e8f0 0deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 86, height: 86, borderRadius: '50%', background: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  );
}

function Bar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>
        <span>{label}</span><span>{value ?? '—'}{value != null ? '/100' : ''}</span>
      </div>
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 6 }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value || 0))}%`, background: color, borderRadius: 6, transition: 'width .6s' }} />
      </div>
    </div>
  );
}

export default function SpeakingPractice() {
  const { token, user } = useAuth();
  const backPath = user?.role === 'teacher' || user?.role === 'head_teacher' ? '/teacher/dashboard' : '/student/dashboard';

  const [lang, setLang] = useState('en');
  const [mode, setMode] = useState(null);          // 'read' | 'talk'
  const [level, setLevel] = useState('easy');
  const [topics, setTopics] = useState([]);
  const [prompt, setPrompt] = useState(null);      // { topic, text } for read | topic string for talk
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedRef = useRef(0);

  const loadHistory = () => {
    api.get('/speaking/history', token).then(setHistory).catch(() => {});
  };
  useEffect(loadHistory, [token]);

  useEffect(() => {
    if (mode === 'talk') {
      api.get(`/speaking/topics?lang=${lang}`, token).then((d) => setTopics(d.topics || [])).catch(() => {});
    }
  }, [mode, lang, token]);

  const getPassage = async () => {
    setBusy(true); setBusyMsg('Preparing your passage…'); setError(''); setResult(null);
    try {
      const d = await api.get(`/speaking/passage?level=${level}&lang=${lang}`, token);
      setPrompt({ topic: d.topic, text: d.text });
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const pickTopic = (t) => { setPrompt({ topic: t, text: null }); setResult(null); setError(''); };

  const startRec = async () => {
    setError(''); setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        const dur = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setBusy(true); setBusyMsg('🧠 Listening and marking your speaking…');
        try {
          const fd = new FormData();
          const ext = (rec.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
          fd.append('audio', blob, `voice.${ext}`);
          fd.append('mode', mode);
          fd.append('lang', lang);
          fd.append('prompt', mode === 'read' ? prompt.text : prompt.topic);
          fd.append('duration_sec', String(dur));
          const r = await uploadFile('/speaking/attempt', fd, token);
          setResult(r);
          loadHistory();
        } catch (e) { setError(e.message); }
        setBusy(false);
      };
      rec.start();
      recRef.current = rec;
      startedRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        const s = Math.round((Date.now() - startedRef.current) / 1000);
        setElapsed(s);
        if (s >= 120) recRef.current?.stop(); // auto-stop after 2 minutes
      }, 500);
      setRecording(true);
    } catch {
      setError('Microphone is not available — allow mic access and try again.');
    }
  };
  const stopRec = () => { recRef.current?.stop(); setRecording(false); };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0f172a,#1e293b)', padding: '16px 14px 60px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Link to={backPath} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>← Back</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, color: '#fff' }}>🗣️ Speaking Practice</h1>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Record your voice — AI marks pronunciation & grammar</div>
          </div>
          <div style={{ display: 'flex', background: '#1e293b', borderRadius: 10, padding: 3 }}>
            {[['en', '🇬🇧 EN'], ['fr', '🇫🇷 FR']].map(([l, label]) => (
              <button key={l} onClick={() => { setLang(l); setPrompt(null); setResult(null); }}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: lang === l ? '#6366f1' : 'transparent', color: lang === l ? '#fff' : '#94a3b8' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode picker */}
        {!mode && (
          <div style={{ display: 'grid', gap: 12 }}>
            <button onClick={() => setMode('read')} style={{ textAlign: 'left', padding: '20px 18px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>
              <div style={{ fontSize: 26 }}>📖</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginTop: 4 }}>Read Aloud</div>
              <div style={{ fontSize: 13, opacity: .9, marginTop: 4 }}>Read a passage out loud — AI checks every word you say, your pace, and pronunciation.</div>
            </button>
            <button onClick={() => setMode('talk')} style={{ textAlign: 'left', padding: '20px 18px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff' }}>
              <div style={{ fontSize: 26 }}>🗣️</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginTop: 4 }}>Free Talk</div>
              <div style={{ fontSize: 13, opacity: .9, marginTop: 4 }}>Speak about a topic — AI marks your grammar, vocabulary and fluency like a real teacher.</div>
            </button>
          </div>
        )}

        {/* Read mode — pick level */}
        {mode === 'read' && !prompt && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>Choose your level:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {LEVELS.map((l) => (
                <button key={l.id} onClick={() => setLevel(l.id)}
                  style={{ flex: 1, minWidth: 90, padding: '14px 8px', borderRadius: 12, cursor: 'pointer', fontWeight: 700,
                    border: level === l.id ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                    background: level === l.id ? '#eef2ff' : '#fff' }}>
                  <div style={{ fontSize: 22 }}>{l.icon}</div>{l.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 15 }} onClick={getPassage} disabled={busy}>
              {busy ? busyMsg : '📄 Get my passage'}
            </button>
          </div>
        )}

        {/* Talk mode — pick topic */}
        {mode === 'talk' && !prompt && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>Pick a topic to talk about:</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Speak for 30–60 seconds — like you're telling a friend.</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {topics.map((t, i) => (
                <button key={i} onClick={() => pickTopic(t)}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  💬 {t}
                </button>
              ))}
              {!topics.length && <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading topics…</div>}
            </div>
          </div>
        )}

        {/* Practice screen */}
        {prompt && !result && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#312e81' }}>
                {mode === 'read' ? `📖 ${prompt.topic}` : `💬 ${prompt.topic}`}
              </div>
              <button onClick={() => { setPrompt(null); setResult(null); }} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                {mode === 'read' ? '↻ New passage' : '↻ New topic'}
              </button>
            </div>

            {mode === 'read' && (
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 18px',
                fontSize: 17, lineHeight: 1.9, color: '#1e293b', fontFamily: 'Georgia, serif', marginBottom: 16 }}>
                {prompt.text}
              </div>
            )}
            {mode === 'talk' && (
              <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 12, padding: '12px 14px',
                fontSize: 14, color: '#065f46', marginBottom: 16 }}>
                Speak naturally for 30–60 seconds. Don't worry about mistakes — that's how you learn!
              </div>
            )}

            {/* Recorder */}
            <div style={{ textAlign: 'center' }}>
              {recording && <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>⏺ {fmt(elapsed)} — speak now!</div>}
              <button
                onClick={recording ? stopRec : startRec}
                disabled={busy}
                style={{ width: 84, height: 84, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 34,
                  background: recording ? '#dc2626' : '#6366f1', color: '#fff',
                  boxShadow: recording ? '0 0 0 10px rgba(220,38,38,.15)' : '0 8px 24px rgba(99,102,241,.4)' }}>
                {recording ? '⏹' : '🎤'}
              </button>
              <div style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>
                {busy ? busyMsg : recording ? 'Tap to stop and get your marks' : 'Tap the mic and start speaking'}
              </div>
            </div>
          </div>
        )}

        {/* Result card */}
        {result && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <ScoreRing score={result.score} />
            {mode === 'read' && (
              <div style={{ marginTop: 16 }}>
                <Bar label="🎯 Accuracy — words said correctly" value={result.accuracy} color="#6366f1" />
                <Bar label="⏱ Pace" value={result.pace === 'good' ? 100 : result.pace === 'too fast' ? 60 : 40} color="#0ea5e9" />
                {result.wpm != null && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>~{result.wpm} words per minute — {result.pace}</div>}
                {(result.mispronounced?.length > 0 || result.missed?.length > 0) && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                    {result.mispronounced?.length > 0 && (
                      <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>
                        🗣 Practise saying: {result.mispronounced.map((w, i) => <strong key={i} style={{ marginRight: 6 }}>{w}</strong>)}
                      </div>
                    )}
                    {result.missed?.length > 0 && (
                      <div style={{ fontSize: 13, color: '#92400e' }}>⏭ You skipped: {result.missed.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {mode === 'talk' && (
              <div style={{ marginTop: 16 }}>
                <Bar label="✏️ Grammar" value={result.grammar} color="#6366f1" />
                <Bar label="📚 Vocabulary" value={result.vocabulary} color="#8b5cf6" />
                <Bar label="🌊 Fluency" value={result.fluency} color="#0ea5e9" />
                {result.mistakes?.length > 0 && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px', margin: '10px 0' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 6 }}>📝 Say it better:</div>
                    {result.mistakes.map((m, i) => (
                      <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>✗ "{m.said}"</span>
                        <span style={{ color: '#64748b' }}> → </span>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>✓ "{m.better}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {result.transcription && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', margin: '12px 0', fontSize: 13, color: '#475569' }}>
                <strong>👂 We heard:</strong> "{result.transcription}"
              </div>
            )}
            {result.feedback && <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6, marginBottom: 8 }}>{result.feedback}</div>}
            {result.tip && <div style={{ background: '#eef2ff', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#3730a3' }}>💡 <strong>Tip:</strong> {result.tip}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setResult(null); }}>🎤 Try again</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setPrompt(null); setResult(null); if (mode === 'read') getPassage(); }}>
                {mode === 'read' ? '📄 New passage' : '💬 New topic'}
              </button>
            </div>
          </div>
        )}

        {error && <div style={{ background: '#fef2f2', color: '#991b1b', borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 14 }}>{error}</div>}

        {/* Change mode */}
        {mode && (
          <button onClick={() => { setMode(null); setPrompt(null); setResult(null); }}
            style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            ← Switch between Read Aloud / Free Talk
          </button>
        )}

        {/* History */}
        {history?.attempts?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 15 }}>📈 Your progress</h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Best: {history.stats.best} · Avg: {history.stats.avg_score} · {history.stats.total} tries</span>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {history.attempts.slice(0, 10).map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e293b', borderRadius: 10, padding: '9px 12px' }}>
                  <span style={{ fontSize: 18 }}>{a.mode === 'read' ? '📖' : '💬'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.mode === 'read' ? 'Read aloud' : a.prompt}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(a.created_at).toLocaleString()}{a.wpm ? ` · ~${a.wpm} wpm` : ''}</div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: a.score >= 75 ? '#4ade80' : a.score >= 50 ? '#fbbf24' : '#f87171' }}>{a.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
