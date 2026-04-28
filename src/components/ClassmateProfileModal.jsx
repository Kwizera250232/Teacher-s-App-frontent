import { UPLOADS_BASE } from '../api';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23667eea'/%3E%3Ctext y='.9em' font-size='50' x='25' fill='white'%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E";

function tryParse(val, fallback) {
  try { return JSON.parse(val) || fallback; } catch { return fallback; }
}

export default function ClassmateProfileModal({ person, onClose, onMessage }) {
  const schools = tryParse(person.schools, []);
  const favLessons = tryParse(person.favorite_lessons, []);
  const hobbies = tryParse(person.hobbies, []);
  const initials = person.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  const bg = colors[(person.id || 0) % colors.length];

  return (
    <div className="cm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-modal">
        <button className="cm-modal-close" onClick={onClose}>✕</button>

        <div className="cm-modal-hero">
          {person.avatar_path
            ? <img src={`${UPLOADS_BASE}${person.avatar_path}`} alt={person.name} className="cm-modal-avatar" />
            : <div className="cm-modal-initials" style={{ background: bg }}>{initials}</div>
          }
          <div className="cm-modal-name">{person.name}</div>
          <span className={`cm-role-badge ${person.role}`}>{person.role}</span>
          {person.email && <div className="cm-modal-email">✉️ {person.email}</div>}
        </div>

        <div className="cm-modal-body">
          {(person.phone || person.home_address || schools.length > 0) && (
            <div className="cm-section">
              <div className="cm-section-title">📋 Personal Info</div>
              {person.phone && <div className="cm-row"><span className="cm-label">📞</span><span>{person.phone}</span></div>}
              {person.home_address && <div className="cm-row"><span className="cm-label">🏠</span><span>{person.home_address}</span></div>}
              {schools.length > 0 && (
                <div className="cm-row">
                  <span className="cm-label">🏫</span>
                  <span className="cm-tags">{schools.map((s, i) => <span key={i} className="cm-tag">{s}</span>)}</span>
                </div>
              )}
            </div>
          )}

          {(person.dreams || favLessons.length > 0 || hobbies.length > 0 || person.fears) && (
            <div className="cm-section">
              <div className="cm-section-title">✨ About Me</div>
              {person.dreams && (
                <div className="cm-block">
                  <div className="cm-label">🌟 Dreams</div>
                  <p>{person.dreams}</p>
                </div>
              )}
              {favLessons.length > 0 && (
                <div className="cm-block">
                  <div className="cm-label">📚 Favorite Lessons</div>
                  <div className="cm-tags">{favLessons.map((l, i) => <span key={i} className="cm-tag">{l}</span>)}</div>
                </div>
              )}
              {hobbies.length > 0 && (
                <div className="cm-block">
                  <div className="cm-label">🎯 Hobbies</div>
                  <div className="cm-tags">{hobbies.map((h, i) => <span key={i} className="cm-tag">{h}</span>)}</div>
                </div>
              )}
              {person.fears && (
                <div className="cm-block">
                  <div className="cm-label">😰 What I Fear</div>
                  <p>{person.fears}</p>
                </div>
              )}
            </div>
          )}

          {!(person.dreams || favLessons.length > 0 || hobbies.length > 0 || person.phone || schools.length > 0) && (
            <p style={{ textAlign: 'center', color: '#aaa', padding: '24px 0', fontSize: 14 }}>
              This person hasn't filled their profile yet.
            </p>
          )}
        </div>

        <div className="cm-modal-footer">
          {onMessage && (
            <button className="btn btn-primary" onClick={() => onMessage(person.id)}>
              💬 Send Message
            </button>
          )}
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
