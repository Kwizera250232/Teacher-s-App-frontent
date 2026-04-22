import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, uploadFile, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import CreateQuizModal from '../components/CreateQuizModal';
import '../pages/Dashboard.css';

const TABS = ['Announcements', 'Notes', 'Homework', 'Quizzes', 'Discussion', 'Students'];

export default function TeacherClassPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [tab, setTab] = useState('Announcements');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Forms
  const [announcementText, setAnnouncementText] = useState('');
  const [noteForm, setNoteForm] = useState({ title: '', file: null });
  const [hwForm, setHwForm] = useState({ title: '', description: '', due_date: '', file: null });
  const [discussionText, setDiscussionText] = useState('');

  useEffect(() => {
    api.get(`/classes/${id}`, token).then(setCls).catch(() => navigate(-1));
  }, [id]);

  useEffect(() => {
    loadTab();
  }, [tab, id]);

  const loadTab = async () => {
    setError('');
    try {
      const endpointMap = {
        Announcements: `/classes/${id}/announcements`,
        Notes: `/classes/${id}/notes`,
        Homework: `/classes/${id}/homework`,
        Quizzes: `/classes/${id}/quizzes`,
        Discussion: `/classes/${id}/discussions`,
        Students: `/classes/${id}/students`,
      };
      const res = await api.get(endpointMap[tab], token);
      setData(res);
    } catch (e) {
      setError(e.message);
    }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/classes/${id}/announcements`, { content: announcementText }, token);
      setAnnouncementText('');
      loadTab();
      showSuccess('Announcement posted!');
    } catch (e) { setError(e.message); }
  };

  const uploadNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title) return;
    try {
      const fd = new FormData();
      fd.append('title', noteForm.title);
      if (noteForm.file) fd.append('file', noteForm.file);
      await uploadFile(`/classes/${id}/notes`, fd, token);
      setNoteForm({ title: '', file: null });
      loadTab();
      showSuccess('Note uploaded!');
    } catch (e) { setError(e.message); }
  };

  const postHomework = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', hwForm.title);
      if (hwForm.description) fd.append('description', hwForm.description);
      if (hwForm.due_date) fd.append('due_date', hwForm.due_date);
      if (hwForm.file) fd.append('file', hwForm.file);
      await uploadFile(`/classes/${id}/homework`, fd, token);
      setHwForm({ title: '', description: '', due_date: '', file: null });
      loadTab();
      showSuccess('Homework created!');
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

  const deleteItem = async (endpoint) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(endpoint, token);
      loadTab();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="class-page">
      <header className="dash-header">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/teacher/dashboard')}>← Back</button>
        <div className="dash-brand">🎓 EduApp</div>
      </header>

      <main className="class-main">
        {cls && (
          <div className="class-hero">
            <div>
              <h1>{cls.name}</h1>
              {cls.subject && <div className="subject">📖 {cls.subject}</div>}
            </div>
            <div className="class-hero-code">
              <span className="code-label">Class Code</span>
              <div className="code-big">{cls.class_code}</div>
            </div>
          </div>
        )}

        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Announcements */}
        {tab === 'Announcements' && (
          <>
            <form onSubmit={postAnnouncement} style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
              <input
                className="form-group"
                style={{ flex: 1, padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14 }}
                placeholder="Write an announcement..."
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">Post</button>
            </form>
            {data.map(a => (
              <div key={a.id} className="item-card">
                <div className="item-card-body">
                  <p>{a.content}</p>
                  <div className="meta">📢 {new Date(a.created_at).toLocaleString()}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteItem(`/classes/${id}/announcements/${a.id}`)}>Delete</button>
              </div>
            ))}
          </>
        )}

        {/* Notes */}
        {tab === 'Notes' && (
          <>
            <form onSubmit={uploadNote} style={{ background: 'white', padding: 20, borderRadius: 10, marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div className="form-group">
                <label>Note Title *</label>
                <input type="text" value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} placeholder="e.g. Chapter 1 - Algebra" required />
              </div>
              <div className="form-group">
                <label>File (PDF, DOC, etc.)</label>
                <input type="file" onChange={e => setNoteForm({ ...noteForm, file: e.target.files[0] })} accept=".pdf,.doc,.docx,.ppt,.pptx" />
              </div>
              <button type="submit" className="btn btn-primary">Upload Note</button>
            </form>
            {data.map(n => (
              <div key={n.id} className="item-card">
                <div className="item-card-body">
                  <h3>📄 {n.title}</h3>
                  {n.file_name && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <a href={`${UPLOADS_BASE}/uploads/${n.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">👁 View</a>
                      <a href={`${UPLOADS_BASE}/uploads/${n.file_path}`} download={n.file_name} className="btn btn-primary btn-sm">⬇ Download</a>
                    </div>
                  )}
                  <div className="meta">{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteItem(`/classes/${id}/notes/${n.id}`)}>Delete</button>
              </div>
            ))}
          </>
        )}

        {/* Homework */}
        {tab === 'Homework' && (
          <>
            <form onSubmit={postHomework} style={{ background: 'white', padding: 20, borderRadius: 10, marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={hwForm.title} onChange={e => setHwForm({ ...hwForm, title: e.target.value })} placeholder="e.g. Exercise 3" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={hwForm.description} onChange={e => setHwForm({ ...hwForm, description: e.target.value })} placeholder="Instructions..." />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={hwForm.due_date} onChange={e => setHwForm({ ...hwForm, due_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Attachment (PDF, DOC, etc.)</label>
                <input type="file" onChange={e => setHwForm({ ...hwForm, file: e.target.files[0] })} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" />
              </div>
              <button type="submit" className="btn btn-primary">Create Homework</button>
            </form>
            {data.map(hw => (
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
                <button className="btn btn-danger btn-sm" onClick={() => deleteItem(`/classes/${id}/homework/${hw.id}`)}>Delete</button>
              </div>
            ))}
          </>
        )}

        {/* Quizzes */}
        {tab === 'Quizzes' && (
          <>
            <div className="section-header">
              <h2>Quizzes</h2>
              <button className="btn btn-primary" onClick={() => setShowQuizModal(true)}>+ Create Quiz</button>
            </div>
            {data.map(q => (
              <div key={q.id} className="item-card">
                <div className="item-card-body">
                  <h3>❓ {q.title}</h3>
                  {q.description && <p>{q.description}</p>}
                  <div className="meta">{new Date(q.created_at).toLocaleDateString()}</div>
                </div>
                <div className="item-card-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/teacher/classes/${id}/quizzes/${q.id}/results`)}>Results</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteItem(`/classes/${id}/quizzes/${q.id}`)}>Delete</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Discussion */}
        {tab === 'Discussion' && (
          <>
            <div className="discussion-list">
              {data.map(d => (
                <div key={d.id} className={`discussion-msg ${d.author_role === 'teacher' ? 'teacher-msg' : ''}`}>
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

        {/* Students */}
        {tab === 'Students' && (
          <div className="students-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{new Date(s.joined_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: '#888' }}>No students yet.</p>}
          </div>
        )}
      </main>

      {showQuizModal && (
        <CreateQuizModal
          token={token}
          classId={id}
          onClose={() => setShowQuizModal(false)}
          onCreated={() => { setShowQuizModal(false); loadTab(); showSuccess('Quiz created!'); }}
        />
      )}
    </div>
  );
}
