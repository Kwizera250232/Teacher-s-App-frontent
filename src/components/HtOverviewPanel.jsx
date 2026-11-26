import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

const statCard = (accent) => ({
  flex: '1 1 140px', minWidth: 130, borderRadius: 14, padding: '14px 16px',
  background: `linear-gradient(135deg, ${accent}14, ${accent}08)`,
  border: `1px solid ${accent}30`,
});
const statNum = { fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 };
const statLbl = { fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 2 };

const TYPE_META = { mid_term: '📄 Mid-Term', end_term: '📑 End-Term', yearly: '📅 Yearly' };

export default function HtOverviewPanel({ token, onError, onGoReports, onGoSchool }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/catmarks/school-overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (alive) setData(d); })
      .catch((e) => onError?.(e.message || 'Could not load the school overview.'));
    return () => { alive = false; };
  }, [token]); // eslint-disable-line

  if (!data) return <p style={{ color: '#64748b', padding: '20px 4px' }}>Loading school overview…</p>;
  if (!data.school) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏫</div>
        <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>No school linked yet</h3>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Link your school to see teachers, reports and approvals here.</p>
      </div>
    );
  }

  const stats = [
    { n: data.teachers, l: 'Teachers', a: '#2563eb' },
    { n: data.classes, l: 'Classes', a: '#7c3aed' },
    { n: data.students, l: 'Students', a: '#0ea5e9' },
    { n: data.pending, l: 'Reports to review', a: '#d97706' },
    { n: data.approved, l: 'Approved', a: '#16a34a' },
    { n: data.join_requests || 0, l: 'Join requests', a: '#dc2626' },
  ];

  return (
    <div>
      {/* School header */}
      <div style={{
        borderRadius: 16, padding: '18px 20px', marginBottom: 16, color: '#fff',
        background: 'linear-gradient(120deg, #0f3d2e 0%, #075e54 55%, #0b7a5e 100%)',
        boxShadow: '0 10px 30px rgba(7,94,84,0.25)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>Head Teacher — School Office</div>
        <h2 style={{ margin: '4px 0 2px', fontSize: 22 }}>🏫 {data.school.name}</h2>
        <div style={{ fontSize: 12.5, opacity: 0.85 }}>
          {[data.school.district, data.school.sector].filter(Boolean).join(' · ') || 'School dashboard'}
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {stats.map((s) => (
          <div key={s.l} style={statCard(s.a)}>
            <div style={{ ...statNum, color: s.a }}>{s.n}</div>
            <div style={statLbl}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Pending approvals callout */}
      {data.pending > 0 && (
        <button
          type="button" onClick={onGoReports}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', border: '1.5px solid #f59e0b', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, background: '#fffbeb', fontSize: 14, fontWeight: 700, color: '#92400e',
          }}
        >
          ⏳ {data.pending} report set{data.pending > 1 ? 's' : ''} waiting for your review — open Reports →
        </button>
      )}

      {(data.join_requests || 0) > 0 && (
        <button
          type="button" onClick={onGoSchool}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', border: '1.5px solid #60a5fa', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, background: '#eff6ff', fontSize: 14, fontWeight: 700, color: '#1d4ed8',
          }}
        >
          👤 {data.join_requests} teacher{data.join_requests > 1 ? 's' : ''} waiting to join the school — open School →
        </button>
      )}

      {/* Recent submissions */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>🕘 Latest report submissions</h3>
        {!(data.recent || []).length && (
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Nothing yet — when teachers send report cards, they appear here.</p>
        )}
        {(data.recent || []).map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid #f1f5f9', fontSize: 13 }}>
            <span>{TYPE_META[s.report_type] || '📄 Report'}</span>
            <strong>{s.class_name || 'Class'}</strong>
            <span style={{ color: '#64748b' }}>{s.teacher_name}</span>
            {s.term && s.term !== 'Year' && <span style={{ color: '#64748b' }}>· Term {s.term}</span>}
            <span style={{
              marginLeft: 'auto', fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
              background: s.status === 'approved' ? '#dcfce7' : '#fef3c7',
              color: s.status === 'approved' ? '#166534' : '#92400e',
            }}>
              {s.status === 'approved' ? '🔒 Approved' : '⏳ Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
