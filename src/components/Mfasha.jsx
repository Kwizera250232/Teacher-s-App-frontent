import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../api';
import './Mfasha.css';

const LANGS = [
  { code: '', label: 'Auto' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Kiswahili' },
];

const QUICK = [
  'Who is struggling in my classes right now?',
  'Help me plan tomorrow’s lesson.',
  'Draft an announcement for my class.',
  'How do I record CAT marks in UClass?',
];

async function api(path, { method = 'GET', body, token, form } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: form ? { Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function md(text) {
  return String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/^\s*#{1,6}\s*(.+?)\s*#*\s*$/gm, '<strong class="mf-h">$1</strong>')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/^[\-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n/g, '<br/>');
}

export default function Mfasha({ user, token }) {
  const [classes, setClasses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [aiReady, setAiReady] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(-1);
  const [error, setError] = useState('');
  // research + slides
  const [researchOpen, setResearchOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [deck, setDeck] = useState(null);
  const [slide, setSlide] = useState(0);
  const [researching, setResearching] = useState(false);
  // parents (one-tap WhatsApp)
  const [parentPanel, setParentPanel] = useState(null); // {loading, cls, students, reason}
  // drafts (from alerts or parents tool)
  const [draftPanel, setDraftPanel] = useState(null); // {loading, drafts}
  const [statsPanel, setStatsPanel] = useState(null);
  const [openQuiz, setOpenQuiz] = useState(null);
  const [quizRunning, setQuizRunning] = useState('');
  const [toast, setToast] = useState('');

  const scrollRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const sendRef = useRef(null);

  useEffect(() => {
    api('/mfasha/overview', { token })
      .then((d) => { setClasses(d.classes || []); setAlerts(d.alerts || []); setAiReady(d.ai !== false); })
      .catch(() => setError('Could not load your classes. Check your connection.'));
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const say = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const send = useCallback(async (question) => {
    const q = (question ?? input).trim();
    if (!q || busy) return;
    setInput('');
    setError('');
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const { answer } = await api('/mfasha/ask', {
        method: 'POST', token,
        body: { question: q, lang, history: next.slice(-10).map((m) => ({ role: m.role, content: m.content })) },
      });
      setMessages([...next, { role: 'assistant', content: answer }]);
    } catch (e) {
      setError(e.message);
      setMessages(next);
    } finally {
      setBusy(false);
    }
  }, [input, busy, messages, lang, token]);
  sendRef.current = send;

  // ── voice note ──
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append('audio', blob, 'voice.webm');
          const { text } = await api('/mfasha/transcribe', { method: 'POST', token, form: fd });
          if (text) { setInput(''); sendRef.current?.(text); }
        } catch (e) {
          setError(e.message);
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setError('Microphone is not available — type your question instead.');
    }
  };
  const stopRec = () => { recRef.current?.stop(); setRecording(false); };

  const readAloud = (text, idx) => {
    const s = window.speechSynthesis;
    if (!s) return;
    if (speaking === idx) { s.cancel(); setSpeaking(-1); return; }
    s.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\*\*|__|[`#*>-]/g, ' ').slice(0, 4000));
    u.lang = { rw: 'rw-RW', en: 'en-US', fr: 'fr-FR', sw: 'sw-TZ' }[lang] || 'en-US';
    u.onend = () => setSpeaking(-1);
    s.speak(u);
    setSpeaking(idx);
  };

  const shareText = async (text, title = 'Mfasha') => {
    const clean = String(text).replace(/\*\*/g, '');
    try { if (navigator.share) { await navigator.share({ title, text: clean }); return; } } catch { /* cancelled */ }
    try { await navigator.clipboard.writeText(clean); say('Copied — paste it anywhere (WhatsApp, SMS, notes).'); }
    catch { say('Could not copy.'); }
  };

  // ── research + slides ──
  const research = async () => {
    if (!topic.trim() || researching) return;
    setResearching(true); setError(''); setDeck(null);
    try {
      const cls = classes[0] || {};
      const { deck } = await api('/mfasha/research', {
        method: 'POST', token,
        body: { topic: topic.trim(), subject: cls.subject, grade: cls.grade, lang },
      });
      setDeck(deck); setSlide(0); setResearchOpen(false);
      setMessages((m) => [...m, { role: 'assistant', content: `📚 Slide deck ready: **${deck.title}** — ${deck.slides?.length || 0} slides. Tap **Open slides** below to view or download.` }]);
    } catch (e) { setError(e.message); }
    finally { setResearching(false); }
  };

  const deckText = () => {
    if (!deck) return '';
    const lines = [`${deck.title}${deck.subtitle ? ` — ${deck.subtitle}` : ''}`, ''];
    deck.slides.forEach((s, i) => {
      lines.push(`Slide ${i + 1}: ${s.title}`);
      (s.bullets || []).forEach((b) => lines.push(`  • ${b}`));
      if (s.example) lines.push(`  Example: ${s.example}`);
      if (s.diagram) lines.push(`  Board diagram: ${s.diagram}`);
      lines.push('');
    });
    if (deck.activity) lines.push(`Activity: ${deck.activity}`);
    return lines.join('\n');
  };

  const downloadPptx = async () => {
    if (!deck) return;
    try {
      const { default: pptxgen } = await import('pptxgenjs');
      const p = new pptxgen();
      p.title = deck.title;
      const t = p.addSlide();
      t.addText(deck.title, { x: 0.6, y: 2, w: 8.8, fontSize: 34, bold: true, color: '1a4d8f', align: 'center' });
      if (deck.subtitle) t.addText(deck.subtitle, { x: 0.6, y: 3.4, w: 8.8, fontSize: 18, color: '555555', align: 'center' });
      t.addText(`Prepared by Mfasha — UClass · ${user?.name || 'Teacher'}`, { x: 0.6, y: 4.8, w: 8.8, fontSize: 12, color: '999999', align: 'center' });
      for (const s of deck.slides) {
        const sl = p.addSlide();
        sl.addText(s.title, { x: 0.5, y: 0.35, w: 9, fontSize: 24, bold: true, color: '1a4d8f' });
        const bullets = (s.bullets || []).map((b) => ({ text: b, options: { bullet: true, breakLine: true } }));
        sl.addText(bullets.length ? bullets : [{ text: ' ', options: {} }], { x: 0.6, y: 1.2, w: 8.8, fontSize: 16, color: '222222' });
        if (s.example) sl.addText(`🇷🇼 ${s.example}`, { x: 0.6, y: 4.4, w: 8.8, fontSize: 13, italic: true, color: '0a7a3d' });
        if (s.diagram) sl.addText(`Board: ${s.diagram}`, { x: 0.6, y: 4.9, w: 8.8, fontSize: 12, color: '8a5a00' });
        if (s.notes) sl.addNotes(s.notes);
      }
      if (deck.activity) {
        const a = p.addSlide();
        a.addText('Class activity', { x: 0.5, y: 0.35, w: 9, fontSize: 24, bold: true, color: '1a4d8f' });
        a.addText(deck.activity, { x: 0.6, y: 1.4, w: 8.8, fontSize: 18, color: '222222' });
      }
      await p.writeFile({ fileName: `${(deck.title || 'lesson').replace(/[^\w\s-]/g, '').slice(0, 60)}.pptx` });
      say('Slide deck downloaded — open it in PowerPoint or on your phone.');
    } catch (e) {
      console.error(e);
      shareText(deckText(), deck.title);
      say('Could not make the .pptx file — shared the deck as text instead.');
    }
  };

  // ── revision quiz from an alert ──
  const makeQuiz = async (alert) => {
    setQuizRunning(alert.id); setError('');
    try {
      const { quiz, questions } = await api('/mfasha/revision-quiz', {
        method: 'POST', token,
        body: { class_id: alert.class_id, topic: alert.topic || alert.subject || alert.title, lang },
      });
      say(`"${quiz.title}" added to ${alert.class_name} — find it in the class Quizzes tab.`);
    } catch (e) { setError(e.message); }
    finally { setQuizRunning(''); }
  };

  // ── parent drafts ──
  const openDrafts = async (alert) => {
    setDraftPanel({ loading: true, drafts: [] });
    try {
      const { drafts } = await api('/mfasha/parent-drafts', {
        method: 'POST', token,
        body: { student_ids: (alert.students || []).map((s) => s.id), reason: alert.title, lang: lang || 'rw' },
      });
      setDraftPanel({ loading: false, drafts: drafts.map((d) => ({ ...d, sent: [] })) });
    } catch (e) { setDraftPanel(null); setError(e.message); }
  };

  const openParents = async (classId) => {
    setParentPanel({ loading: true, cls: classId, students: [], reason: '' });
    try {
      const { class: cls, students } = await api(`/mfasha/class/${classId}/parents`, { token });
      setParentPanel({ loading: false, cls, students, reason: 'I want to update you about your child’s progress.' });
    } catch (e) { setParentPanel(null); setError(e.message); }
  };

  const draftForClass = async () => {
    if (!parentPanel) return;
    const students = parentPanel.students;
    setParentPanel(null);
    setDraftPanel({ loading: true, drafts: [] });
    try {
      const contacts = students.flatMap((s) => (s.parents || []).filter((p) => p.phone && !p.id).map((p) => ({ student_id: s.id, name: p.name, phone: p.phone })));
      const { drafts } = await api('/mfasha/parent-drafts', {
        method: 'POST', token,
        body: { student_ids: students.map((s) => s.id).slice(0, 30), reason: parentPanel.reason, contacts, lang: lang || 'rw' },
      });
      setDraftPanel({ loading: false, drafts: drafts.map((d) => ({ ...d, sent: [] })) });
    } catch (e) { setDraftPanel(null); setError(e.message); }
  };

  const approveSend = async (d, parent) => {
    try {
      await api('/mfasha/send-parent', {
        method: 'POST', token,
        body: { student_id: d.student.id, parent_id: parent.id, message: d.message },
      });
      setDraftPanel((p) => p && ({ ...p, drafts: p.drafts.map((x) => x === d ? { ...x, sent: [...x.sent, parent.id] } : x) }));
      say(`Sent to ${parent.name} in the parent app.`);
    } catch (e) { setError(e.message); }
  };

  const waLink = (phone, message) => {
    const num = String(phone || '').replace(/\D/g, '').replace(/^0/, '250');
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  };

  const openStats = async () => {
    setStatsPanel({ loading: true, classes: [] });
    setOpenQuiz(null);
    try {
      const { classes } = await api('/mfasha/stats', { token });
      setStatsPanel({ loading: false, classes });
    } catch (e) { setStatsPanel(null); setError(e.message); }
  };

  return (
    <div className="mfasha">
      {/* ── slim top bar ── */}
      <header className="mf-head">
        <div className="mf-avatar">MF</div>
        <div className="mf-head-txt">
          <h2>Mfasha</h2>
          <p>{aiReady ? 'Your teaching assistant' : 'AI is not configured on the server yet.'}</p>
        </div>
        <div className="mf-head-right">
          <button className="mf-stats-btn" onClick={openStats}>📊 Stats</button>
          <select className="mf-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </header>

      {/* ── smart alerts strip (compact, scrolls sideways) ── */}
      {alerts.length > 0 && (
        <div className="mf-strip">
          {alerts.map((a) => (
            <div key={a.id} className={`mf-chip mf-${a.severity}`}>
              <div className="mf-chip-txt">
                <strong>{a.title}</strong>
                <span>{a.students.slice(0, 6).map((s) => s.pct != null ? `${s.name} ${s.pct}%` : s.name).join(' · ')}{a.students.length > 6 ? ` +${a.students.length - 6}` : ''}</span>
              </div>
              <div className="mf-chip-btns">
                <button disabled={quizRunning === a.id} onClick={() => makeQuiz(a)}>{quizRunning === a.id ? '…' : '📝 Quiz'}</button>
                <button className="mf-wa-chip" onClick={() => openDrafts(a)}>💬 Parents</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── the conversation: full width ── */}
      <section className="mf-chat" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="mf-welcome">
            <p>Muraho{user?.name ? ` ${String(user.name).split(' ')[0]}` : ''}! I can see your <strong>{classes.length} class{classes.length === 1 ? '' : 'es'}</strong> and their real results.<br />Ask me anything about your work or UClass — or hold 🎤 and just talk.</p>
            <div className="mf-quick">
              {QUICK.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`mf-msg mf-${m.role}`}>
            {m.role === 'assistant' && <div className="mf-mini-avatar">MF</div>}
            <div className="mf-bubble-wrap">
              <div className="mf-bubble" dangerouslySetInnerHTML={{ __html: md(m.content) }} />
              {m.role === 'assistant' && (
                <div className="mf-msg-tools">
                  {m.content.includes('Slide deck ready') && deck && <button onClick={() => setDeck(deck)}>📽 Open slides</button>}
                  <button title="Read aloud" onClick={() => readAloud(m.content, i)}>{speaking === i ? '⏹ Stop' : '🔊 Listen'}</button>
                  <button title="Share / copy" onClick={() => shareText(m.content)}>📤 Share</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="mf-msg mf-assistant"><div className="mf-mini-avatar">MF</div><div className="mf-bubble mf-typing"><span /><span /><span /></div></div>}
        {researching && <div className="mf-msg mf-assistant"><div className="mf-mini-avatar">MF</div><div className="mf-bubble">🔍 Researching and building your slides…</div></div>}
      </section>

      {error && <div className="mf-error">⚠ {error}</div>}

      {/* ── tools row (like ChatGPT's + tools) ── */}
      <div className="mf-tools">
        <button onClick={() => setResearchOpen((v) => !v)}>🔍 Research + Slides</button>
        <button onClick={openStats}>📊 Stats</button>
        <button className="mf-tool-parents" onClick={() => setParentPanel({ pick: true })}>💬 WhatsApp Parents</button>
      </div>

      {/* ── research input panel ── */}
      {researchOpen && (
        <div className="mf-research">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && research()}
            placeholder="Topic for tomorrow — e.g. “Photosynthesis” or “Kubika amafaranga”…"
            autoFocus
          />
          <button onClick={research} disabled={researching || !topic.trim()}>
            {researching ? 'Researching…' : '➤'}
          </button>
        </div>
      )}

      {/* ── composer ── */}
      <footer className="mf-input">
        <button
          className={`mf-mic ${recording ? 'on' : ''}`}
          onMouseDown={startRec} onMouseUp={stopRec} onMouseLeave={recording ? stopRec : undefined}
          onTouchStart={(e) => { e.preventDefault(); startRec(); }} onTouchEnd={stopRec}
          title="Hold to record a voice note"
        >{transcribing ? '…' : '🎤'}</button>
        {recording ? (
          <div className="mf-wave" aria-label="Recording">
            {Array.from({ length: 24 }).map((_, i) => <span key={i} style={{ animationDelay: `${(i % 8) * 0.09}s` }} />)}
            <em>Listening… release 🎤 to send</em>
          </div>
        ) : (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={transcribing ? 'Writing your words…' : 'Ask Mfasha — your classes, lessons, marks, parents…'}
          />
        )}
        <button className="mf-send" onClick={() => send()} disabled={busy || !input.trim()}>➤</button>
      </footer>

      {/* ── slide deck viewer (full modal, presentation style) ── */}
      {deck && (
        <div className="mf-modal" onClick={() => setDeck(null)}>
          <div className="mf-modal-card mf-deck-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head">
              <strong>{deck.title}{deck.subtitle ? <span className="mf-dim"> · {deck.subtitle}</span> : null}</strong>
              <span className="mf-deck-actions">
                <button onClick={downloadPptx}>⬇ Slides (.pptx)</button>
                <button onClick={() => shareText(deckText(), deck.title)}>📤 Share</button>
                <button onClick={() => setDeck(null)}>✕</button>
              </span>
            </div>
            <div className="mf-slide">
              <div className="mf-slide-num">{slide + 1} / {deck.slides.length}</div>
              <h4>{deck.slides[slide]?.title}</h4>
              <ul>{(deck.slides[slide]?.bullets || []).map((b, i) => <li key={i}>{b}</li>)}</ul>
              {deck.slides[slide]?.example && <p className="mf-example">🇷🇼 {deck.slides[slide].example}</p>}
              {deck.slides[slide]?.diagram && <p className="mf-diagram">✏️ Board: {deck.slides[slide].diagram}</p>}
            </div>
            <div className="mf-slide-nav mf-slide-bar">
              <button disabled={slide === 0} onClick={() => setSlide(slide - 1)}>← Prev</button>
              <div className="mf-dots">{deck.slides.map((_, i) => <span key={i} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} />)}</div>
              <button disabled={slide >= deck.slides.length - 1} onClick={() => setSlide(slide + 1)}>Next →</button>
            </div>
            {deck.activity && <p className="mf-activity">🏃 Activity: {deck.activity}</p>}
            {deck.sources?.length > 0 && (
              <p className="mf-sources">Sources: {deck.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer">{s.title || s.url}</a>
              )).reduce((a, b) => [a, ' · ', b])}</p>
            )}
          </div>
        </div>
      )}

      {/* ── pick a class for parent messaging ── */}
      {parentPanel?.pick && (
        <div className="mf-modal" onClick={() => setParentPanel(null)}>
          <div className="mf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head"><strong>💬 Message parents — pick a class</strong><button onClick={() => setParentPanel(null)}>✕</button></div>
            <div className="mf-drafts">
              {classes.map((c) => (
                <button key={c.id} className="mf-classpick" onClick={() => openParents(c.id)}>
                  {c.name}{c.subject ? ` — ${c.subject}` : ''} <span>{c.students} students</span>
                </button>
              ))}
              {classes.length === 0 && <p className="mf-pad">No classes yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── parent picker: students + reason ── */}
      {parentPanel && !parentPanel.pick && (
        <div className="mf-modal" onClick={() => setParentPanel(null)}>
          <div className="mf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head"><strong>💬 Parents of {parentPanel.cls?.name || '…'}</strong><button onClick={() => setParentPanel(null)}>✕</button></div>
            {parentPanel.loading ? <p className="mf-pad">Loading students & parents…</p> : (
              <div className="mf-drafts">
                <textarea
                  className="mf-reason"
                  rows={2}
                  value={parentPanel.reason}
                  onChange={(e) => setParentPanel((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="What is this update about? e.g. exam results, attendance, encouragement…"
                />
                <button className="mf-genbtn" onClick={draftForClass}>✨ Draft personal messages for all parents</button>
                <p className="mf-dim mf-center">— or message one parent directly —</p>
                {parentPanel.students.map((s) => (
                  <div key={s.id} className="mf-studentline">
                    <strong>{s.name}</strong>
                    {(s.parents || []).length === 0 && <em className="mf-dim">no parent linked</em>}
                    {(s.parents || []).map((p) => (
                      <span key={p.id || p.phone} className="mf-parentline">
                        <span>{p.name}</span>
                        {p.phone && <a className="mf-wa" href={waLink(p.phone, `Muraho ${p.name}, I am ${user?.name || 'the teacher'} of ${s.name} (${parentPanel.cls?.name}). `)} target="_blank" rel="noreferrer">WhatsApp</a>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── stats modal ── */}
      {statsPanel && (
        <div className="mf-modal" onClick={() => setStatsPanel(null)}>
          <div className="mf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head"><strong>📊 Marks &amp; quiz statistics</strong><button onClick={() => setStatsPanel(null)}>✕</button></div>
            {statsPanel.loading ? <p className="mf-pad">Reading your marks…</p> : (
              <div className="mf-drafts">
                {statsPanel.classes.map((c) => (
                  <div key={c.id} className="mf-statclass">
                    <strong>{c.name}{c.subject ? ` — ${c.subject}` : ''} <span>{c.students} students</span></strong>
                    {c.cat ? (
                      <div className="mf-statrow">
                        <span>📝 Marks sheet “{c.sheet}” — {c.tests} test{c.tests === 1 ? '' : 's'}, {c.students} marked</span>
                        <b>Avg {c.avg}% · Top {c.high}% · Low {c.low}%</b>
                      </div>
                    ) : <p className="mf-noparent">No marks recorded on the active sheet yet.</p>}
                    {c.quizzes.length > 0 ? c.quizzes.map((q) => (
                      <div key={q.id} className="mf-statrow mf-quizrow" onClick={() => setOpenQuiz(openQuiz === q.id ? null : q.id)}>
                        <span>🧠 {q.title} <small>{q.students}/{q.members} took it</small></span>
                        <b>Avg {q.avg}% · Pass {q.pass}% <i>{openQuiz === q.id ? '▲' : '▼'}</i></b>
                        {openQuiz === q.id && (
                          <div className="mf-quizdetail">
                            <span>🏆 Top: {q.top.map((x) => `${x.name} ${x.pct}%`).join(', ') || '—'}</span>
                            <span>🌱 Needs help: {q.bottom.map((x) => `${x.name} ${x.pct}%`).join(', ') || '—'}</span>
                          </div>
                        )}
                      </div>
                    )) : <p className="mf-noparent">No quiz attempts yet.</p>}
                  </div>
                ))}
                {statsPanel.classes.length === 0 && <p className="mf-pad">No classes yet.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── approve & send parent drafts ── */}
      {draftPanel && (
        <div className="mf-modal" onClick={() => setDraftPanel(null)}>
          <div className="mf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head">
              <strong>Parent updates — approve each before it goes</strong>
              <button onClick={() => setDraftPanel(null)}>✕</button>
            </div>
            {draftPanel.loading ? <p className="mf-pad">Drafting personal messages…</p> : (
              <div className="mf-drafts">
                {draftPanel.drafts.map((d) => (
                  <div key={d.student.id} className="mf-draft">
                    <strong>{d.student.name} <span>({d.student.class_name})</span></strong>
                    <textarea
                      value={d.message}
                      rows={4}
                      onChange={(e) => setDraftPanel((p) => ({ ...p, drafts: p.drafts.map((x) => x === d ? { ...x, message: e.target.value } : x) }))}
                    />
                    {d.parents.length === 0 && <p className="mf-noparent">No parent linked yet — invite them from the class Students tab.</p>}
                    {d.parents.map((p) => (
                      <div key={p.id || p.phone} className="mf-parent-row">
                        <span>{p.name}{p.phone ? ` · ${p.phone}` : ''}</span>
                        {p.id && d.sent.includes(p.id) ? <em>✓ Sent in app</em> : (
                          <span className="mf-parent-btns">
                            {p.id && <button onClick={() => approveSend(d, p)}>✅ Approve &amp; Send (in app)</button>}
                            {p.phone && <a className="mf-wa" href={waLink(p.phone, d.message)} target="_blank" rel="noreferrer">WhatsApp</a>}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="mf-toast">{toast}</div>}
    </div>
  );
}
