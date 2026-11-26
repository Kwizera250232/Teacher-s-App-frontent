import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

const TERMS = ['I', 'II', 'III'];
const inp = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const canon = (s) => {
  const k = norm(s);
  if (k === 'ssr' || k === 'sst' || k === 'srs' || k.startsWith('socialandreligious')) return 'srs';
  if (k === 'set' || k.startsWith('scienceandelementary')) return 'set';
  if (k.startsWith('physicaleducation') || k === 'pheducation' || k === 'pes') return 'physicaleducation';
  return k.replace(/s$/, '');
};
const displaySubj = (s) => ({ srs: 'SRS', set: 'SET', physicaleducation: 'Physical Education' }[canon(s)] || s);

export default function EndTermReportModal({ classId, token, student, onClose, onError }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [folderUrl, setFolderUrl] = useState('');
  const [hasTemplate, setHasTemplate] = useState(false);
  const [form, setForm] = useState({ academic_year: '', term: 'I' });
  const [subjects, setSubjects] = useState([]); // {name, cat, exam}
  const [examTotal, setExamTotal] = useState(100);
  const [comment, setComment] = useState('');
  const [roster, setRoster] = useState([]);
  const [selectedIds, setSelectedIds] = useState(null);
  const [showStudents, setShowStudents] = useState(false);
  const [lockedTerms, setLockedTerms] = useState([]);

  // load CAT+EXAM marks for the chosen term's sheet
  const loadMarks = async (term, subjectNames) => {
    try {
      const ex = await fetch(`${API_BASE}/catmarks/${classId}/exam-marks?term=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const exd = await ex.json().catch(() => ({}));
      if (exd.exam_total) setExamTotal(exd.exam_total);
      const me = (exd.students || []).find((s) => s.id === student.studentId);
      const cat = me?.cat || {}; const exam = me?.exam || {};
      setSubjects((prev) => (subjectNames || prev.map((s) => s.name)).map((name) => ({
        name,
        cat: cat[canon(name)] || null,
        exam: exam[canon(name)] ?? '',
      })));
    } catch { /* keep current list */ }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/catmarks/${classId}/endterm-report/prefill`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed to load');
        if (!alive) return;
        setHasTemplate(Boolean(d.has_template));
        setLockedTerms(d.locked_terms || []);
        setRoster(d.roster || []);
        const term = d.term || 'I';
        setForm({ academic_year: d.academic_year || '', term });
        await loadMarks(term, d.subjects || []);
      } catch (e) {
        onError?.(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [classId, student.studentId, token]); // eslint-disable-line

  // switching term → reload that term's marks
  useEffect(() => {
    if (!loading && form.term) loadMarks(form.term); // eslint-disable-line
  }, [form.term]); // eslint-disable-line

  const setExam = (i, v) => setSubjects((list) => list.map((s, idx) => (idx === i ? { ...s, exam: v } : s)));
  const filledCount = subjects.filter((s) => s.exam !== '' && s.exam !== null && s.exam !== undefined).length;
  const termLocked = lockedTerms.some((l) => l.report_type === 'end_term' && String(l.term || '') === String(form.term || ''));

  const saveExamMarks = async () => {
    const entries = subjects
      .filter((s) => s.exam !== '' && s.exam !== null && s.exam !== undefined && Number.isFinite(Number(s.exam)))
      .map((s) => ({ student_id: student.studentId, subject: s.name, marks: Number(s.exam) }));
    if (!entries.length) { onError?.('Type at least one EXAM mark first.'); return false; }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/catmarks/${classId}/exam-marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entries, total_marks: examTotal, term: form.term }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      return true;
    } catch (e) {
      onError?.(e.message || 'Could not save exam marks.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const postReport = async (extra) => {
    const res = await fetch(`${API_BASE}/catmarks/${classId}/endterm-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ student_id: student.studentId, teacher_comment: comment, ...form, ...extra }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Failed (${res.status})`);
    }
    return res;
  };

  const showPreview = async () => {
    if (filledCount) await saveExamMarks();
    setBusy(true);
    try {
      const res = await postReport({ preview: true });
      setPreviewHtml(await res.text());
    } catch (e) {
      onError?.(e.message || 'Could not generate the report.');
    } finally {
      setBusy(false);
    }
  };

  const downloadDoc = async () => {
    setBusy(true);
    try {
      if (filledCount) await saveExamMarks();
      const res = await postReport({});
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EndTerm-${form.term}-Report-${(student.studentName || 'student').replace(/[^\w]+/g, '-')}.doc`;
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
      const res = await fetch(`${API_BASE}/catmarks/${classId}/endterm-report/${submit ? 'submit' : 'folder'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teacher_comment: comment, ...form, student_ids: selectedIds }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      setFolderUrl(d.folder_url || '');
      if (submit) setSubmitted(true);
      else if (d.folder_url) window.open(d.folder_url, '_blank');
    } catch (e) {
      onError?.(e.message || 'Could not build the reports folder.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 18, padding: 22, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 19 }}>📑 End-Term Report Card</h3>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#64748b' }}>
          For <strong>{student.studentName}</strong> — CAT totals come from the marks sheet automatically. You only add <strong>EXAM</strong> marks.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, color: hasTemplate ? '#166534' : '#92400e' }}>
          {hasTemplate
            ? '🏫 Using the school report card uploaded by the Head Teacher'
            : '⚠️ No school card uploaded yet — using the standard UClass End-Term format'}
        </p>
        {termLocked && (
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
            🔒 Term {form.term} End-Term reports were approved by the Head Teacher — locked, no more edits.
          </p>
        )}

        {loading ? <p style={{ color: '#64748b' }}>Loading…</p> : previewHtml ? (
          <>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#f8fafc' }}>
              <iframe title="End-term report preview" srcDoc={previewHtml} style={{ width: '100%', height: '62vh', border: 'none', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPreviewHtml(null)}>← Back to exam marks</button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={downloadDoc}>
                {busy ? '⏳ …' : '⬇️ Download Word'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
              <div><label style={lbl}>Term</label>
                <select style={inp} value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}>
                  {TERMS.map((t) => <option key={t} value={t}>Term {t}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Academic year</label>
                <input style={inp} value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))} placeholder="2025-2026" />
              </div>
              <div><label style={lbl}>EXAM out of</label>
                <input style={inp} type="number" min="1" max="1000" value={examTotal} onChange={(e) => setExamTotal(Number(e.target.value) || 100)} />
              </div>
            </div>

            <label style={lbl}>EXAM marks — CAT is filled automatically ({filledCount}/{subjects.length} exam marks entered)</label>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8, padding: '7px 10px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                <span>Subject</span><span style={{ textAlign: 'center' }}>CAT total</span><span style={{ textAlign: 'center' }}>EXAM /{examTotal}</span>
              </div>
              {subjects.map((s, i) => (
                <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8, padding: '5px 10px', borderTop: '1px solid #f1f5f9', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{displaySubj(s.name)}</span>
                  <span style={{ textAlign: 'center', color: s.cat == null ? '#cbd5e1' : '#166534', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                    {s.cat == null ? '—' : (
                      <>
                        {s.cat.raw ?? '—'}/{s.cat.out_of ?? 100}
                        <span style={{ display: 'block', fontSize: 10, color: '#16a34a' }}>{s.cat.score}%</span>
                      </>
                    )}
                  </span>
                  <input
                    type="number" min="0" max={examTotal} value={s.exam}
                    onChange={(e) => setExam(i, e.target.value)}
                    disabled={termLocked}
                    placeholder="—"
                    style={{ padding: '6px 8px', borderRadius: 7, border: '1.5px solid #cbd5e1', fontSize: 14, textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              {!subjects.length && <p style={{ margin: 0, padding: 12, fontSize: 13, color: '#94a3b8' }}>No subjects yet — record CAT marks first.</p>}
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Class teacher's comment (optional)</label>
              <textarea style={{ ...inp, minHeight: 60 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. A focused and hardworking learner." />
            </div>

            {roster.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 12 }} onClick={() => setShowStudents((v) => !v)}>
                  👥 {showStudents ? 'Hide students' : `Choose students for the class folder (${selectedIds ? selectedIds.length : roster.length}/${roster.length})`}
                </button>
                {showStudents && (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 8, padding: '6px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                      <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '1px 8px' }} onClick={() => setSelectedIds(null)}>All</button>
                      <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '1px 8px' }} onClick={() => setSelectedIds([])}>None</button>
                      <span style={{ marginLeft: 'auto', color: '#64748b', alignSelf: 'center' }}>{selectedIds ? selectedIds.length : roster.length} selected</span>
                    </div>
                    <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                      {roster.map((s) => {
                        const checked = selectedIds === null || selectedIds.includes(s.id);
                        return (
                          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', fontSize: 13, borderTop: '1px solid #f8fafc', cursor: 'pointer' }}>
                            <input
                              type="checkbox" checked={checked}
                              onChange={() => {
                                const cur = selectedIds === null ? roster.map((r) => r.id) : [...selectedIds];
                                const next = checked ? cur.filter((x) => x !== s.id) : [...cur, s.id];
                                setSelectedIds(next.length === roster.length ? null : next);
                              }}
                            />
                            {s.name}
                            {s.has_exam ? null : <span style={{ marginLeft: 'auto', fontSize: 11, color: '#b45309' }}>no exam marks</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={showPreview}>
                {busy ? '⏳ …' : '👁 Preview report'}
              </button>
              <button type="button" className="btn btn-outline" disabled={busy || termLocked} onClick={() => buildFolder(false)}>
                📁 Class folder (all .doc)
              </button>
              <button type="button" className="btn btn-outline" disabled={busy || termLocked} onClick={() => buildFolder(true)} style={{ borderColor: '#075e54', color: '#075e54', fontWeight: 700 }}>
                📤 Send reports to HT
              </button>
            </div>
            {submitted && (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: '#166534', fontWeight: 600 }}>
                ✅ Sent — the Head Teacher got a notification and this folder is now in their Reports inbox.
              </p>
            )}
            {folderUrl && (
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                <a href={folderUrl} target="_blank" rel="noreferrer" style={{ color: '#0b5cad', fontWeight: 700 }}>📁 Open the reports folder</a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
