import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
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

  const renderContent = () => {
    switch (activeTab) {
      case 'quizzes':
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
                return (
                <div key={q.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                    {q.my_score !== null && <span>Score: {q.my_score}/{q.my_total}</span>}
                    <span>{q.attempt_count || 0} attempts</span>
                    {q.question_count > 0 && <span>{q.question_count} questions</span>}
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                );
              })
            )}
          </div>
        );

      case 'homework':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classData.homework.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <p style={{ color: '#94a3b8' }}>No homework found from your class</p>
              </div>
            ) : (
              classData.homework.map((hw) => (
                <div key={hw.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{hw.title}</h4>
                  {hw.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{hw.description}</p>}
                  {hw.grade !== null && hw.grade !== undefined && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: hw.grade >= 70 ? '#059669' : '#d97706' }}>
                      Grade: {hw.grade}
                      {hw.feedback && <span style={{ fontWeight: 400, color: '#64748b' }}> — {hw.feedback}</span>}
                    </div>
                  )}
                  {hw.submitted_at && (
                    <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Submitted: {new Date(hw.submitted_at).toLocaleDateString()}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                    Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'No due date'}
                  </div>
                </div>
              ))
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
