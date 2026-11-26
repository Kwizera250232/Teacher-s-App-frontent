import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

const inp = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

export default function YearlyReportModal({ classId, token, student, onClose, onError }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [folderUrl, setFolderUrl] = useState('');
  const [hasTemplate, setHasTemplate] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [locked, setLocked] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/catmarks/${classId}/yearly-report/prefill`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed to load');
        if (!alive) return;
        setHasTemplate(Boolean(d.has_template));
        setSheets(d.sheets || []);
        setLocked((d.locked_terms || []).some((l) => l.report_type === 'yearly'));
      } catch (e) {
        onError?.(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [classId, token]); // eslint-disable-line

  const post = async (path, body, asText) => {
    const res = await fetch(`${API_BASE}/catmarks/${classId}/yearly-report${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Failed (${res.status})`);
    }
    return asText ? res.text() : res;
  };

  const showPreview = async () => {
    setBusy(true);
    try {
      setPreviewHtml(await post('', { student_id: student.studentId, teacher_comment: comment, preview: true }, true));
    } catch (e) {
      onError?.(e.message || 'Could not generate the yearly report.');
    } finally {
      setBusy(false);
    }
  };

  const downloadDoc = async () => {
    setBusy(true);
    try {
      const res = await post('', { student_id: student.studentId, teacher_comment: comment });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Yearly-Report-${(student.studentName || 'student').replace(/[^\w]+/g, '-')}.doc`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      onError?.(e.message || 'Could not download the report.');
    } finally {
      setBusy(false);
    }
  };

  const buildFolder = async (submit) => {
    setBusy(true); setFolderUrl(''); setSubmitted(false);
    try {
      const res = await post(`/${submit ? 'submit' : 'folder'}`, { teacher_comment: comment });
      const d = await res.json().catch(() => ({}));
      setFolderUrl(d.folder_url || '');
      if (submit) setSubmitted(true);
      else if (d.folder_url) window.open(d.folder_url, '_blank');
    } catch (e) {
      onError?.(e.message || 'Could not build the yearly folder.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 18, padding: 22, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 19 }}>📅 Yearly Report Card</h3>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#64748b' }}>
          Combines <strong>every term</strong> automatically — no marks to enter. Just generate.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, color: hasTemplate ? '#166534' : '#92400e' }}>
          {hasTemplate
            ? '🏫 Using the school report card uploaded by the Head Teacher'
            : '⚠️ No school card uploaded yet — using the standard UClass yearly format'}
        </p>

        {loading ? <p style={{ color: '#64748b' }}>Loading…</p> : previewHtml ? (
          <>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#f8fafc' }}>
              <iframe title="Yearly report preview" srcDoc={previewHtml} style={{ width: '100%', height: '62vh', border: 'none', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPreviewHtml(null)}>← Back</button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={downloadDoc}>
                {busy ? '⏳ …' : '⬇️ Download Word'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 14, background: '#f8fafc', fontSize: 13 }}>
              <strong>Terms combined:</strong>{' '}
              {sheets.length ? sheets.map((s) => s.name).join('  ·  ') : 'No marks sheets yet — record marks first.'}
              {sheets.length < 3 && sheets.length > 0 && (
                <span style={{ color: '#b45309' }}> (only {sheets.length} term{sheets.length > 1 ? 's' : ''} so far — the report uses what exists)</span>
              )}
            </div>

            {locked && (
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
                🔒 The Head Teacher already approved the yearly reports — they are locked.
              </p>
            )}

            <div>
              <label style={lbl}>Class teacher's comment (optional — same on every card)</label>
              <textarea style={{ ...inp, minHeight: 60 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. A great year of progress." />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" disabled={busy || !sheets.length} onClick={showPreview}>
                {busy ? '⏳ …' : `👁 Preview — ${student.studentName || 'student'}`}
              </button>
              <button type="button" className="btn btn-outline" disabled={busy || locked || !sheets.length} onClick={() => buildFolder(false)}>
                📁 Class folder (all .doc)
              </button>
              <button
                type="button" className="btn btn-outline" disabled={busy || locked || !sheets.length}
                onClick={() => buildFolder(true)} style={{ borderColor: '#075e54', color: '#075e54', fontWeight: 700 }}
              >
                📤 Send yearly reports to HT
              </button>
            </div>
            {submitted && (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: '#166534', fontWeight: 600 }}>
                ✅ Sent — the Head Teacher got a notification and the yearly folder is in their Reports inbox.
              </p>
            )}
            {folderUrl && (
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                <a href={folderUrl} target="_blank" rel="noreferrer" style={{ color: '#0b5cad', fontWeight: 700 }}>📁 Open the yearly reports folder</a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
