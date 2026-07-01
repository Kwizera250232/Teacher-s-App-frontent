import { useState, useEffect } from 'react';
import { api, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const SECTIONS = ['Primary Books', 'Secondary Books', 'Past Papers', 'Revision Notes', 'Teacher Resources', 'University Resources', 'Research Papers', 'Career Guides', 'Government Documents'];

const CATEGORY_LABELS = {
  primary_book: 'Primary Books',
  secondary_book: 'Secondary Books',
  past_paper: 'Past Papers',
  revision_note: 'Revision Notes',
  teacher_resource: 'Teacher Resources',
  university_resource: 'University Resources',
  research_paper: 'Research Papers',
  career_guide: 'Career Guides',
  government_doc: 'Government Documents',
  other: 'Other',
};

export default function AlumniLibrary() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [activeSection, setActiveSection] = useState('Primary Books');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/alumni/library', token).catch(() => ({ books: [] })),
      api.get('/alumni/library-items', token).catch(() => ({ items: [] })),
    ]).then(([data1, data2]) => {
      setBooks(data1.books || []);
      setLibraryItems(data2.items || []);
      setLoading(false);
    });
  }, [token]);

  // Merge old books and new library items, filtered by active section
  const oldFiltered = books.filter((b) => b.section === activeSection);
  const newFiltered = libraryItems.filter((item) => (CATEGORY_LABELS[item.category] || 'Other') === activeSection);
  const filtered = [...oldFiltered, ...newFiltered];

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
            {filtered.map((item) => {
              const isLibraryItem = !!item.category;
              const fileUrl = isLibraryItem
                ? (item.file_path ? (item.file_path.startsWith('http') ? item.file_path : `${UPLOADS_BASE}${item.file_path}`) : null)
                : item.file_url;
              const cover = isLibraryItem && item.cover_image_path
                ? (item.cover_image_path.startsWith('http') ? item.cover_image_path : `${UPLOADS_BASE}${item.cover_image_path}`)
                : null;
              return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                {cover ? (
                  <img src={cover} alt={item.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
                ) : (
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📖</div>
                )}
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{item.title}</h4>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b' }}>{item.author || item.uploader_name || 'Unknown'}</p>
                {item.subject && <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 8 }}>{item.subject}</span>}
                {fileUrl && (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#667eea', fontWeight: 700, textDecoration: 'none' }}>
                    📥 Download
                  </a>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
