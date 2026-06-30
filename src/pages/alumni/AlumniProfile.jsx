import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniProfile() {
  const { identifier } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const isMe = !identifier || identifier === 'me' || identifier === String(user?.id);
  const [profile, setProfile] = useState(null);
  const [compositions, setCompositions] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [follows, setFollows] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
      window.location.reload();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <AlumniLayout showTopWriters={false}><div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div></AlumniLayout>;
  if (!profile) return <AlumniLayout showTopWriters={false}><div style={{ padding: 40, textAlign: 'center' }}>Profile not found.</div></AlumniLayout>;

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Cover */}
        <div style={{
          height: 200,
          background: profile.cover_photo_path
            ? `url(${profile.cover_photo_path}) center/cover`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          marginBottom: -50,
        }} />

        {/* Profile Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : `hsl(${(profile.id * 137) % 360}, 60%, 50%)`,
              border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              color: '#fff', fontWeight: 700,
              overflow: 'hidden',
            }}>
              {!profile.avatar_url && (profile.name?.[0] || 'K')}
            </div>
            <div style={{ flex: 1, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{profile.name}</h2>
                <span style={{ background: '#2563eb', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>✓ VERIFIED ALUMNI</span>
              </div>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                @{profile.email?.split('@')[0]} · {profile.role === 'alumni' ? 'UClass Alumni' : profile.role || 'Alumni'} · {profile.current_occupation || profile.dream_career || 'Student'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <div><strong>{follows.followers || 0}</strong> <span style={{ color: '#64748b', fontSize: 14 }}>Followers</span></div>
            <div><strong>{follows.following || 0}</strong> <span style={{ color: '#64748b', fontSize: 14 }}>Following</span></div>
            <div><strong>{profile.total_compositions || 0}</strong> <span style={{ color: '#64748b', fontSize: 14 }}>Articles</span></div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {isMe ? (
              <button onClick={() => setEditing(!editing)} style={{ padding: '8px 20px', borderRadius: 20, border: '1.5px solid #667eea', background: editing ? '#667eea' : '#fff', color: editing ? '#fff' : '#667eea', fontWeight: 700, cursor: 'pointer' }}>
                {editing ? 'Cancel' : '✏️ Edit Profile'}
              </button>
            ) : (
              <button onClick={handleFollow} style={{ padding: '8px 20px', borderRadius: 20, border: profile.is_following ? '1.5px solid #e2e8f0' : 'none', background: profile.is_following ? '#fff' : '#667eea', color: profile.is_following ? '#475569' : '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {profile.is_following ? 'Subscribed' : '🔔 Subscribe'}
              </button>
            )}
          </div>

          {/* Bio */}
          <p style={{ margin: '0 0 12px', lineHeight: 1.6, color: '#374151' }}>{profile.bio || 'No bio yet.'}</p>

          {/* Details */}
          {profile.graduation_year && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#64748b' }}>
              {profile.graduation_year && <span>🎓 Class of {profile.graduation_year}</span>}
              {profile.current_school_or_uni && <span>🏫 {profile.current_school_or_uni}</span>}
              {profile.favorite_subject && <span>📚 {profile.favorite_subject}</span>}
              {profile.personal_motto && <span>💭 "{profile.personal_motto}"</span>}
            </div>
          )}
        </div>

        {/* EDIT FORM */}
        {editing && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800 }}>Edit Profile</h3>
            {[
              { key: 'current_school_or_uni', label: 'Current School / University', placeholder: 'Where are you studying now?' },
              { key: 'current_occupation', label: 'Current Occupation', placeholder: 'Student, Developer, etc.' },
              { key: 'dream_career', label: 'Dream Career', placeholder: 'What do you aspire to be?' },
              { key: 'favorite_subject', label: 'Favorite Subject', placeholder: 'Math, Science, History...' },
              { key: 'favorite_teacher', label: 'Favorite Teacher', placeholder: 'Who inspired you most?' },
              { key: 'personal_motto', label: 'Personal Motto', placeholder: 'Your life motto or quote' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14 }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, minHeight: 80, resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Profile Photo URL</label>
              <input type="text" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://example.com/photo.jpg" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
              {form.avatar_url && <img src={form.avatar_url} alt="Preview" style={{ width: 60, height: 60, borderRadius: '50%', marginTop: 8, objectFit: 'cover' }} />}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Skills (comma separated)</label>
              <input type="text" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Interests (comma separated)</label>
              <input type="text" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
            </div>
            <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#667eea', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        )}

        {/* Articles */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800 }}>✍️ Articles</h3>
          {compositions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
              <p>No articles yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {compositions.map((comp) => (
                <div key={comp.id} onClick={() => navigate(`/alumni/composition/${comp.slug}`)} style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>{comp.title}</h4>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{comp.excerpt || comp.content?.substring(0, 120)}...</p>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(comp.created_at).toLocaleDateString()} · {comp.reads || 0} reads · {comp.likes || 0} likes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AlumniLayout>
  );
}
