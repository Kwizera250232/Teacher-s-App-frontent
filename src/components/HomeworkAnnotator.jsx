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

const btn = (active) => ({
  padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${active ? '#1565d8' : '#d7e3f5'}`,
  background: active ? '#eaf2ff' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
});

// In-app pen correction: draw ticks, crosses and marks on the student's work —
// photos AND PDFs (page by page) — Google Classroom style.
export default function HomeworkAnnotator({ imageUrl, pdfUrl, title, onSave, onClose, busy }) {
  const canvasRef = useRef(null);
  const [pages, setPages] = useState([]);      // one entry per page: { img, w, h }
  const [pageIdx, setPageIdx] = useState(0);
  const [marks, setMarks] = useState({});      // { pageIndex: strokes[] }
  const [color, setColor] = useState(COLORS[0].c);
  const [size, setSize] = useState(SIZES[1].w);
  const [tool, setTool] = useState('pen');     // pen | tick | cross
  const [ready, setReady] = useState(false);
  const [loadMsg, setLoadMsg] = useState('Loading student work…');
  const drawing = useRef(false);
  const current = useRef(null);
  const strokes = marks[pageIdx] || [];

  // Load image or render every PDF page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (pdfUrl) {
          setLoadMsg('Opening the PDF…');
          const pdfjsLib = await import('pdfjs-dist');
          const version = pdfjsLib.version || '5.6.205';
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
          const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
          const out = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            if (cancelled) return;
            setLoadMsg(`Rendering page ${i} of ${pdf.numPages}…`);
            const page = await pdf.getPage(i);
            const base = page.getViewport({ scale: 1 });
            const scale = Math.min(1600 / base.width, 3);
            const vp = page.getViewport({ scale });
            const c = document.createElement('canvas');
            c.width = Math.round(vp.width); c.height = Math.round(vp.height);
            await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            const img = new Image();
            img.src = c.toDataURL('image/png');
            await img.decode();
            out.push({ img, w: c.width, h: c.height });
          }
          if (!cancelled) setPages(out);
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = imageUrl; });
          const s = Math.min(1, 1600 / img.naturalWidth);
          if (!cancelled) setPages([{ img, w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s) }]);
        }
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error('[annotator load]', e);
        if (!cancelled) setLoadMsg('Could not open this file for correction.');
      }
    })();
    return () => { cancelled = true; };
  }, [imageUrl, pdfUrl]);

  // Size canvas to the current page
  useEffect(() => {
    if (!pages[pageIdx] || !canvasRef.current) return;
    canvasRef.current.width = pages[pageIdx].w;
    canvasRef.current.height = pages[pageIdx].h;
    redraw(marks[pageIdx] || [], pageIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, pageIdx]);

  const redraw = (list, pIdx = pageIdx) => {
    const c = canvasRef.current;
    const pg = pages[pIdx];
    if (!c || !pg) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(pg.img, 0, 0, c.width, c.height);
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

  const setPageStrokes = (list) => setMarks((m) => ({ ...m, [pageIdx]: list }));

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
    let next;
    if (tool === 'tick' || tool === 'cross') {
      next = [...strokes, { type: 'stamp', mark: tool === 'tick' ? '✓' : '✗', x: p.x, y: p.y, size, color }];
    } else {
      drawing.current = true;
      current.current = { type: 'pen', color, size, points: [p] };
      next = [...strokes, current.current];
    }
    setPageStrokes(next); redraw(next);
  };

  const move = (e) => {
    if (!drawing.current || !current.current) return;
    e.preventDefault();
    current.current.points.push(pos(e));
    redraw(strokes);
  };

  const up = () => { drawing.current = false; current.current = null; };
  const undo = () => { const next = strokes.slice(0, -1); setPageStrokes(next); redraw(next); };
  const clear = () => { setPageStrokes([]); redraw([]); };
  const goPage = (i) => { up(); setPageIdx(i); };

  const save = async () => {
    const blobs = [];
    for (let i = 0; i < pages.length; i++) {
      const pg = pages[i];
      const c = document.createElement('canvas');
      c.width = pg.w; c.height = pg.h;
      const ctx = c.getContext('2d');
      ctx.drawImage(pg.img, 0, 0, pg.w, pg.h);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const s of (marks[i] || [])) {
        if (s.type === 'pen') {
          ctx.strokeStyle = s.color; ctx.lineWidth = s.size;
          ctx.beginPath();
          s.points.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.stroke();
        } else if (s.type === 'stamp') {
          ctx.font = `bold ${s.size * 10}px Arial`;
          ctx.fillStyle = s.color;
          ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
          ctx.fillText(s.mark, s.x, s.y);
        }
      }
      blobs.push(await new Promise((res) => c.toBlob(res, 'image/png')));
    }
    onSave(blobs.filter(Boolean));
  };

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
        <button onClick={save} disabled={busy || !ready} style={{ ...btn(false), background: '#16a34a', borderColor: '#16a34a', color: '#fff', fontWeight: 700 }}>
          {busy ? 'Saving…' : '💾 Save correction'}
        </button>
        <button onClick={onClose} style={btn(false)}>✖</button>
      </div>

      {pages.length > 1 && (
        <div style={{ background: '#f0f4fa', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => goPage(pageIdx - 1)} disabled={pageIdx === 0} style={btn(false)}>‹ Prev</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Page {pageIdx + 1} of {pages.length}{(marks[pageIdx] || []).length ? ' ✏️' : ''}</span>
          <button onClick={() => goPage(pageIdx + 1)} disabled={pageIdx === pages.length - 1} style={btn(false)}>Next ›</button>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>correct each page — everything is saved into one corrected PDF</span>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', display: 'grid', placeItems: 'center', padding: 14, touchAction: 'none' }}>
        {!ready && <div style={{ color: '#fff', fontSize: 15 }}>{loadMsg}</div>}
        <canvas
          ref={canvasRef}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          style={{ maxWidth: '100%', maxHeight: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,.5)', cursor: 'crosshair', touchAction: 'none', display: ready ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}
