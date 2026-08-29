import { useState, useCallback, useEffect } from 'react';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';

/**
 * Discussion tab — shared between StudentClassPage and TeacherClassPage.
 * Features:
 * - Input at TOP (not bottom)
 * - Like / unlike messages
 * - Reply (comments) to messages
 * - Real-time refresh
 */
export default function DiscussionPanel({ classId, token, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isStaff = user && ['teacher', 'head_teacher', 'admin'].includes(user.role);
  // Reply state: { [msgId]: { open, text, comments, loading } }
  const [replies, setReplies] = useState({});
  // Like state tracked inline from message data

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/classes/${classId}/discussions`, token);
      setMessages(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [classId, token]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post(`/classes/${classId}/discussions`, { content: text.trim() }, token);
      setText('');
      load();
    } catch (e) { setError(e.message); }
  };

  const toggleLike = async (msgId) => {
    try {
      await api.post(`/classes/discussions/${msgId}/like`, {}, token);
      load();
    } catch (e) { /* silent */ }
  };

  const toggleReply = async (msgId) => {
    const isOpen = replies[msgId]?.open;
    if (!isOpen) {
      // Load comments
      try {
        const comments = await api.get(`/classes/discussions/${msgId}/comments`, token);
        setReplies(prev => ({
          ...prev,
          [msgId]: { open: true, text: '', comments: Array.isArray(comments) ? comments : [], loading: false }
        }));
      } catch (e) {
        setReplies(prev => ({
          ...prev,
          [msgId]: { open: true, text: '', comments: [], loading: false }
        }));
      }
    } else {
      setReplies(prev => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
    }
  };

  const sendReply = async (msgId) => {
    const reply = replies[msgId];
    if (!reply?.text?.trim()) return;
    try {
      await api.post(`/classes/discussions/${msgId}/comments`, { content: reply.text.trim() }, token);
      // Reload comments
      const comments = await api.get(`/classes/discussions/${msgId}/comments`, token);
      setReplies(prev => ({
        ...prev,
        [msgId]: { open: true, text: '', comments: Array.isArray(comments) ? comments : [], loading: false }
      }));
    } catch (e) { /* silent */ }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/classes/discussions/${msgId}`, token);
      load();
    } catch (e) { setError(e.message); }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete ALL discussions in this class? This cannot be undone.')) return;
    try {
      await api.delete(`/classes/${classId}/discussions`, token);
      setReplies({});
      load();
    } catch (e) { setError(e.message); }
  };

  if (loading) return <p style={{ padding: 16, color: '#94a3b8' }}>Loading discussions…</p>;

  return (
    <div className="discussion-tab">
      {/* Input at TOP */}
      <form onSubmit={send} className="discussion-input discussion-input-top" style={{
        marginBottom: 16,
        padding: 12,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}>
        <input
          placeholder="Write a message to the class…"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8,
            border: '2px solid #e2e8f0', fontSize: 14,
            outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = '#667eea'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
          Send
        </button>
        {isStaff && messages.length > 0 && (
          <button type="button" onClick={clearAll} style={{
            padding: '10px 14px', whiteSpace: 'nowrap', cursor: 'pointer',
            border: '2px solid #fecaca', borderRadius: 8, background: '#fff',
            color: '#dc2626', fontWeight: 600, fontSize: 13,
          }} title="Delete all discussions">
            🗑 Clear
          </button>
        )}
      </form>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Messages */}
      <div className="discussion-list">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
            💬 No messages yet. Start the conversation!
          </div>
        )}
        {messages.map(d => {
          const isTeacher = d.author_role === 'teacher' || d.author_role === 'head_teacher';
          const liked = d.liked_by_me;
          const likeCount = parseInt(d.like_count) || 0;
          const replyState = replies[d.id];
          const commentCount = replyState?.comments?.length || 0;

          return (
            <div key={d.id} className={`discussion-msg ${isTeacher ? 'teacher-msg' : ''}`} style={{
              background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              borderLeft: isTeacher ? '3px solid #667eea' : '3px solid #e2e8f0',
            }}>
              <div className="author" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: isTeacher ? '#5A3FFF' : '#1e293b' }}>
                  {d.author_name}
                </span>
                {isTeacher && <VerifiedBadge size={13} info={{ items: [
                  { icon: '👤', label: 'Role', value: d.author_role },
                ] }} />}
                <span className="role-badge" style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 10,
                  background: isTeacher ? '#eef2ff' : '#f1f5f9',
                  color: isTeacher ? '#5A3FFF' : '#64748b', fontWeight: 600,
                }}>{d.author_role}</span>
              </div>

              <div className="body" style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>
                {d.content}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>{new Date(d.created_at).toLocaleString()}</span>

                {/* Like button */}
                <button
                  onClick={() => toggleLike(d.id)}
                  style={{
                    border: 'none', background: liked ? '#fee2e2' : 'transparent',
                    color: liked ? '#ef4444' : '#64748b', cursor: 'pointer',
                    fontSize: 13, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s',
                  }}
                  title={liked ? 'Unlike' : 'Like'}
                >
                  {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''}
                </button>

                {/* Reply button */}
                <button
                  onClick={() => toggleReply(d.id)}
                  style={{
                    border: 'none', background: replyState?.open ? '#eef2ff' : 'transparent',
                    color: replyState?.open ? '#5A3FFF' : '#64748b', cursor: 'pointer',
                    fontSize: 13, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s',
                  }}
                  title="Reply"
                >
                  💬 Reply {commentCount > 0 ? `(${commentCount})` : ''}
                </button>

                {/* Delete button (owner or staff) */}
                {(isStaff || d.user_id === user?.id) && (
                  <button
                    onClick={() => deleteMessage(d.id)}
                    style={{
                      border: 'none', background: 'transparent',
                      color: '#cbd5e1', cursor: 'pointer',
                      fontSize: 13, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                      marginLeft: 'auto', transition: 'all 0.15s',
                    }}
                    title="Delete message"
                    onMouseEnter={e => { e.target.style.color = '#dc2626'; }}
                    onMouseLeave={e => { e.target.style.color = '#cbd5e1'; }}
                  >
                    🗑
                  </button>
                )}
              </div>

              {/* Reply section */}
              {replyState?.open && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  {/* Existing comments */}
                  {replyState.comments.map(c => (
                    <div key={c.id} style={{
                      padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                      background: '#f8fafc', fontSize: 13,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#5A3FFF' }}>
                          {c.author_name}
                        </span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{c.author_role}</span>
                      </div>
                      <div style={{ color: '#374151', lineHeight: 1.4 }}>{c.content}</div>
                      <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {replyState.comments.length === 0 && (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>No replies yet.</p>
                  )}

                  {/* Reply input */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <input
                      placeholder="Write a reply…"
                      value={replyState.text}
                      onChange={e => setReplies(prev => ({
                        ...prev,
                        [d.id]: { ...prev[d.id], text: e.target.value }
                      }))}
                      onKeyDown={e => { if (e.key === 'Enter') sendReply(d.id); }}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        border: '2px solid #e2e8f0', fontSize: 13, outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = '#667eea'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <button
                      onClick={() => sendReply(d.id)}
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap' }}
                      disabled={!replyState.text?.trim()}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
