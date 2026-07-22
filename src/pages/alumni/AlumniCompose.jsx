import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api, UPLOADS_BASE, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const CATEGORIES = ['Education', 'Technology', 'Career', 'Culture', 'Science', 'Arts', 'Leadership', 'Other'];

export default function AlumniCompose() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const inlineImageRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  // Load existing composition if editing
  useEffect(() => {
    if (!id || !token) return;
    api.get(`/alumni/my-compositions?status=`, token)
      .then((list) => {
        const comp = list.compositions?.find?.((c) => String(c.id) === id || c.slug === id);
        if (comp) {
          setTitle(comp.title || '');
          setContent(comp.content || '');
          setFeaturedImage(comp.featured_image_path || '');
          setCategory(comp.category || '');
          setTags((comp.tags || []).join(', '));
          setStatus(comp.status || 'draft');
        }
      })
      .catch(console.error);
  }, [id, token]);

  // Pre-fill topic from TopicSlider navigation
  useEffect(() => {
    if (location.state?.presetTopic && !id) {
      setTitle(location.state.presetTopic);
      setContent(`${location.state.presetTopic}\n\n`);
    }
  }, [location.state, id]);

  const handleImageUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await uploadFile('/alumni/upload', formData, token);
      setFeaturedImage(data.url || data.path || '');
    } catch (e) {
      console.error('Upload failed', e);
      alert('Image upload failed: ' + (e.message || ''));
    }
  };

  const handleInlineImageUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await uploadFile('/alumni/upload', formData, token);
      const imgUrl = data.url || data.path || '';
      const markdown = `\n\n![image](${imgUrl})\n\n`;
      setContent(prev => prev + markdown);
    } catch (e) {
      console.error('Inline upload failed', e);
      alert('Image upload failed: ' + (e.message || ''));
    }
  };

  const handleSave = useCallback(async (silent = false, publish = false) => {
    if (!title.trim() || !content.trim()) return;
    if (!silent) setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        featured_image_path: featuredImage || null,
        category: category || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: publish ? 'published' : (silent ? 'draft' : status),
      };
      if (id) {
        await api.put(`/alumni/compositions/${id}`, payload, token);
      } else {
        const res = await api.post('/alumni/compositions', payload, token);
        if (silent && res?.id) {
          navigate(`/alumni/compose/${res.id}`, { replace: true });
        }
      }
      setLastSaved(new Date());
      if (!silent) setError('');
      if (publish) navigate('/alumni/feed');
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setSaving(false);
    }
  }, [title, content, featuredImage, category, tags, status, id, token, navigate]);

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 800 }}>
          {id ? '✏️ Edit Article' : '✍️ Write an Article'}
        </h2>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}
        {lastSaved && (
          <div style={{ color: '#059669', fontSize: 13, marginBottom: 12 }}>
            💾 Auto-saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}

        {/* Featured Image */}
        <div style={{ marginBottom: 20 }}>
          {featuredImage ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
              <img src={featuredImage.startsWith('http') ? featuredImage : `${UPLOADS_BASE}${featuredImage}`} alt="" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
              <button
                onClick={() => setFeaturedImage('')}
                style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16 }}
              >×</button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 12,
                padding: 40,
                textAlign: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 14 }}>Add featured image</div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(Array.from(e.target.files))} />
        </div>

        {/* Title */}
        <input
          type="text"
          placeholder="Article Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%', padding: '14px 0', fontSize: 28, fontWeight: 800,
            border: 'none', borderBottom: '2px solid #e2e8f0', outline: 'none',
            marginBottom: 16, fontFamily: 'inherit',
          }}
        />

        {/* Meta */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
            <option value="">Category...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            placeholder="Tags: education, rwanda, science"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
          />
          <span style={{ color: '#94a3b8', fontSize: 13, padding: '8px 0' }}>
            {wordCount} words · {readTime} min read
          </span>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell your story... Share your knowledge, experience, or ideas with the UClass alumni community."
          style={{
            width: '100%', minHeight: 400, padding: 16, fontSize: 17, lineHeight: 1.8,
            borderRadius: 10, border: '1px solid #e2e8f0', resize: 'vertical',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={() => inlineImageRef.current?.click()}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
          >
            📷 Insert image inside article
          </button>
        </div>
        <input ref={inlineImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleInlineImageUpload(e.target.files)} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" disabled={saving} onClick={() => handleSave(false, false)}>
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={() => handleSave(false, true)}>
            🚀 Publish Now
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/alumni/dashboard')}>
            Cancel
          </button>
        </div>

        {/* Preview */}
        {content && (
          <div style={{ marginTop: 40, padding: 28, background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: 16, fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1, fontWeight: 700 }}>
              Preview
            </h3>
            {featuredImage && (
              <img src={featuredImage.startsWith('http') ? featuredImage : `${UPLOADS_BASE}${featuredImage}`} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 300, objectFit: 'cover' }} />
            )}
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{title || 'Untitled'}</h1>
            <div style={{ lineHeight: 1.8, color: '#374151', fontSize: 16, whiteSpace: 'pre-wrap' }}>{content}</div>
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
