import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniQuizzes() {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alumni/my-quizzes', token)
      .then((data) => { setQuizzes(data.quizzes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>📝 My Quizzes</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>All quizzes you have taken and new ones</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <h3>No quizzes yet</h3>
            <p style={{ color: '#64748b' }}>Quizzes from your class will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {quizzes.map((q) => (
              <div key={q.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>{q.title}</h4>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569' }}>{q.description}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8' }}>
                  {q.score !== undefined && <span style={{ color: q.score >= 70 ? '#059669' : '#d97706', fontWeight: 700 }}>Score: {q.score}%</span>}
                  {q.status && <span>Status: {q.status}</span>}
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
