import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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

// ── Mfasha poster illustrator (drawn by our own code — no external AI image service) ──
const AID_ICONS = [
  [/fraction|gabunganya|kibice|divide/i, '🍕'], [/plant|photosynth|igiti|leaf|grow|ubuto/i, '🌱'],
  [/money|amafaranga|frw|rwf|market|isoko|bank/i, '💰'], [/map|geograph|ikarita|rwanda|district/i, '🗺️'],
  [/water|amazi|cycle|rain|imvura/i, '💧'], [/animal|inyamaswa|cow|inka/i, '🐄'],
  [/count|number|ibarura|math|add|multiply|umubare/i, '🔢'], [/shape|triangle|angle|geometry|uruziga/i, '📐'],
  [/time|clock|hour|isaha/i, '⏰'], [/book|read|story|andika|composition|inyandiko/i, '📖'],
  [/body|health|umubiri|blood/i, '🫀'], [/electric|umuriro|energy|power/i, '⚡'],
  [/seed|imbuto|soil|ivu|farm|ubuhinzi/i, '🌾'], [/test|exam|quiz|ibizamini/i, '📝'],
  [/music|song|indirimbo/i, '🎵'], [/sport|umukino|football/i, '⚽'], [/speak|talk|language|ururimi/i, '🗣️'],
  [/computer|mudasobwa|code|technology/i, '💻'], [/art|draw|picture|shushanya/i, '🎨'],
];
const iconFor = (t) => (AID_ICONS.find(([re]) => re.test(t)) || [null, '✏️'])[1];

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTeacher(ctx, cx, feetY, s, faceBmp) {
  // legs + shoes
  ctx.fillStyle = '#1f2a44';
  ctx.fillRect(cx - 17 * s, feetY - 118 * s, 15 * s, 116 * s);
  ctx.fillRect(cx + 3 * s, feetY - 118 * s, 15 * s, 116 * s);
  ctx.fillStyle = '#0e1526';
  rr(ctx, cx - 23 * s, feetY - 8 * s, 27 * s, 10 * s, 4 * s); ctx.fill();
  rr(ctx, cx - 1 * s, feetY - 8 * s, 27 * s, 10 * s, 4 * s); ctx.fill();
  // body — smart shirt
  ctx.fillStyle = '#1565d8';
  rr(ctx, cx - 36 * s, feetY - 212 * s, 72 * s, 102 * s, 18 * s); ctx.fill();
  // collar + tie
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(cx - 14 * s, feetY - 210 * s); ctx.lineTo(cx, feetY - 192 * s); ctx.lineTo(cx + 14 * s, feetY - 210 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d93025';
  ctx.beginPath(); ctx.moveTo(cx, feetY - 192 * s); ctx.lineTo(cx - 7 * s, feetY - 196 * s); ctx.lineTo(cx, feetY - 158 * s); ctx.lineTo(cx + 7 * s, feetY - 196 * s); ctx.closePath(); ctx.fill();
  // left arm pointing to the board
  ctx.strokeStyle = '#1565d8'; ctx.lineWidth = 15 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 30 * s, feetY - 196 * s); ctx.lineTo(cx - 92 * s, feetY - 244 * s); ctx.stroke();
  // hand + pointer stick
  ctx.fillStyle = '#8d5524';
  ctx.beginPath(); ctx.arc(cx - 96 * s, feetY - 248 * s, 9 * s, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4 * s;
  ctx.beginPath(); ctx.moveTo(cx - 96 * s, feetY - 248 * s); ctx.lineTo(cx - 150 * s, feetY - 286 * s); ctx.stroke();
  // right arm down + book
  ctx.strokeStyle = '#1565d8'; ctx.lineWidth = 15 * s;
  ctx.beginPath(); ctx.moveTo(cx + 30 * s, feetY - 196 * s); ctx.lineTo(cx + 46 * s, feetY - 138 * s); ctx.stroke();
  ctx.fillStyle = '#8d5524'; ctx.beginPath(); ctx.arc(cx + 48 * s, feetY - 134 * s, 9 * s, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1565d8'; ctx.lineWidth = 3 * s;
  rr(ctx, cx + 40 * s, feetY - 150 * s, 34 * s, 24 * s, 3 * s); ctx.fill(); ctx.stroke();
  // head
  const hy = feetY - 240 * s;
  if (faceBmp) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, hy, 34 * s, 0, 7); ctx.clip();
    const fs = Math.min(faceBmp.width, faceBmp.height);
    ctx.drawImage(faceBmp, (faceBmp.width - fs) / 2, (faceBmp.height - fs) / 2, fs, fs, cx - 34 * s, hy - 34 * s, 68 * s, 68 * s);
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, hy, 34 * s, 0, 7);
    ctx.lineWidth = 4 * s; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
  } else {
    // drawn face — warm smile
    ctx.fillStyle = '#8d5524';
    ctx.beginPath(); ctx.arc(cx, hy, 34 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#241a10';
    ctx.beginPath(); ctx.arc(cx, hy - 16 * s, 33 * s, Math.PI, 0); ctx.fill(); // hair
    ctx.fillStyle = '#241a10';
    ctx.beginPath(); ctx.arc(cx - 11 * s, hy - 2 * s, 3.4 * s, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 11 * s, hy - 2 * s, 3.4 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = '#241a10'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, hy + 8 * s, 13 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }
}

async function drawPoster({ inspiration, user, faceBmp }) {
  const W = 1080, H = 780;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  // warm classroom gradient + soft circles
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f7ecd9'); bg.addColorStop(0.62, '#f2e2c4'); bg.addColorStop(1, '#e8d3ae');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(60 + i * 160, 40 + (i % 3) * 30, 22 + (i % 4) * 10, 0, 7); ctx.fill(); }
  // floor
  ctx.fillStyle = '#d9bd8f'; ctx.fillRect(0, H - 150, W, 150);
  ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(0, H - 150, W, 6);
  // chalkboard with wooden frame
  const bx = 70, by = 80, bw = 640, bh = 400;
  ctx.fillStyle = '#8a5a2b'; rr(ctx, bx - 14, by - 14, bw + 28, bh + 28, 16); ctx.fill();
  ctx.fillStyle = '#20523f'; rr(ctx, bx, by, bw, bh, 8); ctx.fill();
  // chalk tray + chalk
  ctx.fillStyle = '#6e4520'; ctx.fillRect(bx, by + bh + 4, bw, 10);
  ctx.fillStyle = '#fff'; ctx.fillRect(bx + 20, by + bh + 2, 40, 4);
  // board text
  ctx.fillStyle = '#9fd6ba'; ctx.font = '26px "Comic Sans MS","Chalkboard SE",cursive';
  ctx.fillText("Today's lesson", bx + 34, by + 52);
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx + 34, by + 66); ctx.lineTo(bx + 250, by + 66); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  let fs = 52;
  const title = inspiration.title || 'Lesson';
  ctx.font = `bold ${fs}px "Comic Sans MS","Chalkboard SE",cursive`;
  while (ctx.measureText(title).width > bw - 80 && fs > 24) { fs -= 3; ctx.font = `bold ${fs}px "Comic Sans MS","Chalkboard SE",cursive`; }
  const words = title.split(' ');
  let line = '', ty = by + 140;
  for (const w of words) {
    if (ctx.measureText(line + w).width > bw - 90) { ctx.fillText(line.trim(), bx + 40, ty); ty += fs + 14; line = ''; }
    line += w + ' ';
  }
  ctx.fillText(line.trim(), bx + 40, ty);
  // squiggle under title
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5; ctx.beginPath();
  for (let x = 0; x < 220; x += 10) ctx.lineTo(bx + 40 + x, ty + 18 + Math.sin(x / 18) * 5);
  ctx.stroke();
  // a couple of chalk doodles
  ctx.font = '40px "Comic Sans MS",cursive'; ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.fillText('✓', bx + bw - 90, by + 60);
  ctx.fillText('?', bx + bw - 60, by + 130);
  // teacher figure on the right
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.beginPath(); ctx.ellipse(850, H - 150, 120, 22, 0, 0, 7); ctx.fill();
  drawTeacher(ctx, 850, H - 150, 1.05, faceBmp);
  ctx.restore();
  // teaching-aid cards along the bottom
  const aids = (inspiration.aids || []).slice(0, 4);
  aids.forEach((a, i) => {
    const ax = 60 + i * 175, ay = H - 132;
    ctx.fillStyle = 'rgba(0,0,0,.14)'; rr(ctx, ax + 4, ay + 5, 150, 116, 14); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, ax, ay, 150, 116, 14); ctx.fill();
    ctx.strokeStyle = '#e3d5bd'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '52px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(iconFor(a), ax + 75, ay + 62);
    ctx.fillStyle = '#7a6234'; ctx.font = 'bold 15px system-ui';
    const label = String(a).split(/[—:,(]/)[0].trim().split(' ').slice(0, 4).join(' ');
    ctx.fillText(label.length > 20 ? label.slice(0, 19) + '…' : label, ax + 75, ay + 96);
    ctx.textAlign = 'left';
  });
  // branding band
  const g = ctx.createLinearGradient(0, H - 60, 0, H);
  g.addColorStop(0, 'rgba(20,30,60,0)'); g.addColorStop(0.5, 'rgba(20,30,60,.55)'); g.addColorStop(1, 'rgba(15,25,55,.92)');
  ctx.fillStyle = g; ctx.fillRect(0, H - 60, W, 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText(`✨ Made with Mfasha${user?.name ? ` · ${user.name}` : ''}`, 26, H - 20);
  ctx.textAlign = 'right';
  ctx.font = '600 23px system-ui, sans-serif';
  ctx.fillText('© UClass · student.umunsi.com', W - 26, H - 20);
  ctx.textAlign = 'left';
  return cv;
}

async function api(path, { method = 'GET', body, token, form } = {}, attempt = 0) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: form ? { Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    // dropped connection / flaky network — retry once quietly
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 1500));
      return api(path, { method, body, token, form }, attempt + 1);
    }
    throw new Error('Connection lost — check your internet and try again.');
  }
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

