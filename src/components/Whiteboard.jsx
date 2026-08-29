import { useRef, useEffect, useState, useCallback } from 'react';
import { PRIMARY_LEVELS, GRAPH_TYPES, drawRebTemplate } from '../lib/rebGraphs';

const COLORS = ['#111827', '#1e3a8a', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed'];

// Pen presets — Ink Pen is the new smooth, thin pen for handwriting
const PENS = [
  { key: 'ink', label: '✒️ Ink', size: 1.8, alpha: 1, smooth: true },
  { key: 'fine', label: 'Fine', size: 2.5, alpha: 1, smooth: true },
  { key: 'medium', label: 'Medium', size: 5, alpha: 1, smooth: true },
  { key: 'bold', label: 'Bold', size: 10, alpha: 1, smooth: false },
  { key: 'marker', label: 'Marker', size: 14, alpha: 0.45, smooth: false },
  { key: 'highlighter', label: 'Highlight', size: 18, alpha: 0.25, smooth: false },
];

/**
 * Whiteboard component with smooth ink pen and ruled guide lines.
 * - Default mode: standalone board for posting drawings to feed
 * - Live mode (live=true): exposes canvas via canvasRef prop for data URL sync,
 *   supports loading saved board state, and calls onDataChange when board changes.
 *   Uses canDraw to control pen access (teacher or student-with-pen only).
 */
export default function Whiteboard({ onSave, onCancel, live = false, canDraw = true, externalCanvasRef, onDataChange, initialData, height = 320 }) {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('draw');
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [penKey, setPenKey] = useState('ink');
  const [eraser, setEraser] = useState(false);
  const [primary, setPrimary] = useState('p3');
  const [graphType, setGraphType] = useState('bar');
  const [overlayText, setOverlayText] = useState('');
  const [showRuled, setShowRuled] = useState(false);

  // Stroke buffer for smooth drawing
  const strokeRef = useRef([]); // array of {x, y}
  const ruledLayerRef = useRef(null); // offscreen canvas for ruled lines

  const pen = PENS.find((p) => p.key === penKey) || PENS[0];

  // ── Draw ruled lines on a separate layer (so they don't get saved) ──
  const drawRuledLines = useCallback((show) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!show) {
      // Remove ruled line overlay if exists
      const existing = canvas.parentNode?.querySelector('.ruled-overlay');
      if (existing) existing.remove();
      return;
    }
    let overlay = canvas.parentNode?.querySelector('.ruled-overlay');
    if (!overlay) {
      overlay = document.createElement('canvas');
      overlay.className = 'ruled-overlay';
      overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1;';
      canvas.parentNode.style.position = 'relative';
      canvas.parentNode.appendChild(overlay);
    }
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Ruled lines — like notebook paper
    const lineSpacing = Math.max(28, canvas.height / 12);
    const margin = 60;
    ctx.strokeStyle = '#c5d5e8';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (let y = lineSpacing; y < canvas.height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // Red margin line on left (like notebook)
    ctx.strokeStyle = '#e8a5a5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin, 0);
    ctx.lineTo(margin, canvas.height);
    ctx.stroke();
  }, []);

  const initCanvas = useCallback((blank = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth || 600;
    // Use device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const cssW = live ? Math.max(w, 800) : w;
    const cssH = live ? (height || 500) : 320;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.scale(dpr, dpr);
    if (blank) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cssW, cssH);
    }
    // Re-draw ruled lines if enabled
    if (showRuled) drawRuledLines(true);
  }, [live, height, showRuled, drawRuledLines]);

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
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvasRef.current.width / dpr;
        const cssH = canvasRef.current.height / dpr;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0, cssW, cssH);
      };
      img.src = initialData;
    }
  }, [live, initialData]);

  // Toggle ruled lines
  useEffect(() => {
    drawRuledLines(showRuled);
  }, [showRuled, drawRuledLines]);

  const applyGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    const label = PRIMARY_LEVELS.find((p) => p.key === primary)?.label || primary;
    const gLabel = GRAPH_TYPES.find((g) => g.key === graphType)?.label || graphType;
    drawRebTemplate(ctx, cssW, cssH, primary, graphType, `${label} — ${gLabel}`);
    if (overlayText.trim()) {
      ctx.fillStyle = '#0f172a';
      ctx.font = '13px system-ui,sans-serif';
      const lines = overlayText.trim().split('\n');
      lines.forEach((line, i) => ctx.fillText(line, 24, cssH - 24 - (lines.length - 1 - i) * 18));
    }
    if (live && onDataChange) onDataChange();
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dpr = window.devicePixelRatio || 1;
    return {
      x: ((clientX - rect.left) / rect.width) * (canvas.width / dpr),
      y: ((clientY - rect.top) / rect.height) * (canvas.height / dpr),
    };
  };

  // ── Smooth stroke drawing using quadratic Bezier curves ──
  const drawSmoothSegment = useCallback((ctx, points) => {
    if (points.length < 2) return;
    if (points.length === 2) {
      // Just a dot / short line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      return;
    }
    // Use quadratic Bezier through midpoints for smoothness
    const last = points.length - 1;
    const p0 = points[last - 2];
    const p1 = points[last - 1];
    const p2 = points[last];
    // Midpoints
    const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(mid1.x, mid1.y);
    ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
    ctx.stroke();
  }, []);

  const start = (e) => {
    if (mode !== 'draw' || !canDraw) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineCap = pen.smooth ? 'round' : 'round';
    ctx.lineJoin = pen.smooth ? 'round' : 'round';
    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = pen.alpha;
      ctx.lineWidth = pen.size;
    }
    // Start a new stroke buffer
    strokeRef.current = [{ x, y }];
    // Draw a dot for immediate feedback
    ctx.beginPath();
    ctx.arc(x, y, pen.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    if (!eraser) ctx.fill();
    setDrawing(true);
  };

  const move = (e) => {
    if (!drawing || mode !== 'draw' || !canDraw) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    strokeRef.current.push({ x, y });

    if (pen.smooth && !eraser) {
      // Smooth Bezier drawing
      drawSmoothSegment(ctx, strokeRef.current);
    } else {
      // Direct drawing for marker/highlighter/eraser
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const end = () => {
    if (!drawing) return;
    setDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      // Finish the smooth stroke — draw final segment to last point
      if (pen.smooth && !eraser && strokeRef.current.length >= 2) {
        const pts = strokeRef.current;
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const mid = { x: (prev.x + last.x) / 2, y: (prev.y + last.y) / 2 };
        ctx.beginPath();
        ctx.moveTo(mid.x, mid.y);
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    strokeRef.current = [];
    if (live && onDataChange) onDataChange();
  };

  const clear = () => {
    initCanvas(true);
    if (live && onDataChange) onDataChange();
  };

  const saveCanvasBlob = (cb) => {
    // Temporarily hide ruled lines before saving
    const overlay = canvasRef.current?.parentNode?.querySelector('.ruled-overlay');
    if (overlay) overlay.style.display = 'none';
    canvasRef.current?.toBlob((blob) => {
      if (overlay) overlay.style.display = '';
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
        /* Live mode toolbar — compact */
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
              style={{ fontSize: 11, padding: '3px 8px', opacity: canDraw ? 1 : 0.4, cursor: canDraw ? 'pointer' : 'not-allowed', background: penKey === p.key && !eraser ? '#eef2ff' : 'transparent', borderRadius: 6, border: penKey === p.key && !eraser ? '1px solid #667eea' : '1px solid transparent' }}
              onClick={() => { if (canDraw) { setPenKey(p.key); setEraser(false); } }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className={`feed-type-btn ${showRuled ? 'active' : ''}`}
            style={{ fontSize: 11, padding: '3px 8px', opacity: canDraw ? 1 : 0.4, cursor: canDraw ? 'pointer' : 'not-allowed', background: showRuled ? '#eef2ff' : 'transparent', borderRadius: 6, border: showRuled ? '1px solid #667eea' : '1px solid transparent' }}
            onClick={() => { if (canDraw) setShowRuled(s => !s); }}
            title="Toggle ruled guide lines for handwriting"
          >
            📏 Ruled
          </button>
          <button
            type="button"
            className={`feed-type-btn ${eraser ? 'active' : ''}`}
            style={{ fontSize: 11, padding: '3px 8px', opacity: canDraw ? 1 : 0.4, cursor: canDraw ? 'pointer' : 'not-allowed', background: eraser ? '#fee2e2' : 'transparent', borderRadius: 6, border: eraser ? '1px solid #ef4444' : '1px solid transparent' }}
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
              <button
                type="button"
                className={`feed-type-btn ${showRuled ? 'active' : ''}`}
                onClick={() => setShowRuled(s => !s)}
                title="Toggle ruled guide lines"
              >
                📏 Ruled
              </button>
              <button type="button" className={`feed-type-btn ${eraser ? 'active' : ''}`} onClick={() => setEraser(true)}>Eraser</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>Clear</button>
            </div>
          )}
        </>
      )}

      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        style={{ pointerEvents: (mode === 'draw' && canDraw) ? 'auto' : 'none', width: '100%', height: 'auto', touchAction: 'none', background: '#fff', display: 'block', cursor: canDraw ? 'crosshair' : 'default', position: 'relative', zIndex: 0 }}
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
