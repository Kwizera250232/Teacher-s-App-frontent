import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniColleagues() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alumni/directory', token)
      .then((data) => { setColleagues(data.alumni || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>👥 Colleagues</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Chat with anyone like WhatsApp</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : colleagues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <h3>No colleagues yet</h3>
            <p style={{ color: '#64748b' }}>Be the first to connect!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {colleagues.filter((c) => c.id !== user?.id).map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/alumni/chat/${c.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  background: '#fff',
                  borderRadius: 14,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: `hsl(${(c.id * 137) % 360}, 60%, 50%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0,
                }}>
                  {c.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{c.current_occupation || c.dream_career || 'UClass Alumni'}</div>
                </div>
                <div style={{ fontSize: 20, color: '#94a3b8' }}>💬</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
