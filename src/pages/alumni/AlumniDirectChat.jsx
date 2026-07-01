import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';
import VerifiedBadge from '../../components/VerifiedBadge';

export default function AlumniDirectChat() {
  const { userId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [colleague, setColleague] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get(`/alumni/profile/${userId}`, token).then((p) => {
      setColleague(p);
      setIsFollowing(!!p.is_following);
    }).catch(console.error);
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [userId, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await api.get(`/alumni/direct-messages/${userId}`, token);
      setMessages(data.messages || []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const msg = await api.post(`/alumni/direct-messages/${userId}`, { content: newMessage }, token);
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleImageSend = async (file) => {
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${UPLOADS_BASE}/api/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const msg = await api.post(`/alumni/direct-messages/${userId}`, {
        content: '',
        image_path: uploadData.url || uploadData.path,
      }, token);
      setMessages([...messages, msg]);
    } catch (e) {
      alert('Image upload failed.');
    } finally {
      setSending(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      await api.post(`/alumni/follow/${userId}`, {}, token);
      setIsFollowing(true);
      const p = await api.get(`/alumni/profile/${userId}`, token);
      setColleague(p);
    } catch (e) { alert(e.message); }
  };

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Subscribe gate */}
        {colleague && !isFollowing && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `hsl(${(Number(userId) * 137) % 360}, 60%, 50%)`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 16,
            }}>{colleague.name?.[0] || '?'}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {colleague.name}
              <VerifiedBadge size={18} userId={Number(userId)} />
            </h3>
            <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 20px' }}>Subscribe to {colleague.name} to start chatting and view their full profile.</p>
            <button onClick={handleSubscribe} style={{ padding: '12px 32px', borderRadius: 24, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 14px rgba(102,126,234,0.4)' }}>
              🔔 Subscribe to {colleague.name}
            </button>
          </div>
        )}

        {/* Chat — only when subscribed */}
        {colleague && isFollowing && (
        <>
        {/* WhatsApp-style Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: '#075e54', color: '#fff', borderRadius: '16px 16px 0 0',
        }}>
          <button onClick={() => navigate('/alumni/colleagues')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: `hsl(${(Number(userId) * 137) % 360}, 60%, 50%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700,
          }}>
            {colleague?.name?.[0] || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>{colleague?.name || 'Chat'}<VerifiedBadge size={14} userId={Number(userId)} /></div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{colleague?.current_occupation || 'UClass Alumni'}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          height: 'calc(100vh - 260px)',
          overflowY: 'auto',
          padding: 16,
          background: '#e5ddd5',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderRadius: '0 0 16px 16px',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p>Start a conversation with {colleague?.name || 'your colleague'}!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = (msg.sender_id || msg.from_user_id) === user?.id;
              return (
                <div key={msg.id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: isMe ? '#dcf8c6' : '#fff',
                  borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  padding: '8px 12px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                }}>
                  {msg.image_path && (
                    <img src={msg.image_path.startsWith('http') ? msg.image_path : `${UPLOADS_BASE}${msg.image_path}`}
                      alt="shared" style={{ maxWidth: '100%', borderRadius: 8 }} />
                  )}
                  {msg.content && <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.content}</div>}
                  <div style={{ fontSize: 10, color: '#999', textAlign: 'right', marginTop: 2 }}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {isMe && ' ✓✓'}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: '#f0f0f0', borderRadius: 16, marginTop: 8,
        }}>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleImageSend(e.target.files[0])} />
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>📎</button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: 'none', fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleSend} disabled={sending || !newMessage.trim()} style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: '#128c7e', color: '#fff', fontSize: 18, cursor: 'pointer',
            opacity: sending || !newMessage.trim() ? 0.5 : 1,
          }}>➤</button>
        </div>
        </>
        )}
      </div>
    </AlumniLayout>
  );
}
