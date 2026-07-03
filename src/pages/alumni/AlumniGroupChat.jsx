import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, uploadFile, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniGroupChat() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadGroup = async () => {
    try {
      const data = await api.get(`/alumni/groups/${id}`, token);
      setGroup(data);
      setIsMember(data.is_member);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await api.get(`/alumni/groups/${id}/messages`, token);
      setMessages(data.messages || data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroup(); loadMessages(); }, [id, token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/alumni/groups/${id}/join`, {}, token);
      setIsMember(true);
      loadGroup();
    } catch (e) {
      alert(e.message);
    } finally {
      setJoining(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const msg = await api.post(`/alumni/groups/${id}/messages`, {
        content: newMessage,
        message_type: 'text',
      }, token);
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
      const uploadData = await uploadFile('/alumni/upload', formData, token);
      const msg = await api.post(`/alumni/groups/${id}/messages`, {
        content: '',
        image_path: uploadData.url || uploadData.path,
        message_type: 'image',
      }, token);
      setMessages([...messages, msg]);
    } catch (e) {
      alert(e.message || 'Image upload failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#e5ddd5', borderRadius: 16, overflow: 'hidden' }}>
        {/* WhatsApp-style Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: '#075e54', color: '#fff', borderRadius: '16px 16px 0 0',
        }}>
          <button onClick={() => navigate('/alumni/groups')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {group?.name?.[0] || 'G'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{group?.name || 'Group'}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{group?.member_count || 0} members</div>
          </div>
          {!isMember && (
            <button onClick={handleJoin} disabled={joining} style={{ padding: '6px 16px', borderRadius: 16, border: 'none', background: '#25d366', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              {joining ? '...' : 'Join'}
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = (msg.user_id || msg.sender_id) === user?.id;
              return (
                <div key={msg.id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: isMe ? '#dcf8c6' : '#fff',
                  borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  padding: '8px 12px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                }}>
                  {!isMe && <div style={{ fontSize: 12, fontWeight: 600, color: '#128c7e', marginBottom: 2 }}>{msg.author_name || msg.sender_name || 'User'}</div>}
                  {msg.image_path && (
                    <img src={msg.image_path.startsWith('http') ? msg.image_path : `${UPLOADS_BASE}${msg.image_path}`}
                      alt="shared" style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }} />
                  )}
                  {msg.content && <div style={{ fontSize: 14, lineHeight: 1.4 }}>{msg.content}</div>}
                  <div style={{ fontSize: 10, color: '#999', textAlign: 'right', marginTop: 2 }}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {isMe && ' ✓'}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {isMember ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: '#f0f0f0', borderTop: '1px solid #ddd',
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
        ) : (
          <div style={{ padding: 16, textAlign: 'center', background: '#fff', borderTop: '1px solid #ddd' }}>
            <p>You need to join this group to send messages.</p>
            <button className="btn btn-primary" onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
