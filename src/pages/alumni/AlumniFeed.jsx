import { useState, useEffect, useRef, useCallback } from 'react';
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

function AvatarWithStatus({ id, name, avatarUrl, size, online, onClick }) {
  const sz = size === 'sm' ? 'af-avatar-sm' : size === 'md' ? 'af-avatar-md' : '';
  const dotSz = size === 'sm' ? 'af-online-dot-sm' : '';
  const avatarSrc = avatarUrl
    ? (avatarUrl.startsWith('http') ? avatarUrl : `${UPLOADS_BASE}${avatarUrl}`)
    : null;
  return (
    <div className="af-avatar-wrap" onClick={onClick}>
      <div
        className={`af-avatar ${sz}`}
        style={avatarSrc ? { background: `url(${avatarSrc}) center/cover` } : { background: avatarColor(id) }}
      >
        {!avatarSrc && (name?.[0] || 'U')}
      </div>
      {online ? (
        <span className={`af-online-dot ${dotSz}`} />
      ) : online === false ? (
        <span className={`af-offline-dot ${dotSz}`} />
      ) : null}
    </div>
  );
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
  const [stories, setStories] = useState([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyBg, setStoryBg] = useState('#7c3aed');
  const [savingStory, setSavingStory] = useState(false);
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
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);
  const [likersModal, setLikersModal] = useState(null);
  const [viewersModal, setViewersModal] = useState(null);
  const [likersList, setLikersList] = useState([]);
  const [viewersList, setViewersList] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { loadPosts(); loadSuggested(); loadStories(); }, [token]);

  // Heartbeat — send every 2 minutes
  useEffect(() => {
    if (!token) return;
    const beat = () => api.post('/alumni/online/heartbeat', {}, token).catch(() => {});
    beat();
    const interval = setInterval(beat, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  // Load online users every 30 seconds
  const loadOnlineUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/alumni/online/status', token);
      setOnlineUsers(data.online || []);
      setOfflineUsers(data.offline || []);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    loadOnlineUsers();
    const interval = setInterval(loadOnlineUsers, 30 * 1000);
    return () => clearInterval(interval);
  }, [loadOnlineUsers]);

  const loadStories = async () => {
    try {
      const data = await api.get('/alumni/stories', token);
      setStories(data.stories || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateStory = async () => {
    if (!storyText.trim()) return;
    setSavingStory(true);
    try {
      await api.post('/alumni/stories', { content: storyText, background_color: storyBg }, token);
      setStoryText('');
      setShowStoryModal(false);
      loadStories();
    } catch (e) { alert(e.message); }
    finally { setSavingStory(false); }
  };

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

  const openLikers = async (postId) => {
    setLikersModal(postId);
    setLikersList([]);
    try {
      const data = await api.get(`/alumni/feed/${postId}/likers`, token);
      setLikersList(data.likers || []);
    } catch (e) { console.error(e); }
  };

  const openViewers = async (postId) => {
    setViewersModal(postId);
    setViewersList([]);
    try {
      const data = await api.get(`/alumni/feed/${postId}/viewers`, token);
      setViewersList(data.viewers || []);
    } catch (e) { console.error(e); }
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
    else if (action === 'add') setShowStoryModal(true);
  };

  const STORY_BGS = ['#7c3aed', '#dc2626', '#059669', '#d97706', '#2563eb', '#db2777', '#7c2d12', '#1e293b'];

  const renderStoryCircles = () => (
    <div className="af-stories">
      <button className="af-story" onClick={() => setShowStoryModal(true)}>
        <div className="af-story-ring af-story-add">
          <div className="af-story-avatar">➕</div>
        </div>
        <span className="af-story-label">Add Story</span>
      </button>
      <button className="af-story" onClick={() => navigate(`/alumni/profile/${user?.id || 'me'}`)}>
        <div className="af-story-ring">
          <div className="af-story-avatar">👤</div>
        </div>
        <span className="af-story-label">Your Story</span>
      </button>
      <button className="af-story" onClick={() => navigate('/alumni/colleagues')}>
        <div className="af-story-ring">
          <div className="af-story-avatar">🎓</div>
        </div>
        <span className="af-story-label">Class of 2024</span>
      </button>
      <button className="af-story" onClick={() => navigate('/alumni/primary-things')}>
        <div className="af-story-ring">
          <div className="af-story-avatar">🏫</div>
        </div>
        <span className="af-story-label">School News</span>
      </button>
      {stories.map((s) => (
        <button key={s.id} className="af-story" onClick={() => navigate(`/alumni/profile/${s.user_id}`)}>
          <div className="af-story-ring" style={{ background: s.background_color || '#7c3aed' }}>
            <div className="af-story-avatar">{(s.author_name || 'U')[0]}</div>
          </div>
          <span className="af-story-label">{s.author_name?.split(' ')[0] || 'Alumni'}</span>
        </button>
      ))}
      <button className="af-story" onClick={() => navigate('/alumni/colleagues')}>
        <div className="af-story-ring">
          <div className="af-story-avatar">🏆</div>
        </div>
        <span className="af-story-label">Top Writers</span>
      </button>
      <button className="af-story" onClick={() => navigate('/alumni/opportunities')}>
        <div className="af-story-ring">
          <div className="af-story-avatar">📅</div>
        </div>
        <span className="af-story-label">Events</span>
      </button>
    </div>
  );

  const renderPostImages = (post) => {
    const paths = post.image_paths ? (Array.isArray(post.image_paths) ? post.image_paths : [post.image_paths]) : [];
    if (paths.length === 0) return null;
    const visibleCount = Math.min(paths.length, 4);
    return (
      <div className={`af-post-images af-post-images-${visibleCount}`}>
        {paths.slice(0, 4).map((img, i) => (
          <div key={i} className={`af-post-img-wrap ${i === 3 && paths.length > 4 ? 'af-post-img-more' : ''}`}>
            <img
              src={img.startsWith('http') ? img : `${UPLOADS_BASE}${img}`}
              alt=""
              className="af-post-img"
              onClick={() => navigate(`/alumni/post/${post.id}`)}
            />
            {i === 3 && paths.length > 4 && (
              <div className="af-post-img-overlay">+{paths.length - 4}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPost = (post) => (
    <article key={`post-${post.id}`} className="af-card">
      <div className="af-card-header">
        <AvatarWithStatus
          id={post.author_id || post.user_id}
          name={post.author_name}
          avatarUrl={post.author_avatar}
          online={post.author_online}
          onClick={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)}
        />
        <div className="af-card-meta">
          <div className="af-name-row">
            <span className="af-name" onClick={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)}>
              {post.author_name}
            </span>
            <VerifiedBadge size={14} userId={post.author_id || post.user_id} onViewProfile={() => navigate(`/alumni/profile/${post.author_id || post.user_id}`)} />
          </div>
          <div className="af-sub-meta">
            <span>{post.graduation_year ? `Class of ${post.graduation_year}` : 'Alumni'}</span>
            <span className="af-dot">·</span>
            <span>{post.school_name || ''}</span>
            {post.school_name && <span className="af-dot">·</span>}
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="af-card-body" onClick={() => navigate(`/alumni/post/${post.id}`)}>
        <h3 className="af-card-title">{getTitle(post.content)}</h3>
        {getPreview(post.content) && <p className="af-card-text">{getPreview(post.content)}</p>}
      </div>

      {renderPostImages(post)}

      <div className="af-stats-bar">
        <div className="af-stats-left" onClick={() => openLikers(post.id)}>
          <div className="af-likes-icons">
            <span className="af-likes-icon-circle af-likes-icon-like">👍</span>
            <span className="af-likes-icon-circle af-likes-icon-heart">❤️</span>
          </div>
          <span className="af-stats-text">{post.likes_count || 0}</span>
        </div>
        <div className="af-stats-right">
          <span onClick={() => { setCommentOpen(commentOpen === post.id ? null : post.id); if (commentOpen !== post.id) loadComments(post.id); }}>
            {post.comments_count || 0} comments
          </span>
          <span onClick={() => openViewers(post.id)}>
            👁️ {post.views_count || 0} views
          </span>
        </div>
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
            <AvatarWithStatus id={user?.id} name={user?.name} avatarUrl={user?.avatar_url} size="sm" />
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
                <AvatarWithStatus id={c.user_id || c.author_id} name={c.author_name} avatarUrl={c.avatar_url} size="sm" online={c.is_online} />
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
          <AvatarWithStatus
            id={comp.user_id || comp.author_id}
            name={comp.author_name || comp.name}
            avatarUrl={comp.author_avatar}
            online={comp.author_online}
            onClick={() => navigate(`/alumni/profile/${comp.user_id || comp.author_id}`)}
          />
          <div className="af-card-meta">
            <div className="af-name-row">
              <span className="af-name" onClick={() => navigate(`/alumni/profile/${comp.user_id || comp.author_id}`)}>
                {comp.author_name || comp.name || 'Alumni'}
              </span>
              <VerifiedBadge size={14} userId={comp.user_id || comp.author_id} onViewProfile={() => navigate(`/alumni/profile/${comp.user_id || comp.author_id}`)} />
              <span className="af-article-badge">✍️ Article</span>
            </div>
            <div className="af-sub-meta">
              <span>{comp.graduation_year ? `Class of ${comp.graduation_year}` : 'Alumni'}</span>
              <span className="af-dot">·</span>
              <span>{comp.school_name || comp.category || ''}</span>
              {comp.category && <span className="af-dot">·</span>}
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

        <div className="af-stats-bar">
          <div className="af-stats-left" onClick={() => openLikers(comp.id)}>
            <div className="af-likes-icons">
              <span className="af-likes-icon-circle af-likes-icon-like">👍</span>
              <span className="af-likes-icon-circle af-likes-icon-heart">❤️</span>
            </div>
            <span className="af-stats-text">{comp.likes_count || 0}</span>
          </div>
          <div className="af-stats-right">
            <span onClick={() => { setCommentOpen(commentOpen === comp.id ? null : comp.id); if (commentOpen !== comp.id) loadComments(comp.id); }}>
              {comp.comments_count || 0} comments
            </span>
            <span>📖 {comp.read_count || 0} reads</span>
          </div>
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
                  <AvatarWithStatus id={c.user_id || c.author_id} name={c.author_name} avatarUrl={c.avatar_url} size="sm" online={c.is_online} />
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

        {/* Share what will help others card */}
        <div className="af-share-help-card" onClick={() => setShowComposer(true)}>
          <div className="af-share-help-icon">💡</div>
          <div className="af-share-help-body">
            <strong>Share what will help others</strong>
            <p>Post an article, tip, or story that benefits your fellow alumni</p>
          </div>
          <span className="af-share-help-arrow">→</span>
        </div>

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
              {suggested.map((s) => {
                const isOnline = onlineUsers.some(u => u.user_id === s.id);
                return (
                <div key={s.id} className="af-suggested-card">
                  <AvatarWithStatus id={s.id} name={s.name} avatarUrl={s.avatar_url} size="md" online={isOnline} onClick={() => navigate(`/alumni/profile/${s.id}`)} />
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
                );
              })}
            </div>
          </div>
        )}

        {/* Online Now section */}
        <div className="af-online-section">
          <div className="af-online-header">
            <h3>🟢 Active Now</h3>
            {onlineUsers.length > 0 && <span className="af-online-badge">{onlineUsers.length} online</span>}
          </div>
          {onlineUsers.length > 0 ? (
            <div className="af-online-scroll">
              {onlineUsers.map((u) => (
                <div key={u.user_id} className="af-online-user" onClick={() => navigate(`/alumni/profile/${u.user_id}`)}>
                  <div className="af-online-user-avatar" style={u.avatar_url ? { background: `url(${u.avatar_url.startsWith('http') ? u.avatar_url : UPLOADS_BASE + u.avatar_url}) center/cover` } : { background: avatarColor(u.user_id) }}>
                    {!u.avatar_url && (u.name?.[0] || 'U')}
                  </div>
                  <span className="af-online-user-name">{u.name?.split(' ')[0] || 'User'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="af-online-empty">No alumni online right now. Check back later! 🌙</div>
          )}
        </div>
      </div>

      {/* Likers Modal */}
      {likersModal && (
        <div className="af-likers-overlay" onClick={() => setLikersModal(null)}>
          <div className="af-likers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-likers-header">
              <h3>👍 Liked by</h3>
              <button className="af-likers-close" onClick={() => setLikersModal(null)}>✕</button>
            </div>
            <div className="af-likers-list">
              {likersList.length === 0 ? (
                <div className="af-online-empty">No likes yet. Be the first to like this! 💜</div>
              ) : likersList.map((l) => (
                <div key={l.user_id} className="af-liker-row" onClick={() => { setLikersModal(null); navigate(`/alumni/profile/${l.user_id}`); }}>
                  <AvatarWithStatus id={l.user_id} name={l.name} avatarUrl={l.avatar_url} size="sm" online={l.is_online} />
                  <div className="af-liker-info">
                    <div className="af-liker-name">{l.name}</div>
                    <div className="af-liker-meta">{l.graduation_year ? `Class of ${l.graduation_year}` : ''} {l.school_name ? `· ${l.school_name}` : ''}</div>
                  </div>
                  <span className={`af-liker-status ${l.is_online ? 'af-liker-online' : 'af-liker-offline'}`}>
                    {l.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      {viewersModal && (
        <div className="af-likers-overlay" onClick={() => setViewersModal(null)}>
          <div className="af-likers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="af-likers-header">
              <h3>👁️ Viewed by</h3>
              <button className="af-likers-close" onClick={() => setViewersModal(null)}>✕</button>
            </div>
            <div className="af-likers-list">
              {viewersList.length === 0 ? (
                <div className="af-online-empty">No views yet.</div>
              ) : viewersList.map((v) => (
                <div key={v.user_id} className="af-liker-row" onClick={() => { setViewersModal(null); navigate(`/alumni/profile/${v.user_id}`); }}>
                  <AvatarWithStatus id={v.user_id} name={v.name} avatarUrl={v.avatar_url} size="sm" online={v.is_online} />
                  <div className="af-liker-info">
                    <div className="af-liker-name">{v.name}</div>
                    <div className="af-liker-meta">{v.graduation_year ? `Class of ${v.graduation_year}` : ''} · viewed {timeAgo(v.viewed_at)}</div>
                  </div>
                  <span className={`af-liker-status ${v.is_online ? 'af-liker-online' : 'af-liker-offline'}`}>
                    {v.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {showStoryModal && (
        <div className="af-composer-overlay" onClick={() => setShowStoryModal(false)}>
          <div className="af-story-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📸 Add Your Story</h3>
            <p className="af-story-modal-hint">Stories last 24 hours then disappear</p>
            <div className="af-story-preview" style={{ background: storyBg }}>
              <textarea
                className="af-story-textarea"
                placeholder="Share something..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="af-story-colors">
              {STORY_BGS.map(c => (
                <button
                  key={c}
                  className={`af-story-color ${storyBg === c ? 'af-story-color-active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setStoryBg(c)}
                />
              ))}
            </div>
            <div className="af-story-actions">
              <button className="af-composer-icon" onClick={() => setShowStoryModal(false)}>Cancel</button>
              <button
                className="af-composer-post"
                disabled={savingStory || !storyText.trim()}
                onClick={handleCreateStory}
              >
                {savingStory ? 'Posting...' : 'Share Story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlumniLayout>
  );
}
