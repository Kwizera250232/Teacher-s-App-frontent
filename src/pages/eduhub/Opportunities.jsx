import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const HEADER_GRADIENT = 'linear-gradient(135deg, #0B5FFF 0%, #2563EB 50%, #1E40AF 100%)';

const TABS = [
  { key: 'scholarships', label: 'Scholarships', icon: '💰', endpoint: '/education-hub/scholarships', dataKey: 'scholarships' },
  { key: 'jobs', label: 'Jobs', icon: '💼', endpoint: '/education-hub/jobs', dataKey: 'jobs' },
  { key: 'internships', label: 'Internships', icon: '🎓', endpoint: '/education-hub/internships', dataKey: 'internships' },
  { key: 'mentorship', label: 'Mentorship', icon: '🧑‍🏫', endpoint: '/education-hub/mentorship', dataKey: 'mentors' },
];

export default function Opportunities({ initialTab, onNavigate }) {
  const { token } = useAuth();
  const [tab, setTab] = useState(initialTab || 'scholarships');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = TABS.find(t => t.key === tab) || TABS[0];
    api.get(t.endpoint, token)
      .then(data => setItems(data[t.dataKey] || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab, token]);

  const activeTab = TABS.find(t => t.key === tab) || TABS[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: HEADER_GRADIENT, padding: '28px 20px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button onClick={() => onNavigate('home')} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>← Back to Hub</button>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>{activeTab.icon} {activeTab.label}</h1>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 18px', borderRadius: 12, border: tab === t.key ? '2px solid #2563EB' : '2px solid #e2e8f0',
              background: tab === t.key ? '#2563EB' : '#fff', color: tab === t.key ? '#fff' : '#64748b',
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{activeTab.icon}</div>
            <p style={{ color: '#64748b' }}>No {activeTab.label.toLowerCase()} available yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {items.map((item, i) => (
              <div key={item.id || i} style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {tab === 'mentorship' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      {item.photo_url ? <img src={item.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} /> : <div style={{ width: 56, height: 56, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧑‍🏫</div>}
                      <div>
                        <h4 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700 }}>{item.mentor_name}</h4>
                        {item.mentor_title && <div style={{ fontSize: 13, color: '#64748b' }}>{item.mentor_title}</div>}
                      </div>
                    </div>
                    {item.expertise && <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, marginBottom: 6 }}>Expertise: {item.expertise}</div>}
                    {item.bio && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{item.bio}</p>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {item.email && <a href={`mailto:${item.email}`} style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none' }}>📧 {item.email}</a>}
                      {item.linkedin && <a href={item.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none' }}>LinkedIn</a>}
                    </div>
                    {item.is_available && <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 600 }}>Available</span>}
                  </>
                ) : (
                  <>
                    <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{item.title}</h4>
                    {(item.company || item.institution_name) && <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, marginBottom: 6 }}>{item.company || item.institution_name}</div>}
                    {item.description && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{item.description?.slice(0, 120)}{item.description?.length > 120 ? '...' : ''}</p>}
                    <div style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {item.location && <span>📍 {item.location}</span>}
                      {item.amount && <span style={{ color: '#059669', fontWeight: 700 }}>💰 {item.amount}</span>}
                      {item.salary && <span>💵 {item.salary}</span>}
                      {item.duration && <span>⏱ {item.duration}</span>}
                      {item.deadline && <span style={{ color: '#dc2626' }}>Deadline: {new Date(item.deadline).toLocaleDateString()}</span>}
                    </div>
                    {item.eligibility && <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}><strong>Eligibility:</strong> {item.eligibility}</div>}
                    {item.requirements && <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}><strong>Requirements:</strong> {item.requirements}</div>}
                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, padding: '6px 16px', borderRadius: 10, background: '#2563EB', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>Apply / Learn More →</a>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
