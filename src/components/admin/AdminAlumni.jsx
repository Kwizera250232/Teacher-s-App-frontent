import { useState, useEffect } from 'react';
import { api, uploadFile } from '../../api';
import { useRef } from 'react';

const TABS = [
  { key: 'books', label: '📚 Books', icon: '📚' },
  { key: 'opportunities', label: '🌟 Opportunities', icon: '🌟' },
  { key: 'pastpapers', label: '📄 Past Papers', icon: '📄' },
];

export default function AdminAlumni({ token }) {
  const [activeTab, setActiveTab] = useState('books');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'books') endpoint = '/alumni/library';
      else if (activeTab === 'opportunities') endpoint = '/alumni/opportunities';
      else if (activeTab === 'pastpapers') endpoint = '/alumni/past-papers';
      const data = await api.get(endpoint, token);
      if (activeTab === 'books') setItems(data.books || []);
      else if (activeTab === 'opportunities') setItems(data.opportunities || []);
      else if (activeTab === 'pastpapers') setItems(data.papers || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, [activeTab]);

  const handleUpload = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadFile('/upload', fd, token);
      return res.url;
    } catch (err) {
      alert('Upload failed: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input placeholder="PDF/Download URL" value={form.download_url || ''} onChange={(e) => setForm({...form, download_url: e.target.value})} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #667eea', background: '#fff', color: '#667eea', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {uploading ? 'Uploading...' : '📁 Upload PDF'}
            </button>
            <input type="file" ref={fileInputRef} accept=".pdf,.epub,.doc,.docx" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) { const url = await handleUpload(file); if (url) setForm(prev => ({ ...prev, download_url: url })); }
            }} />
          </div>
          {form.download_url && <div style={{ fontSize: 13, color: '#059669', padding: '6px 10px', background: '#f0fdf4', borderRadius: 6 }}>✅ File ready: {form.download_url.split('/').pop()}</div>}
          <textarea placeholder="Description" value={form.description || ''} onChange={(e) => setForm({...form, description: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={uploading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{editing ? 'Update' : 'Add Book'}</button>
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input placeholder="PDF URL" value={form.pdf_url || ''} onChange={(e) => setForm({...form, pdf_url: e.target.value})} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #667eea', background: '#fff', color: '#667eea', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {uploading ? 'Uploading...' : '📁 Upload PDF'}
            </button>
            <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) { const url = await handleUpload(file); if (url) setForm(prev => ({ ...prev, pdf_url: url })); }
            }} />
          </div>
          {form.pdf_url && <div style={{ fontSize: 13, color: '#059669', padding: '6px 10px', background: '#f0fdf4', borderRadius: 6 }}>✅ File ready: {form.pdf_url.split('/').pop()}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={uploading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{editing ? 'Update' : 'Add Past Paper'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({}); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Cancel</button>}
          </div>
        </form>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800 }}>🎓 Alumni Content Management</h2>
      <p style={{ color: '#64748b', marginBottom: 20 }}>Manage books, opportunities, and past papers for the alumni platform.</p>

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
  );
}
