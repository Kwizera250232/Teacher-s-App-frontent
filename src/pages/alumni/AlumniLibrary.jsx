import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const SECTIONS = ['Primary Books', 'Secondary Books', 'Past Papers', 'Revision Notes', 'Teacher Resources', 'University Resources', 'Research Papers', 'Career Guides', 'Government Documents'];

export default function AlumniLibrary() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [activeSection, setActiveSection] = useState('Primary Books');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alumni/library', token)
      .then((data) => { setBooks(data.books || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = books.filter((b) => b.section === activeSection);

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>📖 Digital Library</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Books and resources for alumni</p>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: activeSection === s ? '#667eea' : '#e2e8f0',
                color: activeSection === s ? '#fff' : '#475569',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h3>No books in {activeSection} yet</h3>
            <p style={{ color: '#64748b' }}>Admin will add books soon</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filtered.map((book) => (
              <div key={book.id} style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📖</div>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{book.title}</h4>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>{book.author || 'Unknown'}</p>
                {book.file_url && (
                  <a href={book.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#667eea', fontWeight: 700, textDecoration: 'none' }}>
                    📥 Download
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
