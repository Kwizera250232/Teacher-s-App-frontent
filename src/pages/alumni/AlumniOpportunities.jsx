import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AlumniLayout from '../../components/AlumniLayout';
import './AlumniOpportunities.css';

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
      <div className="opp-container">
        <h2 className="opp-title">🌟 Opportunities</h2>
        <p className="opp-subtitle">Scholarships, internships, competitions and more</p>

        <div className="opp-categories">
          <button className={`opp-category-btn ${activeCategory === 'All' ? 'active' : ''}`} onClick={() => setActiveCategory('All')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`opp-category-btn ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>{c}</button>
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
          <div className="opp-list">
            {filtered.map((opp) => (
              <div key={opp.id} className="opp-card">
                <span className="opp-card-tag">{opp.category}</span>
                <h4 className="opp-card-title">{opp.title}</h4>
                <p className="opp-card-desc">{opp.description}</p>
                <div className="opp-card-meta">
                  {opp.organization && <span>🏢 {opp.organization}</span>}
                  {opp.location && <span>📍 {opp.location}</span>}
                  {opp.deadline && <span>⏰ {new Date(opp.deadline).toLocaleDateString()}</span>}
                </div>
                {opp.link && (
                  <a href={opp.link} target="_blank" rel="noopener noreferrer" className="opp-card-link">
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
