import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniHomework() {
  const { token } = useAuth();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alumni/my-homework', token)
      .then((data) => { setHomework(data.homework || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>📋 My Homework</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>All homework from your class journey</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : homework.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h3>No homework yet</h3>
            <p style={{ color: '#64748b' }}>Homework from your class will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {homework.map((hw) => (
              <div key={hw.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>{hw.title}</h4>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{hw.description}</p>
                {hw.grade !== undefined && (
                  <div style={{ fontSize: 13, color: hw.grade >= 70 ? '#059669' : '#d97706', fontWeight: 700 }}>
                    Grade: {hw.grade}%
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  {new Date(hw.due_date || hw.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
