import { useState, useEffect } from 'react';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';

function TeacherPickCard({ teacher, selected, onSelect }) {
  if (!teacher) return null;
  return (
    <button
      type="button"
      onClick={() => onSelect(String(teacher.id))}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        marginBottom: 12,
        borderRadius: 10,
        border: selected ? '2px solid #075e54' : '2px solid #e2e8f0',
        background: selected ? '#ecfdf5' : 'white',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
        {teacher.name}
        {teacher.is_verified && (
          <VerifiedBadge
            size={14}
            info={{
              items: [
                { icon: '✓', label: 'Verified', value: 'Approved teacher at your school' },
                {
                  icon: '👤',
                  label: 'Role',
                  value: teacher.role === 'head_teacher' ? 'Head teacher' : 'Teacher',
                },
              ],
            }}
          />
        )}
      </div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{teacher.email}</div>
      <div style={{ fontSize: 12, color: '#075e54', marginTop: 6 }}>
        {selected ? 'Selected — ready to send invitation' : 'Tap to select this teacher'}
      </div>
    </button>
  );
}

export default function QuizColleagueShareModal({ classId, quizId, quizTitle, onClose, onSent, token }) {
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState('');
  const [emailLookup, setEmailLookup] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundByEmail, setFoundByEmail] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/quiz-teacher-shares/colleagues', token)
      .then((rows) => {
        setColleagues(rows);
        if (rows.length) setRecipientId(String(rows[0].id));
      })
      .catch((e) => setError(e.message || 'Could not load school teachers.'))
      .finally(() => setLoading(false));
  }, [token]);

  const lookupTeacher = async (e) => {
    e?.preventDefault();
    const email = emailLookup.trim();
    if (!email) {
      setError('Enter the teacher\'s email address.');
      return;
    }
    setLookupLoading(true);
    setError('');
    setFoundByEmail(null);
    try {
      const data = await api.get(
        `/quiz-teacher-shares/lookup?email=${encodeURIComponent(email)}`,
        token
      );
      const teacher = data.teacher;
      setFoundByEmail(teacher);
      setRecipientId(String(teacher.id));
      if (!colleagues.some((c) => String(c.id) === String(teacher.id))) {
        setColleagues((prev) => [...prev, teacher].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      setError(err.message || 'Teacher not found at your school.');
    } finally {
      setLookupLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!recipientId && !emailLookup.trim()) {
      setError('Choose a teacher or enter their email.');
      return;
    }
    setBusy(true);
    setError('');
    setSuccessNote('');
    try {
      const body = { message: message.trim() || undefined };
      if (recipientId) body.recipient_teacher_id = Number(recipientId);
      else body.recipient_email = emailLookup.trim().toLowerCase();

      const res = await api.post(
        `/quiz-teacher-shares/from-class/${classId}/quizzes/${quizId}`,
        body,
        token
      );
      setSuccessNote(res.message || 'Invitation sent.');
      onSent?.();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message || 'Could not send share request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="cm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: '#075e54' }}>
          Share quiz with a colleague
        </h2>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14 }}>
          {quizTitle ? `"${quizTitle}"` : 'This quiz'} will be sent to another{' '}
          <strong>verified teacher</strong> at your school. They receive an in-app invitation and email
          (when mail is configured), and must accept before their students can take it.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {successNote && <div className="alert alert-success">{successNote}</div>}

        {loading ? (
          <p className="phub-muted">Loading teachers at your school…</p>
        ) : (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16, padding: 14, background: '#f8fafc', borderRadius: 10 }}>
              <label className="form-group" style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>Find teacher by email</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="email"
                    value={emailLookup}
                    onChange={(e) => setEmailLookup(e.target.value)}
                    placeholder="colleague@brightschool.edu"
                    disabled={busy || lookupLoading}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={lookupTeacher}
                    disabled={busy || lookupLoading}
                  >
                    {lookupLoading ? 'Finding…' : 'Find'}
                  </button>
                </div>
              </label>
              {foundByEmail && (
                <TeacherPickCard
                  teacher={foundByEmail}
                  selected={String(recipientId) === String(foundByEmail.id)}
                  onSelect={setRecipientId}
                />
              )}
            </div>

            {colleagues.length > 0 ? (
              <label className="form-group">
                Or pick from your school
                <select
                  value={recipientId}
                  onChange={(e) => {
                    setRecipientId(e.target.value);
                    const picked = colleagues.find((c) => String(c.id) === e.target.value);
                    if (picked?.email) setEmailLookup(picked.email);
                  }}
                  disabled={busy}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, marginTop: 8 }}
                >
                  {colleagues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.email} ({c.role === 'head_teacher' ? 'Head teacher' : 'Teacher'})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              !foundByEmail && (
                <p className="phub-muted" style={{ marginBottom: 12 }}>
                  No other teachers listed yet. Use email lookup if they already have an account at your school.
                </p>
              )
            )}

            <label className="form-group">
              Message (optional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                disabled={busy}
                placeholder="e.g. Please use this quiz with your S3 class this week."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10 }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={busy || (!recipientId && !emailLookup.trim())}
              >
                {busy ? 'Sending…' : 'Send quiz invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
