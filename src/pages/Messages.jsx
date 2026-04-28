import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import './Messages.css';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23667eea'/%3E%3Ctext y='.9em' font-size='50' x='25' fill='white'%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E";

export default function Messages() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [inbox, setInbox] = useState([]);
  const bottomRef = useRef();

  useEffect(() => {
    api.get('/profile/contacts/list', token).then(setContacts).catch(() => {});
    api.get('/messages/inbox', token).then(setInbox).catch(() => {});
    // Open specific contact from query param
    const uid = searchParams.get('to');
    if (uid) setActiveId(parseInt(uid));
  }, [token]);

  useEffect(() => {
    if (!activeId) return;
    api.get(`/messages/thread/${activeId}`, token).then(msgs => {
      setThread(msgs);
      setInbox(prev => prev.filter(m => m.sender_id !== activeId));
    }).catch(() => {});
  }, [activeId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    setSending(true);
    try {
      const msg = await api.post('/messages', { receiver_id: activeId, content: text.trim() }, token);
      setThread(t => [...t, { ...msg, sender_name: user?.name }]);
      setText('');
    } catch {/* ignore */}
    setSending(false);
  };

  const activeContact = contacts.find(c => c.id === activeId);
  const unreadMap = Object.fromEntries(inbox.map(m => [m.sender_id, true]));

  return (
    <div className="msg-page">
      <div className="msg-sidebar">
        <div className="msg-sidebar-header">
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>←</button>
          <span>💬 Messages</span>
        </div>
        {contacts.length === 0 && <div className="msg-empty">No contacts yet. Join a class first.</div>}
        {contacts.map(c => (
          <div
            key={c.id}
            className={`msg-contact ${activeId === c.id ? 'active' : ''}`}
            onClick={() => setActiveId(c.id)}
          >
            <div className="msg-contact-avatar-wrap">
              <img src={c.avatar_path ? `${UPLOADS_BASE}${c.avatar_path}` : DEFAULT_AVATAR} alt="" className="msg-contact-avatar" />
              {unreadMap[c.id] && <span className="msg-unread-dot" />}
            </div>
            <div className="msg-contact-info">
              <span className="msg-contact-name">{c.name}</span>
              <span className="msg-contact-role">{c.role}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="msg-chat">
        {!activeId ? (
          <div className="msg-no-chat">
            <div className="msg-no-chat-icon">💬</div>
            <p>Select a contact to start chatting</p>
          </div>
        ) : (
          <>
            <div className="msg-chat-header">
              <img
                src={activeContact?.avatar_path ? `${UPLOADS_BASE}${activeContact.avatar_path}` : DEFAULT_AVATAR}
                alt=""
                className="msg-chat-avatar"
              />
              <div>
                <div className="msg-chat-name">{activeContact?.name}</div>
                <div className="msg-chat-role">{activeContact?.role}</div>
              </div>
            </div>

            <div className="msg-thread">
              {thread.length === 0 && <div className="msg-empty" style={{ textAlign: 'center', marginTop: 40 }}>Start the conversation!</div>}
              {thread.map(m => (
                <div key={m.id} className={`msg-bubble-wrap ${m.sender_id === user?.id ? 'mine' : 'theirs'}`}>
                  <div className="msg-bubble">
                    <p>{m.content}</p>
                    <span className="msg-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form className="msg-input-row" onSubmit={send}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                autoFocus
              />
              <button type="submit" className="msg-send-btn" disabled={sending || !text.trim()}>
                ➤
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
