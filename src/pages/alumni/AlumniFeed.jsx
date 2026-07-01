import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';
import VerifiedBadge from '../../components/VerifiedBadge';

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

function avatarColor(id) {
  return `hsl(${(id || 1) * 137 % 360}, 65%, 48%)`;
}

export default function AlumniFeed() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReactions, setShowReactions] = useState(null);
  const [commentOpen, setCommentOpen] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState({});
  const [sendingPost, setSendingPost] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { loadPosts(); loadSuggested(); }, [token]);

  const loadSuggested = async () => {
    try {
      const data = await api.get('/alumni/suggested-alumni', token);
      setSuggested(data.suggested || []);
    } catch (e) { console.error(e); }
  };

  const handleSubscribe = async (alumniId) => {
    try {
      await api.post(`/alumni/follow/${alumniId}`, {}, token);
      loadSuggested();
    } catch (e) { alert(e.message); }
  };

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
        const upload = await uploadFile('/alumni/upload', fd, token);
        media_url = upload.url;
      }
      await api.post('/alumni/feed', { content: composeText, image_paths: media_url }, token);
      setComposeText('');
      setSelectedImage(null);
      loadPosts();
    } catch (e) { alert(e.message); }
    finally { setSendingPost(false); }
  };

  // ── X-style Composition Link Card ──
  const renderComposition = (comp) => {
    const compUrl = `/alumni/composition/${comp.slug || comp.id}`;
    const featuredImg = comp.featured_image_path
      ? (comp.featured_image_path.startsWith('http') ? comp.featured_image_path : `${UPLOADS_BASE}${comp.featured_image_path}`)
      : null;
    return (
    <article key={`comp-${comp.id}`} style={styles.articleCard}>
      <div style={styles.articleHeader}>
        <div style={{ ...styles.avatar, background: avatarColor(comp.user_id || comp.author_id) }}>
          {(comp.author_name || comp.name || 'U')[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.authorRow}>
            <span style={styles.authorName}>{comp.author_name || comp.name || 'Alumni'}</span>
            <VerifiedBadge size={16} userId={comp.user_id || comp.author_id} onViewProfile={() => navigate(`/alumni/profile/${comp.user_id || comp.author_id}`)} />
            <span style={styles.dateText}>· {new Date(comp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {comp.category && <span style={styles.categoryTag}>{comp.category}</span>}
            <span> · {comp.estimated_read_minutes || 1} min read</span>
          </div>
        </div>
        <span style={styles.compositionBadge}>✍️ Article</span>
      </div>

      {/* X-style link card: image + title in a bordered clickable card */}
      <div onClick={() => navigate(compUrl)} style={styles.linkCard}>
        {featuredImg && (
          <img src={featuredImg} alt={comp.title} style={styles.linkCardImage} />
        )}
        <div style={styles.linkCardBody}>
          <h2 style={styles.linkCardTitle}>{comp.title}</h2>
          <span style={styles.linkCardDomain}>umunsi.com · Read article</span>
        </div>
      </div>

      <div style={styles.actionBar}>
        <button onClick={() => toggleLike(comp)} style={styles.actionBtn}>
          <span style={{ fontSize: 18 }}>{comp.liked_by_me ? '❤️' : '🤍'}</span>
          <span style={styles.actionCount}>{comp.likes_count || ''}</span>
        </button>
        <button onClick={() => { setCommentOpen(commentOpen === comp.id ? null : comp.id); if (commentOpen !== comp.id) loadComments(comp.id); }} style={styles.actionBtn}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={styles.actionCount}>{comp.comments_count || ''}</span>
        </button>
        <span style={{ ...styles.actionBtn, cursor: 'default' }}>
          <span style={{ fontSize: 18 }}>👁️</span>
          <span style={styles.actionCount}>{comp.read_count || 0}</span>
        </span>
        <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${compUrl}`); alert('Link copied!'); }} style={{ ...styles.actionBtn, marginLeft: 'auto' }}>
          <span style={{ fontSize: 18 }}>↗️</span>
        </button>
      </div>
    </article>
  );
  };

  // ── Quick Post Card (image-first style) ──
  const renderPost = (post) => (
    <article key={`post-${post.id}`} style={styles.articleCard}>
      <div style={styles.articleHeader}>
        <div style={{ ...styles.avatar, background: avatarColor(post.user_id) }}>
          {(post.author_name || 'U')[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.authorRow}>
            <span style={styles.authorName}>{post.author_name}</span>
            <VerifiedBadge size={16} userId={post.author_id || post.user_id} onViewProfile={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)} />
            <span style={styles.dateText}>· {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
        <span style={styles.postBadge}>📝 Post</span>
      </div>

      {post.image_paths && post.image_paths.length > 0 && (
        <div onClick={() => navigate(`/alumni/post/${post.id}`)} style={styles.imageWrapper}>
          <img
            src={(Array.isArray(post.image_paths) ? post.image_paths[0] : post.image_paths).startsWith('http') ? (Array.isArray(post.image_paths) ? post.image_paths[0] : post.image_paths) : `${UPLOADS_BASE}${Array.isArray(post.image_paths) ? post.image_paths[0] : post.image_paths}`}
            alt=""
            style={styles.featuredImage}
          />
        </div>
      )}

      <div onClick={() => navigate(`/alumni/post/${post.id}`)} style={styles.clickable}>
        <h3 style={styles.postTitle}>{getTitle(post.content)}</h3>
        {getPreview(post.content) && <p style={styles.postExcerpt}>{getPreview(post.content)}</p>}
      </div>

      <div style={styles.actionBar}>
        <button onClick={() => toggleLike(post)} style={styles.actionBtn}>
          <span style={{ fontSize: 18 }}>{post.liked_by_me ? '❤️' : '🤍'}</span>
          <span style={styles.actionCount}>{post.likes_count || ''}</span>
        </button>
        <button onClick={() => { setCommentOpen(commentOpen === post.id ? null : post.id); if (commentOpen !== post.id) loadComments(post.id); }} style={styles.actionBtn}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={styles.actionCount}>{post.comments_count || ''}</span>
        </button>
        <span style={{ ...styles.actionBtn, cursor: 'default' }}>
          <span style={{ fontSize: 18 }}>👁️</span>
          <span style={styles.actionCount}>{post.views_count || 0}</span>
        </span>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button onClick={() => setShowReactions(showReactions === post.id ? null : post.id)} style={{ ...styles.actionBtn, position: 'relative' }}>
            <span style={{ fontSize: 18 }}>😊</span>
          </button>
          {showReactions === post.id && (
            <div style={styles.reactionPicker}>
              {REACTIONS.map((emoji) => (
                <button key={emoji} onClick={() => addReaction(post.id, emoji)} style={styles.reactionBtn}>{emoji}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/alumni/post/${post.id}`); alert('Link copied!'); }} style={styles.actionBtn}>
          <span style={{ fontSize: 18 }}>↗️</span>
        </button>
      </div>

      {commentOpen === post.id && (
        <div style={styles.commentSection}>
          <div style={styles.commentInputRow}>
            <div style={{ ...styles.avatar, ...styles.avatarSm, background: avatarColor(user?.id) }}>{(user?.name || 'U')[0]}</div>
            <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)} style={styles.commentInput} />
            <button onClick={() => submitComment(post.id)} style={styles.commentBtn}>Reply</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(commentsMap[post.id] || []).map((c) => (
              <div key={c.id} style={styles.commentItem}>
                <div style={{ ...styles.avatar, ...styles.avatarSm, background: avatarColor(c.user_id) }}>{(c.author_name || 'U')[0]}</div>
                <div style={styles.commentBody}>
                  <div style={styles.commentMeta}>
                    <strong style={styles.commentAuthor}>{c.author_name}</strong>
                    <span style={styles.dateText}>{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p style={styles.commentText}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );

  return (
    <AlumniLayout>
      <div style={styles.container}>
        {/* Hero Header */}
        <div style={styles.heroHeader}>
          <h1 style={styles.heroTitle}>U-Class Alumni</h1>
          <p style={styles.heroSubtitle}>Stories, ideas & compositions from our graduates</p>
        </div>

        {/* Compose Box */}
        <div style={styles.composeBox}>
          <div style={styles.composeRow}>
            <div style={{ ...styles.avatar, background: avatarColor(user?.id) }}>{(user?.name || 'U')[0]}</div>
            <textarea
              placeholder="Share something with the alumni community..."
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              style={styles.composeTextarea}
            />
          </div>
          {selectedImage && (
            <div style={styles.previewImageWrap}>
              <img src={URL.createObjectURL(selectedImage)} alt="" style={styles.previewImage} />
              <button onClick={() => setSelectedImage(null)} style={styles.removeImageBtn}>✕</button>
            </div>
          )}
          <div style={styles.composeActions}>
            <button onClick={() => fileInputRef.current?.click()} style={styles.iconBtn}>🖼️ Photo</button>
            <button onClick={() => navigate('/alumni/compose')} style={styles.iconBtn}>✍️ Write Article</button>
            <button onClick={handlePost} disabled={sendingPost || (!composeText.trim() && !selectedImage)} style={styles.postBtn}>
              {sendingPost ? 'Posting...' : 'Post'}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setSelectedImage(e.target.files[0])} />
        </div>

        {/* Feed */}
        {loading ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 36 }}>⏳</div>
            <p style={styles.emptyText}>Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48 }}>📰</div>
            <h3 style={styles.emptyTitle}>No posts yet</h3>
            <p style={styles.emptyText}>Be the first to share something with the alumni community!</p>
            <button onClick={() => navigate('/alumni/compose')} style={styles.ctaBtn}>Write an Article</button>
          </div>
        ) : (
          posts.map((item) => item.itemType === 'composition' ? renderComposition(item) : renderPost(item))
        )}

        {/* Suggested Alumni */}
        {suggested.length > 0 && (
          <div style={styles.suggestedSection}>
            <h3 style={styles.suggestedTitle}>✨ Suggested Alumni</h3>
            <div style={styles.suggestedGrid}>
              {suggested.map((s) => (
                <div key={s.id} style={styles.suggestedCard}>
                  <div style={{ ...styles.avatar, ...styles.avatarMd, background: avatarColor(s.id), cursor: 'pointer' }} onClick={() => navigate(`/alumni/profile/${s.id}`)}>
                    {(s.name || 'U')[0]}
                  </div>
                  <div style={styles.suggestedInfo}>
                    <div style={styles.suggestedNameRow}>
                      <span style={styles.suggestedName} onClick={() => navigate(`/alumni/profile/${s.id}`)}>{s.name}</span>
                      <VerifiedBadge size={14} userId={s.id} onViewProfile={() => navigate(`/alumni/profile/${s.id}`)} />
                    </div>
                    <div style={styles.suggestedMeta}>{s.school_name || 'UClass'} · {s.total_compositions || 0} articles</div>
                    <button
                      onClick={() => handleSubscribe(s.id)}
                      style={s.is_following ? styles.subscribedBtn : styles.subscribeBtn}
                    >
                      {s.is_following ? '✓ Subscribed' : '🔔 Subscribe'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}

const styles = {
  container: { maxWidth: 680, margin: '0 auto', padding: '0 12px' },
  heroHeader: { textAlign: 'center', padding: '28px 0 24px' },
  heroTitle: { fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, color: '#64748b', margin: 0 },

  composeBox: { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' },
  composeRow: { display: 'flex', gap: 12 },
  composeTextarea: { flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, resize: 'vertical', minHeight: 56, outline: 'none', fontFamily: 'inherit' },
  previewImageWrap: { position: 'relative', marginTop: 10 },
  previewImage: { maxHeight: 140, borderRadius: 10, objectFit: 'cover', width: '100%' },
  removeImageBtn: { position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: 13 },
  composeActions: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 },
  iconBtn: { background: '#f1f5f9', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  postBtn: { marginLeft: 'auto', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 20, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  articleCard: { background: '#fff', borderRadius: 16, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' },
  articleHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 10px' },
  avatar: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  avatarSm: { width: 32, height: 32, fontSize: 13 },
  authorRow: { display: 'flex', alignItems: 'center', gap: 6 },
  authorName: { fontWeight: 700, fontSize: 15, color: '#1e293b' },
  verifiedBadge: { color: '#3b82f6', fontSize: 14 },
  dateText: { color: '#94a3b8', fontSize: 13 },
  categoryTag: { background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 },
  compositionBadge: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 },
  postBadge: { background: '#e2e8f0', color: '#475569', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 },

  clickable: { cursor: 'pointer' },
  articleTitle: { margin: 0, padding: '0 18px 8px', fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, letterSpacing: -0.3 },
  articleExcerpt: { margin: 0, padding: '0 18px 12px', fontSize: 16, color: '#475569', lineHeight: 1.6 },
  postTitle: { margin: 0, padding: '0 18px 6px', fontSize: 17, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 },
  postExcerpt: { margin: 0, padding: '0 18px 12px', fontSize: 15, color: '#64748b', lineHeight: 1.5 },

  // X-style link card for compositions
  linkCard: { margin: '0 18px 4px', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.15s', background: '#f8fafc' },
  linkCardImage: { width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' },
  linkCardBody: { padding: '12px 16px' },
  linkCardTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.35 },
  linkCardDomain: { fontSize: 13, color: '#94a3b8', marginTop: 4, display: 'block' },

  imageWrapper: { cursor: 'pointer', overflow: 'hidden', margin: '0 0 4px' },
  featuredImage: { width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' },

  readMoreBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 10px' },
  readMore: { color: '#d97706', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  readTime: { color: '#94a3b8', fontSize: 13 },

  actionBar: { display: 'flex', alignItems: 'center', gap: 16, padding: '10px 18px 14px', borderTop: '1px solid #f1f5f9' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 },
  actionCount: { fontWeight: 600, fontSize: 14 },

  reactionPicker: { position: 'absolute', bottom: 36, right: 0, display: 'flex', gap: 4, background: '#fff', padding: '8px 12px', borderRadius: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 100 },
  reactionBtn: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 },

  commentSection: { padding: '0 18px 16px', borderTop: '1px solid #f1f5f9' },
  commentInputRow: { display: 'flex', gap: 10, margin: '12px 0' },
  commentInput: { flex: 1, padding: '10px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' },
  commentBtn: { padding: '8px 16px', borderRadius: 20, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  commentItem: { display: 'flex', gap: 10 },
  commentBody: { flex: 1 },
  commentMeta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 },
  commentAuthor: { fontSize: 13, color: '#1e293b' },
  commentText: { margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.5, background: '#f8fafc', borderRadius: 12, padding: '10px 14px' },

  emptyState: { textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  emptyTitle: { fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '12px 0 6px' },
  emptyText: { color: '#94a3b8', fontSize: 15, margin: '0 0 16px' },
  ctaBtn: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },

  // Suggested Alumni
  suggestedSection: { marginTop: 32, marginBottom: 24 },
  suggestedTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' },
  suggestedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  suggestedCard: { background: '#fff', borderRadius: 14, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' },
  avatarMd: { width: 48, height: 48, fontSize: 18 },
  suggestedInfo: { flex: 1, minWidth: 0 },
  suggestedNameRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 },
  suggestedName: { fontWeight: 700, fontSize: 14, color: '#1e293b', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  suggestedMeta: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  subscribeBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: 16, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  subscribedBtn: { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 16, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'default' },
};
