import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './StudentShareFeed.css';

const CATEGORIES = [
  { key: 'lesson',     label: 'Lesson',     emoji: '📚', color: '#2563eb', bg: '#dbeafe' },
  { key: 'dream',      label: 'Dream',      emoji: '🌟', color: '#7c3aed', bg: '#ede9fe' },
  { key: 'motivation', label: 'Motivation', emoji: '🔥', color: '#ea580c', bg: '#ffedd5' },
];

function noPaste(e) {
  e.preventDefault();
  alert('⚠️ Copy from elsewhere not allowed. Write your own original work!');
}

function Avatar({ name, size = 42, color = '#2563eb' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="sf-avatar" style={{ width: size, height: size, minWidth: size, background: color, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function StudentShareFeed({ token }) {
  const { user } = useAuth();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [liking, setLiking] = useState(null);
  const [filterCat, setFilterCat] = useState('all');

  const [category, setCategory] = useState('');
  const [title, setTitle]       = useState('');
  const [intro, setIntro]       = useState('');
  const [body,  setBody]        = useState('');
  const [conc,  setConc]        = useState('');
  const [school,  setSchool]    = useState('');
  const [className, setClassName] = useState('');
  const [teacher, setTeacher]   = useState('');
  const [formErr, setFormErr]   = useState('');

  const loadShares = (cat) => {
    setLoading(true);
    const q = (!cat || cat === 'all') ? '' : `?type=${cat}`;
    api.get(`/student-shares${q}`, token)
      .then(setShares)
      .catch(() => setShares([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadShares(filterCat); }, [filterCat]);

  const handleSubmit = async () => {
    setFormErr('');
    if (!category)         return setFormErr('⚠️ Please choose a Category.');
    if (!title.trim())     return setFormErr('⚠️ Follow Rules — Title is required.');
    if (!intro.trim())     return setFormErr('⚠️ Follow Rules — Introduction is required.');
    if (!body.trim())      return setFormErr('⚠️ Follow Rules — Body is required.');
    if (!conc.trim())      return setFormErr('⚠️ Follow Rules — Conclusion is required.');
    if (!school.trim())    return setFormErr('⚠️ School name is required.');
    if (!className.trim()) return setFormErr('⚠️ Class is required.');
    if (!teacher.trim())   return setFormErr('⚠️ Teacher name is required.');

    const content = `📌 ${title.trim()}\n\n📖 Introduction\n${intro.trim()}\n\n📝 Body\n${body.trim()}\n\n🏁 Conclusion\n${conc.trim()}`;
    setPosting(true); setPostError('');
    try {
      await api.post('/student-shares', {
        type: category, content,
        school: school.trim(), class_name: className.trim(), teacher_name: teacher.trim(),
      }, token);
      setCategory(''); setTitle(''); setIntro(''); setBody(''); setConc('');
      setSchool(''); setClassName(''); setTeacher('');
      loadShares(filterCat);
    } catch (e) { setPostError(e.message); }
    finally { setPosting(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/student-shares/${id}`, token);
      setShares(prev => prev.filter(s => s.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  const handleLike = async (id) => {
    setLiking(id);
    try {
      const res = await api.post(`/student-shares/${id}/like`, {}, token);
      setShares(prev => prev.map(s => s.id === id ? {
        ...s,
        liked_by_me: res.liked,
        like_count: res.liked ? (s.like_count || 0) + 1 : Math.max(0, (s.like_count || 0) - 1)
      } : s));
    } catch {}
    finally { setLiking(null); }
  };

  const selCat = CATEGORIES.find(c => c.key === category);

  return (
    <div className="sf-feed">

      <div className="sf-composer" style={{ borderTop: `4px solid ${selCat ? selCat.color : '#0891b2'}` }}>
        {/* Composition Criteria Card */}
        <div style={{
          background: 'linear-gradient(135deg,#fefce8,#fef9c3)',
          border: '1.5px solid #fcd34d',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 14,
        }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            🏆 Composition Scoring Criteria (100 pts)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { pts: '20', label: '5Ws in Introduction', desc: 'Who, What, Where, When, Why' },
              { pts: '15', label: 'Title Match', desc: 'Title must match body content' },
              { pts: '20', label: '≥ 5 Paragraphs', desc: 'Full composition needs 5+ paragraphs' },
              { pts: '20', label: 'Introduction + Conclusion', desc: 'Must have clear background & conclusion' },
              { pts: '25', label: 'Grammar', desc: 'Good grammar throughout' },
            ].map(c => (
              <div key={c.pts} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: '#f59e0b', color: '#fff', borderRadius: 20,
                  padding: '2px 8px', fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>{c.pts}pts</span>
                <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{c.label}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>— {c.desc}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 10, padding: '6px 10px',
            background: '#ecfdf5', borderRadius: 8, border: '1px solid #6ee7b7',
            fontSize: 12, color: '#065f46', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🎁 Write ≥ 500 words &amp; score highest this term → WIN TERM NOTEBOOKS!
          </div>
        </div>

        <div className="sf-comp-rules">
          <span style={{ color: selCat ? selCat.color : '#0891b2' }}>✍️ Write Your Composition</span>
          <ul>
            <li>Choose a category, then fill all 4 sections</li>
            <li>No copy-pasting — write your own original work</li>
            <li>School, Class and Teacher are required to publish</li>
          </ul>
        </div>

        <div className="sf-comp-field">
          <label style={{ color: selCat ? selCat.color : '#475569' }}>📂 Category <span className="sf-req">*</span></label>
          <div className="sf-cat-select">
            {CATEGORIES.map(c => (
              <button key={c.key} type="button"
                className={`sf-cat-btn${category === c.key ? ' sf-cat-btn--active' : ''}`}
                style={category === c.key ? { background: c.color, color: '#fff', borderColor: c.color } : {}}
                onClick={() => setCategory(c.key)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sf-comp-field">
          <label style={{ color: selCat ? selCat.color : '#475569' }}>📌 Title <span className="sf-req">*</span></label>
          <input className="sf-comp-input" placeholder="Write your composition title..." value={title}
            onChange={e => setTitle(e.target.value)} onPaste={noPaste} maxLength={120} />
        </div>

        <div className="sf-comp-field">
          <label style={{ color: selCat ? selCat.color : '#475569' }}>📖 Introduction <span className="sf-req">*</span></label>
          <textarea className="sf-comp-textarea" rows={3} placeholder="Introduce the topic of your composition..."
            value={intro} onChange={e => setIntro(e.target.value)} onPaste={noPaste} maxLength={600} />
          <span className="sf-char-count">{intro.length}/600</span>
        </div>

        <div className="sf-comp-field">
          <label style={{ color: selCat ? selCat.color : '#475569' }}>📝 Body <span className="sf-req">*</span></label>
          <textarea className="sf-comp-textarea" rows={6} placeholder="Develop your ideas — write your main paragraphs..."
            value={body} onChange={e => setBody(e.target.value)} onPaste={noPaste} maxLength={2000} />
          <span className="sf-char-count">{body.length}/2000</span>
        </div>

        <div className="sf-comp-field">
          <label style={{ color: selCat ? selCat.color : '#475569' }}>🏁 Conclusion <span className="sf-req">*</span></label>
          <textarea className="sf-comp-textarea" rows={3} placeholder="Summarise and conclude your composition..."
            value={conc} onChange={e => setConc(e.target.value)} onPaste={noPaste} maxLength={600} />
          <span className="sf-char-count">{conc.length}/600</span>
        </div>

        <div className="sf-comp-divider">📍 Your School Details</div>

        <div className="sf-comp-row3">
          <div className="sf-comp-field">
            <label>🏫 School <span className="sf-req">*</span></label>
            <input className="sf-comp-input" placeholder="e.g. Bright School" value={school}
              onChange={e => setSchool(e.target.value)} maxLength={100} />
          </div>
          <div className="sf-comp-field">
            <label>🎓 Class <span className="sf-req">*</span></label>
            <input className="sf-comp-input" placeholder="e.g. S4 A" value={className}
              onChange={e => setClassName(e.target.value)} maxLength={50} />
          </div>
          <div className="sf-comp-field">
            <label>👨‍🏫 Teacher <span className="sf-req">*</span></label>
            <input className="sf-comp-input" placeholder="Teacher name" value={teacher}
              onChange={e => setTeacher(e.target.value)} maxLength={100} />
          </div>
        </div>

        {(formErr || postError) && <div className="sf-error">{formErr || postError}</div>}

        <button className="sf-post-btn sf-comp-submit"
          style={{ background: selCat ? selCat.color : '#0891b2' }}
          disabled={posting} onClick={handleSubmit}>
          {posting ? 'Publishing…' : '✍️ Publish Composition'}
        </button>
      </div>

      <div className="sf-filter-row">
        <span className="sf-filter-label">View:</span>
        {[{ key: 'all', label: 'All', emoji: '📋' }, ...CATEGORIES].map(c => (
          <button key={c.key}
            className={`sf-tab${filterCat === c.key ? ' sf-tab--active' : ''}`}
            style={filterCat === c.key && c.color ? { background: c.color, color: '#fff', borderColor: c.color } : {}}
            onClick={() => setFilterCat(c.key)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="sf-posts">
        {loading ? (
          <div className="sf-state"><div className="sf-spinner" />Loading posts…</div>
        ) : shares.length === 0 ? (
          <div className="sf-state">
            <div className="sf-empty-icon">✍️</div>
            <strong>No compositions yet</strong>
            <span>Be the first to publish!</span>
          </div>
        ) : shares.map(s => {
          const c = CATEGORIES.find(c => c.key === s.type) || CATEGORIES[0];
          const isOwn = user?.id === s.student_id;
          const lines = s.content.split('\n');
          const postTitle = lines[0]?.replace('📌 ', '') || '';
          const sections = [];
          let cur = null, buf = [];
          for (const l of lines.slice(1)) {
            if (l === '📖 Introduction' || l === '📝 Body' || l === '🏁 Conclusion') {
              if (cur) sections.push({ label: cur, text: buf.join('\n').trim() });
              cur = l; buf = [];
            } else { buf.push(l); }
          }
          if (cur) sections.push({ label: cur, text: buf.join('\n').trim() });

          return (
            <div className="sf-post" key={s.id}>
              <div className="sf-post-head" style={{ borderLeft: `4px solid ${c.color}` }}>
                <Avatar name={s.student_name} color={c.color} size={44} />
                <div className="sf-post-info">
                  <span className="sf-post-name">{s.student_name}</span>
                  <div className="sf-post-sub">
                    <span className="sf-post-badge" style={{ background: c.bg, color: c.color }}>{c.emoji} {c.label}</span>
                    <span className="sf-post-time">· {timeAgo(s.created_at)}</span>
                  </div>
                  {(s.school || s.class_name || s.teacher_name) && (
                    <div className="sf-post-school">
                      {s.school && <span>🏫 {s.school}</span>}
                      {s.class_name && <span>🎓 {s.class_name}</span>}
                      {s.teacher_name && <span>👨‍🏫 {s.teacher_name}</span>}
                    </div>
                  )}
                </div>
                {isOwn && (
                  <button className="sf-del-btn" title="Delete" disabled={deleting === s.id}
                    onClick={() => handleDelete(s.id)}>✕</button>
                )}
              </div>
              <div className="sf-post-body">
                {postTitle && <div className="sf-post-comp-title">{postTitle}</div>}
                {sections.map((sec, i) => (
                  <div key={i} className="sf-post-comp-section">
                    <div className="sf-post-comp-label">{sec.label}</div>
                    <div className="sf-post-comp-text">{sec.text}</div>
                  </div>
                ))}
              </div>
              <div className="sf-post-foot">
                <button className={`sf-like-btn${s.liked_by_me ? ' sf-like-btn--on' : ''}`}
                  disabled={liking === s.id} onClick={() => handleLike(s.id)}>
                  {s.liked_by_me ? '❤️' : '🤍'}
                  <span>{s.like_count > 0 ? `${s.like_count} ` : ''}{s.liked_by_me ? 'Liked' : 'Like'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
