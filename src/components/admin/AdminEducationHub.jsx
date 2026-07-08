import { useState, useEffect } from 'react';
import { api, uploadFile, API_BASE } from '../../api';

const TABS = [
  { key: 'institutions', label: 'Institutions', icon: '🏫' },
  { key: 'claims', label: 'Claims', icon: '📋' },
  { key: 'scholarships', label: 'Scholarships', icon: '💰' },
  { key: 'jobs', label: 'Jobs', icon: '💼' },
  { key: 'internships', label: 'Internships', icon: '🎓' },
  { key: 'careers', label: 'Careers', icon: '🎯' },
  { key: 'mentors', label: 'Mentors', icon: '🧑‍🏫' },
  { key: 'questions', label: 'Career Questions', icon: '❓' },
];

const INST_TYPES = [
  { value: 'university', label: 'University' },
  { value: 'tvet', label: 'TVET' },
  { value: 'secondary', label: 'Secondary School' },
];

const PROVINCES = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'];

export default function AdminEducationHub({ token }) {
  const [tab, setTab] = useState('institutions');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (field, file) => {
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const formData = new FormData();
      formData.append(field, file);
      const result = await uploadFile('/education-hub/admin/upload-image', formData, token);
      const urlKey = field === 'banner' ? 'banner_url' : 'logo_url';
      setForm(prev => ({ ...prev, [urlKey]: result[urlKey] }));
      setMsg(`✅ ${field === 'banner' ? 'Banner' : 'Logo'} uploaded`);
    } catch (e) {
      setMsg(e.message || 'Upload failed');
    }
    setUploading(false);
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/education-hub/institutions?limit=100', token).catch(() => ({ institutions: [] })),
      api.get('/education-hub/admin/claims', token).catch(() => ({ claims: [] })),
      api.get('/education-hub/scholarships?limit=100', token).catch(() => ({ scholarships: [] })),
      api.get('/education-hub/jobs', token).catch(() => ({ jobs: [] })),
      api.get('/education-hub/internships', token).catch(() => ({ internships: [] })),
      api.get('/education-hub/careers', token).catch(() => ({ careers: [] })),
      api.get('/education-hub/mentorship', token).catch(() => ({ mentors: [] })),
      api.get('/education-hub/career-questions', token).catch(() => ({ questions: [] })),
      api.get('/education-hub/admin/stats', token).catch(() => ({})),
    ]).then(([inst, claims, sch, jobs, intern, careers, mentors, questions, stats]) => {
      setData({
        institutions: inst.institutions || [],
        claims: claims.claims || [],
        scholarships: sch.scholarships || [],
        jobs: jobs.jobs || [],
        internships: intern.internships || [],
        careers: careers.careers || [],
        mentors: mentors.mentors || [],
        questions: questions.questions || [],
        stats: stats || {},
      });
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [token]);

  const submit = async (endpoint, body, method = 'POST') => {
    setMsg('');
    try {
      if (method === 'POST') await api.post(endpoint, body, token);
      else if (method === 'DELETE') await api.delete(endpoint, token);
      else if (method === 'PUT') await api.put(endpoint, body, token);
      setMsg('✅ Success');
      setShowForm(null);
      setForm({});
      load();
    } catch (e) {
      setMsg(e.message || 'Failed');
    }
  };

  const handleClaimAction = (claimId, action) => {
    submit(`/education-hub/admin/claims/${claimId}/${action}`, {}, 'POST');
  };

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, marginBottom: 10 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>🎓 Education Hub Management</h2>

      {/* Stats */}
      {data.stats?.institutions && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {data.stats.institutions.map(s => (
            <div key={s.type} style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>{s.count}</div>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{s.type}s</div>
            </div>
          ))}
          {data.stats.claims?.map(c => (
            <div key={c.status} style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{c.count}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{c.status} claims</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(null); }} style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === t.key ? '#2563EB' : '#f1f5f9', color: tab === t.key ? '#fff' : '#475569',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {msg && <div style={{ background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#166534' : '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{msg}</div>}

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div> : (
        <>
          {/* INSTITUTIONS */}
          {tab === 'institutions' && (
            <div>
              <button onClick={() => { setShowForm('institution'); setForm({ type: 'university', is_public: true, is_day: true, is_featured: false }); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>+ Add Institution</button>
              {showForm === 'institution' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 12px' }}>New Institution</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Name *</label><input style={inputStyle} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div><label style={labelStyle}>Type *</label><select style={inputStyle} value={form.type || 'university'} onChange={e => setForm({ ...form, type: e.target.value })}>{INST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div><label style={labelStyle}>Province</label><select style={inputStyle} value={form.province || ''} onChange={e => setForm({ ...form, province: e.target.value })}><option value="">—</option>{PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                    <div><label style={labelStyle}>District</label><input style={inputStyle} value={form.district || ''} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
                    <div><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                    <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                    <div><label style={labelStyle}>Website</label><input style={inputStyle} value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
                    <div><label style={labelStyle}>Banner Image</label>
                      {form.banner_url && <img src={form.banner_url.startsWith('http') ? form.banner_url : API_BASE + form.banner_url} alt="banner" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                      <input type="file" accept="image/*" onChange={e => handleImageUpload('banner', e.target.files[0])} style={{ fontSize: 13, marginBottom: 6 }} />
                      {form.banner_url && <button onClick={() => setForm({ ...form, banner_url: '' })} style={{ fontSize: 11, color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>Remove banner</button>}
                    </div>
                    <div><label style={labelStyle}>Logo Image</label>
                      {form.logo_url && <img src={form.logo_url.startsWith('http') ? form.logo_url : API_BASE + form.logo_url} alt="logo" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                      <input type="file" accept="image/*" onChange={e => handleImageUpload('logo', e.target.files[0])} style={{ fontSize: 13, marginBottom: 6 }} />
                      {form.logo_url && <button onClick={() => setForm({ ...form, logo_url: '' })} style={{ fontSize: 11, color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>Remove logo</button>}
                    </div>
                    <div><label style={labelStyle}>Curriculum</label><input style={inputStyle} value={form.curriculum || ''} onChange={e => setForm({ ...form, curriculum: e.target.value })} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, margin: '8px 0' }}>
                    <label><input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} /> Public</label>
                    <label><input type="checkbox" checked={form.is_boarding} onChange={e => setForm({ ...form, is_boarding: e.target.checked })} /> Boarding</label>
                    <label><input type="checkbox" checked={form.is_day} onChange={e => setForm({ ...form, is_day: e.target.checked })} /> Day</label>
                    <label><input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
                  </div>
                  <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => submit('/education-hub/admin/institutions', form)} disabled={uploading} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: uploading ? '#94a3b8' : '#2563EB', color: '#fff', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer' }}>{uploading ? 'Uploading...' : 'Create'}</button>
                    <button onClick={() => setShowForm(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.institutions.map(inst => (
                  <div key={inst.id} style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div>
                      <strong>{inst.name}</strong>
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>{inst.type} · {inst.province || '—'} {inst.verified ? '· ✓' : ''} {inst.is_featured ? '· ⭐' : ''}</span>
                    </div>
                    <button onClick={() => { if (confirm('Delete?')) submit(`/education-hub/admin/institutions/${inst.id}`, {}, 'DELETE'); }} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Delete</button>
                  </div>
                ))}
                {data.institutions.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No institutions yet.</p>}
              </div>
            </div>
          )}

          {/* CLAIMS */}
          {tab === 'claims' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.claims.map(c => (
                <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div><strong>{c.institution_name}</strong> <span style={{ fontSize: 12, color: '#64748b' }}>({c.institution_type})</span></div>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: c.status === 'pending' ? '#fef3c7' : c.status === 'approved' ? '#dcfce7' : '#fee2e2', color: c.status === 'pending' ? '#92400e' : c.status === 'approved' ? '#166534' : '#dc2626' }}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    <div><strong>Claimed by:</strong> {c.user_name} ({c.user_email})</div>
                    <div><strong>Position:</strong> {c.position} · <strong>Rep:</strong> {c.representative_name}</div>
                    <div><strong>Official Email:</strong> {c.official_email} · <strong>Phone:</strong> {c.official_phone || '—'}</div>
                    {c.national_id_url && <div><a href={c.national_id_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>National ID</a></div>}
                    {c.authorization_letter_url && <div><a href={c.authorization_letter_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>Authorization Letter</a></div>}
                  </div>
                  {c.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={() => handleClaimAction(c.id, 'approved')} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Approve</button>
                      <button onClick={() => handleClaimAction(c.id, 'rejected')} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Reject</button>
                      <button onClick={() => handleClaimAction(c.id, 'info_requested')} style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #f59e0b', background: '#fff', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Request Info</button>
                    </div>
                  )}
                </div>
              ))}
              {data.claims.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No claims yet.</p>}
            </div>
          )}

          {/* SCHOLARSHIPS */}
          {tab === 'scholarships' && (
            <div>
              <button onClick={() => { setShowForm('scholarship'); setForm({}); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>+ Add Scholarship</button>
              {showForm === 'scholarship' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px' }}>New Scholarship</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><label style={labelStyle}>Institution ID</label><input style={inputStyle} type="number" value={form.institution_id || ''} onChange={e => setForm({ ...form, institution_id: e.target.value })} /></div>
                    <div><label style={labelStyle}>Amount</label><input style={inputStyle} value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                    <div><label style={labelStyle}>Deadline</label><input style={inputStyle} type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                    <div><label style={labelStyle}>Link</label><input style={inputStyle} value={form.link || ''} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
                  </div>
                  <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label style={labelStyle}>Eligibility</label><textarea style={{ ...inputStyle, minHeight: 40 }} value={form.eligibility || ''} onChange={e => setForm({ ...form, eligibility: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: 10 }}><button onClick={() => submit(form.institution_id ? `/education-hub/admin/institutions/${form.institution_id}/scholarships` : '/education-hub/admin/institutions/0/scholarships', form)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button><button onClick={() => setShowForm(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button></div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.scholarships.map(s => <div key={s.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}><strong>{s.title}</strong> <span style={{ fontSize: 12, color: '#64748b' }}>{s.institution_name || ''} {s.deadline ? `· Deadline: ${s.deadline}` : ''}</span></div>)}
                {data.scholarships.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No scholarships yet.</p>}
              </div>
            </div>
          )}

          {/* JOBS */}
          {tab === 'jobs' && (
            <div>
              <button onClick={() => { setShowForm('job'); setForm({}); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>+ Add Job</button>
              {showForm === 'job' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px' }}>New Job</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><label style={labelStyle}>Company</label><input style={inputStyle} value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                    <div><label style={labelStyle}>Location</label><input style={inputStyle} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                    <div><label style={labelStyle}>Salary</label><input style={inputStyle} value={form.salary || ''} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                    <div><label style={labelStyle}>Deadline</label><input style={inputStyle} type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                    <div><label style={labelStyle}>Link</label><input style={inputStyle} value={form.link || ''} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
                  </div>
                  <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label style={labelStyle}>Requirements</label><textarea style={{ ...inputStyle, minHeight: 40 }} value={form.requirements || ''} onChange={e => setForm({ ...form, requirements: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: 10 }}><button onClick={() => submit('/education-hub/admin/jobs', form)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button><button onClick={() => setShowForm(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button></div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.jobs.map(j => <div key={j.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}><strong>{j.title}</strong> <span style={{ fontSize: 12, color: '#64748b' }}>{j.company} · {j.location}</span></div>)}
                {data.jobs.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No jobs yet.</p>}
              </div>
            </div>
          )}

          {/* INTERNSHIPS */}
          {tab === 'internships' && (
            <div>
              <button onClick={() => { setShowForm('internship'); setForm({}); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>+ Add Internship</button>
              {showForm === 'internship' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px' }}>New Internship</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><label style={labelStyle}>Company</label><input style={inputStyle} value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                    <div><label style={labelStyle}>Location</label><input style={inputStyle} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                    <div><label style={labelStyle}>Duration</label><input style={inputStyle} value={form.duration || ''} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
                    <div><label style={labelStyle}>Deadline</label><input style={inputStyle} type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                    <div><label style={labelStyle}>Link</label><input style={inputStyle} value={form.link || ''} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
                  </div>
                  <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label style={labelStyle}>Requirements</label><textarea style={{ ...inputStyle, minHeight: 40 }} value={form.requirements || ''} onChange={e => setForm({ ...form, requirements: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: 10 }}><button onClick={() => submit('/education-hub/admin/internships', form)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button><button onClick={() => setShowForm(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button></div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.internships.map(i => <div key={i.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}><strong>{i.title}</strong> <span style={{ fontSize: 12, color: '#64748b' }}>{i.company} · {i.duration}</span></div>)}
                {data.internships.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No internships yet.</p>}
              </div>
            </div>
          )}

          {/* CAREERS */}
          {tab === 'careers' && (
            <div>
              <button onClick={() => { setShowForm('career'); setForm({}); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>+ Add Career</button>
              {showForm === 'career' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px' }}>New Career</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><label style={labelStyle}>Category</label><input style={inputStyle} value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                    <div><label style={labelStyle}>Future Demand</label><input style={inputStyle} value={form.future_demand || ''} onChange={e => setForm({ ...form, future_demand: e.target.value })} /></div>
                    <div><label style={labelStyle}>Estimated Salary</label><input style={inputStyle} value={form.estimated_salary || ''} onChange={e => setForm({ ...form, estimated_salary: e.target.value })} /></div>
                    <div><label style={labelStyle}>Video URL</label><input style={inputStyle} value={form.video_url || ''} onChange={e => setForm({ ...form, video_url: e.target.value })} /></div>
                  </div>
                  <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div><label style={labelStyle}>Skills Required</label><input style={inputStyle} value={form.skills_required || ''} onChange={e => setForm({ ...form, skills_required: e.target.value })} /></div>
                  <div><label style={labelStyle}>Subjects to Focus</label><input style={inputStyle} value={form.subjects_to_focus || ''} onChange={e => setForm({ ...form, subjects_to_focus: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: 10 }}><button onClick={() => submit('/education-hub/admin/careers', form)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button><button onClick={() => setShowForm(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button></div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.careers.map(c => <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}><strong>{c.title}</strong> <span style={{ fontSize: 12, color: '#64748b' }}>{c.category || ''} {c.future_demand ? `· Demand: ${c.future_demand}` : ''}</span></div>)}
                {data.careers.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No careers yet.</p>}
              </div>
            </div>
          )}

          {/* MENTORS */}
          {tab === 'mentors' && (
            <div>
              <button onClick={() => { setShowForm('mentor'); setForm({ is_available: true }); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>+ Add Mentor</button>
              {showForm === 'mentor' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px' }}>New Mentor</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={labelStyle}>Name *</label><input style={inputStyle} value={form.mentor_name || ''} onChange={e => setForm({ ...form, mentor_name: e.target.value })} /></div>
                    <div><label style={labelStyle}>Title</label><input style={inputStyle} value={form.mentor_title || ''} onChange={e => setForm({ ...form, mentor_title: e.target.value })} /></div>
                    <div><label style={labelStyle}>Expertise</label><input style={inputStyle} value={form.expertise || ''} onChange={e => setForm({ ...form, expertise: e.target.value })} /></div>
                    <div><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                    <div><label style={labelStyle}>LinkedIn</label><input style={inputStyle} value={form.linkedin || ''} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div>
                    <div><label style={labelStyle}>Photo URL</label><input style={inputStyle} value={form.photo_url || ''} onChange={e => setForm({ ...form, photo_url: e.target.value })} /></div>
                  </div>
                  <div><label style={labelStyle}>Bio</label><textarea style={{ ...inputStyle, minHeight: 50 }} value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
                  <div style={{ display: 'flex', gap: 10 }}><button onClick={() => submit('/education-hub/admin/mentors', form)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button><button onClick={() => setShowForm(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button></div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.mentors.map(m => <div key={m.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}><strong>{m.mentor_name}</strong> <span style={{ fontSize: 12, color: '#64748b' }}>{m.mentor_title} · {m.expertise} {m.is_available ? '· Available' : ''}</span></div>)}
                {data.mentors.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No mentors yet.</p>}
              </div>
            </div>
          )}

          {/* CAREER QUESTIONS */}
          {tab === 'questions' && (
            <div>
              <button onClick={() => { setShowForm('question'); setForm({ options: ['', '', '', ''], trait_scores: {} }); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>+ Add Question</button>
              {showForm === 'question' && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px' }}>New Career Question</h3>
                  <div><label style={labelStyle}>Question *</label><input style={inputStyle} value={form.question || ''} onChange={e => setForm({ ...form, question: e.target.value })} /></div>
                  <label style={labelStyle}>Options (one per line)</label>
                  {(form.options || []).map((opt, i) => (
                    <input key={i} style={inputStyle} value={opt} placeholder={`Option ${String.fromCharCode(65 + i)}`} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }} />
                  ))}
                  <div><label style={labelStyle}>Order</label><input style={inputStyle} type="number" value={form.order_num || 0} onChange={e => setForm({ ...form, order_num: parseInt(e.target.value) || 0 })} /></div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Trait scores are auto-generated based on option index. Admin can edit later.</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => {
                      const ts = {};
                      (form.options || []).forEach((_, i) => { ts[String(i)] = { analytical: i === 0 ? 3 : 1, social: i === 1 ? 3 : 1, creative: i === 2 ? 3 : 1, practical: i === 3 ? 3 : 1 }; });
                      submit('/education-hub/admin/career-questions', { ...form, trait_scores: ts });
                    }} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create</button>
                    <button onClick={() => setShowForm(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.questions.map(q => <div key={q.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}><strong>Q{q.order_num || q.id}:</strong> {q.question} <span style={{ fontSize: 12, color: '#64748b' }}>· {(q.options || []).length} options</span></div>)}
                {data.questions.length === 0 && <p style={{ color: '#94a3b8', padding: 20 }}>No career questions yet. Add some for the AI Career Assessment.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
