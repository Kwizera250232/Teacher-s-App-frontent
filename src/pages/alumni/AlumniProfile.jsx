import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UPLOADS_BASE, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';
import VerifiedBadge from '../../components/VerifiedBadge';
import AIRevisionBadge from '../../components/AIRevisionBadge';

export default function AlumniProfile() {
  const { identifier } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const isMe = !identifier || identifier === 'me' || identifier === String(user?.id);
  const [profile, setProfile] = useState(null);
  const [compositions, setCompositions] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [follows, setFollows] = useState({ followers: 0, following: 0 });
  const [media, setMedia] = useState([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const avatarFileRef = useRef(null);

  const [form, setForm] = useState({
    bio: '', current_school_or_uni: '', current_occupation: '', dream_career: '',
    skills: '', interests: '', favorite_subject: '', favorite_teacher: '', personal_motto: '', avatar_url: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const id = isMe ? 'me' : identifier;
        const p = await api.get(`/alumni/profile/${id}`, token);
        setProfile(p);
        setForm({
          bio: p.bio || '',
          current_school_or_uni: p.current_school_or_uni || '',
          current_occupation: p.current_occupation || '',
          dream_career: p.dream_career || '',
          skills: (p.skills || []).join(', '),
          interests: (p.interests || []).join(', '),
          favorite_subject: p.favorite_subject || '',
          favorite_teacher: p.favorite_teacher || '',
          personal_motto: p.personal_motto || '',
          avatar_url: p.avatar_url || '',
        });

        const comps = await api.get(`/alumni/compositions?author_id=${p.user_id || p.id}&limit=10`, token);
        setCompositions(comps.compositions || []);

        const recs = await api.get(`/alumni/recognitions/${p.user_id || p.id}`, token);
        setRecognitions(recs || []);

        const f = await api.get(`/alumni/follows/${p.user_id || p.id}`, token);
        setFollows(f || { followers: 0, following: 0 });

        const posts = await api.get(`/alumni/feed?author_id=${p.user_id || p.id}`, token);
        const allImages = (posts.posts || []).flatMap(post => {
          const imgs = post.image_paths ? (Array.isArray(post.image_paths) ? post.image_paths : [post.image_paths]) : [];
          return imgs.map(url => ({ url: url.startsWith('http') ? url : `${UPLOADS_BASE}${url}`, postId: post.id }));
        });
        setMedia(allImages);
        setMediaCount(allImages.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [identifier, token, isMe]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.put('/alumni/profile/me', payload, token);
      setEditing(false);
      // Reload
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (profile.is_following) {
        await api.delete(`/alumni/follow/${profile.user_id || profile.id}`, token);
      } else {
        await api.post(`/alumni/follow/${profile.user_id || profile.id}`, {}, token);
      }
      // Reload profile and follows to update is_following
      const p = await api.get(`/alumni/profile/${profile.user_id || profile.id}`, token);
      setProfile(p);
      const f = await api.get(`/alumni/follows/${profile.user_id || profile.id}`, token);
      setFollows(f || { followers: 0, following: 0 });
      if (showSubscribers) {
        const subs = (f?.followers || []).map(u => ({
          id: u.follower_id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
        }));
        setSubscribers(subs);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const loadSubscribers = async () => {
    try {
      const f = await api.get(`/alumni/follows/${profile.user_id || profile.id}`, token);
      const subs = (f?.followers || []).map(u => ({
        id: u.follower_id,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
      }));
      setSubscribers(subs);
      setShowSubscribers(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const data = await uploadFile('/alumni/profile/avatar', fd, token);
      // Also save avatar_url in profile
      await api.put('/alumni/profile/me', { avatar_url: data.url }, token);
      setProfile({ ...profile, avatar_url: data.url, cover_photo_path: data.url });
    } catch (err) {
      alert(err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return <AlumniLayout showTopWriters={false}><div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div></AlumniLayout>;
  if (!profile) return <AlumniLayout showTopWriters={false}><div style={{ padding: 40, textAlign: 'center' }}>Profile not found.</div></AlumniLayout>;

  const profileId = profile.user_id || profile.id;
  const canViewFull = true; // profiles are public
  const avatarSrc = profile.avatar_url
    ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `${UPLOADS_BASE}${profile.avatar_url}`)
    : null;

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>
        {/* Cover — Edge-to-edge */}
        <div style={{
          height: 280,
          background: profile.cover_photo_path
            ? `url(${profile.cover_photo_path.startsWith('http') ? profile.cover_photo_path : `${UPLOADS_BASE}${profile.cover_photo_path}`}) center/cover`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 0,
          marginBottom: -60,
          position: 'relative',
        }}>
          {isMe && (
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => avatarFileRef.current?.click()} disabled={uploadingAvatar} style={{ padding: '10px 18px', borderRadius: 24, border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                {uploadingAvatar ? 'Uploading...' : '📸 Upload Photo'}
              </button>
              <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>
          )}
        </div>

        {/* Profile Card — Minimal, no border */}
        <div style={{ background: '#fff', borderRadius: 0, padding: '80px 24px 32px', marginBottom: 32, boxShadow: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: avatarSrc ? `url(${avatarSrc}) center/cover` : `hsl(${(profile.id * 137) % 360}, 60%, 50%)`,
              border: '5px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              color: '#fff', fontWeight: 700,
              overflow: 'hidden', flexShrink: 0,
            }}>
              {!avatarSrc && (profile.name?.[0] || 'K')}
            </div>
            <div style={{ flex: 1, marginBottom: 8, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 32, fontWeight: 600, fontFamily: "'Lora', Georgia, serif" }}>{profile.name}</h2>
                <VerifiedBadge size={20} userId={profileId} onViewProfile={null} />
                <AIRevisionBadge size={20} userId={profileId} />
                {!isMe && (
                  <button
                    onClick={handleFollow}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      border: profile.is_following ? '1.5px solid #e2e8f0' : 'none',
                      background: profile.is_following ? '#fff' : '#667eea',
                      color: profile.is_following ? '#475569' : '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    {profile.is_following ? '✓ Subscribed' : '🔔 Subscribe'}
                  </button>
                )}
              </div>
              <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: 15, fontFamily: "'Inter', sans-serif" }}>
                @{profile.email?.split('@')[0]} · {profile.role === 'alumni' ? 'UClass Alumni' : profile.role || 'Alumni'}
              </p>
              {(profile.school_name_text || profile.school_name) && (
                <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                  🏫 {profile.school_name_text || profile.school_name}
                </p>
              )}
              {(profile.district || profile.sector) && (
                <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                  📍 {[profile.district, profile.sector].filter(Boolean).join(', ')}
                </p>
              )}
              {profile.is_external && (
                <span style={{ display: 'inline-block', marginTop: 6, padding: '4px 12px', borderRadius: 8, background: '#eef2ff', color: '#4f46e5', fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                  ✅ Verified External Student
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ cursor: 'pointer' }} onClick={loadSubscribers}>
              <strong style={{ fontSize: 18, color: '#0f172a' }}>{follows.followers?.length || 0}</strong> <span style={{ color: '#9ca3af', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Subscribers</span>
            </div>
            <div><strong style={{ fontSize: 18, color: '#0f172a' }}>{follows.following?.length || 0}</strong> <span style={{ color: '#9ca3af', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Following</span></div>
            <div><strong style={{ fontSize: 18, color: '#0f172a' }}>{profile.total_compositions || 0}</strong> <span style={{ color: '#9ca3af', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Articles</span></div>
            <div><strong style={{ fontSize: 18, color: '#0f172a' }}>{mediaCount}</strong> <span style={{ color: '#9ca3af', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Media</span></div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {isMe ? (
              <>
                <button onClick={() => setEditing(!editing)} style={{ padding: '10px 24px', borderRadius: 24, border: '1.5px solid #667eea', background: editing ? '#667eea' : '#fff', color: editing ? '#fff' : '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                  {editing ? 'Cancel' : '✏️ Edit Profile'}
                </button>
                <button onClick={() => avatarFileRef.current?.click()} disabled={uploadingAvatar} style={{ padding: '10px 24px', borderRadius: 24, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                  {uploadingAvatar ? 'Uploading...' : '📸 Change Photo'}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleFollow} style={{ padding: '10px 24px', borderRadius: 24, border: profile.is_following ? '1.5px solid #e2e8f0' : 'none', background: profile.is_following ? '#fff' : '#667eea', color: profile.is_following ? '#475569' : '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                  {profile.is_following ? '✓ Subscribed' : '🔔 Subscribe'}
                </button>
                {profile.is_following && (
                  <button onClick={() => navigate(`/alumni/chat/${profileId}`)} style={{ padding: '10px 24px', borderRadius: 24, border: '1.5px solid #667eea', background: '#fff', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                    💬 Chat
                  </button>
                )}
              </>
            )}
          </div>

          {/* Bio — always visible */}
          <p style={{ margin: '0 0 16px', lineHeight: 1.8, color: '#374151', fontSize: 18, fontFamily: "'Inter', sans-serif" }}>{profile.bio || 'No bio yet.'}</p>

          {/* Details — always visible */}
          {profile.graduation_year && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14, color: '#9ca3af', fontFamily: "'Inter', sans-serif" }}>
              {profile.graduation_year && <span>🎓 Class of {profile.graduation_year}</span>}
              {profile.current_school_or_uni && <span>🏫 {profile.current_school_or_uni}</span>}
              {profile.favorite_subject && <span>📚 {profile.favorite_subject}</span>}
              {profile.personal_motto && <span>💭 "{profile.personal_motto}"</span>}
            </div>
          )}
        </div>

        {/* SUBSCRIBE GATE — when viewing someone else's profile and not following */}
        {!canViewFull && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Subscribe to {profile.name}</h3>
            <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 20px' }}>Subscribe to view their full profile, articles, and start chatting.</p>
            <button onClick={handleFollow} style={{ padding: '12px 32px', borderRadius: 24, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 14px rgba(102,126,234,0.4)' }}>
              🔔 Subscribe to {profile.name}
            </button>
          </div>
        )}

        {/* EDIT FORM — Editorial style */}
        {editing && (
          <div style={{ background: '#fff', borderRadius: 0, padding: '32px 24px', marginBottom: 32, boxShadow: 'none' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 600, fontFamily: "'Lora', Georgia, serif" }}>Edit Profile</h3>
            {[
              { key: 'current_school_or_uni', label: 'Current School / University', placeholder: 'Where are you studying now?' },
              { key: 'current_occupation', label: 'Current Occupation', placeholder: 'Student, Developer, etc.' },
              { key: 'dream_career', label: 'Dream Career', placeholder: 'What do you aspire to be?' },
              { key: 'favorite_subject', label: 'Favorite Subject', placeholder: 'Math, Science, History...' },
              { key: 'favorite_teacher', label: 'Favorite Teacher', placeholder: 'Who inspired you most?' },
              { key: 'personal_motto', label: 'Personal Motto', placeholder: 'Your life motto or quote' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151', fontFamily: "'Inter', sans-serif" }}>{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151', fontFamily: "'Inter', sans-serif" }}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, minHeight: 100, resize: 'vertical', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151', fontFamily: "'Inter', sans-serif" }}>Profile Photo URL</label>
              <input type="text" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://example.com/photo.jpg" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, fontFamily: "'Inter', sans-serif" }} />
              {form.avatar_url && <img src={form.avatar_url} alt="Preview" style={{ width: 80, height: 80, borderRadius: '50%', marginTop: 12, objectFit: 'cover' }} />}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151', fontFamily: "'Inter', sans-serif" }}>Skills (comma separated)</label>
              <input type="text" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, fontFamily: "'Inter', sans-serif" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151', fontFamily: "'Inter', sans-serif" }}>Interests (comma separated)</label>
              <input type="text" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 15, fontFamily: "'Inter', sans-serif" }} />
            </div>
            <button onClick={handleSave} disabled={saving} style={{ padding: '12px 32px', borderRadius: 24, border: 'none', background: '#667eea', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 15, fontFamily: "'Inter', sans-serif" }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        )}

        {/* Media Gallery — Editorial style */}
        {canViewFull && (
          <div style={{ background: '#fff', borderRadius: 0, padding: '32px 24px', marginBottom: 32, boxShadow: 'none' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 600, fontFamily: "'Lora', Georgia, serif" }}>📸 Media</h3>
            {media.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
                <p style={{ fontSize: 16, fontFamily: "'Inter', sans-serif" }}>No media yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {media.map((m, i) => (
                  <div key={i} onClick={() => setSelectedMedia(m)} style={{ aspectRatio: '1', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: '#f1f5f9' }}>
                    <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Articles — Editorial style */}
        {canViewFull && (
        <div style={{ background: '#fff', borderRadius: 0, padding: '32px 24px', marginBottom: 32, boxShadow: 'none' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 600, fontFamily: "'Lora', Georgia, serif" }}>✍️ Articles</h3>
          {compositions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <p style={{ fontSize: 16, fontFamily: "'Inter', sans-serif" }}>No articles yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {compositions.map((comp) => (
                <div key={comp.id} onClick={() => navigate(`/alumni/composition/${comp.slug}`)} style={{ padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s', background: '#f8fafc' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 600, fontFamily: "'Lora', Georgia, serif" }}>{comp.title}</h4>
                  <p style={{ margin: '0 0 12px', fontSize: 15, color: '#64748b', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>{comp.excerpt || comp.content?.substring(0, 150)}...</p>
                  <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
                    {new Date(comp.created_at).toLocaleDateString()} · {comp.reads || 0} reads · {comp.likes || 0} likes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Media lightbox */}
        {selectedMedia && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={() => setSelectedMedia(null)}>
            <img src={selectedMedia.url} alt="" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12, objectFit: 'contain' }} />
          </div>
        )}

        {/* Subscribers modal */}
        {showSubscribers && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={() => setShowSubscribers(false)}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Subscribers ({subscribers.length})</h3>
                <button onClick={() => setShowSubscribers(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#64748b', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', padding: 12, flex: 1 }}>
                {subscribers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                    <p>No subscribers yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {subscribers.map((s) => (
                      <div key={s.id} onClick={() => { navigate(`/alumni/profile/${s.id}`); setShowSubscribers(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', ':hover': { background: '#f8fafc' } }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.avatar ? `url(${s.avatar.startsWith('http') ? s.avatar : `${UPLOADS_BASE}${s.avatar}`}) center/cover` : `hsl(${(s.id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                          {!s.avatar && (s.name?.[0] || 'K')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                          {s.username && <div style={{ fontSize: 13, color: '#64748b' }}>@{s.username}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
