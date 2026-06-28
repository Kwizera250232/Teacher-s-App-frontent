import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function GraduationManager() {
  const { user, token } = useAuth();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState([]);

  const canGraduate = user?.role === 'admin' || user?.role === 'head_teacher' || user?.role === 'teacher';

  useEffect(() => {
    if (!token) return;
    api.get('/auth/schools', token).then(setSchools).catch(() => {});
    loadStudents();
  }, [schoolId, token]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Get teacher's classes first
      const classes = await api.get('/classes', token).catch(() => []);
      const myClassIds = (Array.isArray(classes) ? classes : []).map(c => c.id);
      
      const params = schoolId ? `?school_id=${schoolId}` : '';
      const data = await api.get(`/alumni/students-for-graduation${params}`, token);
      let allStudents = data || [];
      
      // Filter to show only students from teacher's own classes
      if (user?.role === 'teacher' && myClassIds.length > 0) {
        allStudents = allStudents.filter(s => myClassIds.includes(s.class_id));
      }
      
      setStudents(allStudents);
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  };

  const handleGraduate = async () => {
    if (selected.size === 0) return;
    setActionLoading(true);
    setMessage('');
    try {
      if (selected.size === 1) {
        const studentId = Array.from(selected)[0];
        await api.post('/alumni/graduate', { student_id: studentId, graduation_year: graduationYear }, token);
      } else {
        await api.post('/alumni/graduate-bulk', { student_ids: Array.from(selected), graduation_year: graduationYear }, token);
      }
      setMessage(`✅ Successfully graduated ${selected.size} student(s)!`);
      setSelected(new Set());
      loadStudents();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!canGraduate) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, textAlign: 'center' }}>
        <h2>Graduation Manager</h2>
        <p style={{ color: '#dc2626' }}>Only teachers, head teachers, and admins can graduate students.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ marginBottom: 4 }}>🎓 Graduation Manager</h2>
      <p style={{ color: '#64748b', marginBottom: 20 }}>
        Select students to graduate them to Alumni status. Their school records remain intact.
      </p>

      {message && (
        <div style={{
          background: message.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${message.startsWith('✅') ? '#a7f3d0' : '#fecaca'}`,
          borderRadius: 8, padding: 12, marginBottom: 16, color: message.startsWith('✅') ? '#065f46' : '#dc2626'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {user?.role === 'admin' && (
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <option value="">All Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        {user?.role === 'teacher' && (
          <span style={{ padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: 14 }}>
            👨‍🏫 Your Class Students Only
          </span>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Graduation Year:
          <input
            type="number"
            value={graduationYear}
            onChange={(e) => setGraduationYear(parseInt(e.target.value) || new Date().getFullYear())}
            style={{ width: 80, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
        </label>
        <button
          className="btn btn-primary"
          disabled={selected.size === 0 || actionLoading}
          onClick={handleGraduate}
        >
          {actionLoading ? 'Processing...' : `🎓 Graduate ${selected.size} Student(s)`}
        </button>
        <button className="btn btn-secondary" onClick={selectAll}>
          {selected.size === students.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading students...</div>
      ) : students.length === 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 40, textAlign: 'center', color: '#64748b' }}>
          No eligible students found. All students may already be graduated.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === students.length && students.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Class</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>School</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => toggleSelect(s.id)}>
                  <td style={{ padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{s.class_name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 14 }}>{s.school_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
