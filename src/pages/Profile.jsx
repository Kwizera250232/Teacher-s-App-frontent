
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadFile, UPLOADS_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23667eea'/%3E%3Ctext y='.9em' font-size='50' x='25' fill='white'%3E%F0%9F%91%A4%3C/text%3E%3C/svg%3E";

function TagInput({ label, values, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="tag-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={add}>Add</button>
      </div>
      <div className="tags">
        {values.map((v, i) => (
          <span key={i} className="tag">
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}>Ã—</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editMode, setEditMode] = useState(false);

  // form fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [schools, setSchools] = useState([]);
  const [dreams, setDreams] = useState('');
  const [favLessons, setFavLessons] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [fears, setFears] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    api.get('/profile/me', token).then(p => {
      setProfile(p);
      setPhone(p.phone || '');
      setAddress(p.home_address || '');
      setSchools(tryParse(p.schools, []));
      setDreams(p.dreams || '');
      setFavLessons(tryParse(p.favorite_lessons, []));
      setHobbies(tryParse(p.hobbies, []));
      setFears(p.fears || '');
      setAvatarUrl(p.avatar_path ? `${UPLOADS_BASE}${p.avatar_path}` : '');
      setSubscriberCount(p.subscriber_count || 0);
      setFollowingCount(p.following_count || 0);
    }).catch(() => {});
  }, [token]);

  function tryParse(val, fallback) {
    try { return JSON.parse(val) || fallback; } catch { return fallback; }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await uploadFile('/profile/me/avatar', fd, token);
      setAvatarUrl(`${UPLOADS_BASE}${res.avatar_path}`);
      setMsg('Profile picture updated!');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (hobbies.length < 2) return setMsg('Please add at least 2 hobbies.');
    setSaving(true);
    setMsg('');
    try {
      await api.put('/profile/me', {
        phone, home_address: address, schools,
        dreams, favorite_lessons: favLessons, hobbies, fears,
      }, token);
      setMsg('Profile saved successfully!');
      setEditMode(false);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // â”€â”€ View Mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!editMode) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>â† Back</button>
          <h1>My Profile</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>âœï¸ Edit</button>
        </div>

        <div className="profile-view-card">
          {/* Avatar + change photo */}
          <div className="profile-view-avatar-wrap">
            <img
              src={avatarUrl || DEFAULT_AVATAR}
              alt="avatar"
              className="profile-view-avatar"
            />
            <button type="button" className="avatar-edit-btn-overlay" onClick={() => fileRef.current?.click()}>
              ðŸ“·
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </div>

          {/* Name + role + badge */}
          <div className="profile-view-name-row">
            <span className="profile-name">{user?.name}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="12" fill="#1d9bf0"/>
              <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="profile-role-badge">{user?.role}</span>
          </div>
          <div className="profile-email">âœ‰ï¸ {user?.email}</div>

          {/* Stats */}
          <div className="profile-stats-bar">
            <div className="profile-stat">
              <strong>{subscriberCount}</strong>
              <span>Subscribers</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <strong>{followingCount}</strong>
              <span>Following</span>
            </div>
          </div>

          {/* Personal info */}
          {(phone || address || schools.length > 0) && (
            <div className="profile-view-section">
              <div className="profile-view-section-title">ðŸ“‹ Personal Info</div>
              {phone && <div className="profile-view-row"><span>ðŸ“ž</span><span>{phone}</span></div>}
              {address && <div className="profile-view-row"><span>ðŸ </span><span>{address}</span></div>}
              {schools.length > 0 && (
                <div className="profile-view-row">
                  <span>ðŸ«</span>
                  <div className="profile-view-tags">
                    {schools.map((s, i) => <span key={i} className="profile-view-tag">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* About me */}
          {(dreams || favLessons.length > 0 || hobbies.length > 0 || fears) && (
            <div className="profile-view-section">
              <div className="profile-view-section-title">âœ¨ About Me</div>
              {dreams && (
                <div className="profile-view-block">
                  <div className="profile-view-label">ðŸŒŸ Dreams</div>
                  <p className="profile-view-text">{dreams}</p>
                </div>
              )}
              {favLessons.length > 0 && (
                <div className="profile-view-block">
                  <div className="profile-view-label">ðŸ“š Favorite Lessons</div>
                  <div className="profile-view-tags">
                    {favLessons.map((l, i) => <span key={i} className="profile-view-tag">{l}</span>)}
                  </div>
                </div>
              )}
              {hobbies.length > 0 && (
                <div className="profile-view-block">
                  <div className="profile-view-label">ðŸŽ¯ Hobbies</div>
                  <div className="profile-view-tags">
                    {hobbies.map((h, i) => <span key={i} className="profile-view-tag">{h}</span>)}
                  </div>
                </div>
              )}
              {fears && (
                <div className="profile-view-block">
                  <div className="profile-view-label">ðŸ˜° What I Fear</div>
                  <p className="profile-view-text">{fears}</p>
                </div>
              )}
            </div>
          )}

          {!profile && <p style={{ textAlign: 'center', color: '#aaa', padding: '20px 0' }}>Loading profile...</p>}
          {profile && !phone && !dreams && schools.length === 0 && (
            <div className="profile-view-empty">
              <p>Your profile is empty.</p>
              <button className="btn btn-primary" onClick={() => setEditMode(true)}>âœï¸ Fill your profile</button>
            </div>
          )}

          {msg && <div className={`profile-msg ${msg.includes('success') || msg.includes('updated') ? 'success' : 'error'}`}>{msg}</div>}
        </div>

        {/* Umunsimedia promo */}
        <div className="umunsimedia-promo">
          <a href="https://umunsimedia.com" target="_blank" rel="noreferrer" className="umunsimedia-link">
            <div className="umunsimedia-inner">
              <div className="umunsimedia-text">
                <span className="umunsimedia-tagline">Want to increase your writing knowledge?</span>
                <span className="umunsimedia-cta">Visit Umunsimedia.com â†’</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    );
  }

  // â”€â”€ Edit Mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="btn btn-outline btn-sm" onClick={() => setEditMode(false)}>â† Cancel</button>
        <h1>Edit Profile</h1>
      </div>

      <form className="profile-form" onSubmit={handleSave}>
        {/* Avatar */}
        <div className="profile-avatar-wrap">
          <img
            src={avatarUrl || DEFAULT_AVATAR}
            alt="avatar"
            className="profile-avatar"
            onClick={() => fileRef.current?.click()}
          />
          <button type="button" className="avatar-edit-btn" onClick={() => fileRef.current?.click()}>
            ðŸ“· Change Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>

        <div className="profile-name-row">
          <span className="profile-name">{user?.name}</span>
          <span className="profile-role-badge">{user?.role}</span>
        </div>
        <div className="profile-email">âœ‰ï¸ {user?.email}</div>

        <div className="profile-section-title">ðŸ“‹ Personal Info</div>

        <div className="form-group">
          <label>ðŸ“ž Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 7XX XXX XXX" />
        </div>

        <div className="form-group">
          <label>ðŸ  Home Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="District, Sector..." />
        </div>

        <TagInput
          label="ðŸ« Schools (add all your schools)"
          values={schools}
          onChange={setSchools}
          placeholder="Type school name and press Enter or Add"
        />

        <div className="profile-section-title">âœ¨ About Me</div>

        <div className="form-group">
          <label>ðŸŒŸ My Dreams</label>
          <textarea value={dreams} onChange={e => setDreams(e.target.value)} placeholder="What do you want to become..." rows={3} />
        </div>

        <TagInput
          label="ðŸ“š Favorite Lessons"
          values={favLessons}
          onChange={setFavLessons}
          placeholder="e.g. Mathematics"
        />

        <TagInput
          label="ðŸŽ¯ Hobbies (at least 2)"
          values={hobbies}
          onChange={setHobbies}
          placeholder="e.g. Reading, Football..."
        />

        <div className="form-group">
          <label>ðŸ˜° What I Fear About</label>
          <textarea value={fears} onChange={e => setFears(e.target.value)} placeholder="Something you struggle with or are afraid of..." rows={3} />
        </div>

        {msg && <div className={`profile-msg ${msg.includes('success') || msg.includes('updated') ? 'success' : 'error'}`}>{msg}</div>}

        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'Saving...' : 'ðŸ’¾ Save Profile'}
        </button>
      </form>
    </div>
  );

}
