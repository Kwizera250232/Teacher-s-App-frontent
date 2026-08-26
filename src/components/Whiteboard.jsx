import { useRef, useEffect, useState, useCallback } from 'react';
import { PRIMARY_LEVELS, GRAPH_TYPES, drawRebTemplate } from '../lib/rebGraphs';

const COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed'];
const PENS = [
  { key: 'fine', label: 'Fine', size: 2, alpha: 1 },
  { key: 'medium', label: 'Medium', size: 5, alpha: 1 },
  { key: 'bold', label: 'Bold', size: 10, alpha: 1 },
  { key: 'marker', label: 'Marker', size: 14, alpha: 0.45 },
  { key: 'highlighter', label: 'Highlight', size: 18, alpha: 0.25 },
];

/**
 * Whiteboard component.
 * - Default mode: standalone board for posting drawings to feed (onSave returns blob)
 * - Live mode (live=true): exposes canvas via canvasRef prop for data URL sync,
 *   supports loading saved board state, and calls onDataChange when board changes.
 *   Uses canDraw to control pen access (teacher or student-with-pen only).
 */
export default function Whiteboard({ onSave, onCancel, live = false, canDraw = true, externalCanvasRef, onDataChange, initialData, height = 320 }) {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('draw');
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [penKey, setPenKey] = useState('medium');
  const [eraser, setEraser] = useState(false);
  const [primary, setPrimary] = useState('p3');
  const [graphType, setGraphType] = useState('bar');
  const [overlayText, setOverlayText] = useState('');

  const pen = PENS.find((p) => p.key === penKey) || PENS[1];

  const initCanvas = useCallback((blank = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth || 600;
    canvas.width = live ? Math.max(w, 800) : w;
    canvas.height = live ? (height || 500) : 320;
    if (blank) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [live, height]);

  useEffect(() => { initCanvas(true); }, [initCanvas]);

  // Expose canvas ref to parent in live mode
  useEffect(() => {
    if (live && externalCanvasRef) {
      externalCanvasRef.current = canvasRef.current;
    }
  }, [live, externalCanvasRef]);

  // Load initial data in live mode
  useEffect(() => {
    if (live && initialData && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      };
      img.src = initialData;
    }
  }, [live, initialData]);

  const applyGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const label = PRIMARY_LEVELS.find((p) => p.key === primary)?.label || primary;
    const gLabel = GRAPH_TYPES.find((g) => g.key === graphType)?.label || graphType;
    drawRebTemplate(ctx, canvas.width, canvas.height, primary, graphType, `${label} — ${gLabel}`);
    if (overlayText.trim()) {
      ctx.fillStyle = '#0f172a';
      ctx.font = '13px system-ui,sans-serif';
      const lines = overlayText.trim().split('\n');
      lines.forEach((line, i) => ctx.fillText(line, 24, canvas.height - 24 - (lines.length - 1 - i) * 18));
    }
    if (live && onDataChange) onDataChange();
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e) => {
    if (mode !== 'draw' || !canDraw) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = pen.alpha;
      ctx.lineWidth = pen.size;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const move = (e) => {
    if (!drawing || mode !== 'draw' || !canDraw) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const end = () => {
    if (!drawing) return;
    setDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.globalCompositeOperation = 'source-over';
    if (live && onDataChange) onDataChange();
  };

  const clear = () => {
    initCanvas(true);
    if (live && onDataChange) onDataChange();
  };

  const saveCanvasBlob = (cb) => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) cb(blob);
    }, 'image/png');
  };

  const save = () => saveCanvasBlob((blob) => onSave(blob));

  const postGraphToFeed = () => {
    if (mode === 'graph') applyGraph();
    saveCanvasBlob((blob) => onSave(blob));
  };

  return (
    <div className="whiteboard-wrap">
      {live ? (
        /* Live mode toolbar — compact, includes eraser + highlighter */
        <div className="whiteboard-tools" style={{ display: 'flex', gap: 4, padding: 6, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`wb-color ${!eraser && color === c ? 'active' : ''}`}
              style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: !eraser && color === c ? '3px solid #0f4c3a' : '2px solid #e2e8f0', cursor: canDraw ? 'pointer' : 'not-allowed', opacity: canDraw ? 1 : 0.4 }}
              onClick={() => { if (canDraw) { setColor(c); setEraser(false); } }}
            />
          ))}
          {PENS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`feed-type-btn ${penKey === p.key && !eraser ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '3px 8px', opacity: canDraw ? 1 : 0.4, cursor: canDraw ? 'pointer' : 'not-allowed' }}
              onClick={() => { if (canDraw) { setPenKey(p.key); setEraser(false); } }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className={`feed-type-btn ${eraser ? 'active' : ''}`}
            style={{ fontSize: 11, padding: '3px 8px', opacity: canDraw ? 1 : 0.4, cursor: canDraw ? 'pointer' : 'not-allowed' }}
            onClick={() => { if (canDraw) setEraser(true); }}
          >
            🧹 Eraser
          </button>
          <button
            type="button"
            className="feed-type-btn"
            style={{ fontSize: 11, padding: '3px 8px', opacity: canDraw ? 1 : 0.4, cursor: canDraw ? 'pointer' : 'not-allowed' }}
            onClick={() => { if (canDraw) clear(); }}
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <div className="whiteboard-tabs">
            <button type="button" className={mode === 'draw' ? 'active' : ''} onClick={() => setMode('draw')}>✏️ Draw</button>
            <button type="button" className={mode === 'graph' ? 'active' : ''} onClick={() => setMode('graph')}>📊 REB Graphs</button>
          </div>

          {mode === 'graph' && (
            <div className="wb-graph-panel">
              <label>
                Primary level
                <select value={primary} onChange={(e) => setPrimary(e.target.value)}>
                  {PRIMARY_LEVELS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Graph type
                <select value={graphType} onChange={(e) => setGraphType(e.target.value)}>
                  {GRAPH_TYPES.map((g) => (
                    <option key={g.key} value={g.key}>{g.icon} {g.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Lesson text (optional)
                <textarea
                  rows={2}
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Title, labels, or instructions..."
                />
              </label>
              <button type="button" className="btn btn-primary btn-sm" onClick={applyGraph}>
                Add graph to board
              </button>
            </div>
          )}

          {mode === 'draw' && (
            <div className="whiteboard-tools">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`wb-color ${!eraser && color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => { setColor(c); setEraser(false); }}
                />
              ))}
              {PENS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`feed-type-btn ${penKey === p.key && !eraser ? 'active' : ''}`}
                  onClick={() => { setPenKey(p.key); setEraser(false); }}
                >
                  {p.label}
                </button>
              ))}
              <button type="button" className={`feed-type-btn ${eraser ? 'active' : ''}`} onClick={() => setEraser(true)}>Eraser</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>Clear</button>
            </div>
          )}
        </>
      )}

      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        style={{ pointerEvents: (mode === 'draw' && canDraw) ? 'auto' : 'none', width: '100%', height: 'auto', touchAction: 'none', background: '#fff', display: 'block', cursor: canDraw ? 'crosshair' : 'default' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />

      {!live && (
        <div className="whiteboard-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={postGraphToFeed}>
            {mode === 'graph' ? 'Post graph to feed' : 'Post drawing to feed'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
}
