import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';
import VerifiedBadge from '../../components/VerifiedBadge';
import AIRevisionBadge from '../../components/AIRevisionBadge';
import { Helmet } from 'react-helmet';
import './AlumniFeed.css';

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

  useEffect(() => { loadPost(); }, [postId, token]);

  const loadPost = async () => {
    try {
      const data = await api.get(`/alumni/feed/${postId}`, token);
      setPost(data.post || null);
      setComments(data.comments || []);
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

  if (loading) return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>
    </AlumniLayout>
  );

  if (!post) return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2>Post not found</h2>
        <button onClick={() => navigate('/alumni/feed')} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Back to Feed</button>
      </div>
    </AlumniLayout>
  );

  return (
    <AlumniLayout showTopWriters={false}>
      {post && (
        <Helmet>
          <title>{post.content?.split('\n\n')?.[0]?.substring(0, 60)?.replace(/\n/g, ' ') || post.content?.substring(0, 60)?.replace(/\n/g, ' ') || 'Post'} - UClass Alumni</title>
          <meta name="description" content={post.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || post.content?.substring(0, 200)?.replace(/\n/g, ' ') || ''} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={post.content?.split('\n\n')?.[0]?.substring(0, 60)?.replace(/\n/g, ' ') || post.content?.substring(0, 60)?.replace(/\n/g, ' ') || 'Post'} />
          <meta property="og:description" content={post.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || post.content?.substring(0, 200)?.replace(/\n/g, ' ') || ''} />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:image" content={post.image_paths?.[0] ? (post.image_paths[0].startsWith('http') ? post.image_paths[0] : `${UPLOADS_BASE}${post.image_paths[0]}`) : 'https://student.umunsi.com/og-image.svg'} />
          <meta property="og:site_name" content="UClass Alumni" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={post.content?.split('\n\n')?.[0]?.substring(0, 60)?.replace(/\n/g, ' ') || post.content?.substring(0, 60)?.replace(/\n/g, ' ') || 'Post'} />
          <meta name="twitter:description" content={post.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || post.content?.substring(0, 200)?.replace(/\n/g, ' ') || ''} />
          <meta name="twitter:image" content={post.image_paths?.[0] ? (post.image_paths[0].startsWith('http') ? post.image_paths[0] : `${UPLOADS_BASE}${post.image_paths[0]}`) : 'https://student.umunsi.com/og-image.svg'} />
        </Helmet>
      )}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
        {/* Back button & PDF button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => navigate('/alumni/feed')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
            ← Back to Feed
          </button>
          <button onClick={() => window.print()} style={{ background: 'none', border: '1.5px solid #e2e8f0', cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 600, padding: '6px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            📄 Open as PDF
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Author Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `hsl(${(post.user_id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {post.author_name?.[0] || 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{post.author_name}</span>
                <VerifiedBadge size={16} userId={post.author_id || post.user_id} onViewProfile={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)} />
                <AIRevisionBadge size={16} userId={post.author_id || post.user_id} />
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
            {(post.author_id === user?.id || post.user_id === user?.id) && (
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94a3b8', padding: '4px 8px' }}>⋯</button>
                {showMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 140, overflow: 'hidden' }}>
                    <button onClick={() => { setEditing(true); setEditText(post.content || ''); setShowMenu(false); }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#1e293b', textAlign: 'left' }}>✏️ Edit Post</button>
                    <button onClick={() => { handleDelete(); setShowMenu(false); }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', textAlign: 'left' }}>🗑️ Delete Post</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Featured Images */}
          {post.image_paths && post.image_paths.length > 0 && (
            <div className={`af-post-images af-post-images-${Math.min(post.image_paths.length, 4)}`} style={{ margin: '0 -24px 16px', width: 'calc(100% + 48px)' }}>
              {post.image_paths.slice(0, 4).map((img, i) => (
                <div key={i} className="af-post-img-wrap">
                  <img
                    src={img.startsWith('http') ? img : `${UPLOADS_BASE}${img}`}
                    alt=""
                    className="af-post-img"
                    style={{ borderRadius: 0 }}
                  />
                  {i === 3 && post.image_paths.length > 4 && (
                    <div className="af-post-img-overlay">+{post.image_paths.length - 4}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {editing ? (
            <div style={{ padding: '20px 24px' }}>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: '100%', minHeight: 120, padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 16, lineHeight: 1.7, outline: 'none', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={() => setEditing(false)} style={{ padding: '8px 20px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEdit} disabled={savingEdit || !editText.trim()} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{savingEdit ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 24px', fontSize: 16, lineHeight: 1.7, color: '#1e293b' }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
            <button onClick={toggleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: post.liked_by_me ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>{post.liked_by_me ? '❤️' : '🤍'}</span>
              <span style={{ fontWeight: 600 }}>{post.likes_count || 0}</span>
            </button>
            <span style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <span style={{ fontWeight: 600 }}>{post.comments_count || 0}</span>
            </span>
            <span style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>👁️</span>
              <span style={{ fontWeight: 600 }}>{post.views_count || 0} views</span>
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content?.substring(0, 100) || 'Check this out')}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                style={{ padding: '6px 10px', borderRadius: 18, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                title="Share on X (Twitter)"
              >
                𝕏
              </button>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                style={{ padding: '6px 10px', borderRadius: 18, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                title="Share on Facebook"
              >
                📘
              </button>
              <button
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                style={{ padding: '6px 10px', borderRadius: 18, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                title="Share on LinkedIn"
              >
                💼
              </button>
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent((post.content?.substring(0, 100) || 'Check this out') + ' ' + window.location.href)}`, '_blank')}
                style={{ padding: '6px 10px', borderRadius: 18, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                title="Share on WhatsApp"
              >
                📱
              </button>
              <button
                onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied!'); }}
                style={{ padding: '6px 10px', borderRadius: 18, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
                title="Copy link"
              >
                🔗
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Comments ({comments.length})</h3>

          {/* Comment Input */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(user?.id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} style={{ width: '100%', padding: '12px 16px', borderRadius: 20, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
            </div>
            <button onClick={addComment} style={{ padding: '10px 20px', borderRadius: 20, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Reply</button>
          </div>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(c.user_id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {c.author_name?.[0] || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>{c.author_name}</strong>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 15, color: '#475569', lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AlumniLayout>
  );
}
