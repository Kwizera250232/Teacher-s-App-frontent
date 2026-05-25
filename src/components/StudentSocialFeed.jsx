import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, uploadFile, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import Whiteboard from './Whiteboard';
import './StudentSocialFeed.css';

const PLACEHOLDER = 'Share your class work here. Feel free to express what you learnt.';

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${UPLOADS_BASE}${path}`;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString();
}

export default function StudentSocialFeed({ classes, token }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postClassId, setPostClassId] = useState('');
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState('text');
  const [file, setFile] = useState(null);
  const [showBoard, setShowBoard] = useState(false);
  const [posting, setPosting] = useState(false);
  const [recording, setRecording] = useState(false);
  const chunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (classes?.length && !postClassId) setPostClassId(String(classes[0].id));
  }, [classes]);

  const load = () => {
    setLoading(true);
    api.get('/classroom-feed/my/home', token)
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token]);

  const submitPost = async (extraFile = null) => {
    if (!postClassId) return setError('Join a class first.');
    if (postType === 'text' && !body.trim() && !extraFile && !file) {
      return setError('Write what you learnt or attach a photo, drawing, or voice note.');
    }
    setPosting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('post_type', postType);
      if (body.trim()) fd.append('body', body.trim());
      const upload = extraFile || file;
      if (upload) fd.append('file', upload);
      await uploadFile(`/classroom-feed/${postClassId}/posts`, fd, token);
      setBody('');
      setFile(null);
      setShowBoard(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setPostType('voice');
        stream.getTracks().forEach((t) => t.stop());
        await submitPost(voiceFile);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setPostType('voice');
    } catch {
      setError('Allow microphone access to record a voice note.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const toggleLike = async (post) => {
    try {
      await api.post(`/classroom-feed/${post.class_id}/posts/${post.id}/like`, {}, token);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <section className="student-social-feed">
      <div className="ssf-hero">
        <div className="ssf-hero-icon">✨</div>
        <div>
          <h2>Student Feed</h2>
          <p className="ssf-tagline">{PLACEHOLDER}</p>
        </div>
      </div>

      <div className="ssf-composer">
        {classes?.length > 1 && (
          <label className="ssf-class-pick">
            Class
            <select value={postClassId} onChange={(e) => setPostClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        )}
        <div className="ssf-type-row">
          {[
            { key: 'text', label: '💬 Text' },
            { key: 'image', label: '📷 Photo' },
            { key: 'drawing', label: '🎨 Draw' },
            { key: 'voice', label: '🎙️ Voice' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={postType === t.key ? 'active' : ''}
              onClick={() => setPostType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          placeholder={PLACEHOLDER}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <div className="ssf-actions">
          <label className="btn btn-secondary btn-sm">
            📎 File
            <input type="file" hidden accept="image/*,.pdf,.webm,.mp3" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBoard(!showBoard)}>🖊️ Board</button>
          {postType === 'voice' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={recording ? stopRecording : startRecording}>
              {recording ? '⏹ Stop' : '🎙️ Record'}
            </button>
          )}
          <button type="button" className="btn btn-primary btn-sm" disabled={posting} onClick={() => submitPost()}>
            {posting ? 'Posting...' : '🚀 Share'}
          </button>
        </div>
        {showBoard && (
          <Whiteboard
            onSave={(blob) => {
              const f = new File([blob], `draw-${Date.now()}.png`, { type: 'image/png' });
              setPostType('drawing');
              submitPost(f);
            }}
            onCancel={() => setShowBoard(false)}
          />
        )}
      </div>

      {error && <p className="ssf-error">{error}</p>}

      {loading ? (
        <p className="ssf-loading">Loading your feed...</p>
      ) : posts.length === 0 ? (
        <div className="ssf-empty">
          <span>🌱</span>
          <p>Be the first to share what you learnt today!</p>
        </div>
      ) : (
        <div className="ssf-feed">
          {posts.map((p) => (
            <article key={`${p.class_id}-${p.id}`} className="ssf-card">
              <header>
                <div className="ssf-avatar">{(p.author_name || '?')[0]}</div>
                <div>
                  <strong>{p.author_name}</strong>
                  <span>{p.class_name} · {timeAgo(p.created_at)}</span>
                </div>
              </header>
              {p.body && <p className="ssf-body">{p.body}</p>}
              {p.media_url && /\.(png|jpe?g|webp|gif)$/i.test(p.media_url) && (
                <img src={mediaUrl(p.media_url)} alt="" className="ssf-media" />
              )}
              {p.media_url && /\.(webm|mp3|wav|m4a)/i.test(p.media_url) && (
                <audio controls src={mediaUrl(p.media_url)} className="ssf-audio" />
              )}
              <footer>
                <button type="button" onClick={() => toggleLike(p)}>
                  {p.liked_by_me ? '❤️' : '🤍'} {p.like_count || 0}
                </button>
                <span>💬 {p.comment_count || 0}</span>
                <Link to={`/student/classes/${p.class_id}`}>Open class →</Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
