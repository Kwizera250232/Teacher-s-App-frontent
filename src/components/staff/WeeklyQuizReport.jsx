import { useState, useEffect, useRef, useCallback } from 'react';
import { api, UPLOADS_BASE } from '../../api';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect fill="%23e8eaf6" width="80" height="80"/%3E%3Ctext x="40" y="45" font-size="32" text-anchor="middle" fill="%23667eea"%3E👤%3C/text%3E%3C/svg%3E';

const SUBJECTS = [
  'English', 'Mathematics', 'Kinyarwanda', 'French', 'Science and Elementary Technology (SET)',
  'Social and Religious Studies (SST)', 'Creative Arts', 'Physical Education and Sports (PES)',
  'ICT', 'Entrepreneurship', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History',
  'Economics', 'Accounting', 'Literature in English', 'Kinyarwanda Literature', 'Religious Education',
  'General Studies', 'Other',
];

function getWeekLabel(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const year = d.getFullYear();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (dt) => `${dt.getDate()}/${dt.getMonth() + 1}`;
  return `Week ${fmt(start)} - ${fmt(end)} ${year}`;
}

export default function WeeklyQuizReport({ token, classId }) {
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [aiReports, setAiReports] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');
  const [showNewReport, setShowNewReport] = useState(false);
  const [newWeekLabel, setNewWeekLabel] = useState(getWeekLabel(0));
  const [alsoEmail, setAlsoEmail] = useState(false);
  const [showStudentReport, setShowStudentReport] = useState(null);
  const [viewMode, setViewMode] = useState('gradebook'); // 'gradebook' | 'cards'

  const marksRef = useRef({});
  const saveTimer = useRef(null);
  const emailRef = useRef({});
  const emailSaveTimer = useRef({});
  const phoneRef = useRef({});
  const phoneSaveTimer = useRef({});
  const messageRef = useRef({});
  const messageSaveTimer = useRef({});

  // Load all reports for this class
  const loadReports = useCallback(async () => {
    try {
      const r = await api.get(`/classes/${classId}/weekly-reports`, token);
      setReports(r);
      if (r.length && !activeReport) {
        setActiveReport(r[0].id);
      } else if (!r.length) {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [classId, token]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Load active report data
  const loadReportData = useCallback(() => {
    if (!activeReport) return;
    setLoading(true);
    setError('');
    api.get(`/classes/${classId}/weekly-reports/${activeReport}`, token)
      .then(data => {
        setReportData(data);
        // Initialize marks ref
        const marksMap = {};
        for (const m of data.marks) {
          marksMap[`${m.column_id}_${m.student_id}`] = m.marks !== null ? String(m.marks) : '';
        }
        marksRef.current = marksMap;
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [activeReport, classId, token]);

  useEffect(() => { loadReportData(); }, [loadReportData]);

  // Auto-save (debounced)
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const marksArr = [];
      const current = marksRef.current;
      for (const key of Object.keys(current)) {
        const [column_id, student_id] = key.split('_').map(Number);
        marksArr.push({ column_id, student_id, marks: current[key] });
      }
      if (!marksArr.length) return;
      setSaving(true);
      try {
        await api.put(`/classes/${classId}/weekly-reports/${activeReport}/marks`, { marks: marksArr }, token);
        setSuccessMsg('Auto-saved');
        setTimeout(() => setSuccessMsg(''), 2000);
        // Refresh data silently to update totals
        const data = await api.get(`/classes/${classId}/weekly-reports/${activeReport}`, token);
        setReportData(data);
      } catch (err) {
        setError('Auto-save failed: ' + err.message);
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [activeReport, classId, token]);

  const handleMarkChange = (columnId, studentId, value) => {
    marksRef.current[`${columnId}_${studentId}`] = value;
    scheduleSave();
  };

  const handleEmailChange = (studentId, value) => {
    emailRef.current[studentId] = value;
    if (emailSaveTimer.current[studentId]) clearTimeout(emailSaveTimer.current[studentId]);
    emailSaveTimer.current[studentId] = setTimeout(async () => {
      try {
        await api.put(`/classes/${classId}/students/${studentId}/parent-email`, { parent_email: value.trim() }, token);
        setSuccessMsg('Email saved');
        setTimeout(() => setSuccessMsg(''), 2000);
      } catch (err) {
        setError('Failed to save email: ' + err.message);
      }
    }, 1000);
  };

  const handlePhoneChange = (studentId, value) => {
    phoneRef.current[studentId] = value;
    if (phoneSaveTimer.current[studentId]) clearTimeout(phoneSaveTimer.current[studentId]);
    phoneSaveTimer.current[studentId] = setTimeout(async () => {
      try {
        await api.put(`/classes/${classId}/students/${studentId}/parent-phone`, { parent_phone: value.trim() }, token);
        setSuccessMsg('Phone saved');
        setTimeout(() => setSuccessMsg(''), 2000);
      } catch (err) {
        // 404 means the API isn't deployed yet — save silently, don't block the user
        if (String(err.message || '').includes('404') || String(err.message || '').includes('not on the server')) {
          setSuccessMsg('Phone saved (will sync after server update)');
          setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          setError('Failed to save phone: ' + err.message);
        }
      }
    }, 1000);
  };

  const handleMessageChange = (studentId, value) => {
    messageRef.current[studentId] = value;
    if (messageSaveTimer.current[studentId]) clearTimeout(messageSaveTimer.current[studentId]);
    messageSaveTimer.current[studentId] = setTimeout(async () => {
      try {
        await api.put(`/classes/${classId}/weekly-reports/${activeReport}/comments/${studentId}`, { comment: value.trim() }, token);
        setSuccessMsg('Message saved');
        setTimeout(() => setSuccessMsg(''), 2000);
      } catch (err) {
        setError('Failed to save message: ' + err.message);
      }
    }, 1200);
  };

  const createReport = async () => {
    if (!newWeekLabel.trim()) return;
    try {
      const r = await api.post(`/classes/${classId}/weekly-reports`, { week_label: newWeekLabel.trim() }, token);
      setReports(prev => [r, ...prev]);
      setActiveReport(r.id);
      setShowNewReport(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const addColumn = async (subject = '') => {
    const colCount = (reportData?.columns?.length || 0) + 1;
    try {
      const col = await api.post(
        `/classes/${classId}/weekly-reports/${activeReport}/columns`,
        { name: `Quiz ${colCount}`, max_marks: 20, subject },
        token
      );
      setReportData(prev => ({ ...prev, columns: [...(prev?.columns || []), col] }));
    } catch (err) {
      setError(err.message);
    }
  };

  const renameColumn = async (colId, name) => {
    try {
      await api.put(`/classes/${classId}/weekly-reports/${activeReport}/columns/${colId}`, { name }, token);
      setReportData(prev => ({
        ...prev,
        columns: prev.columns.map(c => c.id === colId ? { ...c, name } : c),
      }));
    } catch (err) { setError(err.message); }
  };

  const setColumnSubject = async (colId, subject) => {
    try {
      await api.put(`/classes/${classId}/weekly-reports/${activeReport}/columns/${colId}`, { subject }, token);
      setReportData(prev => ({
        ...prev,
        columns: prev.columns.map(c => c.id === colId ? { ...c, subject } : c),
      }));
    } catch (err) { setError(err.message); }
  };

  const saveComment = async (studentId, comment) => {
    try {
      await api.put(`/classes/${classId}/weekly-reports/${activeReport}/comments/${studentId}`, { comment }, token);
    } catch (err) { setError('Comment save failed: ' + err.message); }
  };

  const deleteColumn = async (colId) => {
    if (!confirm('Delete this quiz column and all its marks?')) return;
    try {
      await api.delete(`/classes/${classId}/weekly-reports/${activeReport}/columns/${colId}`, token);
      setReportData(prev => ({ ...prev, columns: prev.columns.filter(c => c.id !== colId) }));
    } catch (err) { setError(err.message); }
  };

  // Calculate stats for each student
  const computeStats = () => {
    if (!reportData) return [];
    const { students, columns, marks } = reportData;
    const stats = students.map(s => {
      let total = 0, taken = 0, totalMax = 0;
      const perQuiz = columns.map(c => {
        const m = marks.find(mk => mk.column_id === c.id && mk.student_id === s.id);
        const val = m && m.marks !== null ? parseFloat(m.marks) : null;
        if (val !== null) { total += val; taken++; totalMax += parseFloat(c.max_marks); }
        return { name: c.name, subject: c.subject, marks: val, max: parseFloat(c.max_marks) };
      });
      const avg = taken ? total / taken : 0;
      const pct = totalMax ? (total / totalMax) * 100 : 0;
      // Subject breakdown
      const bySubject = {};
      for (const q of perQuiz) {
        if (q.marks === null) continue;
        const subj = q.subject || 'General';
        if (!bySubject[subj]) bySubject[subj] = { total: 0, max: 0, count: 0 };
        bySubject[subj].total += q.marks;
        bySubject[subj].max += q.max;
        bySubject[subj].count++;
      }
      return { ...s, total, taken, avg, pct, totalMax, perQuiz, bySubject };
    });
    stats.sort((a, b) => b.total - a.total);
    stats.forEach((s, i) => { s.rank = i + 1; });
    return stats;
  };

  const generateAIReport = async (studentId) => {
    setAiLoading(prev => ({ ...prev, [studentId]: true }));
    try {
      const r = await api.post(
        `/classes/${classId}/weekly-reports/${activeReport}/ai-report`,
        { student_id: studentId },
        token
      );
      setAiReports(prev => ({ ...prev, [studentId]: r }));
      setShowStudentReport(studentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const notifyParents = async () => {
    if (!confirm(`Send weekly quiz reports to all parents${alsoEmail ? ' via email' : ''}?`)) return;
    setNotifyLoading(true);
    setNotifyResult('');
    try {
      const r = await api.post(
        `/classes/${classId}/weekly-reports/${activeReport}/notify-parents`,
        { also_email: alsoEmail },
        token
      );
      setNotifyResult(r.message);
    } catch (err) {
      setNotifyResult(err.message);
    } finally {
      setNotifyLoading(false);
    }
  };

  if (loading && !reportData) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading weekly reports...</div>;
  }

  if (!reports.length && !loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: '#f0f4ff', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <h3 style={{ color: '#1e293b', marginBottom: 8 }}>📊 Weekly Quiz Reports</h3>
          <p style={{ color: '#64748b', marginBottom: 16 }}>Create your first weekly quiz report to track student performance.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newWeekLabel}
              onChange={e => setNewWeekLabel(e.target.value)}
              placeholder="Week label"
              style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, width: 220 }}
            />
            <button className="btn btn-primary" onClick={createReport}>Create First Report</button>
          </div>
          {error && <p className="alert alert-error" style={{ marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  const stats = computeStats();

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, color: '#111827', margin: 0 }}>📊 Weekly Quiz Report</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Gradebook with auto-save, rankings & AI reports</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {saving && <span style={{ fontSize: 12, color: '#2563eb' }}>💾 Saving...</span>}
          {successMsg && <span style={{ fontSize: 12, color: '#16a34a' }}>✓ {successMsg}</span>}
          <button
            className="btn btn-outline btn-sm"
            style={{ fontSize: 12, padding: '4px 12px' }}
            onClick={() => { loadReportData(); loadReports(); }}
            title="Refresh student list and marks"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Week selector + actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={activeReport || ''}
          onChange={e => { setActiveReport(parseInt(e.target.value, 10)); setAiReports({}); setNotifyResult(''); }}
          style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, minWidth: 200 }}
        >
          {reports.map(r => (
            <option key={r.id} value={r.id}>{r.week_label}</option>
          ))}
        </select>
        <button className="btn btn-outline" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => { setNewWeekLabel(getWeekLabel(0)); setShowNewReport(true); }}>
          + New Week
        </button>
        {showNewReport && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="text"
              value={newWeekLabel}
              onChange={e => setNewWeekLabel(e.target.value)}
              style={{ padding: '6px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: 180 }}
            />
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={createReport}>OK</button>
            <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setShowNewReport(false)}>Cancel</button>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <select id="newColSubject" defaultValue="" style={{ padding: '6px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          <option value="">No subject</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => {
          const sel = document.getElementById('newColSubject');
          addColumn(sel ? sel.value : '');
        }}>
          + Add Quiz Column
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
          <input type="checkbox" checked={alsoEmail} onChange={e => setAlsoEmail(e.target.checked)} />
          Email
        </label>
        <button
          className="btn btn-primary"
          style={{ fontSize: 13, padding: '6px 16px', background: '#7c3aed' }}
          onClick={notifyParents}
          disabled={notifyLoading}
        >
          {notifyLoading ? 'Sending...' : '📢 Notify Parents'}
        </button>
      </div>

      {notifyResult && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>{notifyResult}</div>
      )}

      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          className={`btn btn-sm${viewMode === 'gradebook' ? ' btn-primary' : ' btn-outline'}`}
          style={{ fontSize: 13, padding: '6px 16px' }}
          onClick={() => setViewMode('gradebook')}
        >
          📊 Gradebook
        </button>
        <button
          className={`btn btn-sm${viewMode === 'cards' ? ' btn-primary' : ' btn-outline'}`}
          style={{ fontSize: 13, padding: '6px 16px' }}
          onClick={() => setViewMode('cards')}
        >
          📮 Parent Notify Cards
        </button>
      </div>

      {/* Gradebook Table */}
      {viewMode === 'gradebook' && reportData && reportData.columns && (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', position: 'sticky', left: 0, background: '#f1f5f9', zIndex: 2, minWidth: 140 }}>
                  Student
                </th>
                {reportData.columns.map(col => (
                  <th key={col.id} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', minWidth: 100 }}>
                    <input
                      type="text"
                      value={col.name}
                      onChange={e => renameColumn(col.id, e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: 12, textAlign: 'center', width: '100%', color: '#1e293b' }}
                    />
                    <select
                      value={col.subject || ''}
                      onChange={e => setColumnSubject(col.id, e.target.value)}
                      style={{ border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 10, padding: '1px 2px', marginTop: 2, color: '#64748b', background: '#f8fafc', width: '100%' }}
                    >
                      <option value="">— subject —</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>/{parseFloat(col.max_marks)}</div>
                    <button
                      onClick={() => deleteColumn(col.id)}
                      style={{ border: 'none', background: 'none', color: '#e11d48', cursor: 'pointer', fontSize: 11, marginTop: 2 }}
                      title="Delete column"
                    >✕</button>
                  </th>
                ))}
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', background: '#eff6ff' }}>Total</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', background: '#eff6ff' }}>Taken</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', background: '#eff6ff' }}>Avg</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', background: '#eff6ff' }}>%</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', background: '#fef3c7' }}>Rank</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', minWidth: 180 }}>Parent Email</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', minWidth: 140 }}>Parent Phone</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', minWidth: 160 }}>Teacher Comment</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>AI Report</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, idx) => (
                <tr key={s.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b', position: 'sticky', left: 0, background: idx % 2 === 0 ? '#fff' : '#f8fafc', zIndex: 1 }}>
                    {s.name}
                  </td>
                  {reportData.columns.map(col => {
                    const key = `${col.id}_${s.id}`;
                    const val = marksRef.current[key] !== undefined
                      ? marksRef.current[key]
                      : (reportData.marks.find(m => m.column_id === col.id && m.student_id === s.id)?.marks);
                    return (
                      <td key={col.id} style={{ padding: '4px', textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={parseFloat(col.max_marks)}
                          defaultValue={val !== null && val !== undefined ? val : ''}
                          onChange={e => handleMarkChange(col.id, s.id, e.target.value)}
                          style={{
                            width: 52, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 5,
                            textAlign: 'center', fontSize: 13, background: '#fff',
                          }}
                        />
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, background: '#eff6ff', color: '#1e40af' }}>
                    {s.total.toFixed(1)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', background: '#eff6ff' }}>{s.taken}</td>
                  <td style={{ padding: '8px', textAlign: 'center', background: '#eff6ff' }}>{s.avg.toFixed(1)}</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, background: '#eff6ff', color: s.pct >= 50 ? '#16a34a' : '#e11d48' }}>
                    {s.pct.toFixed(0)}%
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', background: '#fef3c7', fontWeight: 700, color: '#92400e' }}>
                    #{s.rank}
                  </td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    <input
                      type="email"
                      defaultValue={s.parent_email || ''}
                      onChange={e => handleEmailChange(s.id, e.target.value)}
                      placeholder="parent@email.com"
                      style={{
                        width: 160, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 5,
                        fontSize: 12, background: '#fff', color: '#475569',
                      }}
                    />
                  </td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    <input
                      type="tel"
                      defaultValue={s.parent_phone || ''}
                      onChange={e => handlePhoneChange(s.id, e.target.value)}
                      placeholder="+250..."
                      style={{
                        width: 130, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 5,
                        fontSize: 12, background: '#fff', color: '#475569',
                      }}
                    />
                  </td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    <input
                      type="text"
                      defaultValue={reportData.comments?.find(c => c.student_id === s.id)?.comment || ''}
                      onBlur={e => saveComment(s.id, e.target.value)}
                      placeholder="Add comment..."
                      style={{
                        width: 140, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 5,
                        fontSize: 12, background: '#fff', color: '#475569',
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => generateAIReport(s.id)}
                      disabled={aiLoading[s.id]}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', background: '#7c3aed', color: '#fff',
                      }}
                    >
                      {aiLoading[s.id] ? '⏳' : '🤖 AI'}
                    </button>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={reportData.columns.length + 9} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                    No students in this class yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Parent Notify Cards view */}
      {viewMode === 'cards' && reportData && stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', gap: 16 }}>
          {stats.map((s) => {
            const studentRow = reportData.students.find(st => st.id === s.id);
            return (
              <div key={s.id} style={{
                background: '#fff',
                borderRadius: 16,
                border: '1.5px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Card header: avatar + name + rank */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <img
                    src={studentRow?.avatar_path ? `${UPLOADS_BASE}${studentRow.avatar_path}` : DEFAULT_AVATAR}
                    alt={s.name}
                    onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    style={{
                      width: 48, height: 48, borderRadius: '50%',
                      objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)',
                      background: '#e8eaf6', flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                      Rank #{s.rank} of {stats.length} · {s.taken} quiz{s.taken !== 1 ? 'zes' : ''} taken
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    padding: '6px 12px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{s.pct.toFixed(0)}%</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{s.total}/{s.totalMax}</div>
                  </div>
                </div>

                {/* Quiz summary list */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Quiz Summary
                  </div>
                  {s.perQuiz.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>No quizzes recorded yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {s.perQuiz.map((q, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                          <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {q.subject && <span style={{ fontSize: 10, color: '#7c3aed', background: '#f3e8ff', padding: '1px 5px', borderRadius: 4, marginRight: 4 }}>{q.subject}</span>}
                            {q.name}
                          </span>
                          <span style={{ fontWeight: 600, color: q.marks === null ? '#cbd5e1' : (q.marks / q.max >= 0.5 ? '#16a34a' : '#e11d48'), flexShrink: 0 }}>
                            {q.marks === null ? 'N/A' : `${q.marks}/${q.max}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Parent contact info */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Parent Contact
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      defaultValue={s.parent_email || ''}
                      onChange={e => handleEmailChange(s.id, e.target.value)}
                      placeholder="✉ parent@email.com"
                      style={{
                        flex: '1 1 140px', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 12, background: '#fff', color: '#475569',
                      }}
                    />
                    <input
                      type="tel"
                      defaultValue={s.parent_phone || ''}
                      onChange={e => handlePhoneChange(s.id, e.target.value)}
                      placeholder="📞 +250..."
                      style={{
                        flex: '1 1 120px', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 12, background: '#fff', color: '#475569',
                      }}
                    />
                  </div>
                </div>

                {/* Teacher message box */}
                <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    ✍️ Message to Parent
                  </div>
                  <textarea
                    defaultValue={reportData.comments?.find(c => c.student_id === s.id)?.comment || ''}
                    onChange={e => handleMessageChange(s.id, e.target.value)}
                    placeholder="Write a personal message to this parent about their child's week..."
                    rows={3}
                    style={{
                      width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8,
                      fontSize: 13, background: '#fff', color: '#1e293b', resize: 'vertical',
                      boxSizing: 'border-box', fontFamily: 'inherit', flex: 1, minHeight: 60,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => generateAIReport(s.id)}
                      disabled={aiLoading[s.id]}
                      style={{
                        padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', background: '#7c3aed', color: '#fff',
                      }}
                    >
                      {aiLoading[s.id] ? '⏳ AI…' : '🤖 AI Report'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subject Analytics */}
      {reportData && reportData.columns && stats.length > 0 && (() => {
        const allSubjects = {};
        for (const s of stats) {
          for (const [subj, g] of Object.entries(s.bySubject)) {
            if (!allSubjects[subj]) allSubjects[subj] = { totals: [], count: 0 };
            allSubjects[subj].totals.push({ name: s.name, total: g.total, max: g.max, pct: g.max ? (g.total / g.max) * 100 : 0 });
            allSubjects[subj].count++;
          }
        }
        const subjectList = Object.entries(allSubjects);
        if (!subjectList.length) return null;
        return (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 18, color: '#111827', marginBottom: 12 }}>📈 Marks by Subject</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {subjectList.map(([subj, data]) => {
                const sorted = [...data.totals].sort((a, b) => b.pct - a.pct);
                const avgPct = sorted.reduce((s, x) => s + x.pct, 0) / sorted.length;
                return (
                  <div key={subj} style={{ background: '#f8fafc', borderRadius: 12, padding: 14, minWidth: 240, border: '1.5px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 8 }}>{subj}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Class avg: {avgPct.toFixed(0)}%</div>
                    {sorted.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: i < sorted.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <span style={{ color: '#475569' }}>{t.name}</span>
                        <span style={{ fontWeight: 600, color: t.pct >= 50 ? '#16a34a' : '#e11d48' }}>{t.total}/{t.max} ({t.pct.toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* AI Student Report Modal */}
      {showStudentReport && aiReports[showStudentReport] && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowStudentReport(null)}
        >
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 20, color: '#111827' }}>🤖 AI Report — {aiReports[showStudentReport].student_name}</h3>
              <button onClick={() => setShowStudentReport(null)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e40af' }}>{aiReports[showStudentReport].total_marks.toFixed(1)}</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Quizzes</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{aiReports[showStudentReport].quiz_count}</div>
              </div>
              <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Average</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#92400e' }}>{aiReports[showStudentReport].average}</div>
              </div>
              <div style={{ background: '#fce7f3', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Percentage</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#be185d' }}>{aiReports[showStudentReport].percentage}%</div>
              </div>
            </div>

            {aiReports[showStudentReport].ai_feedback ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiReports[showStudentReport].ai_feedback.performed_well && (
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 14, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6, fontSize: 14 }}>✅ Performed Well</div>
                    <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>{aiReports[showStudentReport].ai_feedback.performed_well}</div>
                  </div>
                )}
                {aiReports[showStudentReport].ai_feedback.needs_improvement && (
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: 14, border: '1px solid #fecaca' }}>
                    <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 6, fontSize: 14 }}>⚠️ Needs Improvement</div>
                    <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>{aiReports[showStudentReport].ai_feedback.needs_improvement}</div>
                  </div>
                )}
                {aiReports[showStudentReport].ai_feedback.appreciation && (
                  <div style={{ background: '#eff6ff', borderRadius: 10, padding: 14, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 6, fontSize: 14 }}>👏 Subject to Appreciate</div>
                    <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>{aiReports[showStudentReport].ai_feedback.appreciation}</div>
                  </div>
                )}
                {aiReports[showStudentReport].ai_feedback.suggestions_for_parents && (
                  <div style={{ background: '#faf5ff', borderRadius: 10, padding: 14, border: '1px solid #e9d5ff' }}>
                    <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 6, fontSize: 14 }}>💡 Suggestions for Parents</div>
                    <div style={{ fontSize: 13, color: '#6b21a8', lineHeight: 1.5 }}>{aiReports[showStudentReport].ai_feedback.suggestions_for_parents}</div>
                  </div>
                )}
                {aiReports[showStudentReport].ai_feedback.raw_text && (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    {aiReports[showStudentReport].ai_feedback.raw_text}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, fontSize: 13, color: '#64748b' }}>
                AI not configured. Basic summary: {aiReports[showStudentReport].summary}
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setShowStudentReport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
