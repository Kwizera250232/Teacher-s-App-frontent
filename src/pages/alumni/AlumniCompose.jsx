import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';

const CATEGORIES = ['Education', 'Technology', 'Career', 'Culture', 'Science', 'Arts', 'Leadership', 'Other'];

export default function AlumniCompose() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  // Load existing composition if editing
  useEffect(() => {
    if (!id) return;
    api.get(`/alumni/my-compositions?status=`)
      .then((list) => {
        const comp = list.find?.((c) => String(c.id) === id || c.slug === id);
        if (comp) {
          setTitle(comp.title || '');
          setContent(comp.content || '');
          setCategory(comp.category || '');
          setTags((comp.tags || []).join(', '));
          setStatus(comp.status || 'draft');
        }
      })
      .catch(console.error);
  }, [id]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!title && !content) return;
    const timer = setInterval(() => {
      if (status === 'draft' && !id) {
        handleSave(true);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [title, content, category, tags, status, id]);

  const handleSave = useCallback(async (silent = false) => {
    if (!title.trim() || !content.trim()) return;
    if (!silent) setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        category: category || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: silent ? 'draft' : status,
      };
      if (id) {
        await api.put(`/alumni/compositions/${id}`, payload);
      } else {
        const res = await api.post('/alumni/compositions', payload);
        if (silent && res?.id) {
          navigate(`/alumni/compose/${res.id}`, { replace: true });
        }
      }
      setLastSaved(new Date());
      if (!silent) setError('');
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setSaving(false);
    }
  }, [title, content, category, tags, status, id, navigate]);

  const handlePublish = async () => {
    setStatus('published');
    await handleSave();
    navigate('/alumni/dashboard');
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h2 style={{ marginBottom: 12 }}>{id ? 'Edit Composition' : 'New Composition'}</h2>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 12, color: '#dc2626' }}>
          {error}
        </div>
      )}
      {lastSaved && (
        <div style={{ color: '#059669', fontSize: 13, marginBottom: 8 }}>
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: '100%', padding: '14px 16px', fontSize: 22, fontWeight: 700,
          borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16,
        }}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <option value="">Category...</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          style={{ flex: 1, minWidth: 150, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <span style={{ color: '#64748b', fontSize: 13, padding: '8px 0' }}>
          {wordCount} words · {readTime} min read
        </span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your composition... (HTML supported for formatting)"
        style={{
          width: '100%', minHeight: 400, padding: 16, fontSize: 16, lineHeight: 1.7,
          borderRadius: 10, border: '1px solid #e2e8f0', resize: 'vertical',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      />

      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : '💾 Save Draft'}
        </button>
        <button className="btn btn-primary" disabled={saving} onClick={handlePublish}>
          🚀 Publish
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/alumni/dashboard')}>
          Cancel
        </button>
      </div>

      {/* Preview */}
      {content && (
        <div style={{ marginTop: 32, padding: 24, background: '#f8fafc', borderRadius: 10 }}>
          <h3 style={{ marginBottom: 12, fontSize: 14, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1 }}>
            Preview
          </h3>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
}
