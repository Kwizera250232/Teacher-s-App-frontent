
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
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button>
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

  // form fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [schools, setSchools] = useState([]);
  const [dreams, setDreams] = useState('');
  const [favLessons, setFavLessons] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [fears, setFears] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

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
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <h1>My Profile</h1>
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
            📷 Change Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>

        <div className="profile-name-row">
          <span className="profile-name">{user?.name}</span>
          <span className="profile-role-badge">{user?.role}</span>
        </div>
        <div className="profile-email">✉️ {user?.email}</div>

        <div className="profile-section-title">📋 Personal Info</div>

        <div className="form-group">
          <label>📞 Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 7XX XXX XXX" />
        </div>

        <div className="form-group">
          <label>🏠 Home Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="District, Sector..." />
        </div>

        <TagInput
          label="🏫 Schools (add all your schools)"
          values={schools}
          onChange={setSchools}
          placeholder="Type school name and press Enter or Add"
        />

        <div className="profile-section-title">✨ About Me</div>

        <div className="form-group">
          <label>🌟 My Dreams</label>
          <textarea value={dreams} onChange={e => setDreams(e.target.value)} placeholder="What do you want to become..." rows={3} />
        </div>

        <TagInput
          label="📚 Favorite Lessons"
          values={favLessons}
          onChange={setFavLessons}
          placeholder="e.g. Mathematics"
        />

        <TagInput
          label="🎯 Hobbies (at least 2)"
          values={hobbies}
          onChange={setHobbies}
          placeholder="e.g. Reading, Football..."
        />

        <div className="form-group">
          <label>😰 What I Fear About</label>
          <textarea value={fears} onChange={e => setFears(e.target.value)} placeholder="Something you struggle with or are afraid of..." rows={3} />
        </div>

        {msg && <div className={`profile-msg ${msg.includes('success') || msg.includes('updated') ? 'success' : 'error'}`}>{msg}</div>}

        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Profile'}
        </button>
      </form>

      {/* Umunsimedia promo */}
      <div className="umunsimedia-promo">
        <a href="https://umunsimedia.com" target="_blank" rel="noreferrer" className="umunsimedia-link">
          <div className="umunsimedia-inner">
            <div className="umunsimedia-text">
              <span className="umunsimedia-tagline">Want to increase your writing knowledge?</span>
              <span className="umunsimedia-cta">Visit Umunsimedia.com →</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
