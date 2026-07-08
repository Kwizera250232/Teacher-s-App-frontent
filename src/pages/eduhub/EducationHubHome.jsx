import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  { key: 'university', label: 'Universities', icon: '🎓' },
  { key: 'tvet', label: 'TVET', icon: '🔧' },
  { key: 'secondary', label: 'Secondary', icon: '🏫' },
  { key: 'scholarships', label: 'Scholarships', icon: '💰' },
  { key: 'jobs', label: 'Jobs', icon: '💼' },
  { key: 'mentorship', label: 'Mentorship', icon: '🧑‍🏫' },
  { key: 'career', label: 'AI Career', icon: '🤖' },
];

const HEADER_GRADIENT = 'linear-gradient(135deg, #0B5FFF 0%, #2563EB 50%, #1E40AF 100%)';

export default function EducationHubHome({ onNavigate }) {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState({ university: [], tvet: [], secondary: [] });
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/education-hub/featured?type=university', token).catch(() => ({ institutions: [] })),
      api.get('/education-hub/featured?type=tvet', token).catch(() => ({ institutions: [] })),
      api.get('/education-hub/featured?type=secondary', token).catch(() => ({ institutions: [] })),
      api.get('/education-hub/scholarships?featured=true&limit=5', token).catch(() => ({ scholarships: [] })),
    ]).then(([uni, tvet, sec, sch]) => {
      setFeatured({
        university: uni.institutions || [],
        tvet: tvet.institutions || [],
        secondary: sec.institutions || [],
      });
      setScholarships(sch.scholarships || []);
      setLoading(false);
    });
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    onNavigate('institutions', { search });
  };

  const InstitutionCard = ({ inst }) => (
    <div style={{ minWidth: 280, maxWidth: 280, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', flexShrink: 0, cursor: 'pointer' }} onClick={() => onNavigate('institution', { id: inst.id })}>
      <div style={{ height: 140, background: inst.banner_url ? `url(${inst.banner_url}) center/cover` : HEADER_GRADIENT, position: 'relative' }}>
        {inst.is_featured && <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#2563EB' }}>⭐ Featured</span>}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {inst.logo_url ? (
            <img src={inst.logo_url} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{inst.type === 'university' ? '🎓' : inst.type === 'tvet' ? '🔧' : '🏫'}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.name}</div>
            {inst.verified && <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>✓ Verified</span>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>📍 {inst.province || 'Rwanda'}{inst.district ? `, ${inst.district}` : ''}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{inst.is_public ? 'Public' : 'Private'} · {inst.is_boarding ? 'Boarding' : 'Day'}</div>
        <button style={{ width: '100%', marginTop: 10, padding: '8px', borderRadius: 12, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View Profile</button>
      </div>
    </div>
  );

  const ScholarshipCard = ({ sch }) => (
    <div style={{ minWidth: 300, maxWidth: 300, background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', flexShrink: 0 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{sch.title}</h4>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{sch.description?.slice(0, 80) || 'Scholarship opportunity'}...</p>
      {sch.amount && <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 4 }}>{sch.amount}</div>}
      {sch.deadline && <div style={{ fontSize: 12, color: '#dc2626' }}>Deadline: {new Date(sch.deadline).toLocaleDateString()}</div>}
      {sch.institution_name && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sch.institution_name}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Full-width premium header */}
      <div style={{ background: HEADER_GRADIENT, padding: '40px 20px 48px', width: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>Education Hub</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, margin: '0 0 24px' }}>Discover your future.</p>

          {/* Search box */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '16px 0 0 16px', padding: '0 16px' }}>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>🔍</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search universities, TVET, careers..." style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 12px', fontSize: 15, background: 'transparent' }} />
            </div>
            <button type="submit" style={{ padding: '0 24px', border: 'none', background: '#1E40AF', color: '#fff', borderRadius: '0 16px 16px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Search</button>
          </form>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => onNavigate(cat.key)} style={{
                padding: '8px 18px', borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.15)',
                color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background .2s',
              }} onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.25)'} onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading...</div>
        ) : (
          <>
            {/* Featured Universities */}
            {featured.university.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎓 Featured Universities</h2>
                  <button onClick={() => onNavigate('institutions', { type: 'university' })} style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>See all →</button>
                </div>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                  {featured.university.map(inst => <InstitutionCard key={inst.id} inst={inst} />)}
                </div>
              </section>
            )}

            {/* Featured TVET */}
            {featured.tvet.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🔧 Featured TVET</h2>
                  <button onClick={() => onNavigate('institutions', { type: 'tvet' })} style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>See all →</button>
                </div>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                  {featured.tvet.map(inst => <InstitutionCard key={inst.id} inst={inst} />)}
                </div>
              </section>
            )}

            {/* Featured Secondary */}
            {featured.secondary.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🏫 Featured Secondary Schools</h2>
                  <button onClick={() => onNavigate('institutions', { type: 'secondary' })} style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>See all →</button>
                </div>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                  {featured.secondary.map(inst => <InstitutionCard key={inst.id} inst={inst} />)}
                </div>
              </section>
            )}

            {/* Scholarships */}
            {scholarships.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>💰 Scholarships</h2>
                  <button onClick={() => onNavigate('scholarships')} style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>See all →</button>
                </div>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                  {scholarships.map(sch => <ScholarshipCard key={sch.id} sch={sch} />)}
                </div>
              </section>
            )}

            {/* AI Career Guidance Banner */}
            <section style={{ marginBottom: 32 }}>
              <div style={{ background: HEADER_GRADIENT, borderRadius: 20, padding: '36px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🤖</div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>AI Career Guidance</h2>
                  <p style={{ fontSize: 15, opacity: 0.9, margin: '0 0 16px', lineHeight: 1.5 }}>Take our AI-powered career assessment and discover the perfect career path for you.</p>
                  <button onClick={() => onNavigate('career')} style={{ padding: '12px 28px', borderRadius: 16, border: 'none', background: '#fff', color: '#2563EB', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Start AI Career Assessment →</button>
                </div>
                <div style={{ fontSize: 64, opacity: 0.3 }}>🎯</div>
              </div>
            </section>

            {/* Empty state */}
            {featured.university.length === 0 && featured.tvet.length === 0 && featured.secondary.length === 0 && scholarships.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <h3 style={{ margin: '0 0 6px' }}>No institutions yet</h3>
                <p style={{ color: '#64748b' }}>Admin needs to add institutions from the admin panel.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
