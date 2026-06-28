import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniNotes() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alumni/my-notes', token)
      .then((data) => { setNotes(data.notes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>📚 My Class Notes</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>All notes from your class and new ones added</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <h3>No notes yet</h3>
            <p style={{ color: '#64748b' }}>Notes from your class will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {notes.map((note) => (
              <div key={note.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>{note.title}</h4>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{note.content}</p>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {note.teacher_name && <span>By {note.teacher_name} · </span>}
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
