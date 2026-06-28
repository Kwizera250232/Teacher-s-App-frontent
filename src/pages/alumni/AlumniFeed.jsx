import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const REACTIONS = ['👍','❤️','😂','😮','🔥','🎉'];

function getTitle(content) {
  if (!content) return 'Untitled';
  const lines = content.split('\n').filter(l => l.trim());
  if (!lines.length) return 'Untitled';
  const first = lines[0].replace(/^#+\s*/, '').trim();
  return first.length > 80 ? first.slice(0, 80) + '...' : first;
}
function getPreview(content) {
  if (!content) return '';
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return '';
  const rest = lines.slice(1).join(' ').trim();
  return rest.length > 140 ? rest.slice(0, 140) + '...' : rest;
}

export default function AlumniFeed() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [compositions, setCompositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReactions, setShowReactions] = useState(null);
  const [commentOpen, setCommentOpen] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState({});
  const [sendingPost, setSendingPost] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadPosts(); }, [token]);

  const loadPosts = async () => {
    try {
      const [feedData, compData] = await Promise.all([
        api.get('/alumni/feed', token).catch(() => ({ posts: [] })),
        api.get('/alumni/compositions?status=published', token).catch(() => ({ compositions: [] })),
      ]);
      const feedPosts = (feedData.posts || []).map(p => ({ ...p, itemType: 'post' }));
      const comps = (compData.compositions || []).map(c => ({ ...c, itemType: 'composition' }));
      const allItems = [...feedPosts, ...comps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(allItems);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleLike = async (post) => {
    try {
      if (post.liked_by_me) {
        await api.delete(`/alumni/feed/${post.id}/like`, token);
      } else {
        await api.post(`/alumni/feed/${post.id}/like`, {}, token);
      }
      loadPosts();
    } catch (e) { console.error(e); }
  };

  const addReaction = async (postId, emoji) => {
    try {
      await api.post(`/alumni/feed/${postId}/reaction`, { emoji }, token);
      setShowReactions(null);
      loadPosts();
    } catch (e) { alert(e.message); }
  };

  const loadComments = async (postId) => {
    try {
      const data = await api.get(`/alumni/feed/${postId}/comments`, token);
      setCommentsMap(prev => ({ ...prev, [postId]: data.comments || [] }));
    } catch (e) { console.error(e); }
  };

  const submitComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/alumni/feed/${postId}/comments`, { content: commentText }, token);
      setCommentText('');
      loadComments(postId);
      loadPosts();
    } catch (e) { alert(e.message); }
  };

  const handlePost = async () => {
    if (!composeText.trim() && !selectedImage) return;
    setSendingPost(true);
    try {
      let media_url = null;
      if (selectedImage) {
        const fd = new FormData();
        fd.append('file', selectedImage);
        const upload = await uploadFile('/upload', fd, token);
        media_url = upload.url;
      }
      await api.post('/alumni/feed', { content: composeText, media_url }, token);
      setComposeText('');
      setSelectedImage(null);
      loadPosts();
    } catch (e) { alert(e.message); }
    finally { setSendingPost(false); }
  };

  // Render a Composition card (Substack-style)
  const renderComposition = (comp) => (
    <div key={`comp-${comp.id}`} style={{ background: '#fff', borderRadius: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 8px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(comp.user_id || comp.author_id || 1) * 137 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {(comp.author_name || comp.name || 'U')[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{comp.author_name || comp.name || 'Alumni'}</span>
            <span style={{ color: '#3b82f6', fontSize: 13 }}>✓</span>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>· {new Date(comp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
        <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>✍️ Composition</span>
      </div>

      {/* Title */}
      <div onClick={() => navigate(`/alumni/composition/${comp.slug || comp.id}`)} style={{ padding: '0 16px 8px', cursor: 'pointer' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b', lineHeight: 1.3 }}>{comp.title}</h3>
      </div>

      {/* Featured Image */}
      {comp.featured_image && (
        <div onClick={() => navigate(`/alumni/composition/${comp.slug || comp.id}`)} style={{ cursor: 'pointer' }}>
          <img src={comp.featured_image.startsWith('http') ? comp.featured_image : `${UPLOADS_BASE}${comp.featured_image}`} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} />
        </div>
      )}

      {/* Preview */}
      <div onClick={() => navigate(`/alumni/composition/${comp.slug || comp.id}`)} style={{ padding: '12px 16px', cursor: 'pointer' }}>
        <p style={{ margin: 0, fontSize: 15, color: '#475569', lineHeight: 1.5 }}>{comp.excerpt || (comp.content && comp.content.length > 180 ? comp.content.slice(0, 180) + '...' : comp.content)}</p>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>Read more →</span>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 16px 12px', borderTop: '1px solid #f1f5f9' }}>
        <button onClick={() => toggleLike(comp)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: comp.liked_by_me ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>{comp.liked_by_me ? '❤️' : '🤍'}</span>
          <span style={{ fontWeight: 600 }}>{comp.likes || ''}</span>
        </button>
        <button onClick={() => { setCommentOpen(commentOpen === comp.id ? null : comp.id); if (commentOpen !== comp.id) loadComments(comp.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ fontWeight: 600 }}>{comp.comments_count || ''}</span>
        </button>
        <button onClick={() => alert('Repost feature coming soon!')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>🔄</span>
        </button>
        <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/alumni/composition/${comp.slug || comp.id}`); alert('Link copied!'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>↗️</span>
        </button>
      </div>
    </div>
  );

  // Render a Quick Post card
  const renderPost = (post) => (
    <div key={`post-${post.id}`} style={{ background: '#fff', borderRadius: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 8px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(post.user_id || 1) * 137 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {(post.author_name || 'U')[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{post.author_name}</span>
            <span style={{ color: '#3b82f6', fontSize: 13 }}>✓</span>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>· {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
        <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>📝 Post</span>
      </div>

      {/* Title */}
      <div onClick={() => navigate(`/alumni/post/${post.id}`)} style={{ padding: '0 16px 8px', cursor: 'pointer' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{getTitle(post.content)}</h3>
      </div>

      {/* Featured Image */}
      {post.media_url && (
        <div onClick={() => navigate(`/alumni/post/${post.id}`)} style={{ cursor: 'pointer' }}>
          <img src={post.media_url.startsWith('http') ? post.media_url : `${UPLOADS_BASE}${post.media_url}`} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} />
        </div>
      )}

      {/* Preview */}
      <div onClick={() => navigate(`/alumni/post/${post.id}`)} style={{ padding: '12px 16px', cursor: 'pointer' }}>
        <p style={{ margin: 0, fontSize: 15, color: '#475569', lineHeight: 1.5 }}>{getPreview(post.content)}</p>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 16px 12px', borderTop: '1px solid #f1f5f9' }}>
        <button onClick={() => toggleLike(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: post.liked_by_me ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>{post.liked_by_me ? '❤️' : '🤍'}</span>
          <span style={{ fontWeight: 600 }}>{post.likes || ''}</span>
        </button>
        <button onClick={() => { setCommentOpen(commentOpen === post.id ? null : post.id); if (commentOpen !== post.id) loadComments(post.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ fontWeight: 600 }}>{post.comments_count || ''}</span>
        </button>
        <button onClick={() => alert('Repost feature coming soon!')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>🔄</span>
        </button>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button onClick={() => setShowReactions(showReactions === post.id ? null : post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}>😊</button>
          {showReactions === post.id && (
            <div style={{ position: 'absolute', bottom: 32, right: 0, display: 'flex', gap: 4, background: '#fff', padding: '6px 10px', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100 }}>
              {REACTIONS.map((emoji) => (
                <button key={emoji} onClick={() => addReaction(post.id, emoji)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4 }}>{emoji}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/alumni/post/${post.id}`); alert('Link copied!'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 18 }}>↗️</span>
        </button>
      </div>

      {/* Inline Comments */}
      {commentOpen === post.id && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${(user?.id || 1) * 137 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{(user?.name || 'U')[0]}</div>
            <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)} style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
            <button onClick={() => submitComment(post.id)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Reply</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(commentsMap[post.id] || []).map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${(c.user_id || 1) * 137 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{(c.author_name || 'U')[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>{c.author_name}</strong>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AlumniLayout>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Compose Box - Quick Post */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `hsl(${(user?.id || 1) * 137 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
              {(user?.name || 'U')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                placeholder="What's on your mind?"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, resize: 'vertical', minHeight: 60, outline: 'none' }}
              />
              {selectedImage && (
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <img src={URL.createObjectURL(selectedImage)} alt="" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                  <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>🖼️</button>
                <input type="file" ref={fileInputRef} onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} accept="image/*" style={{ display: 'none' }} />
                <button onClick={() => navigate('/alumni/compose')} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 20, border: '1.5px solid #f59e0b', background: '#fff', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  ✍️ Write Article
                </button>
                <button onClick={handlePost} disabled={sendingPost} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  {sendingPost ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>}

        {posts.map((item) => (
          item.itemType === 'composition' ? renderComposition(item) : renderPost(item)
        ))}

        {!loading && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <p>No posts yet. Be the first to share!</p>
            <button onClick={() => navigate('/alumni/compose')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 20, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>✍️ Write Your First Article</button>
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
