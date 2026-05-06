import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './NurseryBoard.css';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#111827'];
const STICKERS = ['⭐', '🌈', '🦋', '🚗', '🍎', '🐘', '🏀', '🎈'];

export default function NurseryBoard() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(8);
  const [sticker, setSticker] = useState(STICKERS[0]);

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
  };

  return (
    <div className="nursery-page">
      <header className="nursery-header">
        <div>
          <p className="kicker">Nursery Board</p>
          <h1>Kids Drawing & Writing Board</h1>
          <p>Fun, safe space for children to draw, write letters, and save artwork on mum's phone or computer.</p>
        </div>
        <div className="nursery-actions">
          <Link className="btn btn-outline" to="/welcome">Back Home</Link>
          <button className="btn btn-primary" onClick={saveBoard}>Save Artwork</button>
        </div>
      </header>

      <section className="nursery-tools">
        <div className="tool-group">
          <button className={tool === 'pen' ? 'active' : ''} onClick={() => setTool('pen')}>Pen</button>
          <button className={tool === 'eraser' ? 'active' : ''} onClick={() => setTool('eraser')}>Eraser</button>
          <button className={tool === 'stamp' ? 'active' : ''} onClick={() => setTool('stamp')}>Sticker</button>
          <button onClick={clearBoard}>Clear</button>
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
          <label>Brush: {size}px</label>
          <input type="range" min="2" max="30" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </div>

        {tool === 'stamp' && (
          <div className="tool-group stickers">
            {STICKERS.map((s) => (
              <button key={s} className={sticker === s ? 'active' : ''} onClick={() => setSticker(s)}>{s}</button>
            ))}
          </div>
        )}
      </section>

      <section className="nursery-canvas-wrap">
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
      </section>

      <section className="nursery-ideas">
        <h2>Try these activities</h2>
        <div className="ideas-grid">
          <article><h3>Letter Practice</h3><p>Trace A, B, C and your own name using colorful pens.</p></article>
          <article><h3>Family Art</h3><p>Draw your mum, dad, or home and add stickers.</p></article>
          <article><h3>Number Time</h3><p>Write numbers 1-10 and decorate with stars.</p></article>
        </div>
      </section>
    </div>
  );
}
