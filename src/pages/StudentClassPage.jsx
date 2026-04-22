import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import '../pages/Dashboard.css';

const TABS = ['Announcements', 'Notes', 'Homework', 'Quizzes', 'Discussion'];

export default function StudentClassPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [tab, setTab] = useState('Announcements');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [discussionText, setDiscussionText] = useState('');

  useEffect(() => {
    api.get(`/classes/${id}`, token).then(setCls).catch(() => navigate(-1));
  }, [id]);

  useEffect(() => { loadTab(); }, [tab, id]);

  const loadTab = async () => {
    setError('');
    try {
      const map = {
        Announcements: `/classes/${id}/announcements`,
        Notes: `/classes/${id}/notes`,
        Homework: `/classes/${id}/homework`,
        Quizzes: `/classes/${id}/quizzes`,
        Discussion: `/classes/${id}/discussions`,
      };
      const res = await api.get(map[tab], token);
      setData(res);
    } catch (e) { setError(e.message); }
  };

  const postDiscussion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${id}/discussions`, { content: discussionText }, token);
      setDiscussionText('');
      loadTab();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="class-page">
      <header className="dash-header">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/student/dashboard')}>← Back</button>
        <div className="dash-brand">🎓 EduApp</div>
      </header>

      <main className="class-main">
        {cls && (
          <div className="class-hero">
            <div>
              <h1>{cls.name}</h1>
              {cls.subject && <div className="subject">📖 {cls.subject}</div>}
            </div>
          </div>
        )}

        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {tab === 'Announcements' && (
          data.length === 0
            ? <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No announcements yet.</p>
            : data.map(a => (
              <div key={a.id} className="item-card">
                <div className="item-card-body">
                  <p>{a.content}</p>
                  <div className="meta">📢 {a.teacher_name} · {new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
        )}

        {tab === 'Notes' && (
          data.length === 0
            ? <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No notes uploaded yet.</p>
            : data.map(n => (
              <div key={n.id} className="item-card">
                <div className="item-card-body">
                  <h3>📄 {n.title}</h3>
                  <div className="meta">{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
                {n.file_path && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href={`${UPLOADS_BASE}/uploads/${n.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">👁 View</a>
                    <a href={`${UPLOADS_BASE}/uploads/${n.file_path}`} download={n.file_name || true} className="btn btn-primary btn-sm">⬇ Download</a>
                  </div>
                )}
              </div>
            ))
        )}

        {tab === 'Homework' && (
          data.length === 0
            ? <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No homework yet.</p>
            : data.map(hw => (
              <div key={hw.id} className="item-card">
                <div className="item-card-body">
                  <h3>📝 {hw.title}</h3>
                  {hw.description && <p>{hw.description}</p>}
                  {hw.due_date && <div className="meta">Due: {new Date(hw.due_date).toLocaleDateString()}</div>}
                  {hw.file_name && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <a href={`${UPLOADS_BASE}/uploads/${hw.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">👁 View</a>
                      <a href={`${UPLOADS_BASE}/uploads/${hw.file_path}`} download={hw.file_name} className="btn btn-primary btn-sm">⬇ Download</a>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}

        {tab === 'Quizzes' && (
          data.length === 0
            ? <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No quizzes yet.</p>
            : data.map(q => (
              <div key={q.id} className="item-card">
                <div className="item-card-body">
                  <h3>❓ {q.title}</h3>
                  {q.description && <p>{q.description}</p>}
                  <div className="meta">{new Date(q.created_at).toLocaleDateString()}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/student/classes/${id}/quizzes/${q.id}`)}>
                  Take Quiz
                </button>
              </div>
            ))
        )}

        {tab === 'Discussion' && (
          <>
            <div className="discussion-list">
              {data.map(d => (
                <div key={d.id} className="discussion-msg">
                  <div className="author">
                    {d.author_name}
                    <span className="role-badge">{d.author_role}</span>
                  </div>
                  <div className="body">{d.content}</div>
                  <div className="time">{new Date(d.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <form onSubmit={postDiscussion} className="discussion-input">
              <input placeholder="Write a message..." value={discussionText} onChange={e => setDiscussionText(e.target.value)} required />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
