import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import VerifiedBadge from '../components/VerifiedBadge';
import UmunsiAiModal from '../components/UmunsiAiModal';
import './Dashboard.css';


const COMP_CATS = [
  { key: 'all',        label: 'All',        emoji: '📋' },
  { key: 'lesson',     label: 'Lesson',     emoji: '📚', color: '#2563eb', bg: '#dbeafe' },
  { key: 'dream',      label: 'Dream',      emoji: '🌟', color: '#7c3aed', bg: '#ede9fe' },
  { key: 'motivation', label: 'Motivation', emoji: '🔥', color: '#ea580c', bg: '#ffedd5' },
];

function parseComp(content) {
  const lines = (content || '').split('\n');
  const title = lines[0]?.replace('📌 ', '') || 'Untitled';
  const sections = [];
  let cur = null, buf = [];
  for (const l of lines.slice(1)) {
    if (l === '📖 Introduction' || l === '📝 Body' || l === '🏁 Conclusion') {
      if (cur) sections.push({ label: cur, text: buf.join('\n').trim() });
      cur = l; buf = [];
    } else { buf.push(l); }
  }
  if (cur) sections.push({ label: cur, text: buf.join('\n').trim() });
  return { title, sections };
}

export default function StudentDashboard() {
  const { user, token, logout, isImpersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [teacherAnnouncements, setTeacherAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
  // Quick note state: { classId, open, text, saving }
  const [quickNote, setQuickNote] = useState(null);
  const [aiModal, setAiModal] = useState(null); // { classId, className }
  const [unread, setUnread] = useState(0);
  // My Compositions modal state
  const [showMyComp, setShowMyComp] = useState(false);
  const [myComps, setMyComps] = useState([]);
  const [myCompsLoading, setMyCompsLoading] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [myCompCat, setMyCompCat] = useState('all');

  const loadClasses = () => {
    api.get('/classes/my', token).then(setClasses).catch(e => setError(e.message));
  };

  const dismissAnnouncement = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    api.get('/admin/user-announcements', token).then(setAnnouncements).catch(() => {});
  }, []);
  useEffect(() => {
    api.get('/classes/my-announcements', token).then(setTeacherAnnouncements).catch(() => {});
  }, []);
  useEffect(() => {
    api.get('/messages/unread-count', token).then(r => setUnread(r.count)).catch(() => {});
  }, []);

  const loadMyComps = () => {
    if (!user?.id) return;
    setMyCompsLoading(true);
    api.get(`/student-shares/user/${user.id}`, token)
      .then(data => setMyComps(Array.isArray(data) ? data : []))
      .catch(() => setMyComps([]))
      .finally(() => setMyCompsLoading(false));
  };

  const openMyComps = () => {
    setShowMyComp(true);
    setSelectedComp(null);
    setMyCompCat('all');
    loadMyComps();
  };

  const saveQuickNote = async () => {
    if (!quickNote?.text?.trim()) return;
    setQuickNote(q => ({ ...q, saving: true }));
    try {
      await api.post('/student/notes', {
        title: quickNote.text.trim().slice(0, 60) || 'Note',
        content: quickNote.text.trim(),
        color: '#fff9c4',
      }, token);
      setQuickNote(null);
    } catch (_) {
      setQuickNote(q => ({ ...q, saving: false }));
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎓 UClass</div>
        <div className="dash-user">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>👋 {user?.name}<VerifiedBadge size={15} info={{ items: [
            { icon: '👩‍🎓', label: 'Role', value: 'Student' },
            { icon: '📧', label: 'Email', value: user?.email },
          ] }} /></span>
          {isImpersonating && (
            <button className="btn btn-secondary btn-sm" onClick={stopImpersonation}>↩ Return Admin</button>
          )}
          <Link to="/student/notes" className="btn btn-secondary btn-sm">📝 Amateka Yanjye</Link>
          <Link to="/messages" className="btn btn-secondary btn-sm" style={{ position: 'relative' }}>
            💬 Messages{unread > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 11, fontWeight: 700, padding: '1px 6px', marginLeft: 4 }}>{unread}</span>}
          </Link>
          <Link to="/profile" className="btn btn-secondary btn-sm">👤 Profile</Link>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>Amashuri Yanjye</h1>
            <p className="dash-sub">Injira mu mashuri yawe</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowJoin(true)}>
            + Injira mu Ishuri
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* My Compositions quick-access */}
        <div style={{ margin: '0 0 1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', gap: 8 }}
            onClick={openMyComps}
          >
            📝 VIEW MY COMPOSITIONS
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎒</div>
            <h3>Nta mashuri ufite</h3>
            <p>Injira mu ishuri ukoresheje kode umwarimu wawe yakuguye</p>
            <button className="btn btn-primary" onClick={() => setShowJoin(true)}>Injira mu Ishuri</button>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(cls => (
              <div key={cls.id} className="class-card-wrap">
                <Link to={`/student/classes/${cls.id}`} className="class-card">
                  <div className="class-card-header">
                    <h3>{cls.name}</h3>
                    {cls.subject && <span className="subject-tag">{cls.subject}</span>}
                  </div>
                  <div className="class-teacher">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>👨‍🏫 {cls.teacher_name}<VerifiedBadge size={13} info={{ items: [
                      { icon: '📚', label: 'Class', value: cls.name },
                      { icon: '📖', label: 'Subject', value: cls.subject || '—' },
                      { icon: '🏷️', label: 'Code', value: cls.class_code },
                    ] }} /></span>
                  </div>
                  <div className="class-card-footer">
                    <span>Tap to enter</span>
                    <span className="arrow">→</span>
                  </div>
                </Link>
                {/* AI button */}
                <button
                  className="class-card-note-btn"
                  onClick={e => { e.stopPropagation(); setAiModal({ classId: cls.id, className: cls.name }); }}
                >
                  🎓 Baza Umunsi AI
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Announcement Space (non-intrusive) */}
        <section style={{ marginTop: '2.2rem', paddingTop: '1.2rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>📣 Updates & Announcements</h2>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
              This area is kept at the bottom so class lessons stay focused.
            </p>
          </div>

          {teacherAnnouncements.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>From Teachers</div>
              {teacherAnnouncements.map(a => (
                <div key={`t-${a.id}-${a.class_id}`} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                  padding: '0.9rem 1rem', marginBottom: 10,
                }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 5 }}>
                    👨‍🏫 {a.teacher_name} • 🎓 {a.class_name}
                  </div>
                  {a.content && <p style={{ margin: 0, color: '#334155', fontSize: 14 }}>{a.content}</p>}
                  {a.image_path && (
                    <img
                      src={`${UPLOADS_BASE}${a.image_path}`}
                      alt={a.image_name || 'announcement image'}
                      style={{ marginTop: 10, width: '100%', maxWidth: 520, borderRadius: 10, border: '1px solid #e2e8f0' }}
                    />
                  )}
                  <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          {announcements.filter(a => !dismissed.includes(a.id)).length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>From Platform Admin</div>
              {announcements.filter(a => !dismissed.includes(a.id)).map(a => (
                <div key={`a-${a.id}`} style={{
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  border: '1px solid #93c5fd',
                  borderRadius: 12,
                  padding: '0.95rem 1.1rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span>📢</span>
                      <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>{a.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>— {a.admin_name}</span>
                    </div>
                    <p style={{ margin: 0, color: '#374151', fontSize: '0.9rem' }}>{a.message}</p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => dismissAnnouncement(a.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem', padding: 0, lineHeight: 1, flexShrink: 0 }}
                    title="Siba iri tangazo"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showJoin && (
        <JoinClassModal
          token={token}
          onClose={() => setShowJoin(false)}
          onJoined={() => { setShowJoin(false); loadClasses(); }}
        />
      )}

      {/* Quick note modal */}
      {quickNote?.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setQuickNote(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 4, fontSize: 18 }}>📝 Note zanjye</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>Andika inshamake y'isomo mwize uyu munsi</p>
            <textarea
              autoFocus
              rows={5}
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Uyu munsi twize... Ibisanzwe...  Nize..."
              value={quickNote.text}
              onChange={e => setQuickNote(q => ({ ...q, text: e.target.value }))}
              onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') saveQuickNote(); }}
            />
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Ctrl+Enter gufunga</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setQuickNote(null)}>Reka</button>
              <button
                className="btn btn-primary"
                disabled={quickNote.saving || !quickNote.text.trim()}
                onClick={saveQuickNote}
              >
                {quickNote.saving ? 'Kubika...' : '💾 Bika Inshamake'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Baza Umunsi Student AI modal */}
      {aiModal && (
        <UmunsiAiModal
          classId={aiModal.classId}
          className={aiModal.className}
          token={token}
          onClose={() => setAiModal(null)}
        />
      )}

      {/* ── MY COMPOSITIONS MODAL ────────────────────────────────────────── */}
      {showMyComp && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setShowMyComp(false); setSelectedComp(null); } }}
        >
          <div className="modal" style={{ maxWidth: 640, width: '95vw', maxHeight: '88vh', overflowY: 'auto', padding: 0, borderRadius: 18 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', zIndex: 2, borderRadius: '18px 18px 0 0' }}>
              {selectedComp ? (
                <button
                  onClick={() => setSelectedComp(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
                >
                  ← Back to list
                </button>
              ) : (
                <span style={{ fontWeight: 800, fontSize: 17, color: '#1e293b' }}>📝 My Compositions</span>
              )}
              <button
                onClick={() => { setShowMyComp(false); setSelectedComp(null); }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >&times;</button>
            </div>

            <div style={{ padding: '16px 22px 28px' }}>
              {selectedComp ? (
                /* ── Full Composition View ── */
                (() => {
                  const cat = COMP_CATS.find(c => c.key === selectedComp.type) || COMP_CATS[1];
                  const { title, sections } = parseComp(selectedComp.content);
                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ background: cat.bg || '#e0e7ff', color: cat.color || '#3730a3', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{cat.emoji} {cat.label}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(selectedComp.created_at).toLocaleDateString()}</span>
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 18, lineHeight: 1.3 }}>{title}</h2>
                      {sections.map((sec, i) => (
                        <div key={i} style={{ marginBottom: 18 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: cat.color || '#7c3aed', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
                            {sec.label.replace(/^[^ ]+ /, '')}
                          </div>
                          <p style={{ margin: 0, fontSize: 15, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{sec.text}</p>
                        </div>
                      ))}
                      {(selectedComp.school || selectedComp.class_name || selectedComp.teacher_name) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                          {selectedComp.school && <span style={{ fontSize: 12, color: '#64748b' }}>🏫 {selectedComp.school}</span>}
                          {selectedComp.class_name && <span style={{ fontSize: 12, color: '#64748b' }}>🎓 {selectedComp.class_name}</span>}
                          {selectedComp.teacher_name && <span style={{ fontSize: 12, color: '#64748b' }}>👨‍🏫 {selectedComp.teacher_name}</span>}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* ── Category List View ── */
                <>
                  {/* Category tabs */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {COMP_CATS.map(c => (
                      <button key={c.key}
                        onClick={() => setMyCompCat(c.key)}
                        style={{
                          padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                          cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .15s',
                          background: myCompCat === c.key ? (c.color || '#7c3aed') : '#fff',
                          color: myCompCat === c.key ? '#fff' : (c.color || '#475569'),
                          borderColor: c.color || '#e2e8f0',
                        }}
                      >{c.emoji} {c.label}</button>
                    ))}
                  </div>

                  {myCompsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>Loading compositions…</div>
                  ) : (() => {
                    const filtered = myComps.filter(s => myCompCat === 'all' || s.type === myCompCat);
                    if (filtered.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                          <div style={{ fontSize: 36, marginBottom: 10 }}>✍️</div>
                          <p style={{ color: '#94a3b8', fontSize: 14 }}>
                            {myCompCat === 'all' ? 'You have not published any compositions yet.' : `No ${myCompCat} compositions yet.`}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map(s => {
                          const cat = COMP_CATS.find(c => c.key === s.type) || COMP_CATS[1];
                          const { title, sections } = parseComp(s.content);
                          const intro = sections.find(sec => sec.label === '📖 Introduction')?.text || '';
                          const isRecent = (Date.now() - new Date(s.created_at)) < 7 * 24 * 60 * 60 * 1000;
                          return (
                            <div key={s.id}
                              style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 18px', borderLeft: `4px solid ${cat.color || '#7c3aed'}`, cursor: 'pointer', transition: 'box-shadow .15s' }}
                              onClick={() => setSelectedComp(s)}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ background: cat.bg || '#e0e7ff', color: cat.color || '#3730a3', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{cat.emoji} {cat.label}</span>
                                {isRecent && <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>🆕 Recent</span>}
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: intro ? 6 : 0 }}>{title}</div>
                              {intro && <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{intro}</p>}
                              <div style={{ marginTop: 10, fontSize: 12, color: cat.color || '#7c3aed', fontWeight: 600 }}>Read full composition →</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
