import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

const statCard = (accent) => ({
  flex: '1 1 140px', minWidth: 130, borderRadius: 14, padding: '14px 16px',
  background: `linear-gradient(135deg, ${accent}14, ${accent}08)`,
  border: `1px solid ${accent}30`,
});
const statNum = { fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 };
const statLbl = { fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 2 };

const TYPE_META = { mid_term: 'MT', end_term: 'ET', yearly: 'YR' };
const TYPE_NAME = { mid_term: '📄 Mid-Term', end_term: '📑 End-Term', yearly: '📅 Yearly' };
const AV_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const initials = (name) => String(name || '?').trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

function ReportChip({ r }) {
  const ok = r.status === 'approved';
  return (
    <span
      title={`${TYPE_NAME[r.report_type] || r.report_type} ${r.term && r.term !== 'Year' ? `Term ${r.term}` : 'Yearly'} — ${r.student_count || 0} reports — ${ok ? 'approved & locked' : 'pending review'}`}
      style={{
        fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
        background: ok ? '#dcfce7' : '#fef3c7', color: ok ? '#166534' : '#92400e',
        border: `1px solid ${ok ? '#86efac' : '#fcd34d'}`,
      }}
    >
      {ok ? '✅' : '⏳'} {TYPE_META[r.report_type] || 'RP'}·{r.term || '—'}
    </span>
  );
}

function TeacherRow({ t, i }) {
  const [open, setOpen] = useState(false);
  const color = AV_COLORS[i % AV_COLORS.length];
  return (
    <div style={{ borderTop: '1px solid #f1f5f9' }}>
      <button
        type="button" onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0,
        }}>
          {initials(t.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
          <div style={{ fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email || ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 9px', borderRadius: 20 }}>
            {t.class_count} class{t.class_count === 1 ? '' : 'es'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 9px', borderRadius: 20 }}>
            {t.student_count} students
          </span>
          {t.pending > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#92400e', background: '#fef3c7', padding: '3px 9px', borderRadius: 20 }}>
              ⏳ {t.pending} to review
            </span>
          )}
          {t.approved > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '3px 9px', borderRadius: 20 }}>
              🔒 {t.approved}
            </span>
          )}
        </div>
        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 4px 12px 50px' }}>
          {!t.classes.length && <p style={{ margin: '4px 0', fontSize: 12.5, color: '#94a3b8' }}>No classes created yet.</p>}
          {t.classes.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '7px 10px', marginBottom: 6, border: '1px solid #f1f5f9', borderRadius: 10, background: '#fafbfc' }}>
              <strong style={{ fontSize: 13 }}>{c.name}</strong>
              {c.subject && <span style={{ fontSize: 11.5, color: '#64748b' }}>· {c.subject}</span>}
              {c.grade && <span style={{ fontSize: 11.5, color: '#64748b' }}>· {c.grade}</span>}
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#e2e8f0', padding: '2px 8px', borderRadius: 20 }}>
                {c.students} 👥
              </span>
              <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginLeft: 'auto' }}>
                {!c.reports.length && <span style={{ fontSize: 11, color: '#cbd5e1' }}>no reports yet</span>}
                {c.reports.slice(0, 8).map((r, ri) => <ReportChip key={ri} r={r} />)}
                {c.reports.length > 8 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{c.reports.length - 8}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HtOverviewPanel({ token, onError, onGoReports, onGoSchool }) {
  const [data, setData] = useState(null);
  const [teachers, setTeachers] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/catmarks/school-overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (alive) setData(d); })
      .catch((e) => onError?.(e.message || 'Could not load the school overview.'));
    fetch(`${API_BASE}/catmarks/school-teachers`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (alive) setTeachers(d.teachers || []); })
      .catch(() => { if (alive) setTeachers([]); });
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

      {/* Teachers & classes — the MIS directory */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '6px 14px 10px', background: '#fff', marginBottom: 16 }}>
        <h3 style={{ margin: '10px 0 4px', fontSize: 15 }}>👩‍🏫 Teachers & their classes</h3>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94a3b8' }}>
          Tap a teacher to see their classes and which report cards were submitted. ⏳ = waiting for you · ✅ = approved &amp; locked.
        </p>
        {teachers === null && <p style={{ fontSize: 13, color: '#64748b' }}>Loading staff…</p>}
        {teachers !== null && !teachers.length && (
          <p style={{ margin: '8px 0', fontSize: 13, color: '#94a3b8' }}>No teachers in the school yet — approve join requests or add teachers from the School tab.</p>
        )}
        {(teachers || []).map((t, i) => <TeacherRow key={t.id} t={t} i={i} />)}
      </div>

      {/* Recent submissions */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#fff' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>🕘 Latest report submissions</h3>
        {!(data.recent || []).length && (
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Nothing yet — when teachers send report cards, they appear here.</p>
        )}
        {(data.recent || []).map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid #f1f5f9', fontSize: 13 }}>
            <span>{TYPE_NAME[s.report_type] || 'Report'}</span>
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
