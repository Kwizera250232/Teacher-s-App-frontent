import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AlumniProfile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [compositions, setCompositions] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.id === profile?.user_id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await api.get(`/alumni/profile/${identifier}`);
        setProfile(p);

        // Load compositions by this alumni
        const comps = await api.get(`/alumni/compositions?author_id=${p.user_id || p.id}&limit=10`);
        setCompositions(comps.compositions || []);

        // Load recognitions
        const recs = await api.get(`/alumni/recognitions/${p.user_id || p.id}`);
        setRecognitions(recs || []);

        // Check if current user follows this alumni
        if (user?.id && !isOwnProfile) {
          const follows = await api.get(`/alumni/follows/${p.user_id || p.id}`);
          setIsFollowing(follows.followers?.some((f) => f.follower_id === user.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [identifier, user?.id]);

  const handleFollow = async () => {
    if (!profile || isOwnProfile) return;
    try {
      const id = profile.user_id || profile.id;
      if (isFollowing) {
        await api.delete(`/alumni/follow/${id}`);
        setIsFollowing(false);
      } else {
        await api.post(`/alumni/follow/${id}`);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: 40, textAlign: 'center' }}>Profile not found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {/* Cover */}
      <div style={{
        height: 200,
        background: profile.cover_photo_path
          ? `url(${profile.cover_photo_path}) center/cover`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px 12px 0 0',
      }} />

      {/* Profile Card */}
      <div style={{
        background: '#fff',
        borderRadius: '0 0 12px 12px',
        padding: '0 24px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -40, marginBottom: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#f1f5f9', border: '4px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            {profile.name?.[0] || '?'}
          </div>
          <div style={{ marginBottom: 4, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>
              {profile.name}
              {profile.is_verified && <span style={{ color: '#2563eb', marginLeft: 8, fontSize: 16 }}>✓ Verified</span>}
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              {profile.username && `@${profile.username}`}
              {profile.graduation_year && ` · Class of ${profile.graduation_year}`}
            </p>
          </div>
          {!isOwnProfile && (
            <button
              className={isFollowing ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={handleFollow}
              style={{ marginBottom: 8 }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {isOwnProfile && (
            <button className="btn btn-secondary" onClick={() => navigate('/alumni/dashboard')} style={{ marginBottom: 8 }}>
              Edit Profile
            </button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>{profile.bio}</p>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Compositions', value: profile.total_compositions || 0 },
            { label: 'Followers', value: profile.followers_count || 0 },
            { label: 'Following', value: profile.following_count || 0 },
            { label: 'Rewards', value: profile.total_rewards || 0 },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {profile.current_occupation && (
          <DetailCard icon="💼" label="Occupation" value={profile.current_occupation} />
        )}
        {profile.current_school_or_uni && (
          <DetailCard icon="🎓" label="School/University" value={profile.current_school_or_uni} />
        )}
        {profile.dream_career && (
          <DetailCard icon="⭐" label="Dream Career" value={profile.dream_career} />
        )}
        {profile.current_location && (
          <DetailCard icon="📍" label="Location" value={profile.current_location} />
        )}
        {profile.favorite_subject && (
          <DetailCard icon="📚" label="Favorite Subject" value={profile.favorite_subject} />
        )}
        {profile.favorite_teacher && (
          <DetailCard icon="👨‍🏫" label="Favorite Teacher" value={profile.favorite_teacher} />
        )}
        {profile.favorite_club && (
          <DetailCard icon="🏆" label="Favorite Club" value={profile.favorite_club} />
        )}
        {profile.personal_motto && (
          <DetailCard icon="💬" label="Motto" value={profile.personal_motto} />
        )}
      </div>

      {/* Skills & Interests */}
      {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {profile.skills?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#94a3b8', textTransform: 'uppercase' }}>Skills</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {profile.skills.map((s) => (
                  <span key={s} style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {profile.interests?.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#94a3b8', textTransform: 'uppercase' }}>Interests</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {profile.interests.map((i) => (
                  <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>{i}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compositions */}
      <h3 style={{ marginBottom: 12 }}>Compositions</h3>
      {compositions.length === 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 24, textAlign: 'center', color: '#64748b' }}>
          No compositions yet.
        </div>
      ) : (
        compositions.map((c) => (
          <div key={c.id} style={{
            background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer',
          }} onClick={() => navigate(`/alumni/composition/${c.slug}`)}>
            <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>{c.title}</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              {c.read_count} reads · {c.likes_count} likes · {c.comments_count} comments
            </p>
          </div>
        ))
      )}

      {/* Recognitions */}
      {recognitions.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12, marginTop: 24 }}>Recognitions</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {recognitions.map((r) => (
              <div key={r.id} style={{
                background: '#fff', borderRadius: 10, padding: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '4px solid #f59e0b',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{r.badge_type.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetailCard({ icon, label, value }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{icon} {value}</div>
    </div>
  );
}
