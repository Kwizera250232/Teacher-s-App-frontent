import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, uploadFile, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import DocPreviewModal from '../components/DocPreviewModal';
import ShareModal from '../components/ShareModal';
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
  const [success, setSuccess] = useState('');
  const [discussionText, setDiscussionText] = useState('');
  // Submission state: { [hwId]: { submitting, form, mySubmission } }
  const [subState, setSubState] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null); // { viewerUrl, fileName }
  const [shareItem, setShareItem] = useState(null);   // { title, text, url }

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

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
      // Load existing submissions for each homework
      if (tab === 'Homework') {
        const subs = {};
        await Promise.all(res.map(async (hw) => {
          try {
            const sub = await api.get(`/classes/${id}/homework/${hw.id}/my-submission`, token);
            subs[hw.id] = { submitting: false, form: { text: '', file: null }, mySubmission: sub };
          } catch {
            subs[hw.id] = { submitting: false, form: { text: '', file: null }, mySubmission: null };
          }
        }));
        setSubState(subs);
      }
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

  const submitHomework = async (e, hwId) => {
    e.preventDefault();
    const st = subState[hwId];
    if (!st?.form?.text && !st?.form?.file) {
      setError('Please write a response or attach a file.');
      return;
    }
    setSubState(prev => ({ ...prev, [hwId]: { ...prev[hwId], submitting: true } }));
    setError('');
    try {
      const fd = new FormData();
      if (st.form.text) fd.append('text_response', st.form.text);
      if (st.form.file) fd.append('file', st.form.file);
      const sub = await uploadFile(`/classes/${id}/homework/${hwId}/submit`, fd, token);
      setSubState(prev => ({ ...prev, [hwId]: { submitting: false, form: { text: '', file: null }, mySubmission: sub } }));
      showSuccess('Homework submitted successfully!');
    } catch (e) {
      setError(e.message);
      setSubState(prev => ({ ...prev, [hwId]: { ...prev[hwId], submitting: false } }));
    }
  };

  const getViewerUrl = (filePath) => {
    const url = `${UPLOADS_BASE}/uploads/${filePath}`;
    const ext = filePath.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return url;
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  };

  const getDueStatus = (due_date) => {
    if (!due_date) return null;
    const due = new Date(due_date);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Overdue', color: '#ef4444' };
    if (diffDays === 0) return { label: 'Due today', color: '#f97316' };
    if (diffDays <= 2) return { label: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: '#f59e0b' };
    return { label: `Due ${due.toLocaleDateString()}`, color: '#64748b' };
  };

  return (
    <div className="class-page">
      <header className="dash-header">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/student/dashboard')}>← Back</button>
        <div className="dash-brand">🎓 UClass</div>
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
        {success && <div className="alert alert-success">{success}</div>}

        {tab === 'Announcements' && (
          data.length === 0
            ? <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No announcements yet.</p>
            : data.map(a => (
              <div key={a.id} className="item-card">
                <div className="item-card-body">
                  <p>{a.content}</p>
                  <div className="meta">📢 {a.teacher_name} · {new Date(a.created_at).toLocaleString()}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShareItem({ title: a.content, url: window.location.href })}
                >
                  🔗 Share
                </button>
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
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewDoc({ viewerUrl: getViewerUrl(n.file_path), fileName: n.file_name || n.title })}
                    >👁 Preview</button>
                    <a href={`${UPLOADS_BASE}/uploads/${n.file_path}`} download={n.file_name || true} className="btn btn-primary btn-sm">⬇ Download</a>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShareItem({ title: n.title, url: `${UPLOADS_BASE}/uploads/${n.file_path}` })}
                    >🔗 Share</button>
                  </div>
                )}
              </div>
            ))
        )}

        {tab === 'Homework' && (
          data.length === 0
            ? <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No homework yet.</p>
            : data.map(hw => {
              const st = subState[hw.id] || { submitting: false, form: { text: '', file: null }, mySubmission: null };
              const dueStatus = getDueStatus(hw.due_date);
              const sub = st.mySubmission;
              return (
                <div key={hw.id} className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  {/* Homework info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div className="item-card-body" style={{ flex: 1 }}>
                      <h3>📝 {hw.title}</h3>
                      {hw.description && <p>{hw.description}</p>}
                      {dueStatus && (
                        <div className="meta" style={{ color: dueStatus.color, fontWeight: 600 }}>
                          ⏰ {dueStatus.label}
                        </div>
                      )}
                      {hw.file_name && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setPreviewDoc({ viewerUrl: getViewerUrl(hw.file_path), fileName: hw.file_name })}
                          >👁 Preview</button>
                          <a href={`${UPLOADS_BASE}/uploads/${hw.file_path}`} download={hw.file_name} className="btn btn-primary btn-sm">⬇ Download</a>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShareItem({ title: hw.title, url: `${UPLOADS_BASE}/uploads/${hw.file_path}` })}
                          >🔗 Share</button>
                        </div>
                      )}
                    </div>
                    {/* Submission badge */}
                    <div style={{ flexShrink: 0 }}>
                      {sub
                        ? sub.grade !== null && sub.grade !== undefined
                          ? <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                              ✅ Graded: {sub.grade}/100
                            </span>
                          : <span style={{ background: '#fef9c3', color: '#92400e', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                              ✔ Submitted
                            </span>
                        : <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                            ✗ Not submitted
                          </span>
                      }
                    </div>
                  </div>

                  {/* Grade & feedback display */}
                  {sub && sub.grade !== null && sub.grade !== undefined && (
                    <div style={{ margin: '12px 0 0', padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, borderLeft: '4px solid #22c55e' }}>
                      <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>Grade: {sub.grade}/100</div>
                      {sub.feedback && <div style={{ color: '#374151', fontSize: 14 }}>💬 Feedback: {sub.feedback}</div>}
                    </div>
                  )}

                  {/* Submitted file/text display */}
                  {sub && (
                    <div style={{ margin: '10px 0 0', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
                      <strong>Your submission:</strong>
                      {sub.text_response && <p style={{ margin: '4px 0 0' }}>{sub.text_response}</p>}
                      {sub.file_name && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setPreviewDoc({ viewerUrl: getViewerUrl(sub.file_path), fileName: sub.file_name })}
                          >👁 Preview</button>
                          <a href={`${UPLOADS_BASE}/uploads/${sub.file_path}`} download={sub.file_name} className="btn btn-primary btn-sm">⬇ Download</a>
                        </div>
                      )}
                      <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>
                        Submitted: {new Date(sub.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Submission form */}
                  <form onSubmit={(e) => submitHomework(e, hw.id)}
                    style={{ marginTop: 14, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1.5px dashed #cbd5e1' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 10 }}>
                      {sub ? '✏️ Update your submission' : '📤 Submit your work'}
                    </div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <textarea
                        placeholder="Write your answer here... (optional if uploading a file)"
                        value={st.form.text}
                        onChange={e => setSubState(prev => ({ ...prev, [hw.id]: { ...prev[hw.id], form: { ...prev[hw.id].form, text: e.target.value } } }))}
                        rows={3}
                        style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                        onChange={e => setSubState(prev => ({ ...prev, [hw.id]: { ...prev[hw.id], form: { ...prev[hw.id].form, file: e.target.files[0] } } }))}
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={st.submitting}>
                      {st.submitting ? 'Submitting...' : sub ? 'Resubmit' : 'Submit'}
                    </button>
                  </form>
                </div>
              );
            })
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

      {previewDoc && (
        <DocPreviewModal
          viewerUrl={previewDoc.viewerUrl}
          fileName={previewDoc.fileName}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {shareItem && (
        <ShareModal
          title={shareItem.title}
          text={shareItem.text}
          url={shareItem.url}
          onClose={() => setShareItem(null)}
        />
      )}
    </div>
  );
}
