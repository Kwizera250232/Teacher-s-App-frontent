import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function StaffQuickActions({ token, basePath, firstClassId, onAddStudents }) {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    setMsg('Link copied to clipboard.');
    setTimeout(() => setMsg(''), 3000);
  };

  const teacherInvite = async () => {
    setErr('');
    try {
      const data = await api.post('/classes/school/teacher-invite-link', {}, token);
      await copy(data.invite_link);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="staff-quick-actions" style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem',
      padding: '0.75rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
    }}>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onAddStudents}>
        ➕ Add students
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={teacherInvite}>
        👨‍🏫 Teacher invite link
      </button>
      {firstClassId && (
        <Link to={`${basePath}/classes/${firstClassId}`} className="btn btn-outline btn-sm">
          👪 Parent invites (per student)
        </Link>
      )}
      {msg && <span style={{ color: '#166534', fontSize: '0.85rem', width: '100%' }}>{msg}</span>}
      {err && <span style={{ color: '#dc2626', fontSize: '0.85rem', width: '100%' }}>{err}</span>}
    </div>
  );
}
