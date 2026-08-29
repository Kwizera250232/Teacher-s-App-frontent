import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getStroke } from 'perfect-freehand';
import { PRIMARY_LEVELS, GRAPH_TYPES, drawRebTemplate } from '../lib/rebGraphs';

const COLORS = ['#1a1a2e', '#1e3a8a', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed'];

// ── Pen presets using Perfect Freehand options ──
// size = base width in px; thinning = pressure/velocity effect;
// smoothing = how much to smooth jitter (0-1); streamline = stabilization (0-1)
const PENS = [
  { key: 'pen',   label: '✒️ Pen',     size: 2.5, thinning: 0.6, smoothing: 0.5, streamline: 0.5, alpha: 1,    color: '#1a1a2e' },
  { key: 'fine',  label: '🖊️ Fine',    size: 1.5, thinning: 0.7, smoothing: 0.6, streamline: 0.6, alpha: 1,    color: '#1a1a2e' },
  { key: 'pencil',label: '✏️ Pencil',  size: 2.0, thinning: 0.5, smoothing: 0.7, streamline: 0.4, alpha: 0.75, color: '#444' },
  { key: 'bold',  label: 'Bold',       size: 5,   thinning: 0.3, smoothing: 0.4, streamline: 0.3, alpha: 1,    color: '#1a1a2e' },
  { key: 'marker',label: 'Marker',     size: 10,  thinning: 0.1, smoothing: 0.3, streamline: 0.2, alpha: 0.45, color: '#2563eb' },
];

const BG_NONE = 'none';
const BG_NOTEBOOK = 'notebook';
const BG_GRID = 'grid';
const BG_WHITEBOARD = 'whiteboard';

/**
 * Whiteboard with Perfect Freehand stroke engine.
 * Features:
 *  - Pressure/velocity-sensitive strokes (natural handwriting)
 *  - Point stabilization (streamline) to remove jitter
 *  - Stroke-based undo/redo (not pixel-based)
 *  - Notebook / Grid / Whiteboard backgrounds
 *  - Hand/Pan mode to scroll without drawing
 *  - Stroke clipping — drawing stays inside the canvas
 *  - Eraser removes entire strokes (natural)
 */
const Whiteboard = forwardRef(function Whiteboard({ onSave, onCancel, live = false, canDraw = true, externalCanvasRef, onDataChange, initialData, height = 320 }, ref) {
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);   // background layer (notebook/grid)
  const wrapRef = useRef(null);

  const [mode, setMode] = useState('draw');      // 'draw' | 'graph'
  const [tool, setTool] = useState('pen');        // 'pen' | 'fine' | 'pencil' | 'bold' | 'marker' | 'eraser' | 'hand'
  const [color, setColor] = useState(COLORS[0]);
  const [primary, setPrimary] = useState('p3');
  const [graphType, setGraphType] = useState('bar');
  const [overlayText, setOverlayText] = useState('');
  const [background, setBackground] = useState(BG_WHITEBOARD);

  // Stroke storage — each stroke = { points: [[x,y,pressure]], color, pen, eraser }
  const strokesRef = useRef([]);
  const redoStackRef = useRef([]);
  const currentStrokeRef = useRef(null);
  const drawingRef = useRef(false);
  const panRef = useRef({ panning: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  const pen = PENS.find((p) => p.key === tool) || PENS[0];
  const isEraser = tool === 'eraser';
  const isHand = tool === 'hand';

  // ── Convert perfect-freehand stroke to SVG path ──
  const strokeToPath = useCallback((strokePoints) => {
    if (!strokePoints || strokePoints.length === 0) return '';
    const d = strokePoints.reduce(
      (acc, [x, y], i, arr) => {
        if (i === 0) return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
        const [x0, y0] = arr[i - 1];
        const midX = (x0 + x) / 2;
        const midY = (y0 + y) / 2;
        return `${acc} Q ${x0.toFixed(2)} ${y0.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
      },
      ''
    );
    return d + ` L ${strokePoints[strokePoints.length - 1][0].toFixed(2)} ${strokePoints[strokePoints.length - 1][1].toFixed(2)}`;
  }, []);

  // ── Get perfect-freehand stroke outline points ──
  const getStrokeOutline = useCallback((strokeData) => {
    const opts = {
      size: strokeData.pen.size * 2,
      thinning: strokeData.pen.thinning,
      smoothing: strokeData.pen.smoothing,
      streamline: strokeData.pen.streamline,
      easing: (t) => t, // linear
      start: { taper: 0, cap: true },
      end: { taper: 0, cap: true },
    };
    return getStroke(strokeData.points, opts);
  }, []);

  // ── Draw a single stroke on the canvas ──
  const drawStroke = useCallback((ctx, strokeData) => {
    const outline = getStrokeOutline(strokeData);
    if (outline.length < 2) {
      // Single dot — draw a small circle
      if (strokeData.points.length > 0) {
        const [x, y] = strokeData.points[0];
        ctx.fillStyle = strokeData.eraser ? '#fff' : strokeData.color;
        ctx.globalAlpha = strokeData.eraser ? 1 : strokeData.pen.alpha;
        ctx.beginPath();
        ctx.arc(x, y, strokeData.pen.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      return;
    }
    ctx.save();
    ctx.globalAlpha = strokeData.eraser ? 1 : strokeData.pen.alpha;
    ctx.fillStyle = strokeData.eraser ? '#ffffff' : strokeData.color;
    ctx.beginPath();
    outline.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [getStrokeOutline]);

  // ── Redraw all strokes ──
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw all strokes
    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  }, [drawStroke]);

  // ── Draw background layer ──
  const drawBackground = useCallback((bg) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth || 600;
    const cssH = canvas.offsetHeight || (live ? (height || 500) : 320);
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    if (bg === BG_NOTEBOOK) {
      // Notebook lines
      const spacing = 32;
      ctx.strokeStyle = '#a8c5e8';
      ctx.lineWidth = 1;
      for (let y = spacing; y < cssH; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
      }
      // Red margin line
      ctx.strokeStyle = '#e8a5a5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, cssH);
      ctx.stroke();
    } else if (bg === BG_GRID) {
      // Grid for math
      const cell = 24;
      ctx.strokeStyle = '#d0d8e0';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= cssW; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cssH);
        ctx.stroke();
      }
      for (let y = 0; y <= cssH; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
      }
      // Major lines every 4 cells
      ctx.strokeStyle = '#a0b0c0';
      ctx.lineWidth = 1;
      for (let x = 0; x <= cssW; x += cell * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cssH);
        ctx.stroke();
      }
      for (let y = 0; y <= cssH; y += cell * 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
      }
    }
    // BG_WHITEBOARD or BG_NONE = plain white (already filled)
  }, [live, height]);

  // ── Initialize canvas with proper DPR ──
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth || 600;
    const cssW = live ? Math.max(w, 800) : w;
    const cssH = live ? (height || 500) : 320;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawBackground(background);
    redrawAll();
  }, [live, height, background, drawBackground, redrawAll]);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  // Redraw when background changes
  useEffect(() => { drawBackground(background); }, [background, drawBackground]);

  // Expose canvas ref to parent in live mode
  useEffect(() => {
    if (live && externalCanvasRef) {
      externalCanvasRef.current = canvasRef.current;
    }
  }, [live, externalCanvasRef]);

  // Load initial data in live mode (as image)
  useEffect(() => {
    if (live && initialData && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvasRef.current.width / dpr;
        const cssH = canvasRef.current.height / dpr;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0, cssW, cssH);
      };
      img.src = initialData;
    }
  }, [live, initialData]);

  // Expose undo/redo/clear to parent via ref
  useImperativeHandle(ref, () => ({
    undo: () => doUndo(),
    redo: () => doRedo(),
    clear: () => doClear(),
    getCanvas: () => canvasRef.current,
  }));

  // ── Get position with pressure ──
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let x = ((clientX - rect.left) / rect.width) * (canvas.width / dpr);
    let y = ((clientY - rect.top) / rect.height) * (canvas.height / dpr);
    // Clip to canvas bounds — no drawing outside
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    x = Math.max(0, Math.min(cssW, x));
    y = Math.max(0, Math.min(cssH, y));
    // Pressure
    let pressure = 0.5;
    if (e.touches && e.touches[0] && e.touches[0].force > 0) {
      pressure = e.touches[0].force;
    } else if (e.pointerType === 'pen' && e.pressure > 0) {
      pressure = e.pressure;
    } else if (e.touches) {
      // Touch — simulate slight pressure variation based on speed (handled by perfect-freehand)
      pressure = 0.5;
    } else {
      pressure = 0.5; // Mouse — constant pressure, perfect-freehand uses velocity
    }
    return [x, y, pressure];
  };

  // ── Start drawing ──
  const start = (e) => {
    if (mode !== 'draw' || !canDraw) return;
    if (isHand) {
      // Pan mode
      e.preventDefault();
      const wrap = wrapRef.current;
      if (!wrap) return;
      panRef.current = {
        panning: true,
        startX: e.touches ? e.touches[0].clientX : e.clientX,
        startY: e.touches ? e.touches[0].clientY : e.clientY,
        scrollLeft: wrap.scrollLeft,
        scrollTop: wrap.scrollTop,
      };
      return;
    }
    e.preventDefault();
    const pos = getPos(e);
    drawingRef.current = true;
    redoStackRef.current = []; // clear redo on new stroke
    currentStrokeRef.current = {
      points: [pos],
      color: isEraser ? '#ffffff' : color,
      pen: isEraser ? { ...PENS[0], size: 15, alpha: 1, thinning: 0, smoothing: 0.3, streamline: 0.3 } : pen,
      eraser: isEraser,
    };
    // Draw initial dot
    const ctx = canvasRef.current.getContext('2d');
    drawStroke(ctx, currentStrokeRef.current);
  };

  // ── Continue drawing ──
  const move = (e) => {
    if (panRef.current.panning) {
      e.preventDefault();
      const wrap = wrapRef.current;
      if (!wrap) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      wrap.scrollLeft = panRef.current.scrollLeft - (x - panRef.current.startX);
      wrap.scrollTop = panRef.current.scrollTop - (y - panRef.current.startY);
      return;
    }
    if (!drawingRef.current || mode !== 'draw' || !canDraw) return;
    e.preventDefault();
    const pos = getPos(e);
    const stroke = currentStrokeRef.current;
    if (!stroke) return;
    // Stabilization: skip points too close to the last one (min distance)
    const last = stroke.points[stroke.points.length - 1];
    const dx = pos[0] - last[0];
    const dy = pos[1] - last[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.5) return; // skip micro-jitter
    stroke.points.push(pos);
    // Redraw just this stroke on top of existing canvas
    const ctx = canvasRef.current.getContext('2d');
    // We need to redraw all + current for correct rendering
    // Optimization: redraw all strokes + current
    redrawAll();
    drawStroke(ctx, stroke);
  };

  // ── End drawing ──
  const end = () => {
    if (panRef.current.panning) {
      panRef.current.panning = false;
      return;
    }
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const stroke = currentStrokeRef.current;
    if (stroke && stroke.points.length > 0) {
      strokesRef.current.push(stroke);
      // Final clean redraw
      redrawAll();
    }
    currentStrokeRef.current = null;
    if (live && onDataChange) onDataChange();
  };

  // ── Undo ──
  const doUndo = () => {
    if (strokesRef.current.length === 0) return;
    const last = strokesRef.current.pop();
    redoStackRef.current.push(last);
    redrawAll();
    if (live && onDataChange) onDataChange();
  };

  // ── Redo ──
  const doRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const stroke = redoStackRef.current.pop();
    strokesRef.current.push(stroke);
    redrawAll();
    if (live && onDataChange) onDataChange();
  };

  // ── Clear ──
  const doClear = () => {
    if (strokesRef.current.length === 0) return;
    // Move all to redo for undo-clear
    redoStackRef.current = [...strokesRef.current];
    strokesRef.current = [];
    redrawAll();
    if (live && onDataChange) onDataChange();
  };

  // ── Graph mode ──
  const applyGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    const label = PRIMARY_LEVELS.find((p) => p.key === primary)?.label || primary;
    const gLabel = GRAPH_TYPES.find((g) => g.key === graphType)?.label || graphType;
    // Draw graph directly on canvas (not as a stroke)
    drawRebTemplate(ctx, cssW, cssH, primary, graphType, `${label} — ${gLabel}`);
    if (overlayText.trim()) {
      ctx.fillStyle = '#0f172a';
      ctx.font = '13px system-ui,sans-serif';
      const lines = overlayText.trim().split('\n');
      lines.forEach((line, i) => ctx.fillText(line, 24, cssH - 24 - (lines.length - 1 - i) * 18));
    }
    if (live && onDataChange) onDataChange();
  };

  // ── Save ──
  const saveCanvasBlob = (cb) => {
    // Composite: background + strokes
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) cb(blob);
    }, 'image/png');
  };

  const save = () => saveCanvasBlob((blob) => onSave(blob));
  const postGraphToFeed = () => {
    if (mode === 'graph') applyGraph();
    saveCanvasBlob((blob) => onSave(blob));
  };

  // ── Tool button style ──
  const toolBtnStyle = (active, emoji) => ({
    fontSize: 11, padding: '4px 8px', cursor: canDraw ? 'pointer' : 'not-allowed',
    opacity: canDraw ? 1 : 0.4, borderRadius: 6, border: active ? '1.5px solid #667eea' : '1px solid #e2e8f0',
    background: active ? '#eef2ff' : '#fff', fontWeight: active ? 700 : 500,
    transition: 'all 0.15s', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3,
  });

  const bgBtnStyle = (active) => ({
    fontSize: 11, padding: '4px 8px', cursor: 'pointer', borderRadius: 6,
    border: active ? '1.5px solid #667eea' : '1px solid #e2e8f0',
    background: active ? '#eef2ff' : '#fff', fontWeight: active ? 700 : 500,
  });

  return (
    <div className="whiteboard-wrap" ref={wrapRef} style={{ overflow: isHand ? 'auto' : 'hidden', position: 'relative' }}>
      {/* Background canvas (notebook/grid) */}
      <canvas
        ref={bgCanvasRef}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto',
          pointerEvents: 'none', zIndex: 0, background: '#fff',
        }}
      />

      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        style={{
          pointerEvents: (mode === 'draw' && canDraw) ? 'auto' : 'none',
          width: '100%', height: 'auto', touchAction: isHand ? 'pan-x pan-y' : 'none',
          background: 'transparent', display: 'block',
          cursor: isHand ? 'grab' : (isEraser ? 'cell' : 'crosshair'),
          position: 'relative', zIndex: 1,
        }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />

      {live ? (
        /* Live mode toolbar */
        <div className="whiteboard-tools" style={{
          display: 'flex', gap: 4, padding: 6, flexWrap: 'wrap', alignItems: 'center',
          borderBottom: '1px solid #e2e8f0', position: 'relative', zIndex: 2, background: '#fff',
        }}>
          {/* Pen tools */}
          {PENS.map((p) => (
            <button key={p.key} type="button" style={toolBtnStyle(tool === p.key, p.label)} onClick={() => { if (canDraw) setTool(p.key); }}>
              {p.label}
            </button>
          ))}
          {/* Eraser */}
          <button type="button" style={toolBtnStyle(isEraser)} onClick={() => { if (canDraw) setTool('eraser'); }}>
            🧽 Eraser
          </button>
          {/* Hand/Pan */}
          <button type="button" style={toolBtnStyle(isHand)} onClick={() => { if (canDraw) setTool('hand'); }} title="Pan/scroll mode">
            🖐️ Hand
          </button>
          {/* Divider */}
          <span style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
          {/* Colors */}
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              style={{
                width: 20, height: 20, borderRadius: '50%', background: c, cursor: canDraw ? 'pointer' : 'not-allowed',
                opacity: canDraw ? 1 : 0.4, border: (!isEraser && color === c) ? '3px solid #0f4c3a' : '2px solid #e2e8f0',
              }}
              onClick={() => { if (canDraw) { setColor(c); if (isEraser) setTool('pen'); } }}
            />
          ))}
          {/* Divider */}
          <span style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
          {/* Background */}
          <button type="button" style={bgBtnStyle(background === BG_WHITEBOARD)} onClick={() => setBackground(BG_WHITEBOARD)}>⬜ Board</button>
          <button type="button" style={bgBtnStyle(background === BG_NOTEBOOK)} onClick={() => setBackground(BG_NOTEBOOK)}>📓 Notebook</button>
          <button type="button" style={bgBtnStyle(background === BG_GRID)} onClick={() => setBackground(BG_GRID)}>▦ Grid</button>
          {/* Divider */}
          <span style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
          {/* Undo / Redo */}
          <button type="button" style={toolBtnStyle(false)} onClick={doUndo} title="Undo" disabled={strokesRef.current.length === 0}>
            ↩️ Undo
          </button>
          <button type="button" style={toolBtnStyle(false)} onClick={doRedo} title="Redo" disabled={redoStackRef.current.length === 0}>
            ↪️ Redo
          </button>
          <button type="button" style={toolBtnStyle(false)} onClick={doClear} title="Clear all">
            🗑 Clear
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
                  {PRIMARY_LEVELS.map((p) => (<option key={p.key} value={p.key}>{p.label}</option>))}
                </select>
              </label>
              <label>
                Graph type
                <select value={graphType} onChange={(e) => setGraphType(e.target.value)}>
                  {GRAPH_TYPES.map((g) => (<option key={g.key} value={g.key}>{g.icon} {g.label}</option>))}
                </select>
              </label>
              <label>
                Lesson text (optional)
                <textarea rows={2} value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="Title, labels, or instructions..." />
              </label>
              <button type="button" className="btn btn-primary btn-sm" onClick={applyGraph}>Add graph to board</button>
            </div>
          )}

          {mode === 'draw' && (
            <div className="whiteboard-tools" style={{ display: 'flex', gap: 4, padding: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {PENS.map((p) => (
                <button key={p.key} type="button" style={toolBtnStyle(tool === p.key)} onClick={() => setTool(p.key)}>
                  {p.label}
                </button>
              ))}
              <button type="button" style={toolBtnStyle(isEraser)} onClick={() => setTool('eraser')}>🧽 Eraser</button>
              <button type="button" style={toolBtnStyle(isHand)} onClick={() => setTool('hand')}>🖐️ Hand</button>
              <span style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
              {COLORS.map((c) => (
                <button key={c} type="button" className={`wb-color ${!isEraser && color === c ? 'active' : ''}`}
                  style={{ background: c, border: (!isEraser && color === c) ? '3px solid #0f4c3a' : '2px solid #e2e8f0' }}
                  onClick={() => { setColor(c); if (isEraser) setTool('pen'); }} />
              ))}
              <span style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
              <button type="button" style={bgBtnStyle(background === BG_WHITEBOARD)} onClick={() => setBackground(BG_WHITEBOARD)}>⬜ Board</button>
              <button type="button" style={bgBtnStyle(background === BG_NOTEBOOK)} onClick={() => setBackground(BG_NOTEBOOK)}>📓 Notebook</button>
              <button type="button" style={bgBtnStyle(background === BG_GRID)} onClick={() => setBackground(BG_GRID)}>▦ Grid</button>
              <span style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
              <button type="button" style={toolBtnStyle(false)} onClick={doUndo}>↩️ Undo</button>
              <button type="button" style={toolBtnStyle(false)} onClick={doRedo}>↪️ Redo</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={doClear}>Clear</button>
            </div>
          )}
        </>
      )}

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
});

export default Whiteboard;
