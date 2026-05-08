import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './NurseryBoard.css';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#111827'];
const STICKER_PACKS = {
  classic: ['⭐', '�🇼', '🦋', '🚗', '🍎', '🐘', '🏀', '🎈'],
  rwanda: ['🦍', '🦓', '🚌', '🏫', '🌋', '🏟️', '🏛️', '🇷🇼'],
};

const TRACE_SETS = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8'],
  words: ['Mama', 'Papa', 'Inzu', 'Ishuri', 'Star', 'Car'],
};

const CHALLENGES = [
  'Draw your family and home',
  'Trace A to H and say each letter',
  'Draw 5 fruits and count them',
  'Create a Rwanda nature scene',
  'Draw your classroom and teacher',
];

const DEFAULT_NURSERY_AUDIO_LESSONS = [
  {
    id: 'abc-song',
    title: 'Alphabet Song',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'counting-song',
    title: 'Counting Song',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
];

const DEFAULT_NURSERY_VIDEO_LESSONS = [
  {
    id: 'colors-video',
    title: 'Colors Practice',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: 'shapes-video',
    title: 'Shapes Practice',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
];

export default function NurseryBoard() {
  const canvasRef = useRef(null);
  const audioRefs = useRef({});
  const videoRefs = useRef({});
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [language, setLanguage] = useState('en');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(8);
  const [stickerPack, setStickerPack] = useState('classic');
  const [sticker, setSticker] = useState(STICKER_PACKS.classic[0]);
  const [traceSet, setTraceSet] = useState('letters');
  const [traceIndex, setTraceIndex] = useState(0);
  const [challenge, setChallenge] = useState(CHALLENGES[0]);
  const [savedCount, setSavedCount] = useState(0);
  const [mediaVolume, setMediaVolume] = useState(0.9);
  const [typingText, setTypingText] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [audioLessons, setAudioLessons] = useState(DEFAULT_NURSERY_AUDIO_LESSONS);
  const [videoLessons, setVideoLessons] = useState(DEFAULT_NURSERY_VIDEO_LESSONS);
  const [nextMediaChangeAt, setNextMediaChangeAt] = useState('');

  const t = useMemo(() => {
    if (language === 'rw') {
      return {
        kicker: 'Ikibaho cy’abana',
        title: 'Gushushanya no Kwandika ku Bana',
        subtitle: 'Aho abana bashushanyiriza, bakandika inyuguti, kandi bakabika ibihangano ku telefoni cyangwa mudasobwa.',
        back: 'Subira Ahabanza',
        save: 'Bika Igihangano',
        toolPen: 'Ikaramu',
        toolEraser: 'Guhanagura',
        toolSticker: 'Udukaratasi',
        toolTrace: 'Gukurikirana',
        clear: 'Sukura',
        brush: 'Ubunini',
        pack: 'Ubwoko bw’udukaratasi',
        traceSet: 'Ubwoko bwo gukurikira',
        traceItem: 'Ikintu cyo gukurikira',
        hear: 'Vuga',
        nextChallenge: 'Undi Mukino',
        challenge: 'Umukino w’uyu munsi',
        ideas: 'Gerageza ibi bikorwa',
        parentTitle: 'Ku Babyeyi',
        teacherTitle: 'Ku Barimu',
        saved: 'Ibikorwa wabitse',
        mediaTitle: 'Kwiga ukoresheje Video na Audio',
        mediaHint: 'Koresha volume hejuru cyangwa hasi. Byashyizwe kuri volume yo hejuru kugira ngo umwana yumve neza.',
        mediaAuto: 'Ibi bihinduka buri minsi 3 byikora.',
        mediaVolume: 'Ijwi',
        volumeHigh: 'Hejuru',
        volumeMid: 'Hagati',
        volumeLow: 'Hasi',
        volumeMute: 'Mute',
        typingTitle: 'Kwitoza Kwandika',
        typingHint: 'Andika amagambo yoroshye. Camera yo mu mfuruka ihora yaka kugira ngo umwana yibone.',
        typingPlaceholder: 'Andika hano... urugero: Mama',
        cameraNoAccess: 'Ntitwabashije gufungura camera. Emera uruhushya rwa camera.',
      };
    }
    return {
      kicker: 'Nursery Board',
      title: 'Kids Drawing & Writing Board',
      subtitle: 'Fun, safe space for children to draw, write letters, and save artwork on mum\'s phone or computer.',
      back: 'Back Home',
      save: 'Save Artwork',
      toolPen: 'Pen',
      toolEraser: 'Eraser',
      toolSticker: 'Sticker',
      toolTrace: 'Trace',
      clear: 'Clear',
      brush: 'Brush',
      pack: 'Sticker pack',
      traceSet: 'Trace set',
      traceItem: 'Trace item',
      hear: 'Speak',
      nextChallenge: 'Next Challenge',
      challenge: 'Today\'s challenge',
      ideas: 'Try these activities',
      parentTitle: 'Parent Corner',
      teacherTitle: 'Teacher Corner',
      saved: 'Saved artworks',
      mediaTitle: 'Video & Audio Learning',
      mediaHint: 'Use the loudness controls below. Playback starts with high volume so learners can hear clearly.',
      mediaAuto: 'These rotate automatically every 3 days.',
      mediaVolume: 'Volume',
      volumeHigh: 'High',
      volumeMid: 'Mid',
      volumeLow: 'Low',
      volumeMute: 'Mute',
      typingTitle: 'Typing Practice',
      typingHint: 'Type easy words. The fun corner camera stays on so learners can see themselves.',
      typingPlaceholder: 'Type here... e.g. Mama',
      cameraNoAccess: 'Could not access camera. Please allow camera permission.',
    };
  }, [language]);

  const currentStickers = STICKER_PACKS[stickerPack];
  const currentTraceSet = TRACE_SETS[traceSet];
  const currentTrace = currentTraceSet[traceIndex] || '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const saved = Number(localStorage.getItem('nursery_saved_count') || '0');
    if (Number.isFinite(saved)) setSavedCount(saved);
  }, []);

  useEffect(() => {
    setSticker(STICKER_PACKS[stickerPack][0]);
  }, [stickerPack]);

  useEffect(() => {
    Object.values(audioRefs.current).forEach((el) => {
      if (el) el.volume = mediaVolume;
    });
    Object.values(videoRefs.current).forEach((el) => {
      if (el) el.volume = mediaVolume;
    });
  }, [mediaVolume]);

  useEffect(() => {
    let active = true;
    api.get('/admin/nursery-media/public')
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res.audio_lessons) && res.audio_lessons.length > 0) {
          setAudioLessons(res.audio_lessons);
        }
        if (Array.isArray(res.video_lessons) && res.video_lessons.length > 0) {
          setVideoLessons(res.video_lessons);
        }
        if (res.next_change_at) setNextMediaChangeAt(res.next_change_at);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPoint(e);

    if (tool === 'stamp') {
      ctx.font = `${Math.max(20, size * 3)}px sans-serif`;
      ctx.fillText(sticker, x - 10, y + 10);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPoint(e);

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = size;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = () => setDrawing(false);

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  };

  const saveBoard = () => {
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `nursery-drawing-${Date.now()}.png`;
    a.click();

    const next = savedCount + 1;
    setSavedCount(next);
    localStorage.setItem('nursery_saved_count', String(next));
  };

  const speakCurrentTrace = () => {
    if (!window.speechSynthesis || !currentTrace) return;
    const utterance = new SpeechSynthesisUtterance(currentTrace);
    utterance.lang = language === 'rw' ? 'rw-RW' : 'en-US';
    utterance.rate = 0.8;
    utterance.volume = 1;
    utterance.pitch = 1.2;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const nextChallenge = () => {
    const pick = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    setChallenge(pick);
  };

  const setAllMediaVolume = (next) => {
    const clamped = Math.max(0, Math.min(1, next));
    setMediaVolume(clamped);
  };

  const startCamera = async () => {
    if (cameraStreamRef.current) {
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = cameraStreamRef.current;
      setCameraEnabled(true);
      setCameraError('');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
      setCameraEnabled(true);
      setCameraError('');
    } catch {
      setCameraEnabled(false);
      setCameraError(t.cameraNoAccess);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    setCameraEnabled(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (cameraEnabled && cameraStreamRef.current && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [cameraEnabled]);

  const showCornerCam = cameraEnabled;

  return (
    <div className="nursery-page">
      <header className="nursery-header">
        <div>
          <p className="kicker">{t.kicker}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="nursery-actions">
          <button className="btn btn-outline" onClick={() => setLanguage((v) => (v === 'en' ? 'rw' : 'en'))}>
            {language === 'en' ? 'Kinyarwanda' : 'English'}
          </button>
          <Link className="btn btn-outline" to="/welcome">{t.back}</Link>
          <button className="btn btn-primary" onClick={saveBoard}>{t.save}</button>
        </div>
      </header>

      <section className="nursery-challenge">
        <strong>{t.challenge}:</strong> {challenge}
        <button onClick={nextChallenge}>{t.nextChallenge}</button>
      </section>

      <section className="nursery-tools">
        <div className="tool-group">
          <button className={tool === 'pen' ? 'active' : ''} onClick={() => setTool('pen')}>{t.toolPen}</button>
          <button className={tool === 'eraser' ? 'active' : ''} onClick={() => setTool('eraser')}>{t.toolEraser}</button>
          <button className={tool === 'stamp' ? 'active' : ''} onClick={() => setTool('stamp')}>{t.toolSticker}</button>
          <button className={tool === 'trace' ? 'active' : ''} onClick={() => setTool('trace')}>{t.toolTrace}</button>
          <button onClick={clearBoard}>{t.clear}</button>
        </div>

        <div className="tool-group colors">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={color === c ? 'active-color' : ''}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>

        <div className="tool-group">
          <label>{t.brush}: {size}px</label>
          <input type="range" min="2" max="30" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </div>

        {tool === 'stamp' && (
          <div className="tool-group stickers">
            <label>{t.pack}:</label>
            <select value={stickerPack} onChange={(e) => setStickerPack(e.target.value)}>
              <option value="classic">Classic</option>
              <option value="rwanda">Rwanda</option>
            </select>
            {currentStickers.map((s) => (
              <button key={s} className={sticker === s ? 'active' : ''} onClick={() => setSticker(s)}>{s}</button>
            ))}
          </div>
        )}

        {tool === 'trace' && (
          <div className="tool-group trace-controls">
            <label>{t.traceSet}:</label>
            <select value={traceSet} onChange={(e) => { setTraceSet(e.target.value); setTraceIndex(0); }}>
              <option value="letters">Letters</option>
              <option value="numbers">Numbers</option>
              <option value="words">Words</option>
            </select>
            <label>{t.traceItem}:</label>
            <select value={traceIndex} onChange={(e) => setTraceIndex(Number(e.target.value))}>
              {currentTraceSet.map((item, i) => <option key={item} value={i}>{item}</option>)}
            </select>
            <button onClick={speakCurrentTrace}>{t.hear}</button>
          </div>
        )}
      </section>

      <section className="nursery-canvas-wrap">
        {tool === 'trace' && <div className="trace-overlay">{currentTrace}</div>}
        <canvas
          ref={canvasRef}
          className="nursery-canvas"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />
        {showCornerCam && (
          <div className="typing-cam-float" aria-live="polite">
            <div className="typing-cam-header">
              <span>Star Learner Cam</span>
              <span>😄</span>
            </div>
            <video ref={cameraVideoRef} autoPlay playsInline muted />
          </div>
        )}
      </section>

      <section className="nursery-typing">
        <h2>{t.typingTitle}</h2>
        <p>{t.typingHint}</p>
        <div className="typing-row">
          <input
            type="text"
            value={typingText}
            placeholder={t.typingPlaceholder}
            onChange={(e) => setTypingText(e.target.value)}
          />
        </div>
        {cameraError && <p className="typing-cam-error">{cameraError}</p>}
      </section>

      <section className="nursery-ideas">
        <h2>{t.ideas}</h2>
        <div className="ideas-grid">
          <article><h3>Letter Practice</h3><p>Trace A, B, C and your own name using colorful pens.</p></article>
          <article><h3>Family Art</h3><p>Draw your mum, dad, or home and add stickers.</p></article>
          <article><h3>Number Time</h3><p>Write numbers 1-10 and decorate with stars.</p></article>
        </div>
      </section>

      <section className="nursery-media">
        <div className="nursery-media-top">
          <div>
            <h2>{t.mediaTitle}</h2>
            <p>{t.mediaHint}</p>
            <p className="nursery-media-rotation-note">
              {t.mediaAuto}
              {nextMediaChangeAt ? ` Next change: ${new Date(nextMediaChangeAt).toLocaleString()}` : ''}
            </p>
          </div>
          <div className="media-volume">
            <label>{t.mediaVolume}: {Math.round(mediaVolume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={mediaVolume}
              onChange={(e) => setAllMediaVolume(Number(e.target.value))}
            />
            <div className="media-volume-buttons">
              <button onClick={() => setAllMediaVolume(1)}>{t.volumeHigh}</button>
              <button onClick={() => setAllMediaVolume(0.7)}>{t.volumeMid}</button>
              <button onClick={() => setAllMediaVolume(0.4)}>{t.volumeLow}</button>
              <button onClick={() => setAllMediaVolume(0)}>{t.volumeMute}</button>
            </div>
          </div>
        </div>

        <div className="media-grid">
          {audioLessons.map((lesson) => (
            <article key={lesson.id} className="media-card">
              <h3>{lesson.title}</h3>
              <audio
                controls
                preload="metadata"
                ref={(el) => { audioRefs.current[lesson.id] = el; }}
                onPlay={(e) => { e.currentTarget.volume = mediaVolume; }}
                src={lesson.src}
              />
            </article>
          ))}

          {videoLessons.map((lesson) => (
            <article key={lesson.id} className="media-card">
              <h3>{lesson.title}</h3>
              <video
                controls
                preload="metadata"
                ref={(el) => { videoRefs.current[lesson.id] = el; }}
                onPlay={(e) => { e.currentTarget.volume = mediaVolume; }}
                src={lesson.src}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="nursery-meta-grid">
        <article className="meta-card parent">
          <h3>{t.parentTitle}</h3>
          <p>{t.saved}: <strong>{savedCount}</strong></p>
          <p>Tip: do 10-15 mins daily. Ask your child to say what they drew and count objects out loud.</p>
        </article>
        <article className="meta-card teacher">
          <h3>{t.teacherTitle}</h3>
          <p>Use this board for quick class warm-up: 1 letter trace, 1 number trace, 1 free drawing.</p>
          <p>Rotate children every 3 minutes and save one artwork per child each week.</p>
        </article>
      </section>
    </div>
  );
}
