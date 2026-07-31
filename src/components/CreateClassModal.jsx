import { useState } from 'react';
import { api } from '../api';

// Rwandan curriculum subjects — Primary (P1-P6) and Secondary (S1-S6)
const SUBJECTS = [
  'English', 'Mathematics', 'Kinyarwanda', 'French', 'Science and Elementary Technology (SET)',
  'Social and Religious Studies (SST)', 'Creative Arts', 'Physical Education and Sports (PES)',
  'ICT', 'Entrepreneurship', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History',
  'Economics', 'Accounting', 'Literature in English', 'Kinyarwanda Literature', 'Religious Education',
  'General Studies', 'Other',
];

export default function CreateClassModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', subject: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/classes', form, token);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>📚 Create New Class</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Class Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. S3 Mathematics"
              required
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <select
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
            >
              <option value="">— Choose subject —</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
