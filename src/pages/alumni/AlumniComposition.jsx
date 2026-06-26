import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AlumniComposition() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comp, setComp] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get(`/alumni/compositions/${slug}`);
        setComp(data);
        const c = await api.get(`/alumni/compositions/${data.id}/comments`);
        setComments(c || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setReadProgress(Math.min(100, Math.round((scrolled / docHeight) * 100)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleReaction = async (type) => {
    if (!comp) return;
    try {
      if (comp.user_reaction === type) {
        await api.delete(`/alumni/compositions/${comp.id}/react`);
        setComp({ ...comp, user_reaction: null, likes_count: comp.likes_count - 1 });
      } else {
        await api.post(`/alumni/compositions/${comp.id}/react`, { reaction_type: type });
        setComp({ ...comp, user_reaction: type, likes_count: comp.likes_count + (comp.user_reaction ? 0 : 1) });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!comp) return;
    try {
      if (comp.is_bookmarked) {
        await api.delete(`/alumni/compositions/${comp.id}/bookmark`);
        setComp({ ...comp, is_bookmarked: false, bookmarks_count: comp.bookmarks_count - 1 });
      } else {
        await api.post(`/alumni/compositions/${comp.id}/bookmark`);
        setComp({ ...comp, is_bookmarked: true, bookmarks_count: comp.bookmarks_count + 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !comp) return;
    setCommentLoading(true);
    try {
      const c = await api.post(`/alumni/compositions/${comp.id}/comments`, { content: newComment.trim() });
      setComments([...comments, c]);
      setNewComment('');
      setComp({ ...comp, comments_count: comp.comments_count + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading composition...</div>;
  if (!comp) return <div style={{ padding: 40, textAlign: 'center' }}>Composition not found.</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      {/* Reading Progress */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#e2e8f0', zIndex: 100,
      }}>
        <div style={{
          width: `${readProgress}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s',
        }} />
      </div>

      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: comp.author_avatar ? `url(${comp.author_avatar}) center/cover` : '#e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {!comp.author_avatar && (comp.author_name?.[0] || '?')}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{comp.author_name}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {comp.author_username && `@${comp.author_username}`} · {new Date(comp.published_at || comp.created_at).toLocaleDateString()}
            {comp.estimated_read_minutes && ` · ${comp.estimated_read_minutes} min read`}
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 32, lineHeight: 1.2, marginBottom: 16 }}>{comp.title}</h1>

      {/* Category & Tags */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {comp.category && (
          <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {comp.category}
          </span>
        )}
        {(comp.tags || []).map((tag) => (
          <span key={tag} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
            #{tag}
          </span>
        ))}
      </div>

      {/* Content */}
      <div
        style={{ lineHeight: 1.8, fontSize: 17, color: '#1e293b', marginBottom: 32 }}
        dangerouslySetInnerHTML={{ __html: comp.content }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        {['like', 'love', 'celebrate', 'support'].map((type) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            style={{
              padding: '8px 14px', borderRadius: 20, border: '1px solid #e2e8f0',
              background: comp.user_reaction === type ? '#e0e7ff' : '#fff',
              color: comp.user_reaction === type ? '#3730a3' : '#64748b',
              fontSize: 14, cursor: 'pointer',
            }}
          >
            {type === 'like' && '👍'} {type === 'love' && '❤️'} {type === 'celebrate' && '🎉'} {type === 'support' && '🙌'}
            {' '}{type}
          </button>
        ))}
        <button
          onClick={handleBookmark}
          style={{
            padding: '8px 14px', borderRadius: 20, border: '1px solid #e2e8f0',
            background: comp.is_bookmarked ? '#ecfdf5' : '#fff',
            color: comp.is_bookmarked ? '#059669' : '#64748b',
            fontSize: 14, cursor: 'pointer', marginLeft: 'auto',
          }}
        >
          {comp.is_bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
        </button>
      </div>

      <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
        {comp.likes_count} likes · {comp.comments_count} comments · {comp.read_count} reads · {comp.bookmarks_count} bookmarks
      </div>

      {/* Comments */}
      <h3 style={{ marginBottom: 16 }}>Comments ({comp.comments_count})</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', minHeight: 60, resize: 'vertical' }}
        />
        <button className="btn btn-primary" disabled={commentLoading} onClick={handleComment}>
          {commentLoading ? 'Posting...' : 'Post'}
        </button>
      </div>

      {comments.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No comments yet. Be the first!</div>
      ) : (
        comments.map((c) => (
          <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <strong style={{ fontSize: 14 }}>{c.author_name}</strong>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{c.content}</p>
          </div>
        ))
      )}
    </div>
  );
}
