import { useEffect, useMemo, useState } from 'react';
import { api, API_BASE } from '../api';

const inp = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

/**
 * Teacher proclamation — class marks board from the ACTIVE marks sheet.
 * Teacher picks which students appear (or all); shows rank, per-subject /100,
 * total, percentage and class average; downloads as a Word document.
 */
export default function ProclamationModal({ classId, token, onClose, onError }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null); // null = all
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api.get(`/catmarks/${classId}/proclamation`, token);
        if (alive) setData(d);
      } catch (e) {
        onError?.(e.message || 'Could not load the proclamation.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [classId, token]);

  const allRows = data?.students || [];
  const subjects = data?.subjects || [];

  // Displayed rows = selected subset, re-ranked over that subset (same rule as backend)
  const shown = useMemo(() => {
    const rows = allRows.filter((r) => sel === null || sel.includes(r.id));
    const sorted = [...rows].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || a.name.localeCompare(b.name));
    sorted.forEach((r, i) => { r.rank = i + 1; });
    return sorted;
  }, [allRows, sel]);

  const classAvg = useMemo(() => {
    const marked = shown.filter((r) => r.pct !== null);
    return marked.length ? Math.round((marked.reduce((a, r) => a + r.pct, 0) / marked.length) * 10) / 10 : null;
  }, [shown]);

  const selectedIds = sel === null ? allRows.map((r) => r.id) : sel;

  const toggle = (id) => {
    setSel((cur) => {
      const base = cur === null ? allRows.map((r) => r.id) : cur;
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });
  };

  const download = async () => {
    if (!selectedIds.length) { onError?.('Select at least one student.'); return; }
    setDownloading(true);
    try {
      const qs = sel === null ? '' : `?student_ids=${selectedIds.join(',')}`;
      const res = await fetch(`${API_BASE}/catmarks/${classId}/proclamation.doc${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safe = String(data?.class_name || 'class').replace(/[^\w]+/g, '-');
      a.download = `Proclamation-MidTerm-${data?.term || 'I'}-${safe}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      onError?.(e.message || 'Could not download the proclamation.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{ background: '#fff', borderRadius: 14, maxWidth: 1000, width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '18px 22px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 19 }}>📋 Proclamation{data ? ` — ${data.class_name} (Mid-Term ${data.term}, ${data.sheet?.name || 'active sheet'})` : ''}</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 12px' }}>
          Marks come from the active marks sheet only. Tick the students to include — ranking, totals and class average update to match.
        </p>

        {loading ? <p>Loading…</p> : !data ? null : (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => setSel(null)}>All</button>
              <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => setSel([])}>None</button>
              <span style={{ fontSize: 12, color: '#64748b' }}>{selectedIds.length}/{allRows.length} students on the proclamation</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 'auto' }}
                disabled={downloading || !selectedIds.length}
                onClick={download}
              >
                {downloading ? '⏳ Preparing…' : '⬇ Download (.doc)'}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cat-marks-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 34 }}></th>
                    <th style={{ width: 34 }}>#</th>
                    <th>Student</th>
                    {subjects.map((s) => <th key={s}>{s}<div style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>/100</div></th>)}
                    <th>Total /{data.total_max}</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.rank}</td>
                      <td className="cat-name">{r.name}</td>
                      {r.scores.map((v, i) => (
                        <td key={i} style={{ textAlign: 'center' }}>{v === null ? '—' : v}</td>
                      ))}
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.total === null ? '—' : r.total}</td>
                      <td className="cat-pct">{r.pct === null ? '—' : `${r.pct}%`}</td>
                    </tr>
                  ))}
                  {!shown.length && (
                    <tr><td colSpan={4 + subjects.length} style={{ textAlign: 'center', color: '#888', padding: 14 }}>No students selected.</td></tr>
                  )}
                  <tr className="cat-avg-row">
                    <td colSpan={3}>Class average</td>
                    {subjects.map((_, i) => <td key={i}></td>)}
                    <td></td>
                    <td>{classAvg === null ? '—' : `${classAvg}%`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
