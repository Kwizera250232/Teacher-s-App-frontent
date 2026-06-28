import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const YEARS = ['2024', '2023', '2022', '2021', '2020'];
const SUBJECTS = ['Mathematics', 'English', 'Kinyarwanda', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Entrepreneurship'];

export default function AlumniPastPapers() {
  const { token } = useAuth();
  const [papers, setPapers] = useState([]);
  const [activeYear, setActiveYear] = useState('2024');
  const [activeSubject, setActiveSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alumni/past-papers', token)
      .then((data) => { setPapers(data.papers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = papers.filter((p) => {
    if (activeYear && p.year !== activeYear) return false;
    if (activeSubject && p.subject !== activeSubject) return false;
    return true;
  });

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>📄 Past Papers</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Practice with past national exams</p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={activeYear} onChange={(e) => setActiveYear(e.target.value)} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14 }}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={activeSubject} onChange={(e) => setActiveSubject(e.target.value)} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14 }}>
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <h3>No past papers found</h3>
            <p style={{ color: '#64748b' }}>Check back later for more papers</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((p) => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{p.title}</h4>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{p.subject} · {p.year}</div>
                </div>
                {p.file_url && (
                  <a href={p.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', borderRadius: 8, background: '#667eea', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
