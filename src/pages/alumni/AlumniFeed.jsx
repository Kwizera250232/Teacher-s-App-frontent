import { useState, useEffect, useRef } from 'react';
import { api, UPLOADS_BASE, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AlumniFeed() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerImages, setComposerImages] = useState([]);
  const [posting, setPosting] = useState(false);
  const [commentOpen, setCommentOpen] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState({});
  const fileInputRef = useRef(null);

  const loadFeed = async () => {
    try {
      const data = await api.get('/alumni/feed', token);
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeed(); }, []);

  const handleImageUpload = async (files) => {
    const uploaded = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${UPLOADS_BASE}/api/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const data = await res.json();
        uploaded.push(data.url || data.path);
      } catch (e) {
        console.error('Upload failed', e);
      }
    }
    setComposerImages([...composerImages, ...uploaded]);
  };

  const handlePost = async () => {
    if (!composerContent.trim() && composerImages.length === 0) return;
    setPosting(true);
    try {
      const post = await api.post('/alumni/feed', {
        content: composerContent,
        image_paths: composerImages,
        post_type: composerImages.length > 0 && !composerContent.trim() ? 'image' : 'text',
      }, token);
      setPosts([post, ...posts]);
      setShowComposer(false);
      setComposerContent('');
      setComposerImages([]);
    } catch (e) {
      alert(e.message);
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post) => {
    try {
      if (post.liked_by_me) {
        await api.delete(`/alumni/feed/${post.id}/like`, token);
      } else {
        await api.post(`/alumni/feed/${post.id}/like`, {}, token);
      }
      loadFeed();
    } catch (e) {
      console.error(e);
    }
  };

  const loadComments = async (postId) => {
    try {
      const data = await api.get(`/alumni/feed/${postId}/comments`, token);
      setComments({ ...comments, [postId]: data });
    } catch (e) {
      console.error(e);
    }
  };

  const addComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/alumni/feed/${postId}/comments`, { content: commentText }, token);
      setCommentText('');
      loadComments(postId);
      loadFeed();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading feed...</div>;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Alumni Feed</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Share what you learned, achievements, and moments</p>
      </div>

      {/* Composer */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {!showComposer ? (
          <div
            onClick={() => setShowComposer(true)}
            style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: 24, cursor: 'pointer', color: '#64748b', fontSize: 14 }}
          >
            💡 Share what you learned today...
          </div>
        ) : (
          <div>
            <textarea
              autoFocus
              placeholder="What did you learn today? Share your thoughts, achievements, or moments..."
              value={composerContent}
              onChange={(e) => setComposerContent(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            {composerImages.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {composerImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img.startsWith('http') ? img : `${UPLOADS_BASE}${img}`} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                    <button onClick={() => setComposerImages(composerImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="file" accept="image/*" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleImageUpload([...e.target.files])} />
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>📷</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setShowComposer(false); setComposerContent(''); setComposerImages([]); }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={posting || (!composerContent.trim() && composerImages.length === 0)}>
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: '#f8fafc', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
            <h3 style={{ margin: '0 0 8px' }}>No posts yet</h3>
            <p style={{ color: '#64748b' }}>Be the first to share something!</p>
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `hsl(${(post.author_id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                {post.author_name?.[0] || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{post.author_name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(post.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            {post.content && <p style={{ margin: '0 0 12px', lineHeight: 1.5, fontSize: 15 }}>{post.content}</p>}

            {post.image_paths && post.image_paths.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: post.image_paths.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                {post.image_paths.map((img, i) => (
                  <img key={i} src={img.startsWith('http') ? img : `${UPLOADS_BASE}${img}`} alt="" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 400 }} />
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => toggleLike(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: post.liked_by_me ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                {post.liked_by_me ? '❤️' : '🤍'} {post.likes_count || 0}
              </button>
              <button onClick={() => { setCommentOpen(commentOpen === post.id ? null : post.id); loadComments(post.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                💬 {post.comments_count || 0}
              </button>
            </div>

            {commentOpen === post.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                {(comments[post.id] || []).map((c) => (
                  <div key={c.id} style={{ marginBottom: 8, fontSize: 13 }}>
                    <strong>{c.author_name}</strong>: {c.content}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment(post.id)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => addComment(post.id)}>Reply</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
