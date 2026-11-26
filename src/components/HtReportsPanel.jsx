import { useEffect, useRef, useState } from 'react';
import { API_BASE, UPLOADS_BASE } from '../api';

const inp = { padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' };
const ZONES = {
  front: [
    { key: 'info', label: 'Student info', color: '#2563eb' },
    { key: 'marks', label: 'Marks table', color: '#16a34a' },
  ],
  back: [
    { key: 'comments', label: 'Comments', color: '#d97706' },
  ],
};

const imgUrl = (p) => {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  if (p.startsWith('/uploads/')) return `${UPLOADS_BASE}${p}`;
  return `${UPLOADS_BASE}/uploads/${p.replace(/^\/+/, '')}`;
};

/** A report-card page image with draggable/resizable zone boxes on top. */
function ZoneEditor({ src, zones, onChange, zoneDefs }) {
  const ref = useRef(null);
  const drag = useRef(null);

  const pct = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const startDrag = (e, key, mode) => {
    e.preventDefault(); e.stopPropagation();
    const p = pct(e);
    const z = zones[key];
    drag.current = { key, mode, sx: p.x, sy: p.y, oz: { ...z } };
    const move = (ev) => {
      const d = drag.current; if (!d) return;
      const q = pct(ev);
      const dx = q.x - d.sx; const dy = q.y - d.sy;
      if (d.mode === 'move') {
        onChange(d.key, { ...d.oz, x: clamp(d.oz.x + dx, 0, 100 - d.oz.w), y: clamp(d.oz.y + dy, 0, 100 - d.oz.h) });
      } else {
        onChange(d.key, { ...d.oz, w: clamp(d.oz.w + dx, 5, 100 - d.oz.x), h: clamp(d.oz.h + dy, 5, 100 - d.oz.y) });
      }
    };
    const up = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', aspectRatio: '210/297', border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <img src={src} alt="report card page" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
      {zoneDefs.map(({ key, label, color }) => {
        const z = zones[key]; if (!z) return null;
        return (
          <div
            key={key}
            onPointerDown={(e) => startDrag(e, key, 'move')}
            style={{
              position: 'absolute', left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
              border: `2px dashed ${color}`, background: `${color}14`, cursor: 'move', touchAction: 'none',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            }}
          >
            <span style={{ background: color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: '0 0 6px 6px', pointerEvents: 'none' }}>{label}</span>
            <div
              onPointerDown={(e) => startDrag(e, key, 'resize')}
              style={{ position: 'absolute', right: -7, bottom: -7, width: 14, height: 14, background: color, borderRadius: 3, cursor: 'nwse-resize', touchAction: 'none' }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function HtReportsPanel({ token, onError }) {
  const [tpl, setTpl] = useState(null);
  const [layout, setLayout] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [subs, setSubs] = useState([]);
  const [editZones, setEditZones] = useState(false);

  const load = async () => {
    try {
      const [t, i] = await Promise.all([
        fetch(`${API_BASE}/catmarks/report-card/template`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_BASE}/catmarks/reports-inbox`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      setTpl(t.template || null);
      setLayout(t.template?.layout || t.defaults || null);
      setSubs(i.submissions || []);
    } catch (e) {
      onError?.(e.message || 'Could not load reports.');
    }
  };
  useEffect(() => { load(); }, [token]); // eslint-disable-line

  const uploadCard = async () => {
    if (!frontFile && !backFile) { onError?.('Choose the front and/or back image first.'); return; }
    setBusy(true); setSaved('');
    try {
      const fd = new FormData();
      if (frontFile) fd.append('front', frontFile);
      if (backFile) fd.append('back', backFile);
      const res = await fetch(`${API_BASE}/catmarks/report-card/template`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      setTpl(d.template); setLayout(d.template?.layout || layout);
      setFrontFile(null); setBackFile(null);
      setSaved('✅ Report card saved — every teacher in the school now uses this End-Term format.');
    } catch (e) {
      onError?.(e.message || 'Could not upload the report card.');
    } finally {
      setBusy(false);
    }
  };

  const saveLayout = async () => {
    setBusy(true); setSaved('');
    try {
      const res = await fetch(`${API_BASE}/catmarks/report-card/template/layout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ layout }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      setEditZones(false);
      setSaved('✅ Zones saved — reports fill exactly into the marked areas.');
    } catch (e) {
      onError?.(e.message || 'Could not save the zones.');
    } finally {
      setBusy(false);
    }
  };

  const act = async (id, action) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/catmarks/reports-inbox/${id}/${action}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      await load();
    } catch (e) {
      onError?.(e.message || 'Could not update the report.');
    } finally {
      setBusy(false);
    }
  };

  const TYPE_META = { mid_term: '📄 Mid-Term', end_term: '📑 End-Term', yearly: '📅 Yearly' };

  // group submissions: term → type
  const grouped = {};
  for (const s of subs) {
    const t = s.term || '—';
    (grouped[t] ||= { mid_term: [], end_term: [], yearly: [] })[s.report_type]?.push(s);
  }
  const termOrder = (t) => ({ I: 0, II: 1, III: 2, Year: 3 }[t] ?? 4);
  const terms = Object.keys(grouped).sort((a, b) => termOrder(a) - termOrder(b));

  const card = { border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16, background: '#fff' };

  return (
    <div style={{ marginTop: 8 }}>
      {/* ── School report card template ── */}
      <div style={card}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>📋 School Report Card (End-Term)</h3>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#64748b' }}>
          Upload the school's official report card — <strong>front and back</strong>. It becomes the End-Term format for every teacher in the school, filled automatically with CAT + EXAM marks.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Front page</label>
            <input type="file" accept="image/*,.pdf" style={{ ...inp, fontSize: 12, width: 220 }} onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Back page</label>
            <input type="file" accept="image/*,.pdf" style={{ ...inp, fontSize: 12, width: 220 }} onChange={(e) => setBackFile(e.target.files?.[0] || null)} />
          </div>
          <button type="button" className="premium-action-button premium-action-button--create" disabled={busy} onClick={uploadCard}>
            {busy ? '⏳ Uploading…' : '⬆ Save school card'}
          </button>
        </div>
        {saved && <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#166534', fontWeight: 600 }}>{saved}</p>}

        {tpl && layout && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Current card:</span>
              <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 12 }} onClick={() => setEditZones((v) => !v)}>
                {editZones ? '✖ Cancel zone editing' : '🎯 Adjust where marks go'}
              </button>
              {editZones && (
                <button type="button" className="btn btn-primary btn-sm" style={{ fontSize: 12 }} disabled={busy} onClick={saveLayout}>
                  {busy ? '⏳…' : '💾 Save zones'}
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {tpl.front && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>FRONT{editZones ? ' — drag boxes to move, corner to resize' : ''}</p>
                  <ZoneEditor
                    src={imgUrl(tpl.front)}
                    zones={layout.front || {}}
                    zoneDefs={ZONES.front}
                    onChange={editZones ? (k, z) => setLayout((l) => ({ ...l, front: { ...l.front, [k]: z } })) : () => {}}
                  />
                </div>
              )}
              {tpl.back && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>BACK</p>
                  <ZoneEditor
                    src={imgUrl(tpl.back)}
                    zones={layout.back || {}}
                    zoneDefs={ZONES.back}
                    onChange={editZones ? (k, z) => setLayout((l) => ({ ...l, back: { ...l.back, [k]: z } })) : () => {}}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Reports inbox ── */}
      <div style={card}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>📁 Reports Inbox</h3>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#64748b' }}>
          Every reports folder your teachers generate lands here — Mid-Term, End-Term and Yearly, grouped by term. Open a folder to check each student's card, then <strong>Approve &amp; lock</strong> — approved reports can't be edited by teachers anymore.
        </p>
        {!subs.length && <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>No reports submitted yet — when a teacher builds a reports folder or sends reports to you, it appears here.</p>}
        {terms.map((t) => (
          <div key={t} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>🗓 {t === 'Year' ? 'Yearly' : `Term ${t}`}</div>
            {['mid_term', 'end_term', 'yearly'].map((type) => grouped[t][type].length ? (
              <div key={type} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                  {TYPE_META[type]} ({grouped[t][type].length})
                </div>
                {grouped[t][type].map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', border: `1px solid ${s.status === 'approved' ? '#bbf7d0' : '#f1f5f9'}`, borderRadius: 10, padding: '8px 12px', marginBottom: 6, background: s.status === 'approved' ? '#f0fdf4' : '#fafbfc' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <strong style={{ fontSize: 13 }}>{s.class_name || 'Class'}</strong>
                      <span style={{ fontSize: 12, color: '#64748b' }}> · {s.teacher_name || 'Teacher'} · {s.student_count || 0} reports · {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span style={{
                        marginLeft: 8, fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
                        background: s.status === 'approved' ? '#dcfce7' : '#fef3c7',
                        color: s.status === 'approved' ? '#166534' : '#92400e',
                      }}>
                        {s.status === 'approved' ? '🔒 Approved' : '⏳ Pending review'}
                      </span>
                    </div>
                    <a href={s.folder_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ fontSize: 12, textDecoration: 'none' }}>📁 View folder</a>
                    <a href={`${s.folder_url}/all`} className="btn btn-outline btn-sm" style={{ fontSize: 12, textDecoration: 'none' }}>⬇ All</a>
                    {s.status === 'approved' ? (
                      <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 12 }} disabled={busy} onClick={() => act(s.id, 'reopen')} title="Send back to pending — teachers may regenerate">
                        ↩ Reopen
                      </button>
                    ) : (
                      <button type="button" className="btn btn-primary btn-sm" style={{ fontSize: 12 }} disabled={busy} onClick={() => act(s.id, 'approve')} title="Approve — locks these reports for teachers">
                        ✅ Approve & lock
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : null)}
          </div>
        ))}
      </div>
    </div>
  );
}