function dataText(d) {
  if (d.type === 'roster') {
    return `${d.title}\n\n` + d.classes.map((c) => `${c.name} — ${c.students.length} student${c.students.length === 1 ? '' : 's'}\n` + c.students.map((n, i) => `${i + 1}. ${n}`).join('\n')).join('\n\n');
  }
  if (d.type === 'marks') {
    return `${d.title}\n\n` + d.classes.map((c) => `🏆 ${c.name}${c.sheet ? ` (${c.sheet})` : ''}\n` + c.rows.map((r) => `${r.rank}. ${r.name} — ${r.pct ?? '—'}% (${r.obt}/${r.tot})`).join('\n')).join('\n\n');
  }
  return '';
}

function DataCard({ d, onShare }) {
  return (
    <div className="mf-datacard">
      <div className="mf-dc-head"><strong>{d.type === 'roster' ? '👩‍🎓' : '🏆'} {d.title}</strong></div>
      {d.classes.map((c) => (
        <div className="mf-dc-class" key={c.name}>
          <b>{c.name}{c.sheet ? <span className="mf-dim"> · {c.sheet}</span> : ''} <em>{c.students ? `${c.students.length} students` : `${c.rows.length} ranked`}</em></b>
          <ol>
            {c.students
              ? c.students.map((n, i) => <li key={i}>{n}</li>)
              : c.rows.map((r) => <li key={r.rank}>{r.name} <span className="mf-dim">— {r.pct ?? '—'}%</span></li>)}
          </ol>
        </div>
      ))}
      <button className="mf-dc-share" onClick={() => onShare(dataText(d), d.title)}>📤 Share this list</button>
    </div>
  );
}

