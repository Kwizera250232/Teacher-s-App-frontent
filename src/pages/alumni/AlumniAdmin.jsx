import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const TABS = [
  { key: 'books', label: '📚 Books', icon: '📚' },
  { key: 'opportunities', label: '🌟 Opportunities', icon: '🌟' },
  { key: 'pastpapers', label: '📄 Past Papers', icon: '📄' },
];

export default function AlumniAdmin() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('books');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  // Allow admin, head_teacher, and teacher
  const isAdmin = user?.role === 'admin' || user?.role === 'head_teacher' || user?.role === 'teacher';

  if (!isAdmin) {
    return (
      <AlumniLayout showTopWriters={false}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>Only teachers and admins can access this page.</p>
        </div>
      </AlumniLayout>
    );
  }

  const loadItems = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'books') endpoint = '/alumni/library';
      else if (activeTab === 'opportunities') endpoint = '/alumni/opportunities';
      else if (activeTab === 'pastpapers') endpoint = '/alumni/past-papers';
      else if (activeTab === 'quizzes') endpoint = '/alumni/dean-quizzes';
      const data = await api.get(endpoint, token);
      if (activeTab === 'books') setItems(data.books || []);
      else if (activeTab === 'opportunities') setItems(data.opportunities || []);
      else if (activeTab === 'pastpapers') setItems(data.papers || []);
      else if (activeTab === 'quizzes') setItems(data.quizzes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      if (activeTab === 'books') endpoint = '/admin/alumni/books';
      else if (activeTab === 'opportunities') endpoint = '/admin/alumni/opportunities';
      else if (activeTab === 'pastpapers') endpoint = '/admin/alumni/past-papers';

      if (editing) {
        await api.put(`${endpoint}/${editing}`, form, token);
      } else {
        await api.post(endpoint, form, token);
      }
      setForm({});
      setEditing(null);
      loadItems();
    } catch (err) {
      alert(err.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      let endpoint = '';
      if (activeTab === 'books') endpoint = `/admin/alumni/books/${id}`;
      else if (activeTab === 'opportunities') endpoint = `/admin/alumni/opportunities/${id}`;
      else if (activeTab === 'pastpapers') endpoint = `/admin/alumni/past-papers/${id}`;
      await api.delete(endpoint, token);
      loadItems();
    } catch (e) { alert('Failed to delete'); }
  };

  const renderForm = () => {
    if (activeTab === 'books') {
      return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 8px' }}>{editing ? 'Edit Book' : 'Add New Book'}</h4>
          <input placeholder="Title" value={form.title || ''} onChange={(e) => setForm({...form, title: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} required />
          <input placeholder="Author" value={form.author || ''} onChange={(e) => setForm({...form, author: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <select value={form.section || 'Primary Books'} onChange={(e) => setForm({...form, section: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }}>
            {['Primary Books','Secondary Books','Past Papers','Revision Notes','Teacher Resources','University Resources','Research Papers','Career Guides','Government Documents'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Cover Image URL" value={form.cover_url || ''} onChange={(e) => setForm({...form, cover_url: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <input placeholder="PDF/Download URL" value={form.download_url || ''} onChange={(e) => setForm({...form, download_url: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <textarea placeholder="Description" value={form.description || ''} onChange={(e) => setForm({...form, description: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{editing ? 'Update' : 'Add Book'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({}); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Cancel</button>}
          </div>
        </form>
      );
    }
    if (activeTab === 'opportunities') {
      return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 8px' }}>{editing ? 'Edit Opportunity' : 'Add New Opportunity'}</h4>
          <input placeholder="Title" value={form.title || ''} onChange={(e) => setForm({...form, title: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} required />
          <select value={form.category || 'Scholarships'} onChange={(e) => setForm({...form, category: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }}>
            {['Scholarships','Internships','Competitions','Volunteering','Jobs','Training','Hackathons','Conferences'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Organization" value={form.organization || ''} onChange={(e) => setForm({...form, organization: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <input placeholder="Location" value={form.location || ''} onChange={(e) => setForm({...form, location: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <input type="date" placeholder="Deadline" value={form.deadline || ''} onChange={(e) => setForm({...form, deadline: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <input placeholder="Apply Link" value={form.link || ''} onChange={(e) => setForm({...form, link: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <textarea placeholder="Description" value={form.description || ''} onChange={(e) => setForm({...form, description: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{editing ? 'Update' : 'Add Opportunity'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({}); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Cancel</button>}
          </div>
        </form>
      );
    }
    if (activeTab === 'pastpapers') {
      return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 8px' }}>{editing ? 'Edit Past Paper' : 'Add New Past Paper'}</h4>
          <input placeholder="Title (e.g., Primary 6 Math 2024)" value={form.title || ''} onChange={(e) => setForm({...form, title: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} required />
          <select value={form.subject || 'Mathematics'} onChange={(e) => setForm({...form, subject: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }}>
            {['Mathematics','English','Kinyarwanda','Science','Social Studies','French','ICT','Religion'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.year || '2024'} onChange={(e) => setForm({...form, year: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }}>
            {['2024','2023','2022','2021','2020','2019'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input placeholder="PDF URL" value={form.pdf_url || ''} onChange={(e) => setForm({...form, pdf_url: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{editing ? 'Update' : 'Add Past Paper'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({}); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Cancel</button>}
          </div>
        </form>
      );
    }
    return null;
  };

  return (
    <AlumniLayout showTopWriters={false}>
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 40 }}>⚙️</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Alumni Admin</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Manage content for the alumni platform</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setEditing(null); setForm({}); }} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#667eea' : '#e2e8f0', color: activeTab === tab.key ? '#fff' : '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {renderForm()}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12 }}>No items yet. Add one above!</div>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {item.author && `By ${item.author} · `}
                    {item.category && `${item.category} · `}
                    {item.subject && `${item.subject} · `}
                    {item.year && `${item.year} · `}
                    {item.section && `${item.section} · `}
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setEditing(item.id); setForm(item); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>✏️ Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>🗑️ Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
    </AlumniLayout>
  );
}
