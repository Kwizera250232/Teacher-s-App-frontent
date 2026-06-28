import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';

const CATEGORIES = ['Scholarships', 'Internships', 'Competitions', 'Volunteering', 'Jobs', 'Training', 'Hackathons', 'Conferences'];

export default function AlumniOpportunities() {
  const { token } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alumni/opportunities', token)
      .then((data) => { setOpportunities(data.opportunities || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = activeCategory === 'All' ? opportunities : opportunities.filter((o) => o.category === activeCategory);

  return (
    <AlumniLayout showTopWriters={false}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>🌟 Opportunities</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Scholarships, internships, competitions and more</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setActiveCategory('All')} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: activeCategory === 'All' ? '#667eea' : '#e2e8f0', color: activeCategory === 'All' ? '#fff' : '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: activeCategory === c ? '#667eea' : '#e2e8f0', color: activeCategory === c ? '#fff' : '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
            <h3>No opportunities yet</h3>
            <p style={{ color: '#64748b' }}>Check back soon for new opportunities!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((opp) => (
              <div key={opp.id} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ background: '#f0f7ff', color: '#667eea', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{opp.category}</span>
                    <h4 style={{ margin: '8px 0 6px', fontSize: 17, fontWeight: 700 }}>{opp.title}</h4>
                    <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{opp.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8' }}>
                  {opp.organization && <span>🏢 {opp.organization}</span>}
                  {opp.location && <span>📍 {opp.location}</span>}
                  {opp.deadline && <span>⏰ {new Date(opp.deadline).toLocaleDateString()}</span>}
                </div>
                {opp.link && (
                  <a href={opp.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, padding: '8px 18px', borderRadius: 10, background: '#667eea', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                    Apply Now →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AlumniLayout>
  );
}
