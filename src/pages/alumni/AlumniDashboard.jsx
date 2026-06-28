import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AlumniLayout from '../../components/AlumniLayout';

export default function AlumniDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [compositions, setCompositions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, myComp, trend, w] = await Promise.all([
          api.get('/alumni/profile/me', token),
          api.get('/alumni/my-compositions?limit=5', token),
          api.get('/alumni/compositions/trending', token),
          api.get('/alumni/wallet', token).catch(() => ({ wallet: null })),
        ]);
        setProfile(p);
        setCompositions(myComp || []);
        setTrending(trend || []);
        setWallet(w.wallet);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <AlumniLayout><div style={{ padding: 40, textAlign: 'center' }}>Loading...</div></AlumniLayout>;

  return (
    <AlumniLayout>
    <div>
      {/* Cover & Profile Header */}
      <div style={{ position: 'relative', marginBottom: 60 }}>
        <div style={{
          height: 180,
          background: profile?.cover_photo_path
            ? `url(${profile.cover_photo_path}) center/cover`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
        }} />
        <div style={{
          position: 'absolute',
          bottom: -40,
          left: 24,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
        }}>
          <div style={{
            width: 80, height: 80,
            borderRadius: '50%',
            background: '#f1f5f9',
            border: '4px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>
            {profile?.name?.[0] || '?'}
          </div>
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{profile?.name}</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
              {profile?.current_occupation || profile?.dream_career || 'Alumni'}
              {profile?.is_verified && <span style={{ color: '#2563eb', marginLeft: 6 }}>✓ Verified</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Compositions', value: profile?.total_compositions || 0, link: '/alumni/compose' },
          { label: 'Followers', value: profile?.followers_count || 0 },
          { label: 'Following', value: profile?.following_count || 0 },
          { label: 'Wallet', value: `${wallet?.reward_balance || 0} RWF`, link: '/alumni/wallet' },
        ].map((stat) => (
          <div key={stat.label} style={{
            flex: '1 1 120px',
            background: '#fff',
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            cursor: stat.link ? 'pointer' : 'default',
          }} onClick={() => stat.link && navigate(stat.link)}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/alumni/compose')}>
          ✍️ New Composition
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/alumni/directory')}>
          🔍 Alumni Directory
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/alumni/groups')}>
          👥 U-Class Groups
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/alumni/feed')}>
          📰 Alumni Feed
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/alumni/wallet')}>
          💰 Wallet
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Compositions */}
        <div>
          <h3 style={{ marginBottom: 12 }}>My Compositions</h3>
          {compositions.length === 0 ? (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 24, textAlign: 'center', color: '#64748b' }}>
              No compositions yet. <Link to="/alumni/compose">Write your first one</Link>.
            </div>
          ) : (
            compositions.map((c) => (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }} onClick={() => navigate(`/alumni/composition/${c.slug}`)}>
                <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>{c.title}</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.4 }}>
                  {c.excerpt?.slice(0, 100)}...
                </p>
                <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                  {c.status} · {c.read_count} reads · {c.likes_count} likes
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trending */}
        <div>
          <h3 style={{ marginBottom: 12 }}>Trending Compositions</h3>
          {trending.length === 0 ? (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 24, textAlign: 'center', color: '#64748b' }}>
              No trending compositions yet.
            </div>
          ) : (
            trending.map((c) => (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }} onClick={() => navigate(`/alumni/composition/${c.slug}`)}>
                <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>{c.title}</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                  by {c.author_name} · {c.read_count} reads
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </AlumniLayout>
  );
}
