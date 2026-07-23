import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import VerifiedBadge from '../../components/VerifiedBadge';
import AIRevisionBadge from '../../components/AIRevisionBadge';
import { Helmet } from 'react-helmet';

function avatarColor(id) {
  return `hsl(${(id || 1) * 137 % 360}, 65%, 48%)`;
}

function formatContent(html) {
  if (!html) return '';
  // If content already has HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(html)) return html;
  // Convert plain text with newlines to paragraphs
  // Split on double newlines for paragraphs, single newlines become <br/>
  const paragraphs = html.split(/\n\n+/).filter(p => p.trim());
  return paragraphs.map(p => `<p style="margin:0 0 16px;">${p.replace(/\n/g, '<br/>')}</p>`).join('');
}

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

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get(`/alumni/compositions/${slug}`, token);
        setComp(data);
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
      setReadProgress(Math.min(100, Math.round((scrolled / docHeight) * 100)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleReaction = async (type) => {
    if (!comp) return;
    try {
      if (comp.user_reaction === type) {
        await api.delete(`/alumni/compositions/${comp.id}/react`, token);
        setComp({ ...comp, user_reaction: null, likes_count: comp.likes_count - 1 });
      } else {
        await api.post(`/alumni/compositions/${comp.id}/react`, { reaction_type: type }, token);
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
        await api.delete(`/alumni/compositions/${comp.id}/bookmark`, token);
        setComp({ ...comp, is_bookmarked: false, bookmarks_count: comp.bookmarks_count - 1 });
      } else {
        await api.post(`/alumni/compositions/${comp.id}/bookmark`, {}, token);
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
      const c = await api.post(`/alumni/compositions/${comp.id}/comments`, { content: newComment.trim() }, token);
      setComments([...comments, c]);
      setNewComment('');
      setComp({ ...comp, comments_count: comp.comments_count + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', fontSize: 16, color: '#64748b' }}>Loading article...</div>;
  if (!comp) return <div style={{ padding: 60, textAlign: 'center', fontSize: 16, color: '#64748b' }}>Article not found.</div>;

  const authorId = comp.user_id || comp.author_id || 1;
  const featuredImg = comp.featured_image_path
    ? (comp.featured_image_path.startsWith('http') ? comp.featured_image_path : `${UPLOADS_BASE}${comp.featured_image_path}`)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {comp && (
        <Helmet>
          <title>{comp.title} - UClass Alumni</title>
          <meta name="description" content={comp.excerpt || comp.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || comp.content?.substring(0, 200)?.replace(/\n/g, ' ') || ''} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={comp.title} />
          <meta property="og:description" content={comp.excerpt || comp.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || comp.content?.substring(0, 200)?.replace(/\n/g, ' ') || ''} />
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
          <meta name="twitter:description" content={comp.excerpt || comp.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || comp.content?.substring(0, 200)?.replace(/\n/g, ' ') || ''} />
          <meta name="twitter:image" content={featuredImg || 'https://student.umunsi.com/og-image.svg'} />
          <meta name="twitter:image:alt" content={comp.title} />
          <meta itemprop="name" content={comp.title} />
          <meta itemprop="description" content={comp.excerpt || comp.content?.split('\n\n')?.[0]?.substring(0, 200)?.replace(/\n/g, ' ') || comp.content?.substring(0, 200)?.replace(/\n/g, ' ') || ''} />
          <meta itemprop="image" content={featuredImg || 'https://student.umunsi.com/og-image.svg'} />
        </Helmet>
      )}
      {/* Reading Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#f1f5f9', zIndex: 200 }}>
        <div style={{ width: `${readProgress}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', transition: 'width 0.2s' }} />
      </div>

      {/* Back Button & PDF Button */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/alumni/feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Feed
        </button>
        <button onClick={() => window.print()} style={{ background: 'none', border: '1.5px solid #e2e8f0', cursor: 'pointer', fontSize: 14, color: '#64748b', fontWeight: 600, padding: '8px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          📄 Open as PDF
        </button>
      </div>

      {/* Article Header - Substack style */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 0' }}>
        {/* Category */}
        {comp.category && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {comp.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, color: '#0f172a', margin: '0 0 16px', letterSpacing: -0.8, fontFamily: 'Georgia, "Times New Roman", serif' }}>
          {comp.title}
        </h1>

        {/* Author Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: avatarColor(authorId), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
            {(comp.author_name || 'U')[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>{comp.author_name}</span>
              <VerifiedBadge size={16} userId={authorId} onViewProfile={null} />
              <AIRevisionBadge size={16} userId={authorId} />
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              {new Date(comp.published_at || comp.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              {comp.estimated_read_minutes && ` · ${comp.estimated_read_minutes} min read`}
              {comp.read_count > 0 && ` · ${comp.read_count} reads`}
            </div>
          </div>
          <button onClick={handleBookmark} style={{
            padding: '8px 16px', borderRadius: 20, border: comp.is_bookmarked ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
            background: comp.is_bookmarked ? '#ecfdf5' : '#fff', color: comp.is_bookmarked ? '#059669' : '#64748b',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {comp.is_bookmarked ? '🔖 Saved' : '🔖 Save'}
          </button>
        </div>
      </div>

      {/* Featured Image - Full width Substack style */}
      {featuredImg && (
        <div style={{ width: '100%', maxHeight: 480, overflow: 'hidden', marginBottom: 32 }}>
          <img src={featuredImg} alt={comp.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Article Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: featuredImg ? '0 16px 32px' : '0 16px 32px' }}>
        <div
          style={{
            lineHeight: 1.85, fontSize: 18, color: '#1e293b',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
          dangerouslySetInnerHTML={{ __html: formatContent(comp.content) }}
        />

        {/* Tags */}
        {(comp.tags || []).length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
            {(comp.tags || []).map((tag) => (
              <span key={tag} style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 12px', borderRadius: 16, fontSize: 13 }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reaction Bar */}
        <div style={{ display: 'flex', gap: 10, padding: '24px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', margin: '32px 0', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { type: 'like', emoji: '👍', label: 'Like' },
            { type: 'love', emoji: '❤️', label: 'Love' },
            { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
            { type: 'support', emoji: '🙌', label: 'Support' },
          ].map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              style={{
                padding: '8px 16px', borderRadius: 24, border: comp.user_reaction === type ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                background: comp.user_reaction === type ? '#fef3c7' : '#fff',
                color: comp.user_reaction === type ? '#92400e' : '#64748b',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {emoji} {label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(comp.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              style={{ padding: '8px 12px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              title="Share on X (Twitter)"
            >
              𝕏
            </button>
            <button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              style={{ padding: '8px 12px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              title="Share on Facebook"
            >
              📘
            </button>
            <button
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
              style={{ padding: '8px 12px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              title="Share on LinkedIn"
            >
              💼
            </button>
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(comp.title + ' ' + window.location.href)}`, '_blank')}
              style={{ padding: '8px 12px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              title="Share on WhatsApp"
            >
              📱
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied!'); }}
              style={{ padding: '8px 12px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              title="Copy link"
            >
              🔗
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
          {comp.likes_count || 0} likes · {comp.comments_count || 0} comments · {comp.read_count || 0} reads
        </div>

        {/* Comments Section */}
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 16, fontFamily: 'Georgia, serif' }}>
          Comments ({comp.comments_count || 0})
        </h3>

        {/* Comment Input */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, background: '#f8fafc', borderRadius: 14, padding: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(user?.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {(user?.name || 'U')[0]}
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', minHeight: 56, resize: 'vertical', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={handleComment}
                disabled={commentLoading || !newComment.trim()}
                style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: commentLoading || !newComment.trim() ? 0.5 : 1 }}
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 15 }}>
            No comments yet. Start the conversation!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(c.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {(c.author_name || 'U')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 14, padding: '12px 16px' }}>
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
        )}

        {/* Back to Feed */}
        <div style={{ textAlign: 'center', marginTop: 40, paddingBottom: 40 }}>
          <button onClick={() => navigate('/alumni/feed')} style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 24, padding: '10px 24px', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
            ← Back to Feed
          </button>
        </div>
      </div>
    </div>
  );
}