export default function Mfasha({ user, token, onClose }) {
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
  // class inspiration (illustration + guide)
  const [inspireOpen, setInspireOpen] = useState(false);
  const [inspireTopic, setInspireTopic] = useState('');
  const [inspiration, setInspiration] = useState(null);
  const [inspiring, setInspiring] = useState(false);
  // "use my photo" — camera capture, face lands on the teacher figure
  const [myPhoto, setMyPhoto] = useState(null); // dataURL
  const [camOpen, setCamOpen] = useState(false);
  const [cardImg, setCardImg] = useState(null); // rendered poster dataURL
  const videoRef = useRef(null);
  const camStream = useRef(null);
  // parents (one-tap WhatsApp)
  const [parentPanel, setParentPanel] = useState(null); // {loading, cls, students, reason}
  // drafts (from alerts or parents tool)
  const [draftPanel, setDraftPanel] = useState(null); // {loading, drafts}
  const [statsPanel, setStatsPanel] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
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

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    camStream.current?.getTracks().forEach((t) => t.stop());
  }, []);

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
      const { answer, data } = await api('/mfasha/ask', {
        method: 'POST', token,
        body: { question: q, lang, history: next.slice(-10).map((m) => ({ role: m.role, content: m.content })) },
      });
      setMessages([...next, { role: 'assistant', content: answer, data: data?.length ? data : null }]);
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
          const ext = (rec.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
          fd.append('audio', blob, `voice.${ext}`);
          const { text } = await api('/mfasha/transcribe', { method: 'POST', token, form: fd });
          if (text) { setInput(''); sendRef.current?.(text); }
          else setError('I could not hear anything — try again and speak closer to the mic.');
        } catch (e) {
          setError(`Voice note failed to send (${e.message}). Check your internet and try again.`);
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

  // ── camera: capture teacher photo ──
  const openCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      camStream.current = s;
      setCamOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 60);
    } catch {
      setError('Camera is not available — you can pick a photo from your files instead.');
    }
  };
  const closeCam = () => { camStream.current?.getTracks().forEach((t) => t.stop()); camStream.current = null; setCamOpen(false); };
  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setMyPhoto(c.toDataURL('image/jpeg', 0.85));
    closeCam();
  };
  const pickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => setMyPhoto(fr.result);
    fr.readAsDataURL(f);
  };

  // draw the poster ourselves — illustration + optional face on the teacher + UClass ©
  const buildCardBlob = async () => {
    let faceBmp = null;
    if (myPhoto) {
      try { faceBmp = await createImageBitmap(await (await fetch(myPhoto)).blob()); } catch { faceBmp = null; }
    }
    const cv = await drawPoster({ inspiration, user, faceBmp });
    return new Promise((res) => cv.toBlob(res, 'image/png'));
  };

  // (re)render the poster whenever the guide or the photo changes
  useEffect(() => {
    if (!inspiration) { setCardImg(null); return; }
    let live = true;
    buildCardBlob().then((b) => live && setCardImg(URL.createObjectURL(b))).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspiration, myPhoto]);

  const downloadCard = async () => {
    try {
      const blob = await buildCardBlob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(inspiration.title || 'inspiration').replace(/[^\w\s-]/g, '').slice(0, 50)}-UClass.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      say('Image downloaded with © UClass branding — ready to share!');
    } catch (e) { setError(e.message); }
  };

  const shareCard = async () => {
    try {
      const blob = await buildCardBlob();
      const file = new File([blob], 'mfasha.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: inspiration.title });
        return;
      }
    } catch { /* fall through to copy/download */ }
    downloadCard();
  };

  // ── class inspiration: illustration + guide ──
  const inspire = async () => {
    if (!inspireTopic.trim() || inspiring) return;
    setInspiring(true); setError(''); setInspiration(null);
    try {
      const cls = classes[0] || {};
      const { inspiration } = await api('/mfasha/inspire', {
        method: 'POST', token,
        body: { topic: inspireTopic.trim(), subject: cls.subject, grade: cls.grade, lang },
      });
      setInspiration(inspiration); setInspireOpen(false);
    } catch (e) { setError(e.message); }
    finally { setInspiring(false); }
  };

  const inspText = () => {
    if (!inspiration) return '';
    const L = [`${inspiration.title}`, '', inspiration.intro || '', ''];
    if (inspiration.aids?.length) { L.push('Teaching aids (CBC):'); inspiration.aids.forEach((a) => L.push(`  • ${a}`)); L.push(''); }
    if (inspiration.conduct?.length) { L.push('How to carry yourself:'); inspiration.conduct.forEach((a) => L.push(`  • ${a}`)); L.push(''); }
    if (inspiration.struggling?.length) { L.push('Students needing care:'); inspiration.struggling.forEach((a) => L.push(`  • ${a}`)); L.push(''); }
    if (inspiration.preparation?.length) { L.push('Before the lesson:'); inspiration.preparation.forEach((a) => L.push(`  • ${a}`)); L.push(''); }
    if (inspiration.flow?.length) { L.push('Lesson flow:'); inspiration.flow.forEach((a, i) => L.push(`  ${i + 1}. ${a}`)); L.push(''); }
    if (inspiration.encouragement) L.push(`💪 ${inspiration.encouragement}`);
    return L.join('\n');
  };

  const downloadInspirationDoc = async () => {
    if (!inspiration) return;
    let imgTag = '';
    try {
      const b = await buildCardBlob();
      const dataUrl = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
      imgTag = `<p><img src="${dataUrl}" style="max-width:640px;width:100%"/></p>`;
    } catch { /* keep URL fallback */ }
    const li = (arr) => (arr || []).map((x) => `<li>${String(x).replace(/</g, '&lt;')}</li>`).join('');
    const html = `<html><head><meta charset="utf-8"></head><body>
      <h1>${inspiration.title}</h1>
      <p><i>Class Inspiration · Mfasha · UClass — ${user?.name || 'Teacher'}</i></p>
      ${imgTag}
      <h2>About this lesson</h2><p>${inspiration.intro || ''}</p>
      ${inspiration.aids?.length ? `<h2>Teaching aids for this lesson (CBC)</h2><ul>${li(inspiration.aids)}</ul>` : ''}
      ${inspiration.conduct?.length ? `<h2>How to carry yourself in this lesson</h2><ul>${li(inspiration.conduct)}</ul>` : ''}
      ${inspiration.struggling?.length ? `<h2>Students needing care</h2><ul>${li(inspiration.struggling)}</ul>` : ''}
      ${inspiration.preparation?.length ? `<h2>Before the lesson</h2><ul>${li(inspiration.preparation)}</ul>` : ''}
      ${inspiration.flow?.length ? `<h2>Lesson flow</h2><ol>${li(inspiration.flow)}</ol>` : ''}
      ${inspiration.encouragement ? `<h2>Word for you</h2><p><b>${inspiration.encouragement}</b></p>` : ''}
      </body></html>`;
    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(inspiration.title || 'inspiration').replace(/[^\w\s-]/g, '').slice(0, 50)}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
    say('Guide downloaded as a .doc — open it in Word.');
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
        {onClose && <button className="mf-back" onClick={onClose} title="Back to dashboard">←</button>}
        {alerts.length > 0 && (
          <button className={`mf-bell ${alerts.some((a) => a.severity === 'high') ? 'hot' : ''}`} onClick={() => setAlertsOpen((v) => !v)} title="Things needing your attention">
            ⚠<b>{alerts.length}</b>
          </button>
        )}
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

      {/* ── alerts popover (hidden until ⚠ is tapped) ── */}
      {alertsOpen && alerts.length > 0 && (
        <div className="mf-alerts-pop">
          <div className="mf-alerts-pop-head"><strong>Needs your attention</strong><button onClick={() => setAlertsOpen(false)}>✕</button></div>
          {alerts.map((a) => (
            <div key={a.id} className={`mf-chip mf-${a.severity}`}>
              <div className="mf-chip-txt">
                <strong>{a.title}</strong>
                <span>{a.students.slice(0, 6).map((s) => s.pct != null ? `${s.name} ${s.pct}%` : s.name).join(' · ')}{a.students.length > 6 ? ` +${a.students.length - 6}` : ''}</span>
              </div>
              <div className="mf-chip-btns">
                <button disabled={quizRunning === a.id} onClick={() => makeQuiz(a)}>{quizRunning === a.id ? '…' : '📝 Quiz'}</button>
                <button className="mf-wa-chip" onClick={() => { setAlertsOpen(false); openDrafts(a); }}>💬 Parents</button>
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
            {classes.length > 0 && classes.every((c) => !c.students) && (
              <p className="mf-nostu">Your classes have no students yet — <Link to="/teacher/classes" className="mf-addstu">➕ Add students (UClass)</Link> and I’ll start watching their marks.</p>
            )}
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
              {m.data?.map((d, di) => <DataCard key={di} d={d} onShare={shareText} />)}
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
        {inspiring && <div className="mf-msg mf-assistant"><div className="mf-mini-avatar">MF</div><div className="mf-bubble">🎨 Drawing your class inspiration… (the picture takes ~20 seconds)</div></div>}
      </section>

      {error && <div className="mf-error" onClick={() => setError('')}>⚠ {error} <b>✕</b></div>}

      {/* ── tools row (like ChatGPT's + tools) ── */}
      <div className="mf-tools">
        <button onClick={() => setResearchOpen((v) => !v)}>🔍 Research + Slides</button>
        <button className="mf-tool-inspire" onClick={() => setInspireOpen(true)}>✨ Class Inspiration</button>
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

      {/* ── class inspiration: input ── */}
      {inspireOpen && (
        <div className="mf-modal" onClick={() => setInspireOpen(false)}>
          <div className="mf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head"><strong>✨ Class Inspiration</strong><button onClick={() => setInspireOpen(false)}>✕</button></div>
            <div className="mf-drafts">
              <p className="mf-dim">Type your unit topic, subtopic, or anything you’re about to teach — I’ll draw an inspiring picture of a teacher ready for that lesson, with a full guide.</p>
              <input
                className="mf-inp"
                value={inspireTopic}
                onChange={(e) => setInspireTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inspire()}
                placeholder="e.g. Photosynthesis · Fractions · Ubusabo bw’abaturage…"
                autoFocus
              />
              <div className="mf-photo-row">
                {myPhoto ? (
                  <>
                    <img src={myPhoto} alt="you" className="mf-photo-thumb" />
                    <span className="mf-dim">Your photo will be added to the picture ✓</span>
                    <button className="mf-linkbtn" onClick={() => setMyPhoto(null)}>remove</button>
                    <button className="mf-linkbtn" onClick={openCam}>retake</button>
                  </>
                ) : (
                  <>
                    <button className="mf-photobtn" onClick={openCam}>📷 Use my photo</button>
                    <label className="mf-linkbtn">or choose from files<input type="file" accept="image/*" hidden onChange={pickPhoto} /></label>
                  </>
                )}
              </div>
              <button className="mf-genbtn" onClick={inspire} disabled={inspiring || !inspireTopic.trim()}>
                {inspiring ? '🎨 Drawing…' : '✨ Inspire me'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── class inspiration: result ── */}
      {inspiration && (
        <div className="mf-modal" onClick={() => setInspiration(null)}>
          <div className="mf-modal-card mf-inspire-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head">
              <strong>✨ {inspiration.title}</strong>
              <span className="mf-deck-actions">
                <button onClick={downloadCard}>⬇ Image</button>
                <button onClick={shareCard}>📤 Share image</button>
                <button onClick={downloadInspirationDoc}>⬇ Guide (.doc)</button>
                <button onClick={() => shareText(inspText(), inspiration.title)}>📄 Share text</button>
                <button onClick={() => setInspiration(null)}>✕</button>
              </span>
            </div>
            <div className="mf-inspire-body">
              <div className="mf-inspire-img-wrap">
                {cardImg
                  ? <img src={cardImg} alt={inspiration.title} className="mf-inspire-img" draggable={false} />
                  : <div className="mf-inspire-loading">🎨 Drawing your picture…</div>}
              </div>
              <div className="mf-face-tools">
                {myPhoto ? (
                  <>
                    <span className="mf-dim">Your face is on the teacher ✓</span>
                    <button className="mf-linkbtn" onClick={() => setMyPhoto(null)}>remove face</button>
                    <button className="mf-linkbtn" onClick={openCam}>📷 retake</button>
                  </>
                ) : (
                  <>
                    <button className="mf-photobtn" onClick={openCam}>📷 Add my face to this picture</button>
                    <label className="mf-linkbtn">or upload<input type="file" accept="image/*" hidden onChange={pickPhoto} /></label>
                  </>
                )}
              </div>
              {inspiration.intro && <p className="mf-inspire-intro">{inspiration.intro}</p>}
              {inspiration.aids?.length > 0 && (
                <div className="mf-inspire-sec"><h4>🧰 Teaching aids for this lesson (CBC)</h4><ul>{inspiration.aids.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              )}
              {inspiration.conduct?.length > 0 && (
                <div className="mf-inspire-sec"><h4>🧑‍🏫 How to carry yourself in this lesson</h4><ul>{inspiration.conduct.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              )}
              {inspiration.struggling?.length > 0 && (
                <div className="mf-inspire-sec"><h4>🌱 Students needing care (from your marks)</h4><ul>{inspiration.struggling.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              )}
              {inspiration.preparation?.length > 0 && (
                <div className="mf-inspire-sec"><h4>📋 Before the lesson</h4><ul>{inspiration.preparation.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              )}
              {inspiration.flow?.length > 0 && (
                <div className="mf-inspire-sec"><h4>🪜 Lesson flow</h4><ol>{inspiration.flow.map((a, i) => <li key={i}>{a}</li>)}</ol></div>
              )}
              {inspiration.encouragement && <p className="mf-inspire-cheer">💪 {inspiration.encouragement}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── camera capture ── */}
      {camOpen && (
        <div className="mf-modal" onClick={closeCam}>
          <div className="mf-modal-card mf-cam-card" onClick={(e) => e.stopPropagation()}>
            <div className="mf-modal-head"><strong>📷 Smile — then capture</strong><button onClick={closeCam}>✕</button></div>
            <video ref={videoRef} autoPlay playsInline muted className="mf-cam-video" />
            <div className="mf-cam-btns">
              <button className="mf-genbtn" onClick={capture}>📸 Capture</button>
            </div>
          </div>
        </div>
      )}

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
                {parentPanel.students.length === 0 && (
                  <p className="mf-pad">No students in this class yet.<br /><Link to="/teacher/classes" className="mf-addstu" onClick={() => setParentPanel(null)}>➕ Add students (UClass)</Link></p>
                )}
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
                    {c.students === 0 && (
                      <Link to="/teacher/classes" className="mf-addstu">➕ Add students — weak students will appear here</Link>
                    )}
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
