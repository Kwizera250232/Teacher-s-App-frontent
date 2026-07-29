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

function formatContent(html) {
  if (!html) return '';
  if (/<[a-z][\s\S]*>/i.test(html)) return html;
  const paragraphs = html.split(/\n\n+/).filter(p => p.trim());
  return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
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

export default function AlumniComposition() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [comp, setComp] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [restacked, setRestacked] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get(`/alumni/compositions/${slug}`, token);
        setComp(data);
        setRestacked(!!data?.restacked_by_me);
        const c = await api.get(`/alumni/compositions/${data.id}/comments`, token);
        setComments(c || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, token]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setReadProgress(Math.min(100, Math.round((scrolled / Math.max(docHeight, 1)) * 100)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLike = async () => {
    if (!comp) return;
    try {
      if (comp.user_reaction === 'like') {
        await api.delete(`/alumni/compositions/${comp.id}/react`, token);
        setComp({ ...comp, user_reaction: null, likes_count: (comp.likes_count || 1) - 1 });
      } else {
        await api.post(`/alumni/compositions/${comp.id}/react`, { reaction_type: 'like' }, token);
        setComp({ ...comp, user_reaction: 'like', likes_count: (comp.likes_count || 0) + (comp.user_reaction ? 0 : 1) });
      }
    } catch (err) { console.error(err); }
  };

  const handleBookmark = async () => {
    if (!comp) return;
    try {
      if (comp.is_bookmarked) {
        await api.delete(`/alumni/compositions/${comp.id}/bookmark`, token);
        setComp({ ...comp, is_bookmarked: false, bookmarks_count: (comp.bookmarks_count || 1) - 1 });
      } else {
        await api.post(`/alumni/compositions/${comp.id}/bookmark`, {}, token);
        setComp({ ...comp, is_bookmarked: true, bookmarks_count: (comp.bookmarks_count || 0) + 1 });
      }
    } catch (err) { console.error(err); }
  };

  const handleRestack = async () => {
    if (!comp) return;
    try {
      if (restacked) {
        await api.delete(`/alumni/compositions/${comp.id}/restack`, token);
        setRestacked(false);
        setComp({ ...comp, restacks_count: (comp.restacks_count || 1) - 1 });
      } else {
        await api.post(`/alumni/compositions/${comp.id}/restack`, {}, token);
        setRestacked(true);
        setComp({ ...comp, restacks_count: (comp.restacks_count || 0) + 1 });
      }
    } catch (err) { console.error(err); }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: comp.title, url: window.location.href });
      } else {
        await navigator.clipboard?.writeText(window.location.href);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }
    } catch (err) { /* user cancelled */ }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !comp) return;
    setCommentLoading(true);
    try {
      const c = await api.post(`/alumni/compositions/${comp.id}/comments`, { content: newComment.trim() }, token);
      setComments([...comments, c]);
      setNewComment('');
      setComp({ ...comp, comments_count: (comp.comments_count || 0) + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', fontSize: 16, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Loading article…</div>;
  if (!comp) return <div style={{ padding: 60, textAlign: 'center', fontSize: 16, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Article not found.</div>;

  const authorId = comp.user_id || comp.author_id || 1;
  const featuredImg = comp.featured_image_path
    ? (comp.featured_image_path.startsWith('http') ? comp.featured_image_path : `${UPLOADS_BASE}${comp.featured_image_path}`)
    : null;
  const liked = comp.user_reaction === 'like';

  const ogDesc = comp.excerpt || comp.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || comp.content?.substring(0, 200)?.replace(/\n/g, ' ') || '';

  return (
    <div className="substack-post-page">
      {comp && (
        <Helmet>
          <title>{comp.title} - UClass Alumni</title>
          <meta name="description" content={ogDesc} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={comp.title} />
          <meta property="og:description" content={ogDesc} />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:image" content={featuredImg || 'https://student.umunsi.com/og-image.svg'} />
          <meta property="og:image:secure_url" content={featuredImg || 'https://student.umunsi.com/og-image.svg'} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={comp.title} />
          <meta property="og:site_name" content="UClass Alumni" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={comp.title} />
          <meta name="twitter:description" content={ogDesc} />
          <meta name="twitter:image" content={featuredImg || 'https://student.umunsi.com/og-image.svg'} />
          <meta name="twitter:image:alt" content={comp.title} />
          <meta itemprop="name" content={comp.title} />
          <meta itemprop="description" content={ogDesc} />
          <meta itemprop="image" content={featuredImg || 'https://student.umunsi.com/og-image.svg'} />
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

        {/* Category */}
        {comp.category && (
          <span className="substack-category">{comp.category}</span>
        )}

        {/* Title */}
        <h1 className="substack-title">{comp.title}</h1>

        {/* Author row */}
        <div className="substack-author-row">
          <div className="substack-author-avatar" style={{ background: avatarColor(authorId) }}>
            {(comp.author_name || 'U')[0]}
          </div>
          <div className="substack-author-info">
            <div className="substack-author-name">
              <span>{comp.author_name}</span>
              <VerifiedBadge size={16} userId={authorId} onViewProfile={null} />
              <AIRevisionBadge size={16} userId={authorId} />
            </div>
            <div className="substack-author-meta">
              {new Date(comp.published_at || comp.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              {comp.estimated_read_minutes ? ` · ${comp.estimated_read_minutes} min read` : ''}
              {comp.read_count > 0 ? ` · ${comp.read_count} reads` : ''}
            </div>
          </div>
          <button
            className="substack-subscribe-btn"
            onClick={handleBookmark}
            style={comp.is_bookmarked ? { borderColor: '#059669', color: '#059669', background: '#ecfdf5' } : {}}
          >
            {comp.is_bookmarked ? '✓ Saved' : '🔖 Save'}
          </button>
        </div>
      </div>

      {/* Featured Image */}
      {featuredImg && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
          <div className="substack-featured-img">
            <img src={featuredImg} alt={comp.title} />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="substack-container" style={{ paddingTop: 0 }}>
        <div
          className="substack-content"
          dangerouslySetInnerHTML={{ __html: formatContent(comp.content) }}
        />

        {/* Tags */}
        {(comp.tags || []).length > 0 && (
          <div className="substack-tags">
            {(comp.tags || []).map((tag) => (
              <span key={tag} className="substack-tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Action Bar — Substack style */}
        <div className="substack-actions">
          <button
            className={`substack-action-btn${liked ? ' active' : ''}`}
            onClick={handleLike}
            title="Like"
          >
            <HeartIcon filled={liked} />
            <span>{comp.likes_count || 0}</span>
          </button>

          <button
            className="substack-action-btn"
            onClick={() => document.getElementById('substack-comments')?.scrollIntoView({ behavior: 'smooth' })}
            title="Comment"
          >
            <CommentIcon />
            <span>{comp.comments_count || 0}</span>
          </button>

          <button
            className={`substack-action-btn${restacked ? ' active' : ''}`}
            onClick={handleRestack}
            title="Restack"
            style={restacked ? { color: '#10b981', background: '#ecfdf5', borderColor: '#a7f3d0' } : {}}
          >
            <RestackIcon active={restacked} />
            <span>{comp.restacks_count || 0}</span>
          </button>

          <div className="substack-share-group">
            <button className="substack-action-btn" onClick={handleShare} title="Share">
              <ShareIcon />
            </button>
          </div>
        </div>

        {/* Stats line */}
        <div className="substack-stats">
          {comp.read_count || 0} reads · {comp.likes_count || 0} likes · {comp.restacks_count || 0} restacks
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
                placeholder="Join the discussion…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                className="substack-comment-submit"
                onClick={handleComment}
                disabled={commentLoading || !newComment.trim()}
              >
                {commentLoading ? 'Posting…' : 'Comment'}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="substack-empty-comments">No comments yet. Be the first to share your thoughts.</div>
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
