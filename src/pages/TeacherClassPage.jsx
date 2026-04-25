import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, uploadFile, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import CreateQuizModal from '../components/CreateQuizModal';
import DocPreviewModal from '../components/DocPreviewModal';
import ShareModal from '../components/ShareModal';
import ClassLeaderboard from '../components/ClassLeaderboard';
import VerifiedBadge from '../components/VerifiedBadge';
import '../pages/Dashboard.css';

const TABS = ['Announcements', 'Notes', 'Homework', 'Quizzes', 'Leaderboard', 'Discussion', 'Students'];

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
  const [editQuiz, setEditQuiz] = useState(null);

  // Forms
  const [announcementText, setAnnouncementText] = useState('');
  const [noteForm, setNoteForm] = useState({ title: '', file: null });
  const [hwForm, setHwForm] = useState({ title: '', description: '', due_date: '', file: null });
  const [discussionText, setDiscussionText] = useState('');
  // Submissions viewer: { [hwId]: { open, submissions, gradeForm: { [subId]: { grade, feedback } } } }
  const [submissionsState, setSubmissionsState] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null); // { viewerUrl, fileName }
  const [shareItem, setShareItem] = useState(null);   // { title, text, url }

  useEffect(() => {
    api.get(`/classes/${id}`, token).then(setCls).catch(() => navigate(-1));
  }, [id]);

  useEffect(() => {
    loadTab();
  }, [tab, id]);

  const loadTab = async () => {
    setError('');
    if (tab === 'Leaderboard') return; // handled by ClassLeaderboard component
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

  const getViewerUrl = (filePath) => {
    return `${UPLOADS_BASE}/uploads/${filePath}`;
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

  const loadSubmissions = async (hwId) => {
    const isOpen = submissionsState[hwId]?.open;
    if (isOpen) {
      setSubmissionsState(prev => ({ ...prev, [hwId]: { ...prev[hwId], open: false } }));
      return;
    }
    try {
      const subs = await api.get(`/classes/${id}/homework/${hwId}/submissions`, token);
      const gradeForm = {};
      subs.forEach(s => { gradeForm[s.id] = { grade: s.grade ?? '', feedback: s.feedback ?? '' }; });
      setSubmissionsState(prev => ({ ...prev, [hwId]: { open: true, submissions: subs, gradeForm } }));
    } catch (e) { setError(e.message); }
  };

  const gradeSubmission = async (hwId, subId) => {
    const gf = submissionsState[hwId]?.gradeForm?.[subId];
    if (!gf) return;
    try {
      await api.put(`/classes/${id}/homework/${hwId}/submissions/${subId}/grade`, { grade: gf.grade, feedback: gf.feedback }, token);
      showSuccess('Grade saved!');
      // Refresh submissions
      const subs = await api.get(`/classes/${id}/homework/${hwId}/submissions`, token);
      const gradeForm = {};
      subs.forEach(s => { gradeForm[s.id] = { grade: s.grade ?? '', feedback: s.feedback ?? '' }; });
      setSubmissionsState(prev => ({ ...prev, [hwId]: { open: true, submissions: subs, gradeForm } }));
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="class-page">
      <header className="dash-header">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/teacher/dashboard')}>← Back</button>
        <div className="dash-brand">🎓 UClass</div>
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShareItem({ title: a.content, text: `Announcement on UClass: ${a.content}`, url: 'https://student.umunsi.com' })}
                  >🔗 Share</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteItem(`/classes/${id}/announcements/${a.id}`)}>Delete</button>
                </div>
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                      background: '#f0f2ff', border: '1px solid #c7d2fe', borderRadius: 6,
                      padding: '3px 10px', fontSize: 12, color: '#4338ca', fontWeight: 600 }}>
                      <span>📎</span>
                      <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.file_name.replace(/^\d+-\d+\./, '')}
                      </span>
                    </div>
                  )}
                  {n.file_name && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreviewDoc({ fileUrl: `${UPLOADS_BASE}/download/notes/${n.file_path}?inline=1`, fileName: n.file_name })}
                      >👁 Preview</button>
                      <a href={`${UPLOADS_BASE}/download/notes/${n.file_path}`} download={n.file_name} className="btn btn-primary btn-sm">⬇ Download</a>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShareItem({ title: `📄 ${n.title}`, text: `Check out this note on UClass: ${n.title}`, url: 'https://student.umunsi.com' })}
                      >🔗 Share</button>
                    </div>
                  )}
                  <div className="meta" style={{ marginTop: 6 }}>{new Date(n.created_at).toLocaleDateString()}</div>
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
            {data.map(hw => {
              const dueStatus = getDueStatus(hw.due_date);
              const ss = submissionsState[hw.id];
              return (
                <div key={hw.id} className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div className="item-card-body" style={{ flex: 1 }}>
                      <h3>📝 {hw.title}</h3>
                      {hw.description && <p>{hw.description}</p>}
                      {dueStatus && (
                        <div className="meta" style={{ color: dueStatus.color, fontWeight: 600 }}>⏰ {dueStatus.label}</div>
                      )}
                      {hw.file_name && (
                        <>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6,
                            padding: '3px 10px', fontSize: 12, color: '#c2410c', fontWeight: 600 }}>
                            <span>📎</span>
                            <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {hw.file_name.replace(/^\d+-\d+\./, '')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setPreviewDoc({ fileUrl: `${UPLOADS_BASE}/download/homework/${hw.file_path}?inline=1`, fileName: hw.file_name })}
                            >👁 Preview</button>
                            <a href={`${UPLOADS_BASE}/download/homework/${hw.file_path}`} download={hw.file_name} className="btn btn-primary btn-sm">⬇ Download</a>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setShareItem({ title: `📝 ${hw.title}`, text: `Check out this homework on UClass: ${hw.title}`, url: 'https://student.umunsi.com' })}
                            >🔗 Share</button>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => loadSubmissions(hw.id)}>
                        {ss?.open ? '▲ Hide' : '👥 Submissions'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteItem(`/classes/${id}/homework/${hw.id}`)}>Delete</button>
                    </div>
                  </div>

                  {/* Submissions panel */}
                  {ss?.open && (
                    <div style={{ marginTop: 14, borderTop: '1.5px solid #e8e8e8', paddingTop: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 12 }}>
                        📋 Submissions ({ss.submissions.length})
                      </div>
                      {ss.submissions.length === 0
                        ? <p style={{ color: '#94a3b8', fontSize: 14 }}>No submissions yet.</p>
                        : ss.submissions.map(sub => (
                          <div key={sub.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 12, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>👤 {sub.student_name}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                {new Date(sub.submitted_at).toLocaleString()}
                              </div>
                            </div>
                            {sub.text_response && (
                              <p style={{ fontSize: 14, color: '#475569', background: '#fff', padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                                {sub.text_response}
                              </p>
                            )}
                            {sub.file_name && (
                              <>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
                                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6,
                                  padding: '3px 10px', fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                                  <span>📎</span>
                                  <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sub.file_name.replace(/^\d+-\d+\./, '')}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10, marginTop: 6, flexWrap: 'wrap' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setPreviewDoc({ fileUrl: `${UPLOADS_BASE}/download/homework/${sub.file_path}?inline=1`, fileName: sub.file_name })}
                                  >👁 Preview</button>
                                  <a href={`${UPLOADS_BASE}/download/homework/${sub.file_path}`} download={sub.file_name} className="btn btn-primary btn-sm">⬇ Download</a>
                                </div>
                              </>
                            )}
                            {/* Grade form */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                              <div>
                                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3 }}>Grade (0–100)</label>
                                <input
                                  type="number" min="0" max="100"
                                  value={ss.gradeForm[sub.id]?.grade ?? ''}
                                  onChange={e => setSubmissionsState(prev => ({
                                    ...prev,
                                    [hw.id]: { ...prev[hw.id], gradeForm: { ...prev[hw.id].gradeForm, [sub.id]: { ...prev[hw.id].gradeForm[sub.id], grade: e.target.value } } }
                                  }))}
                                  style={{ width: 80, padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 14 }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 140 }}>
                                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3 }}>Feedback (optional)</label>
                                <input
                                  type="text"
                                  placeholder="Well done! / Try again..."
                                  value={ss.gradeForm[sub.id]?.feedback ?? ''}
                                  onChange={e => setSubmissionsState(prev => ({
                                    ...prev,
                                    [hw.id]: { ...prev[hw.id], gradeForm: { ...prev[hw.id].gradeForm, [sub.id]: { ...prev[hw.id].gradeForm[sub.id], feedback: e.target.value } } }
                                  }))}
                                  style={{ width: '100%', padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }}
                                />
                              </div>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => gradeSubmission(hw.id, sub.id)}
                              >
                                {sub.grade !== null && sub.grade !== undefined ? '✏️ Update Grade' : '✅ Save Grade'}
                              </button>
                            </div>
                            {sub.grade !== null && sub.grade !== undefined && (
                              <div style={{ marginTop: 6, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                                Current grade: {sub.grade}/100 {sub.graded_at && `· Graded ${new Date(sub.graded_at).toLocaleDateString()}`}
                              </div>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              );
            })}
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
                  <div className="meta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                    {q.attempt_count > 0
                      ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>👁 {q.attempt_count} attempt{q.attempt_count > 1 ? 's' : ''} — locked</span>
                      : <span style={{ color: '#22c55e', fontWeight: 600 }}>✏️ Editable</span>
                    }
                  </div>
                </div>
                <div className="item-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditQuiz(q)}
                    disabled={q.attempt_count > 0}
                    title={q.attempt_count > 0 ? 'Cannot edit after students have attempted' : 'Edit quiz questions'}
                  >Edit</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/teacher/classes/${id}/quizzes/${q.id}/results`)}>Results</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteItem(`/classes/${id}/quizzes/${q.id}`)}>Delete</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Leaderboard */}
        {tab === 'Leaderboard' && (
          <ClassLeaderboard classId={id} />
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
                    <td style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{s.name}<VerifiedBadge size={13} /></td>
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
      {editQuiz && (
        <CreateQuizModal
          token={token}
          classId={id}
          editQuiz={editQuiz}
          onClose={() => setEditQuiz(null)}
          onCreated={() => { setEditQuiz(null); loadTab(); showSuccess('Quiz updated!'); }}
        />
      )}

      {previewDoc && (
        <DocPreviewModal
          fileUrl={previewDoc.fileUrl}
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
