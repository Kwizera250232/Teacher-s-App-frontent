import { useState, useEffect } from 'react';
import { api } from '../../api';

const KIND_LABELS = {
  open: 'Opened Mfasha', chat: 'Chat questions', voice: 'Voice notes',
  stats: 'Stats views', research: 'Research + slides', inspire: 'Class inspiration',
  revision_quiz: 'Revision quizzes', parent_drafts: 'Parent drafts',
  parent_send: 'Parent sends', parents_view: 'Parent lists',
};

const KIND_ICONS = {
  open: '✨', chat: '💬', voice: '🎤', stats: '📊', research: '🔍', inspire: '🎨',
  revision_quiz: '📝', parent_drafts: '✉️', parent_send: '✅', parents_view: '👨‍👩‍👧',
};

const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function AdminMfasha({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      try { setData(await api.get('/mfasha/admin/usage', token)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Could not load Mfasha usage.</div>;

  const t = data.totals || {};
  const teachers = (data.teachers || []).filter((x) =>
    !filter || x.name?.toLowerCase().includes(filter.toLowerCase()) ||
    x.email?.toLowerCase().includes(filter.toLowerCase()) ||
    x.school?.toLowerCase().includes(filter.toLowerCase()));
  const maxEvents = Math.max(1, ...(data.daily || []).map((d) => d.users));

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>✨ Mfasha — Teacher AI usage</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          ['Active today', t.active_today, '#0e7a3d'],
          ['Active 7 days', t.active_7d, '#1565d8'],
          ['Active 30 days', t.active_30d, '#6a3fb5'],
          ['Total active (lifetime)', t.active_lifetime, '#b3540e'],
          ['Actions today', t.events_today, '#0e7a3d'],
          ['Total actions', t.total_events, '#333'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{val ?? 0}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>📈 Daily active teachers — last 30 days</h3>
          {data.daily?.length ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 110 }}>
              {data.daily.map((d) => (
                <div key={d.day} title={`${fmtDay(d.day)}: ${d.users} teacher${d.users === 1 ? '' : 's'}, ${d.events} actions`}
                  style={{ flex: 1, minWidth: 4, background: 'linear-gradient(180deg,#7db4ff,#1565d8)', borderRadius: '3px 3px 0 0', height: `${Math.max(6, (d.users / maxEvents) * 100)}%` }} />
              ))}
            </div>
          ) : <p style={{ color: '#888', fontSize: 13 }}>No usage recorded yet — stats appear as teachers start using Mfasha.</p>}
          {!!data.daily?.length && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginTop: 4 }}>
            <span>{fmtDay(data.daily[0].day)}</span><span>{fmtDay(data.daily[data.daily.length - 1].day)}</span>
          </div>}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>🧰 What teachers use most</h3>
          {data.by_kind?.length ? data.by_kind.map((k) => {
            const pct = Math.round((k.n / data.by_kind[0].n) * 100);
            return (
              <div key={k.kind} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{KIND_ICONS[k.kind] || '•'} {KIND_LABELS[k.kind] || k.kind}</span><b>{k.n}</b>
                </div>
                <div style={{ height: 6, background: '#eef2f8', borderRadius: 4, marginTop: 3 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#1565d8', borderRadius: 4 }} />
                </div>
              </div>
            );
          }) : <p style={{ color: '#888', fontSize: 13 }}>No feature usage yet.</p>}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>👨‍🏫 Teachers using Mfasha ({data.teachers?.length || 0})</h3>
          <input placeholder="Search teacher, email, school…" value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{ border: '1px solid #d7e3f5', borderRadius: 8, padding: '7px 12px', fontSize: 13, minWidth: 240 }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#777', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '8px 10px' }}>Teacher</th><th style={{ padding: '8px 10px' }}>School</th>
                <th style={{ padding: '8px 10px' }}>First used</th><th style={{ padding: '8px 10px' }}>Last used</th>
                <th style={{ padding: '8px 10px' }}>Days active</th><th style={{ padding: '8px 10px' }}>Actions</th>
                <th style={{ padding: '8px 10px' }}>Today</th><th style={{ padding: '8px 10px' }}>Top features</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((x) => {
                const top = Object.entries(x.kinds || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
                return (
                  <tr key={x.id} style={{ borderBottom: '1px solid #f0f3f8' }}>
                    <td style={{ padding: '8px 10px' }}><b>{x.name}</b><br /><span style={{ fontSize: 11, color: '#888' }}>{x.email}</span></td>
                    <td style={{ padding: '8px 10px' }}>{x.school || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{fmt(x.first_used)}</td>
                    <td style={{ padding: '8px 10px' }}>{fmt(x.last_used)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{x.days_active}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}><b>{x.events}</b></td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{x.events_today ? <span style={{ background: '#eafaf0', color: '#0e7a3d', borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>{x.events_today}</span> : '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{top.map(([k, n]) => `${KIND_ICONS[k] || ''}${KIND_LABELS[k] || k} ×${n}`).join(' · ') || '—'}</td>
                  </tr>
                );
              })}
              {!teachers.length && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#888' }}>No teachers have used Mfasha yet{filter ? ' matching this search' : ''}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
