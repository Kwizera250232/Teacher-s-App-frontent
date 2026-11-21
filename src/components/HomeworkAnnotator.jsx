import { useEffect, useRef, useState } from 'react';

const COLORS = [
  { c: '#e11d48', label: 'Red' },
  { c: '#16a34a', label: 'Green' },
  { c: '#2563eb', label: 'Blue' },
  { c: '#111827', label: 'Black' },
];
const SIZES = [
  { w: 4, label: 'S' },
  { w: 8, label: 'M' },
  { w: 14, label: 'L' },
];

// In-app pen correction: draw ticks, crosses and marks on the student's work — Google Classroom style.
export default function HomeworkAnnotator({ imageUrl, title, onSave, onClose, busy }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [color, setColor] = useState(COLORS[0].c);
  const [size, setSize] = useState(SIZES[1].w);
  const [tool, setTool] = useState('pen'); // pen | tick | cross | eraser
  const [ready, setReady] = useState(false);
  const drawing = useRef(false);
  const current = useRef(null);

  // Load the student's image into the canvas at natural resolution (capped)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const scale = Math.min(1, 1600 / img.naturalWidth);
      const c = canvasRef.current;
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      redraw([]);
      setReady(true);
    };
    img.src = imageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  const redraw = (list) => {
    const c = canvasRef.current;
    if (!c || !imgRef.current) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(imgRef.current, 0, 0, c.width, c.height);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const s of list) {
      if (s.type === 'pen') {
        ctx.strokeStyle = s.color; ctx.lineWidth = s.size;
        ctx.beginPath();
        s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
      } else if (s.type === 'stamp') {
        ctx.font = `bold ${s.size * 10}px Arial`;
        ctx.fillStyle = s.color;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText(s.mark, s.x, s.y);
      }
    }
  };

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current.height / r.height),
    };
  };

  const down = (e) => {
    if (!ready) return;
    e.preventDefault();
    const p = pos(e);
    if (tool === 'tick' || tool === 'cross') {
      const next = [...strokes, { type: 'stamp', mark: tool === 'tick' ? '✓' : '✗', x: p.x, y: p.y, size, color }];
      setStrokes(next); redraw(next);
      return;
    }
    drawing.current = true;
    current.current = { type: 'pen', color, size, points: [p] };
    const next = [...strokes, current.current];
    setStrokes(next); redraw(next);
  };

  const move = (e) => {
    if (!drawing.current || !current.current) return;
    e.preventDefault();
    current.current.points.push(pos(e));
    redraw(strokes);
  };

  const up = () => { drawing.current = false; current.current = null; };

  const undo = () => { const next = strokes.slice(0, -1); setStrokes(next); redraw(next); };
  const clear = () => { setStrokes([]); redraw([]); };

  const save = () => {
    canvasRef.current.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  const btn = (active) => ({
    padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${active ? '#1565d8' : '#d7e3f5'}`,
    background: active ? '#eaf2ff' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,18,38,.75)', zIndex: 1300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
        <strong style={{ fontSize: 15, flex: 1, minWidth: 140 }}>✏️ Correct work — {title}</strong>
        {COLORS.map((c) => (
          <button key={c.c} title={c.label} onClick={() => { setColor(c.c); setTool('pen'); }}
            style={{ width: 30, height: 30, borderRadius: '50%', background: c.c, border: tool === 'pen' && color === c.c ? '3px solid #0b3d91' : '2px solid #fff', boxShadow: '0 0 0 1px #cbd5e1', cursor: 'pointer' }} />
        ))}
        {SIZES.map((s) => (
          <button key={s.w} onClick={() => setSize(s.w)} style={btn(size === s.w)}>{s.label}</button>
        ))}
        <button onClick={() => setTool('tick')} style={btn(tool === 'tick')}>✓ Tick</button>
        <button onClick={() => setTool('cross')} style={btn(tool === 'cross')}>✗ Cross</button>
        <button onClick={undo} disabled={!strokes.length} style={btn(false)}>↩ Undo</button>
        <button onClick={clear} disabled={!strokes.length} style={btn(false)}>🗑 Clear</button>
        <button onClick={save} disabled={busy} style={{ ...btn(false), background: '#16a34a', borderColor: '#16a34a', color: '#fff', fontWeight: 700 }}>
          {busy ? 'Saving…' : '💾 Save correction'}
        </button>
        <button onClick={onClose} style={btn(false)}>✖</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'grid', placeItems: 'center', padding: 14, touchAction: 'none' }}>
        {!ready && <div style={{ color: '#fff', fontSize: 15 }}>Loading student work…</div>}
        <canvas
          ref={canvasRef}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          style={{ maxWidth: '100%', maxHeight: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,.5)', cursor: 'crosshair', touchAction: 'none', display: ready ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}
