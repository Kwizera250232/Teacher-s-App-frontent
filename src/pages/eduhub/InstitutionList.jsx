import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const HEADER_GRADIENT = 'linear-gradient(135deg, #0B5FFF 0%, #2563EB 50%, #1E40AF 100%)';
const PROVINCES = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'];

const TYPE_LABELS = { university: 'Universities', tvet: 'TVET Institutions', secondary: 'Secondary Schools' };

export default function InstitutionList({ initialType, initialSearch, onNavigate }) {
  const { token } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: initialType || 'university',
    search: initialSearch || '',
    province: '',
    is_public: '',
    sort: 'featured',
  });
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: LIMIT, offset: page * LIMIT, sort: filters.sort });
    if (filters.type) params.set('type', filters.type);
    if (filters.search) params.set('search', filters.search);
    if (filters.province) params.set('province', filters.province);
    if (filters.is_public !== '') params.set('is_public', filters.is_public);
    api.get(`/education-hub/institutions?${params}`, token)
      .then(data => { setInstitutions(data.institutions || []); setTotal(data.total || 0); })
      .catch(() => { setInstitutions([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [filters, page, token]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: HEADER_GRADIENT, padding: '28px 20px 24px', width: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button onClick={() => onNavigate('home')} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>← Back to Hub</button>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 16px' }}>{TYPE_LABELS[filters.type] || 'Institutions'}</h1>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 16, padding: '0 16px', maxWidth: 600 }}>
            <span style={{ fontSize: 18, color: '#94a3b8' }}>🔍</span>
            <input type="text" value={filters.search} onChange={e => updateFilter('search', e.target.value)} placeholder="Search institutions..." style={{ flex: 1, border: 'none', outline: 'none', padding: '12px', fontSize: 15, background: 'transparent' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => updateFilter('type', key)} style={{
              padding: '8px 18px', borderRadius: 12, border: filters.type === key ? '2px solid #2563EB' : '2px solid #e2e8f0',
              background: filters.type === key ? '#2563EB' : '#fff', color: filters.type === key ? '#fff' : '#64748b',
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>{label}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={filters.province} onChange={e => updateFilter('province', e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
            <option value="">All Provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.is_public} onChange={e => updateFilter('is_public', e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
            <option value="">Public & Private</option>
            <option value="true">Public Only</option>
            <option value="false">Private Only</option>
          </select>
          <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
            <option value="featured">Sort: Featured</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>

        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{total} institution{total !== 1 ? 's' : ''} found</div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading...</div>
        ) : institutions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
            <p style={{ color: '#64748b' }}>No institutions found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {institutions.map(inst => (
              <div key={inst.id} onClick={() => onNavigate('institution', { id: inst.id })} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform .15s, boxShadow .15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}>
                <div style={{ height: 120, background: inst.banner_url ? `url(${inst.banner_url}) center/cover` : HEADER_GRADIENT, position: 'relative' }}>
                  {inst.is_featured && <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#2563EB' }}>⭐</span>}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {inst.logo_url ? <img src={inst.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{inst.type === 'university' ? '🎓' : inst.type === 'tvet' ? '🔧' : '🏫'}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.name}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {inst.verified && <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>✓ Verified</span>}
                        {inst.rating > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>⭐ {inst.rating}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>📍 {inst.province || 'Rwanda'}{inst.district ? `, ${inst.district}` : ''}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{inst.is_public ? 'Public' : 'Private'} · {inst.is_boarding ? 'Boarding' : 'Day'}</div>
                  <button style={{ width: '100%', marginTop: 10, padding: '8px', borderRadius: 12, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View Profile</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontWeight: 600 }}>← Prev</button>
            <span style={{ padding: '8px 14px', fontSize: 14, color: '#64748b' }}>Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
            <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: (page + 1) * LIMIT >= total ? 'default' : 'pointer', opacity: (page + 1) * LIMIT >= total ? 0.4 : 1, fontWeight: 600 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
