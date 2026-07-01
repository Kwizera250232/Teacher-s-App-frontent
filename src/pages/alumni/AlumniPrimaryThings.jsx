import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadFile, UPLOADS_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const TABS = [
  { key: 'quizzes', label: 'Quizzes & Marks', icon: '🎯' },
  { key: 'homework', label: 'Homework', icon: '📋' },
  { key: 'notes', label: 'Notes', icon: '📝' },
  { key: 'announcements', label: 'Announcements', icon: '📢' },
  { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { key: 'discussion', label: 'Discussion', icon: '💬' },
  { key: 'cstatus', label: 'C. Status', icon: '✍️' },
  { key: 'inyandiko', label: 'Inyandiko', icon: '📄' },
];

export default function AlumniPrimaryThings() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quizzes');
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState({
    quizzes: [], homework: [], notes: [], announcements: [],
    leaderboard: [], discussions: [], cstatus: [], inyandiko: [],
  });
  const [classInfo, setClassInfo] = useState(null);
  const [quizDetail, setQuizDetail] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [hwDetail, setHwDetail] = useState(null);
  const [hwLoading, setHwLoading] = useState(false);
  const [inyandikoUploading, setInyandikoUploading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [token]);

  const loadAllData = async () => {
    try {
      const data = await api.get('/alumni/primary-things', token);
      setClassInfo(data.classInfo);
      setClassData({
        quizzes: data.quizzes || [],
        homework: data.homework || [],
        notes: data.notes || [],
        announcements: data.announcements || [],
        leaderboard: data.leaderboard || [],
        discussions: data.discussions || [],
        cstatus: data.cstatus || [],
        inyandiko: data.inyandiko || [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openQuizDetail = async (quizId) => {
    setQuizLoading(true);
    setQuizDetail(null);
    try {
      const data = await api.get(`/alumni/quiz/${quizId}/detail`, token);
      setQuizDetail(data);
    } catch (e) {
      alert(e.message || 'Failed to load quiz detail');
    } finally {
      setQuizLoading(false);
    }
  };

  const openHwDetail = async (hwId) => {
    setHwLoading(true);
    setHwDetail(null);
    try {
      const data = await api.get(`/alumni/homework/${hwId}/detail`, token);
      setHwDetail(data);
    } catch (e) {
      alert(e.message || 'Failed to load homework detail');
    } finally {
      setHwLoading(false);
    }
  };

  const renderQuizDetail = () => {
    if (quizLoading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading quiz...</div>;
    if (!quizDetail) return null;
    const { quiz, attempt, questions } = quizDetail;
    const pct = attempt && attempt.total ? Math.round((attempt.score / attempt.total) * 100) : null;
    return (
      <div>
        <button onClick={() => setQuizDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#667eea', fontWeight: 600, marginBottom: 16 }}>← Back to quizzes</button>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>{quiz.title}</h3>
          {quiz.description && <p style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b' }}>{quiz.description}</p>}
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
            {quiz.class_name && <span>Class: {quiz.class_name}</span>}
            <span>{questions.length} questions</span>
            {attempt ? (
              <span style={{ fontWeight: 700, color: pct >= 70 ? '#166534' : pct >= 50 ? '#92400e' : '#991b1b' }}>
                Score: {attempt.score}/{attempt.total} ({pct}%)
              </span>
            ) : (
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Not attempted</span>
            )}
          </div>
        </div>
        {questions.map((q, i) => {
          const optMap = { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d };
          return (
            <div key={q.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                {i + 1}. {q.question}
              </div>
              {q.question_type === 'fill_blank' ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Your answer:</span>
                  <span style={{ padding: '4px 12px', borderRadius: 8, background: q.is_correct ? '#dcfce7' : '#fee2e2', fontWeight: 600, fontSize: 13 }}>
                    {q.student_answer || '(blank)'}
                  </span>
                  {!q.is_correct && (
                    <span style={{ fontSize: 13, color: '#059669' }}>Correct: <strong>{q.correct_answer}</strong></span>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['a', 'b', 'c', 'd'].map((key) => {
                    if (!optMap[key]) return null;
                    const isCorrect = q.correct_answer === key;
                    const isStudent = q.student_answer.toLowerCase() === key;
                    let bg = '#f8fafc';
                    if (isCorrect) bg = '#dcfce7';
                    else if (isStudent && !isCorrect) bg = '#fee2e2';
                    return (
                      <div key={key} style={{ padding: '8px 12px', borderRadius: 8, background: bg, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{key.toUpperCase()}.</span>
                        <span>{optMap[key]}</span>
                        {isCorrect && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✅</span>}
                        {isStudent && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: 16 }}>❌</span>}
                      </div>
                    );
                  })}
                  {!q.student_answer && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>You did not answer this question.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderHwDetail = () => {
    if (hwLoading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading homework...</div>;
    if (!hwDetail) return null;
    const { homework, submission } = hwDetail;
    return (
      <div>
        <button onClick={() => setHwDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#667eea', fontWeight: 600, marginBottom: 16 }}>← Back to homework</button>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>{homework.title}</h3>
          {homework.description && <p style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{homework.description}</p>}
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
            {homework.class_name && <span>Class: {homework.class_name}</span>}
            <span>Due: {homework.due_date ? new Date(homework.due_date).toLocaleDateString() : 'No due date'}</span>
          </div>
          {homework.file_path && (
            <a href={`${(homework.file_path.startsWith('http') ? '' : 'https://studentapi.umunsi.com/uploads/')}${homework.file_path}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
              📎 {homework.file_name || 'Download homework file'}
            </a>
          )}
        </div>

        {submission ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Your Submission</h4>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              {submission.grade !== null && submission.grade !== undefined && (
                <div style={{ padding: '6px 14px', borderRadius: 20, background: submission.grade >= 70 ? '#dcfce7' : '#fef3c7', color: submission.grade >= 70 ? '#166534' : '#92400e', fontWeight: 700, fontSize: 13 }}>
                  Grade: {submission.grade}
                </div>
              )}
              <div style={{ padding: '6px 14px', borderRadius: 20, background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 12 }}>
                Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
              </div>
              {submission.graded_at && (
                <div style={{ padding: '6px 14px', borderRadius: 20, background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 12 }}>
                  Graded: {new Date(submission.graded_at).toLocaleDateString()}
                </div>
              )}
            </div>
            {submission.text_response && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Your response:</div>
                <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 10 }}>{submission.text_response}</div>
              </div>
            )}
            {submission.feedback && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Teacher feedback:</div>
                <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#fef3c7', padding: 12, borderRadius: 10 }}>{submission.feedback}</div>
              </div>
            )}
            {submission.teacher_answer && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Teacher's answer:</div>
                <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#dcfce7', padding: 12, borderRadius: 10 }}>{submission.teacher_answer}</div>
              </div>
            )}
            {submission.file_path && (
              <a href={`${(submission.file_path.startsWith('http') ? '' : 'https://studentapi.umunsi.com/uploads/')}${submission.file_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
                📎 {submission.file_name || 'Download your submission'}
              </a>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <p style={{ color: '#94a3b8', margin: 0 }}>You did not submit this homework</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'quizzes':
        if (quizDetail) return renderQuizDetail();
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classData.quizzes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
                <p style={{ color: '#94a3b8' }}>No quizzes found from your class</p>
              </div>
            ) : (
              classData.quizzes.map((q) => {
                const pct = q.my_total ? Math.round((q.my_score / q.my_total) * 100) : null;
                const notTaken = q.my_score === null;
                return (
                <div key={q.id} onClick={() => openQuizDetail(q.id)} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{q.title}</h4>
                      {q.description && <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{q.description}</p>}
                    </div>
                    {pct !== null && (
                      <div style={{
                        padding: '6px 14px', borderRadius: 20,
                        background: pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef3c7' : '#fee2e2',
                        color: pct >= 70 ? '#166534' : pct >= 50 ? '#92400e' : '#991b1b',
                        fontWeight: 700, fontSize: 13,
                      }}>
                        {pct}%
                      </div>
                    )}
                    {notTaken && (
                      <div style={{ padding: '6px 14px', borderRadius: 20, background: '#f1f5f9', color: '#94a3b8', fontWeight: 700, fontSize: 12 }}>
                        Not taken
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                    {q.my_score !== null && <span>Score: {q.my_score}/{q.my_total}</span>}
                    <span>{q.attempt_count || 0} attempts</span>
                    {q.question_count > 0 && <span>{q.question_count} questions</span>}
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                    <span style={{ color: '#667eea', fontWeight: 600 }}>→ View details</span>
                  </div>
                </div>
                );
              })
            )}
          </div>
        );

      case 'homework':
        if (hwDetail) return renderHwDetail();
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classData.homework.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <p style={{ color: '#94a3b8' }}>No homework found from your class</p>
              </div>
            ) : (
              classData.homework.map((hw) => {
                const submitted = !!hw.submitted_at;
                return (
                <div key={hw.id} onClick={() => openHwDetail(hw.id)} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{hw.title}</h4>
                    <div style={{ padding: '4px 12px', borderRadius: 20, background: submitted ? '#dcfce7' : '#fee2e2', color: submitted ? '#166534' : '#991b1b', fontWeight: 700, fontSize: 11 }}>
                      {submitted ? 'Submitted' : 'Not submitted'}
                    </div>
                  </div>
                  {hw.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{hw.description}</p>}
                  {hw.grade !== null && hw.grade !== undefined && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: hw.grade >= 70 ? '#059669' : '#d97706' }}>
                      Grade: {hw.grade}
                      {hw.feedback && <span style={{ fontWeight: 400, color: '#64748b' }}> — {hw.feedback}</span>}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, display: 'flex', gap: 12 }}>
                    <span>Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'No due date'}</span>
                    <span style={{ color: '#667eea', fontWeight: 600 }}>→ View details</span>
                  </div>
                </div>
                );
              })
            )}
          </div>
        );

      case 'notes':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classData.notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
                <p style={{ color: '#94a3b8' }}>No notes found from your class</p>
              </div>
            ) : (
              classData.notes.map((n) => (
                <div key={n.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{n.title}</h4>
                  {n.file_path && (
                    <a href={`${(n.file_path.startsWith('http') ? '' : 'https://studentapi.umunsi.com/uploads/')}${n.file_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
                      📎 {n.file_name || 'Download'}
                    </a>
                  )}
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    By {n.teacher_name || 'Teacher'} · {new Date(n.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'announcements':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classData.announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📢</div>
                <p style={{ color: '#94a3b8' }}>No announcements found</p>
              </div>
            ) : (
              classData.announcements.map((a) => (
                <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #667eea' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{a.content}</p>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {a.teacher_name && `By ${a.teacher_name} · `}{new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'leaderboard':
        return (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800 }}>🏆 Class Leaderboard</h3>
            {classData.leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No leaderboard data</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {classData.leaderboard.map((entry, i) => (
                  <div key={entry.student_id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10,
                    background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fff7ed' : '#f8fafc',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, width: 30, textAlign: 'center' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{entry.student_name}</div>
                      {entry.quizzes_taken > 0 && <div style={{ fontSize: 11, color: '#94a3b8' }}>{entry.quizzes_taken} quizzes</div>}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#667eea' }}>{entry.total_points || entry.score || 0} pts</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'discussion':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classData.discussions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                <p style={{ color: '#94a3b8' }}>No discussions found</p>
              </div>
            ) : (
              classData.discussions.map((d) => (
                <div key={d.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{d.title || 'Discussion'}</h4>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{d.content}</p>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    By {d.author_name || 'Anonymous'} · {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'cstatus':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classData.cstatus.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✍️</div>
                <p style={{ color: '#94a3b8' }}>No composition statuses found</p>
              </div>
            ) : (
              classData.cstatus.map((cs) => (
                <div key={cs.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>"{cs.content || cs.share_content}"</p>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {cs.view_count || 0} views · {new Date(cs.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'inyandiko':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Upload form */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 4 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>📤 Add Your Document</h4>
              <InyandikoUploadForm classId={classInfo?.class_id} token={token} onUploaded={loadAllData} uploading={inyandikoUploading} setUploading={setInyandikoUploading} />
            </div>

            {classData.inyandiko.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                <p style={{ color: '#94a3b8' }}>No documents found</p>
              </div>
            ) : (
              classData.inyandiko.map((doc) => (
                <div key={doc.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{doc.title || doc.doc_type}</h4>
                      <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{doc.doc_type?.replace('_', ' ')}</span>
                    </div>
                    {doc.file_path && (
                      <a href={`${(doc.file_path.startsWith('http') ? '' : 'https://studentapi.umunsi.com/uploads/')}${doc.file_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
                        📎 {doc.file_name || 'Download'}
                      </a>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    {doc.student_name && `By ${doc.student_name} · `}{new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>🎒 Primary Things</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>
          Everything from your school days — {classInfo?.name || 'your class'}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: 'none',
                background: activeTab === tab.key ? '#667eea' : '#e2e8f0',
                color: activeTab === tab.key ? '#fff' : '#475569',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
            <p>Loading your class memories...</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </AlumniLayout>
  );
}

function InyandikoUploadForm({ classId, token, onUploaded, uploading, setUploading }) {
  const [docType, setDocType] = useState('other');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { alert('Please select a file.'); return; }
    if (!classId) { alert('Class info not loaded yet.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('class_id', String(classId));
      fd.append('doc_type', docType);
      fd.append('title', title);
      await uploadFile('/alumni/inyandiko/upload', fd, token);
      setTitle('');
      setFile(null);
      e.target.reset();
      onUploaded();
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
      <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 }}>
        <option value="other">Other Document</option>
        <option value="commitment">Commitment</option>
        <option value="school_report">School Report</option>
      </select>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ fontSize: 13 }} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt" />
      <button type="submit" disabled={uploading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: uploading ? '#cbd5e1' : '#667eea', color: '#fff', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14 }}>
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
}
