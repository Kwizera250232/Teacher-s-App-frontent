import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

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
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
        {/* Back button */}
        <button onClick={() => navigate('/alumni/feed')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          ← Back to Feed
        </button>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Author Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `hsl(${(post.user_id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {post.author_name?.[0] || 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{post.author_name}</span>
                <span style={{ color: '#3b82f6', fontSize: 14 }}>✓</span>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Featured Image */}
          {post.media_url && (
            <img src={post.media_url.startsWith('http') ? post.media_url : `${UPLOADS_BASE}${post.media_url}`} alt="" style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} />
          )}

          {/* Content */}
          <div style={{ padding: '20px 24px', fontSize: 16, lineHeight: 1.7, color: '#1e293b' }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 24px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={toggleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: post.liked_by_me ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>{post.liked_by_me ? '❤️' : '🤍'}</span>
              <span style={{ fontWeight: 600 }}>{post.likes || 0}</span>
            </button>
            <span style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <span style={{ fontWeight: 600 }}>{post.comments_count || 0}</span>
            </span>
            <button onClick={() => alert('Repost feature coming soon!')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>🔄</span>
            </button>
            <button onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied!'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 20 }}>↗️</span>
            </button>
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
