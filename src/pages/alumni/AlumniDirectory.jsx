import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function AlumniDirectory() {
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [search, setSearch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (graduationYear) params.set('graduation_year', graduationYear);
      const data = await api.get(`/alumni/directory?${params}`);
      setAlumni(data.alumni || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, graduationYear, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ marginBottom: 4 }}>🎓 Alumni Directory</h2>
      <p style={{ color: '#64748b', marginBottom: 20 }}>
        Connect with fellow graduates. Search by name, occupation, or year.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search alumni..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <input
          type="number"
          placeholder="Graduation year"
          value={graduationYear}
          onChange={(e) => { setGraduationYear(e.target.value); setPage(1); }}
          style={{ width: 140, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : alumni.length === 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 40, textAlign: 'center', color: '#64748b' }}>
          No alumni found. Try different search terms.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {alumni.map((a) => (
            <div key={a.id} style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }} onClick={() => navigate(`/alumni/profile/${a.username || a.id}`)}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: a.cover_photo_path ? `url(${a.cover_photo_path}) center/cover` : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 12,
              }}>
                {!a.cover_photo_path && (a.name?.[0] || '?')}
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>{a.name}</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                {a.current_occupation || a.current_school_or_uni || 'Alumni'}
              </p>
              <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                {a.graduation_year && `Class of ${a.graduation_year}`} · {a.school_name}
              </div>
              {a.is_verified && (
                <span style={{ color: '#2563eb', fontSize: 12, marginTop: 4, display: 'inline-block' }}>✓ Verified</span>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '8px 12px', color: '#64748b' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
