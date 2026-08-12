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
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');
  const [showNewReport, setShowNewReport] = useState(false);
  const [newWeekLabel, setNewWeekLabel] = useState(getWeekLabel(0));
  const [alsoEmail, setAlsoEmail] = useState(true);
  const [selectedParents, setSelectedParents] = useState(new Set());
  const [mySubjects, setMySubjects] = useState([]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const marksRef = useRef({});
  const saveTimer = useRef(null);
  const emailRef = useRef({});
  const emailSaveTimer = useRef({});
  const phoneRef = useRef({});
  const phoneSaveTimer = useRef({});
  const messageRef = useRef({});
  const messageSaveTimer = useRef({});

  // Load saved subjects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mySubjects_${classId}`);
      if (saved) setMySubjects(JSON.parse(saved));
    } catch {}
  }, [classId]);

  const toggleSubject = (subj) => {
    setMySubjects(prev => {
      const next = prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj];
      localStorage.setItem(`mySubjects_${classId}`, JSON.stringify(next));
      return next;
    });
  };

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

  const loadReportData = useCallback(() => {
    if (!activeReport) return;
    setLoading(true);
    setError('');
    api.get(`/classes/${classId}/weekly-reports/${activeReport}`, token)
      .then(data => {
        setReportData(data);
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
    const { students, columns, marks, systemQuizzes, aiRevisionQuizzes, catMarks } = reportData;
    const stats = students.map(s => {
      // CAT marks from Marks Sheet (auto-pulled, grouped by subject)
      const myCatMarks = (catMarks || []).filter(cm => cm.student_id === s.id);
      const catBySubject = {};
      let catTotal = 0, catMax = 0, catCount = 0;
      for (const cm of myCatMarks) {
        const subj = cm.subject || 'General';
        if (!catBySubject[subj]) catBySubject[subj] = { total: 0, max: 0, count: 0, items: [] };
        catBySubject[subj].total += parseFloat(cm.marks_obtained || 0);
        catBySubject[subj].max += parseFloat(cm.total_marks || 100);
        catBySubject[subj].count++;
        catBySubject[subj].items.push({ test: `CAT ${cm.test_number}`, marks: parseFloat(cm.marks_obtained), max: parseFloat(cm.total_marks || 100) });
        catTotal += parseFloat(cm.marks_obtained || 0);
        catMax += parseFloat(cm.total_marks || 100);
        catCount++;
      }

      // Weekly report columns (legacy manual marks — still shown if any exist)
      let total = 0, taken = 0, totalMax = 0;
      const perQuiz = columns.map(c => {
        const m = marks.find(mk => mk.column_id === c.id && mk.student_id === s.id);
        const val = m && m.marks !== null ? parseFloat(m.marks) : null;
        if (val !== null) { total += val; taken++; totalMax += parseFloat(c.max_marks); }
        return { name: c.name, subject: c.subject, marks: val, max: parseFloat(c.max_marks) };
      });
      const avg = taken ? total / taken : 0;
      const pct = totalMax ? (total / totalMax) * 100 : 0;
      const bySubject = {};
      for (const q of perQuiz) {
        if (q.marks === null) continue;
        const subj = q.subject || 'General';
        if (!bySubject[subj]) bySubject[subj] = { total: 0, max: 0, count: 0 };
        bySubject[subj].total += q.marks;
        bySubject[subj].max += q.max;
        bySubject[subj].count++;
      }
      // Auto system quiz data
      const autoQuizzes = (systemQuizzes || []).filter(sq => sq.student_id === s.id);
      let autoTotal = 0, autoMax = 0, autoCount = 0;
      for (const aq of autoQuizzes) {
        autoTotal += parseFloat(aq.score || 0);
        autoMax += parseFloat(aq.total || 0);
        autoCount++;
      }
      // AI Revision quiz data
      const aiQuizzes = (aiRevisionQuizzes || []).filter(ar => ar.student_id === s.id);
      let aiTotal = 0, aiMax = 0, aiCount = 0;
      for (const ar of aiQuizzes) {
        aiTotal += parseFloat(ar.score || 0);
        aiMax += parseFloat(ar.total || 0);
        aiCount++;
      }
      // Grand total = CAT marks + weekly columns + system quizzes + AI revision
      const grandTotal = catTotal + total + autoTotal + aiTotal;
      const grandMax = catMax + totalMax + autoMax + aiMax;
      const grandPct = grandMax ? (grandTotal / grandMax) * 100 : 0;
      return { ...s, total, taken, avg, pct, totalMax, perQuiz, bySubject,
               autoQuizzes, autoTotal, autoMax, autoCount,
               aiQuizzes, aiTotal, aiMax, aiCount,
               catBySubject, catTotal, catMax, catCount,
               grandTotal, grandMax, grandPct };
    });
    stats.sort((a, b) => b.grandTotal - a.grandTotal);
    stats.forEach((s, i) => { s.rank = i + 1; });
    return stats;
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

  const notifySelectedParents = async () => {
    const ids = Array.from(selectedParents);
    if (!ids.length) {
      setNotifyResult('Select at least one parent first.');
      return;
    }
    if (!confirm(`Send to ${ids.length} selected parent(s)${alsoEmail ? ' via email' : ''}?`)) return;
    setNotifyLoading(true);
    setNotifyResult('');
    try {
      const r = await api.post(
        `/classes/${classId}/weekly-reports/${activeReport}/notify-parents`,
        { also_email: alsoEmail, student_ids: ids },
        token
      );
      setNotifyResult(r.message);
    } catch (err) {
      setNotifyResult(err.message);
    } finally {
      setNotifyLoading(false);
    }
  };

  const notifyOneParent = async (studentId, studentName) => {
    if (!confirm(`Send report to ${studentName}'s parent${alsoEmail ? ' via email' : ''}?`)) return;
    setNotifyLoading(true);
    setNotifyResult('');
    try {
      const r = await api.post(
        `/classes/${classId}/weekly-reports/${activeReport}/notify-parents`,
        { also_email: alsoEmail, student_ids: [studentId] },
        token
      );
      setNotifyResult(`Sent to ${studentName}'s parent: ${r.message}`);
    } catch (err) {
      setNotifyResult(err.message);
    } finally {
      setNotifyLoading(false);
    }
  };

  const toggleParentSelection = (studentId) => {
    setSelectedParents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedParents.size === stats.length) {
      setSelectedParents(new Set());
    } else {
      setSelectedParents(new Set(stats.map(s => s.id)));
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
              style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, width: 220, color: '#1e293b' }}
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
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Teacher marks + Auto system marks, parent contacts, email sending</p>
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
          onChange={e => { setActiveReport(parseInt(e.target.value, 10)); setNotifyResult(''); }}
          style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, minWidth: 200, color: '#1e293b' }}
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
              style={{ padding: '6px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: 180, color: '#1e293b' }}
            />
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={createReport}>OK</button>
            <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setShowNewReport(false)}>Cancel</button>
          </div>
        )}
        <div style={{ flex: 1 }} />
        {/* My Subjects selector — teacher picks which subjects they teach */}
        <button
          className="btn btn-outline btn-sm"
          style={{ fontSize: 12, padding: '6px 12px', border: '1.5px solid #7c3aed', color: '#7c3aed', fontWeight: 600 }}
          onClick={() => setShowSubjectPicker(!showSubjectPicker)}
          title="Select which subjects you teach — marks will be organized by subject in reports"
        >
          📚 My Subjects {mySubjects.length > 0 && `(${mySubjects.length})`}
        </button>
      </div>

      {/* Subject picker panel */}
      {showSubjectPicker && (
        <div style={{
          background: '#faf5ff', border: '1.5px solid #c4b5fd', borderRadius: 12,
          padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, color: '#5b21b6', margin: 0, fontWeight: 700 }}>
              📚 Select subjects you teach
            </h3>
            <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setShowSubjectPicker(false)}>Done</button>
          </div>
          <p style={{ fontSize: 12, color: '#7c3aed', margin: '0 0 12px' }}>
            Only subjects you select will appear as quick-add options. Marks will be grouped by subject in reports and parent emails.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUBJECTS.map(subj => {
              const selected = mySubjects.includes(subj);
              return (
                <button
                  key={subj}
                  onClick={() => toggleSubject(subj)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: selected ? '2px solid #7c3aed' : '1.5px solid #d1d5db',
                    background: selected ? '#7c3aed' : '#fff',
                    color: selected ? '#fff' : '#374151',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {selected ? '✓ ' : ''}{subj}
                </button>
              );
            })}
          </div>
          {mySubjects.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626' }}
                onClick={() => { setMySubjects([]); localStorage.removeItem(`mySubjects_${classId}`); }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick-add subject buttons — show selected subjects as one-click add */}
      {mySubjects.length > 0 && reportData && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>Quick add CAT:</span>
          {mySubjects.map(subj => (
            <button
              key={subj}
              className="btn btn-sm"
              style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 16,
                background: '#f3e8ff', border: '1.5px solid #c4b5fd', color: '#6b21a8', fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => addColumn(subj)}
              title={`Add a CAT column for ${subj}`}
            >
              + {subj}
            </button>
          ))}
        </div>
      )}

      {/* Student Cards — Mobile + Desktop friendly */}
      {reportData && reportData.columns && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {stats.map((s) => {
            const studentRow = reportData.students.find(st => st.id === s.id);
            const isSelected = selectedParents.has(s.id);
            return (
              <div key={s.id} style={{
                background: '#fff',
                borderRadius: 14,
                border: isSelected ? '2px solid #667eea' : '1.5px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                {/* Student header bar */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleParentSelection(s.id)}
                    style={{ width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }}
                    title="Select for bulk send"
                  />
                  <img
                    src={studentRow?.avatar_path ? `${UPLOADS_BASE}${studentRow.avatar_path}` : DEFAULT_AVATAR}
                    alt={s.name}
                    onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                      Rank #{s.rank} of {stats.length} · {s.taken} quiz{s.taken !== 1 ? 'zes' : ''} taken
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    padding: '4px 10px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{s.pct.toFixed(0)}%</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{s.total}/{s.totalMax}</div>
                  </div>
                </div>

                {/* Subject Summary — clean table, no individual CATs shown */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                    📊 Subject Summary
                  </div>
                  {s.catCount === 0 && (!s.autoQuizzes || s.autoQuizzes.length === 0) && (!s.aiQuizzes || s.aiQuizzes.length === 0) ? (
                    <div style={{ fontSize: 13, color: '#94a3b8', padding: 8, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                      No marks recorded yet for this week.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', borderRadius: '6px 0 0 6px', color: '#475569', fontSize: 11, fontWeight: 600 }}>Subject</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: '#475569', fontSize: 11, fontWeight: 600 }}>Tests</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: '#475569', fontSize: 11, fontWeight: 600 }}>Total</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', color: '#475569', fontSize: 11, fontWeight: 600 }}>Avg</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', borderRadius: '0 6px 6px 0', color: '#475569', fontSize: 11, fontWeight: 600 }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* CAT marks by subject */}
                        {Object.entries(s.catBySubject).map(([subj, g]) => {
                          const stPct = g.max ? ((g.total / g.max) * 100).toFixed(0) : 0;
                          const stAvg = (g.total / g.count).toFixed(1);
                          const stColor = stPct >= 70 ? '#16a34a' : stPct >= 50 ? '#facc15' : '#e11d48';
                          return (
                            <tr key={`cat_${subj}`}>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b' }}>📚 {subj}</td>
                              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>{g.count}</td>
                              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600 }}>{g.total}/{g.max}</td>
                              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>{stAvg}</td>
                              <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 700, color: stColor }}>{stPct}%</td>
                            </tr>
                          );
                        })}
                        {/* System quizzes by subject */}
                        {(() => {
                          const sysBySubj = {};
                          for (const aq of (s.autoQuizzes || [])) {
                            const subj = aq.subject || 'General';
                            if (!sysBySubj[subj]) sysBySubj[subj] = { total: 0, max: 0, count: 0 };
                            sysBySubj[subj].total += parseFloat(aq.score || 0);
                            sysBySubj[subj].max += parseFloat(aq.total || 0);
                            sysBySubj[subj].count++;
                          }
                          return Object.entries(sysBySubj).map(([subj, g]) => {
                            const stPct = g.max ? ((g.total / g.max) * 100).toFixed(0) : 0;
                            const stAvg = g.count ? (g.total / g.count).toFixed(1) : '0';
                            const stColor = stPct >= 70 ? '#16a34a' : stPct >= 50 ? '#facc15' : '#e11d48';
                            return (
                              <tr key={`sys_${subj}`}>
                                <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#15803d' }}>💻 {subj}</td>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>{g.count}</td>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600 }}>{g.total}/{g.max}</td>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>{stAvg}</td>
                                <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 700, color: stColor }}>{stPct}%</td>
                              </tr>
                            );
                          });
                        })()}
                        {/* AI Revision quizzes by subject */}
                        {(() => {
                          const aiBySubj = {};
                          for (const ar of (s.aiQuizzes || [])) {
                            const subj = ar.subject || 'General';
                            if (!aiBySubj[subj]) aiBySubj[subj] = { total: 0, max: 0, count: 0 };
                            aiBySubj[subj].total += parseFloat(ar.score || 0);
                            aiBySubj[subj].max += parseFloat(ar.total || 0);
                            aiBySubj[subj].count++;
                          }
                          return Object.entries(aiBySubj).map(([subj, g]) => {
                            const stPct = g.max ? ((g.total / g.max) * 100).toFixed(0) : 0;
                            const stAvg = g.count ? (g.total / g.count).toFixed(1) : '0';
                            const stColor = stPct >= 70 ? '#16a34a' : stPct >= 50 ? '#facc15' : '#e11d48';
                            return (
                              <tr key={`ai_${subj}`}>
                                <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#c2410c' }}>🤖 {subj}</td>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>{g.count}</td>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600 }}>{g.total}/{g.max}</td>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>{stAvg}</td>
                                <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 700, color: stColor }}>{stPct}%</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Legacy weekly report columns — hidden, marks managed in Marks Sheet */}

                {/* Grand Total — all marks combined */}
                {(s.catCount > 0 || s.autoCount > 0 || s.aiCount > 0) && (
                  <div style={{
                    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Grand Total (Teacher + System + AI)
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
                          {s.grandTotal.toFixed(1)}<span style={{ fontSize: 13, color: '#94a3b8' }}>/{s.grandMax.toFixed(0)}</span>
                        </span>
                        <span style={{
                          color: '#fff', fontSize: 16, fontWeight: 700,
                          background: s.grandPct >= 70 ? '#16a34a' : s.grandPct >= 50 ? '#facc15' : '#e11d48',
                          padding: '2px 10px', borderRadius: 20,
                        }}>
                          {s.grandPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Parent contact info */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    👨‍👩‍👧 Parent Contact
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 180px', minWidth: 140 }}>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Parent Email</label>
                      <input
                        type="email"
                        defaultValue={s.parent_email || ''}
                        onChange={e => handleEmailChange(s.id, e.target.value)}
                        placeholder="parent@email.com"
                        style={{
                          width: '100%', padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8,
                          fontSize: 13, background: '#fff', color: '#1e293b', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Parent Phone</label>
                      <input
                        type="tel"
                        defaultValue={s.parent_phone || ''}
                        onChange={e => handlePhoneChange(s.id, e.target.value)}
                        placeholder="+250..."
                        style={{
                          width: '100%', padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8,
                          fontSize: 13, background: '#fff', color: '#1e293b', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Big teacher message area */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    ✍️ Teacher Message to Parent
                  </div>
                  <textarea
                    defaultValue={reportData.comments?.find(c => c.student_id === s.id)?.comment || ''}
                    onChange={e => handleMessageChange(s.id, e.target.value)}
                    placeholder="Write a personal message to this parent about their child's week..."
                    rows={4}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
                      fontSize: 14, background: '#fff', color: '#1e293b', resize: 'vertical',
                      boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 80, lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* Individual send button */}
                <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => notifyOneParent(s.id, s.name)}
                    disabled={notifyLoading}
                    style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', background: '#25d366', color: '#fff',
                    }}
                  >
                    {notifyLoading ? '⏳ Sending...' : '📧 Send to This Parent'}
                  </button>
                </div>
              </div>
            );
          })}
          {stats.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>
              No students in this class yet. Make sure students have joined with the class code.
            </div>
          )}
        </div>
      )}

      {/* Big Notify Parents bar at the bottom */}
      {reportData && stats.length > 0 && (
        <div style={{
          marginTop: 20,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>📢 Notify Parents</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {selectedParents.size > 0
                  ? `${selectedParents.size} parent(s) selected — send to selected only`
                  : `Send to all ${stats.length} parents in this class`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alsoEmail}
                  onChange={e => setAlsoEmail(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                Also send via Email
              </label>
              {selectedParents.size > 0 && (
                <button
                  onClick={notifySelectedParents}
                  disabled={notifyLoading}
                  style={{
                    padding: '12px 24px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', background: '#25d366', color: '#fff',
                  }}
                >
                  {notifyLoading ? '⏳ Sending...' : `📮 Send to ${selectedParents.size} Selected`}
                </button>
              )}
              <button
                onClick={notifyParents}
                disabled={notifyLoading}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', background: '#fff', color: '#667eea',
                }}
              >
                {notifyLoading ? '⏳ Sending...' : '📢 Send to ALL Parents'}
              </button>
            </div>
          </div>
          {notifyResult && (
            <div style={{
              background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#1e293b', fontWeight: 600,
            }}>
              {notifyResult}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            ✓ Parent emails and phones are saved automatically and stay for next week.
            Each parent receives: teacher marks, auto system marks, teacher message, performance analysis, and a signup link.
          </div>
        </div>
      )}
    </div>
  );
}
