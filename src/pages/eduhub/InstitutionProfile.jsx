import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const HEADER_GRADIENT = 'linear-gradient(135deg, #0B5FFF 0%, #2563EB 50%, #1E40AF 100%)';
const TABS = ['Overview', 'Programs', 'Admission', 'Scholarships', 'Events', 'News', 'Gallery', 'Contact'];

export default function InstitutionProfile({ institutionId, onNavigate }) {
  const { token, user } = useAuth();
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [claimForm, setClaimForm] = useState({ position: '', representative_name: '', official_email: '', official_phone: '', website: '', national_id_url: '', authorization_letter_url: '', staff_card_url: '' });
  const [claimMsg, setClaimMsg] = useState('');

  useEffect(() => {
    api.get(`/education-hub/institutions/${institutionId}`, token)
      .then(data => { setInst(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [institutionId, token]);

  const handleSave = async () => {
    try {
      if (saved) {
        await api.delete(`/education-hub/save/${institutionId}`, token);
        setSaved(false);
      } else {
        await api.post(`/education-hub/save/${institutionId}`, {}, token);
        setSaved(true);
      }
    } catch {}
  };

  const handleFollow = async () => {
    try {
      if (following) {
        await api.delete(`/education-hub/follow/${institutionId}`, token);
        setFollowing(false);
      } else {
        await api.post(`/education-hub/follow/${institutionId}`, {}, token);
        setFollowing(true);
      }
    } catch {}
  };

  const handleClaim = async () => {
    if (!claimForm.position.trim() || !claimForm.representative_name.trim() || !claimForm.official_email.trim()) {
      setClaimMsg('Position, representative name, and official email are required.');
      return;
    }
    try {
      await api.post(`/education-hub/claim/${institutionId}`, claimForm, token);
      setClaimMsg('✅ Claim submitted! Admin will review your request.');
      setShowClaim(false);
    } catch (e) {
      setClaimMsg(e.message || 'Failed to submit claim.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Loading...</div>;
  if (!inst) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Institution not found.</div>;

  const stats = inst.stats || {};
  const facilities = inst.facilities || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Banner */}
      <div style={{ position: 'relative', height: 260, background: inst.banner_url ? `url(${inst.banner_url}) center/cover` : HEADER_GRADIENT }}>
        <button onClick={() => onNavigate('home')} style={{ position: 'absolute', top: 16, left: 16, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, backdropFilter: 'blur(10px)' }}>← Back</button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            {inst.logo_url ? <img src={inst.logo_url} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '3px solid #fff' }} /> : <div style={{ width: 72, height: 72, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{inst.type === 'university' ? '🎓' : inst.type === 'tvet' ? '🔧' : '🏫'}</div>}
            <div style={{ color: '#fff' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>{inst.name}</h1>
              <div style={{ fontSize: 14, opacity: 0.9 }}>📍 {inst.province || 'Rwanda'}{inst.district ? `, ${inst.district}` : ''}{inst.website && ` · ${inst.website}`}</div>
            </div>
          </div>
          {inst.verified && <span style={{ background: '#fff', color: '#2563EB', borderRadius: 12, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>✓ Verified</span>}
        </div>
      </div>

      {/* Action bar */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={handleSave} style={{ padding: '8px 18px', borderRadius: 16, border: saved ? 'none' : '2px solid #2563EB', background: saved ? '#2563EB' : '#fff', color: saved ? '#fff' : '#2563EB', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>{saved ? '★ Saved' : '☆ Save'}</button>
        <button onClick={handleFollow} style={{ padding: '8px 18px', borderRadius: 16, border: following ? 'none' : '2px solid #2563EB', background: following ? '#2563EB' : '#fff', color: following ? '#fff' : '#2563EB', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>{following ? '✓ Following' : '+ Follow'}</button>
        {!inst.claimed_by && !inst.verified && (
          <button onClick={() => setShowClaim(true)} style={{ padding: '8px 18px', borderRadius: 16, border: '2px solid #f59e0b', background: '#fff', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Claim Institution</button>
        )}
      </div>

      {claimMsg && <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}><div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>{claimMsg}</div></div>}

      {/* Stats row */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Programs', value: inst.programs?.length || 0 },
          { label: 'Scholarships', value: inst.scholarships?.length || 0 },
          { label: 'Events', value: inst.events?.length || 0 },
          { label: 'Type', value: inst.is_public ? 'Public' : 'Private' },
          { label: 'Boarding', value: inst.is_boarding ? 'Yes' : 'No' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '12px 20px', minWidth: 100, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: tab === t ? '#2563EB' : '#fff', color: tab === t ? '#fff' : '#64748b',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 40px' }}>
        {tab === 'Overview' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {inst.description && <p style={{ fontSize: 15, lineHeight: 1.7, color: '#334155', margin: '0 0 20px' }}>{inst.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {inst.curriculum && <div><strong style={{ fontSize: 13, color: '#64748b' }}>Curriculum</strong><div style={{ fontSize: 15 }}>{inst.curriculum}</div></div>}
              {inst.sector && <div><strong style={{ fontSize: 13, color: '#64748b' }}>Sector</strong><div style={{ fontSize: 15 }}>{inst.sector}</div></div>}
              {inst.email && <div><strong style={{ fontSize: 13, color: '#64748b' }}>Email</strong><div style={{ fontSize: 15 }}>{inst.email}</div></div>}
              {inst.phone && <div><strong style={{ fontSize: 13, color: '#64748b' }}>Phone</strong><div style={{ fontSize: 15 }}>{inst.phone}</div></div>}
            </div>
            {facilities.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <strong style={{ fontSize: 14, color: '#334155' }}>Facilities</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {facilities.map((f, i) => <span key={i} style={{ padding: '4px 12px', borderRadius: 999, background: '#eef2ff', color: '#2563EB', fontSize: 13, fontWeight: 600 }}>{f}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Programs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inst.programs?.length === 0 ? <EmptyState text="No programs listed yet." /> : inst.programs?.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{p.name}</h4>
                <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {p.faculty && <span>Faculty: {p.faculty}</span>}
                  {p.duration && <span>Duration: {p.duration}</span>}
                  {p.degree && <span>Degree: {p.degree}</span>}
                  {p.fees && <span>Fees: {p.fees}</span>}
                  {p.intake && <span>Intake: {p.intake}</span>}
                </div>
                {p.entry_requirements && <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}><strong>Entry Requirements:</strong> {p.entry_requirements}</div>}
                {p.description && <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>{p.description}</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'Admission' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>Admission Information</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Contact the institution directly for admission requirements and deadlines.</p>
            {inst.email && <div style={{ marginTop: 12 }}><strong>Email:</strong> {inst.email}</div>}
            {inst.phone && <div style={{ marginTop: 4 }}><strong>Phone:</strong> {inst.phone}</div>}
            {inst.website && <div style={{ marginTop: 4 }}><strong>Website:</strong> <a href={inst.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>{inst.website}</a></div>}
          </div>
        )}

        {tab === 'Scholarships' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inst.scholarships?.length === 0 ? <EmptyState text="No scholarships listed yet." /> : inst.scholarships?.map(s => (
              <div key={s.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>💰 {s.title}</h4>
                {s.description && <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 8px' }}>{s.description}</p>}
                <div style={{ fontSize: 13, color: '#475569', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {s.amount && <span>Amount: {s.amount}</span>}
                  {s.deadline && <span style={{ color: '#dc2626' }}>Deadline: {new Date(s.deadline).toLocaleDateString()}</span>}
                </div>
                {s.eligibility && <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}><strong>Eligibility:</strong> {s.eligibility}</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'Events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inst.events?.length === 0 ? <EmptyState text="No upcoming events." /> : inst.events?.map(e => (
              <div key={e.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>📅 {e.title}</h4>
                {e.description && <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 6px' }}>{e.description}</p>}
                <div style={{ fontSize: 13, color: '#475569' }}>
                  {e.event_date && <span>{new Date(e.event_date).toLocaleDateString()}</span>}
                  {e.location && <span> · {e.location}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'News' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inst.news?.length === 0 ? <EmptyState text="No news yet." /> : inst.news?.map(n => (
              <div key={n.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>📰 {n.title}</h4>
                {n.body && <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 6px', lineHeight: 1.6 }}>{n.body}</p>}
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Gallery' && (
          <div>
            {inst.gallery?.length === 0 ? <EmptyState text="No photos yet." /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {inst.gallery?.map(g => (
                  <div key={g.id} style={{ borderRadius: 16, overflow: 'hidden', height: 180, background: `url(${g.image_url}) center/cover`, position: 'relative' }}>
                    {g.caption && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 10px', fontSize: 12 }}>{g.caption}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Contact' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 15 }}>
              {inst.email && <div>📧 <strong>Email:</strong> {inst.email}</div>}
              {inst.phone && <div>📞 <strong>Phone:</strong> {inst.phone}</div>}
              {inst.website && <div>🌐 <strong>Website:</strong> <a href={inst.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>{inst.website}</a></div>}
              {inst.address && <div>📍 <strong>Address:</strong> {inst.address}</div>}
              {inst.province && <div>🗺️ <strong>Province:</strong> {inst.province}</div>}
              {inst.district && <div>🏙️ <strong>District:</strong> {inst.district}</div>}
            </div>
            {inst.social_links && Object.keys(inst.social_links).length > 0 && (
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                {Object.entries(inst.social_links).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', borderRadius: 12, background: '#eef2ff', color: '#2563EB', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>{platform}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {showClaim && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '20px 0' }} onClick={e => e.target === e.currentTarget && setShowClaim(false)}>
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 500, width: '90%', padding: 24, margin: '20px 0' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>Claim: {inst.name}</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Submit your details to claim this institution. Admin will review your request.</p>
            {['position', 'representative_name', 'official_email', 'official_phone', 'website', 'national_id_url', 'authorization_letter_url', 'staff_card_url'].map(field => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, textTransform: 'capitalize' }}>{field.replace(/_/g, ' ').replace('url', 'URL')} {['position', 'representative_name', 'official_email'].includes(field) ? '*' : ''}</label>
                <input type={field.includes('email') ? 'email' : field.includes('url') ? 'url' : 'text'} value={claimForm[field]} onChange={e => setClaimForm({ ...claimForm, [field]: e.target.value })} placeholder={field.includes('url') ? 'Paste URL...' : ''} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
              </div>
            ))}
            {claimMsg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{claimMsg}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowClaim(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleClaim} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Submit Claim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, color: '#94a3b8' }}>{text}</div>;
}
