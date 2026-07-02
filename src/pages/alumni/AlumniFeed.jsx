import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';
import VerifiedBadge from '../../components/VerifiedBadge';
import DailyCompositionChallenge from '../../components/DailyCompositionChallenge';
import './AlumniFeed.css';

const REACTIONS = ['👍', '❤️', '😂', '😮', '🔥', '🎉'];

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
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const STORIES = [
  { key: 'add', label: 'Add Story', icon: '➕', action: 'add' },
  { key: 'yours', label: 'Your Story', icon: '👤', action: 'profile' },
  { key: 'class2024', label: 'Class of 2024', icon: '🎓', action: 'filter' },
  { key: 'news', label: 'School News', icon: '🏫', action: 'news' },
  { key: 'writers', label: 'Top Writers', icon: '🏆', action: 'writers' },
  { key: 'events', label: 'Events', icon: '📅', action: 'events' },
];

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
  const [showComposer, setShowComposer] = useState(false);
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
      setShowComposer(false);
      loadPosts();
    } catch (e) { alert(e.message); }
    finally { setSendingPost(false); }
  };

  const handleStoryClick = (action) => {
    if (action === 'profile') navigate(`/alumni/profile/${user?.id || 'me'}`);
    else if (action === 'writers') navigate('/alumni/colleagues');
    else if (action === 'events') navigate('/alumni/opportunities');
    else if (action === 'news') navigate('/alumni/primary-things');
    else if (action === 'add') setShowComposer(true);
  };

  const renderStoryCircles = () => (
    <div className="af-stories">
      {STORIES.map((s) => (
        <button key={s.key} className="af-story" onClick={() => handleStoryClick(s.action)}>
          <div className={`af-story-ring ${s.key === 'add' ? 'af-story-add' : ''}`}>
            <div className="af-story-avatar">{s.icon}</div>
          </div>
          <span className="af-story-label">{s.label}</span>
        </button>
      ))}
    </div>
  );

  const renderPostImages = (post) => {
    const paths = post.image_paths ? (Array.isArray(post.image_paths) ? post.image_paths : [post.image_paths]) : [];
    if (paths.length === 0) return null;
    return (
      <div className={`af-post-images af-post-images-${Math.min(paths.length, 3)}`}>
        {paths.slice(0, 3).map((img, i) => (
          <img
            key={i}
            src={img.startsWith('http') ? img : `${UPLOADS_BASE}${img}`}
            alt=""
            className="af-post-img"
            onClick={() => navigate(`/alumni/post/${post.id}`)}
          />
        ))}
      </div>
    );
  };

  const renderPost = (post) => (
    <article key={`post-${post.id}`} className="af-card">
      <div className="af-card-header">
        <div
          className="af-avatar"
          style={{ background: avatarColor(post.user_id) }}
          onClick={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)}
        >
          {(post.author_name || 'U')[0]}
        </div>
        <div className="af-card-meta">
          <div className="af-name-row">
            <span className="af-name" onClick={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)}>
              {post.author_name}
            </span>
            <VerifiedBadge size={14} userId={post.author_id || post.user_id} onViewProfile={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)} />
          </div>
          <div className="af-sub-meta">
            <span>{post.graduation_year ? `Class of ${post.graduation_year}` : 'UClass Alumni'}</span>
            <span className="af-dot">·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="af-card-body" onClick={() => navigate(`/alumni/post/${post.id}`)}>
        <h3 className="af-card-title">{getTitle(post.content)}</h3>
        {getPreview(post.content) && <p className="af-card-text">{getPreview(post.content)}</p>}
      </div>

      {renderPostImages(post)}

      <div className="af-card-stats">
        <span>{post.likes_count || 0} likes</span>
        <span>{post.comments_count || 0} comments</span>
      </div>

      <div className="af-card-actions">
        <button className={`af-action ${post.liked_by_me ? 'af-action-active' : ''}`} onClick={() => toggleLike(post)}>
          <span>{post.liked_by_me ? '❤️' : '👍'}</span>
          <span>Like</span>
        </button>
        <button className="af-action" onClick={() => { setCommentOpen(commentOpen === post.id ? null : post.id); if (commentOpen !== post.id) loadComments(post.id); }}>
          <span>💬</span>
          <span>Comment</span>
        </button>
        <div className="af-action-wrap">
          <button className="af-action" onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}>
            <span>😊</span>
            <span>Celebrate</span>
          </button>
          {showReactions === post.id && (
            <div className="af-reaction-picker">
              {REACTIONS.map((emoji) => (
                <button key={emoji} onClick={() => addReaction(post.id, emoji)} className="af-reaction-btn">{emoji}</button>
              ))}
            </div>
          )}
        </div>
        <button className="af-action" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/alumni/post/${post.id}`); alert('Link copied!'); }}>
          <span>↗️</span>
          <span>Share</span>
        </button>
      </div>

      {commentOpen === post.id && (
        <div className="af-comments">
          <div className="af-comment-input-row">
            <div className="af-avatar af-avatar-sm" style={{ background: avatarColor(user?.id) }}>{(user?.name || 'U')[0]}</div>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
              className="af-comment-input"
            />
            <button onClick={() => submitComment(post.id)} className="af-comment-btn">Post</button>
          </div>
          <div className="af-comment-list">
            {(commentsMap[post.id] || []).map((c) => (
              <div key={c.id} className="af-comment">
                <div className="af-avatar af-avatar-sm" style={{ background: avatarColor(c.user_id) }}>{(c.author_name || 'U')[0]}</div>
                <div className="af-comment-content">
                  <div className="af-comment-meta">
                    <strong>{c.author_name}</strong>
                    <span>{timeAgo(c.created_at)}</span>
                  </div>
                  <p>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );

  const renderComposition = (comp) => {
    const featuredImg = comp.featured_image_path
      ? (comp.featured_image_path.startsWith('http') ? comp.featured_image_path : `${UPLOADS_BASE}${comp.featured_image_path}`)
      : null;
    return (
      <article key={`comp-${comp.id}`} className="af-card">
        <div className="af-card-header">
          <div
            className="af-avatar"
            style={{ background: avatarColor(comp.user_id || comp.author_id) }}
            onClick={() => navigate(`/alumni/profile/${comp.user_id || comp.author_id}`)}
          >
            {(comp.author_name || comp.name || 'U')[0]}
          </div>
          <div className="af-card-meta">
            <div className="af-name-row">
              <span className="af-name" onClick={() => navigate(`/alumni/profile/${comp.user_id || comp.author_id}`)}>
                {comp.author_name || comp.name || 'Alumni'}
              </span>
              <VerifiedBadge size={14} userId={comp.user_id || comp.author_id} onViewProfile={() => navigate(`/alumni/profile/${comp.user_id || comp.author_id}`)} />
              <span className="af-article-badge">✍️ Article</span>
            </div>
            <div className="af-sub-meta">
              <span>{comp.category || 'UClass Alumni'}</span>
              <span className="af-dot">·</span>
              <span>{timeAgo(comp.created_at)}</span>
              <span className="af-dot">·</span>
              <span>{comp.estimated_read_minutes || 1} min read</span>
            </div>
          </div>
        </div>

        <div className="af-link-card" onClick={() => navigate(`/alumni/composition/${comp.slug || comp.id}`)}>
          {featuredImg && <img src={featuredImg} alt={comp.title} className="af-link-img" />}
          <div className="af-link-body">
            <h3 className="af-link-title">{comp.title}</h3>
            <p className="af-link-desc">{comp.category ? `${comp.category} · ` : ''}{comp.read_count || 0} reads</p>
          </div>
        </div>

        <div className="af-card-stats">
          <span>{comp.likes_count || 0} likes</span>
          <span>{comp.comments_count || 0} comments</span>
        </div>

        <div className="af-card-actions">
          <button className={`af-action ${comp.liked_by_me ? 'af-action-active' : ''}`} onClick={() => toggleLike(comp)}>
            <span>{comp.liked_by_me ? '❤️' : '👍'}</span>
            <span>Like</span>
          </button>
          <button className="af-action" onClick={() => { setCommentOpen(commentOpen === comp.id ? null : comp.id); if (commentOpen !== comp.id) loadComments(comp.id); }}>
            <span>💬</span>
            <span>Comment</span>
          </button>
          <button className="af-action" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/alumni/composition/${comp.slug || comp.id}`); alert('Link copied!'); }}>
            <span>↗️</span>
            <span>Share</span>
          </button>
        </div>

        {commentOpen === comp.id && (
          <div className="af-comments">
            <div className="af-comment-input-row">
              <div className="af-avatar af-avatar-sm" style={{ background: avatarColor(user?.id) }}>{(user?.name || 'U')[0]}</div>
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment(comp.id)}
                className="af-comment-input"
              />
              <button onClick={() => submitComment(comp.id)} className="af-comment-btn">Post</button>
            </div>
            <div className="af-comment-list">
              {(commentsMap[comp.id] || []).map((c) => (
                <div key={c.id} className="af-comment">
                  <div className="af-avatar af-avatar-sm" style={{ background: avatarColor(c.user_id) }}>{(c.author_name || 'U')[0]}</div>
                  <div className="af-comment-content">
                    <div className="af-comment-meta">
                      <strong>{c.author_name}</strong>
                      <span>{timeAgo(c.created_at)}</span>
                    </div>
                    <p>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <AlumniLayout>
      <div className="af-feed">
        {renderStoryCircles()}

        <DailyCompositionChallenge token={token} />

        {loading ? (
          <div className="af-empty">
            <div style={{ fontSize: 36 }}>⏳</div>
            <p>Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="af-empty">
            <div style={{ fontSize: 48 }}>📰</div>
            <h3>No posts yet</h3>
            <p>Be the first to share something with the alumni community!</p>
            <button onClick={() => setShowComposer(true)} className="af-cta-btn">Share an update</button>
          </div>
        ) : (
          <div className="af-posts">
            {posts.map((item) => item.itemType === 'composition' ? renderComposition(item) : renderPost(item))}
          </div>
        )}

        {suggested.length > 0 && (
          <div className="af-suggested">
            <h3>✨ Suggested Alumni</h3>
            <div className="af-suggested-grid">
              {suggested.map((s) => (
                <div key={s.id} className="af-suggested-card">
                  <div className="af-avatar af-avatar-md" style={{ background: avatarColor(s.id) }} onClick={() => navigate(`/alumni/profile/${s.id}`)}>
                    {(s.name || 'U')[0]}
                  </div>
                  <div className="af-suggested-info">
                    <div className="af-suggested-name-row">
                      <span onClick={() => navigate(`/alumni/profile/${s.id}`)}>{s.name}</span>
                      <VerifiedBadge size={14} userId={s.id} onViewProfile={() => navigate(`/alumni/profile/${s.id}`)} />
                    </div>
                    <div className="af-suggested-meta">{s.school_name || 'UClass'} · {s.total_compositions || 0} articles</div>
                    <button
                      onClick={() => handleSubscribe(s.id)}
                      className={s.is_following ? 'af-suggested-subscribed' : 'af-suggested-subscribe'}
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

      <button className="af-fab" onClick={() => setShowComposer(true)} aria-label="New post">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      </button>

      {showComposer && (
        <div className="af-composer-overlay" onClick={() => setShowComposer(false)}>
          <div className="af-composer" onClick={(e) => e.stopPropagation()}>
            <h3>✍️ Share an update</h3>
            <div className="af-composer-row">
              <div className="af-avatar" style={{ background: avatarColor(user?.id) }}>{(user?.name || 'U')[0]}</div>
              <textarea
                placeholder="What's on your mind?"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                className="af-composer-textarea"
              />
            </div>
            {selectedImage && (
              <div className="af-preview-wrap">
                <img src={URL.createObjectURL(selectedImage)} alt="" className="af-preview-img" />
                <button onClick={() => setSelectedImage(null)} className="af-preview-remove">✕</button>
              </div>
            )}
            <div className="af-composer-actions">
              <button onClick={() => fileInputRef.current?.click()} className="af-composer-icon">🖼️ Photo</button>
              <button onClick={() => { setShowComposer(false); navigate('/alumni/compose'); }} className="af-composer-icon">📄 Article</button>
              <button onClick={handlePost} disabled={sendingPost || (!composeText.trim() && !selectedImage)} className="af-composer-post">
                {sendingPost ? 'Posting...' : 'Post'}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setSelectedImage(e.target.files[0])} />
          </div>
        </div>
      )}
    </AlumniLayout>
  );
}
