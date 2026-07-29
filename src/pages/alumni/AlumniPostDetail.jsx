import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import VerifiedBadge from '../../components/VerifiedBadge';
import AIRevisionBadge from '../../components/AIRevisionBadge';
import { Helmet } from 'react-helmet';
import './AlumniPostSubstack.css';

function avatarColor(id) {
  return `hsl(${(id || 1) * 137 % 360}, 65%, 48%)`;
}

/* ── Substack-style SVG icons ─────────────────────────────────────────────── */
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" className={filled ? 'filled-heart' : ''}>
    <path d="M12 21s-7.5-4.7-10-9.2C.4 8.4 2 5 5.2 5c2 0 3.4 1.1 4.3 2.4C10.4 6.1 11.8 5 13.8 5 17 5 18.6 8.4 17 11.8 14.5 16.3 12 21 12 21z"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RestackIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={active ? 'filled-restack' : ''}>
    <path d="M17 2.1l4.6 4.6L17 11.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 11.5v-2a4 4 0 0 1 4-4h14.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 21.9l-4.6-4.6L7 11.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.5 12.5v2a4 4 0 0 1-4 4H1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 6l-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AlumniPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [restacked, setRestacked] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => { loadPost(); }, [postId, token]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setReadProgress(Math.min(100, Math.round((scrolled / Math.max(docHeight, 1)) * 100)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPost = async () => {
    try {
      const data = await api.get(`/alumni/feed/${postId}`, token);
      setPost(data.post || null);
      setComments(data.comments || []);
      setRestacked(!!(data.post || {}).restacked_by_me);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/alumni/feed/${postId}/comments`, { content: commentText }, token);
      setCommentText('');
      loadPost();
    } catch (e) { alert(e.message); }
  };

  const toggleLike = async () => {
    if (!post) return;
    try {
      if (post.liked_by_me) {
        await api.delete(`/alumni/feed/${post.id}/like`, token);
      } else {
        await api.post(`/alumni/feed/${post.id}/like`, {}, token);
      }
      loadPost();
    } catch (e) { console.error(e); }
  };

  const handleRestack = async () => {
    if (!post) return;
    try {
      if (restacked) {
        await api.delete(`/alumni/feed/${post.id}/restack`, token);
        setRestacked(false);
      } else {
        await api.post(`/alumni/feed/${post.id}/restack`, {}, token);
        setRestacked(true);
      }
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.content?.substring(0, 60) || 'Post', url: window.location.href });
      } else {
        await navigator.clipboard?.writeText(window.location.href);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }
    } catch (err) { /* user cancelled */ }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      await api.put(`/alumni/feed/${postId}`, { content: editText }, token);
      setEditing(false);
      loadPost();
    } catch (e) { alert(e.message); }
    finally { setSavingEdit(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/alumni/feed/${postId}`, token);
      navigate('/alumni/feed');
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', fontSize: 16, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Loading post…</div>;

  if (!post) return (
    <div style={{ padding: 60, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ color: '#0f172a' }}>Post not found</h2>
      <button onClick={() => navigate('/alumni/feed')} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 24, border: '1.5px solid #eef2f6', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>← Back to Feed</button>
    </div>
  );

  const authorId = post.author_id || post.user_id;
  const firstImg = post.image_paths?.[0];
  const ogImg = firstImg ? (firstImg.startsWith('http') ? firstImg : `${UPLOADS_BASE}${firstImg}`) : 'https://student.umunsi.com/og-image.svg';
  const ogDesc = post.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || post.content?.substring(0, 200)?.replace(/\n/g, ' ') || '';
  const ogTitle = post.content?.split('\n\n')?.[0]?.substring(0, 60)?.replace(/\n/g, ' ') || post.content?.substring(0, 60)?.replace(/\n/g, ' ') || 'Post';

  return (
    <div className="substack-post-page">
      {post && (
        <Helmet>
          <title>{ogTitle} - UClass Alumni</title>
          <meta name="description" content={ogDesc} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={ogTitle} />
          <meta property="og:description" content={ogDesc} />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:image" content={ogImg} />
          <meta property="og:image:secure_url" content={ogImg} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={ogTitle} />
          <meta property="og:site_name" content="UClass Alumni" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={ogTitle} />
          <meta name="twitter:description" content={ogDesc} />
          <meta name="twitter:image" content={ogImg} />
          <meta name="twitter:image:alt" content={ogTitle} />
          <meta itemprop="name" content={ogTitle} />
          <meta itemprop="description" content={ogDesc} />
          <meta itemprop="image" content={ogImg} />
        </Helmet>
      )}

      {/* Reading Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#f1f5f9', zIndex: 200 }}>
        <div style={{ width: `${readProgress}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #ea580c)', transition: 'width 0.2s' }} />
      </div>

      <div className="substack-container">
        {/* Top tools */}
        <div className="substack-header-tools">
          <button className="substack-back-btn" onClick={() => navigate('/alumni/feed')}>← Back to Feed</button>
          <button className="substack-pdf-btn" onClick={() => window.print()}>📄 Open as PDF</button>
        </div>

        {/* Author row */}
        <div className="substack-author-row">
          <div className="substack-author-avatar" style={{ background: avatarColor(authorId) }}>
            {post.author_name?.[0] || 'U'}
          </div>
          <div className="substack-author-info">
            <div className="substack-author-name">
              <span>{post.author_name}</span>
              <VerifiedBadge size={16} userId={authorId} onViewProfile={() => navigate(`/alumni/profile/${authorId}`)} />
              <AIRevisionBadge size={16} userId={authorId} />
            </div>
            <div className="substack-author-meta">
              {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              {post.views_count > 0 ? ` · ${post.views_count} views` : ''}
            </div>
          </div>
          {(post.author_id === user?.id || post.user_id === user?.id) && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94a3b8', padding: '4px 8px' }}
                title="More"
              >⋯</button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 150, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
                  <button onClick={() => { setEditing(true); setEditText(post.content || ''); setShowMenu(false); }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#1e293b', textAlign: 'left' }}>✏️ Edit Post</button>
                  <button onClick={() => { handleDelete(); setShowMenu(false); }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', textAlign: 'left' }}>🗑️ Delete Post</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Featured Images */}
      {post.image_paths && post.image_paths.length > 0 && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
          <div className="substack-featured-img" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(post.image_paths.length, 2)}, 1fr)`, gap: 4 }}>
            {post.image_paths.slice(0, 4).map((img, i) => (
              <div key={i} style={{ position: 'relative', minHeight: 200 }}>
                <img
                  src={img.startsWith('http') ? img : `${UPLOADS_BASE}${img}`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {i === 3 && post.image_paths.length > 4 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
                    +{post.image_paths.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="substack-container" style={{ paddingTop: 0 }}>
        {editing ? (
          <div style={{ marginBottom: 24 }}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{ width: '100%', minHeight: 140, padding: 14, borderRadius: 12, border: '1.5px solid #eef2f6', fontSize: 16, lineHeight: 1.7, outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setEditing(false)} style={{ padding: '8px 20px', borderRadius: 20, border: '1.5px solid #eef2f6', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={handleEdit} disabled={savingEdit || !editText.trim()} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#f97316', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{savingEdit ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        ) : (
          <div className="substack-content" style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>
        )}

        {/* Action Bar — Substack style */}
        <div className="substack-actions">
          <button
            className={`substack-action-btn${post.liked_by_me ? ' active' : ''}`}
            onClick={toggleLike}
            title="Like"
          >
            <HeartIcon filled={post.liked_by_me} />
            <span>{post.likes_count || 0}</span>
          </button>

          <button
            className="substack-action-btn"
            onClick={() => document.getElementById('substack-comments')?.scrollIntoView({ behavior: 'smooth' })}
            title="Comment"
          >
            <CommentIcon />
            <span>{post.comments_count || 0}</span>
          </button>

          <button
            className={`substack-action-btn${restacked ? ' active' : ''}`}
            onClick={handleRestack}
            title="Repost"
            style={restacked ? { color: '#10b981', background: '#ecfdf5', borderColor: '#a7f3d0' } : {}}
          >
            <RestackIcon active={restacked} />
            <span>{post.restacks_count || 0}</span>
          </button>

          <div className="substack-share-group">
            <button className="substack-action-btn" onClick={handleShare} title="Share">
              <ShareIcon />
            </button>
          </div>
        </div>

        {/* Stats line */}
        <div className="substack-stats">
          {post.views_count || 0} views · {post.likes_count || 0} likes · {post.comments_count || 0} comments
        </div>

        {/* Comments */}
        <div id="substack-comments">
          <h3 className="substack-comments-title">Comments ({comments.length})</h3>

          {/* Comment Input */}
          <div className="substack-comment-input-row">
            <div className="substack-comment-avatar" style={{ background: avatarColor(user?.id) }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div className="substack-comment-input-col">
              <textarea
                className="substack-comment-textarea"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
              />
              <button
                className="substack-comment-submit"
                onClick={addComment}
                disabled={!commentText.trim()}
              >
                Reply
              </button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="substack-empty-comments">No comments yet. Be the first to comment.</div>
          ) : (
            <div className="substack-comments-list">
              {comments.map((c) => (
                <div key={c.id} className="substack-comment">
                  <div className="substack-comment-avatar" style={{ background: avatarColor(c.user_id) }}>
                    {c.author_name?.[0] || 'U'}
                  </div>
                  <div className="substack-comment-bubble">
                    <div className="substack-comment-header">
                      <span className="substack-comment-name">{c.author_name}</span>
                      <span className="substack-comment-date">
                        {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="substack-comment-text">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Feed bottom */}
        <div className="substack-back-bottom">
          <button className="substack-back-bottom-btn" onClick={() => navigate('/alumni/feed')}>
            ← Back to Feed
          </button>
        </div>
      </div>

      {shareToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 24,
          fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', zIndex: 300,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          🔗 Link copied to clipboard
        </div>
      )}
    </div>
  );
}
