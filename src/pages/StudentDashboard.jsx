import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import JoinClassModal from '../components/JoinClassModal';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  // Quick note state: { classId, open, text, saving }
  const [quickNote, setQuickNote] = useState(null);

  const loadClasses = () => {
    api.get('/classes/my', token).then(setClasses).catch(e => setError(e.message));
  };

  useEffect(() => { loadClasses(); }, []);

  const saveQuickNote = async () => {
    if (!quickNote?.text?.trim()) return;
    setQuickNote(q => ({ ...q, saving: true }));
    try {
      await api.post('/student/notes', {
        title: quickNote.text.trim().slice(0, 60) || 'Note',
        content: quickNote.text.trim(),
        color: '#fff9c4',
      }, token);
      setQuickNote(null);
    } catch (_) {
      setQuickNote(q => ({ ...q, saving: false }));
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">🎓 UClass</div>
        <div className="dash-user">
          <span>👋 {user?.name}</span>
          <Link to="/student/notes" className="btn btn-secondary btn-sm">📝 Amateka Yanjye</Link>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-top">
          <div>
            <h1>Amashuri Yanjye</h1>
            <p className="dash-sub">Injira mu mashuri yawe</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowJoin(true)}>
            + Injira mu Ishuri
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎒</div>
            <h3>Nta mashuri ufite</h3>
            <p>Injira mu ishuri ukoresheje kode umwarimu wawe yakuguye</p>
            <button className="btn btn-primary" onClick={() => setShowJoin(true)}>Injira mu Ishuri</button>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(cls => (
              <div key={cls.id} className="class-card-wrap">
                <Link to={`/student/classes/${cls.id}`} className="class-card">
                  <div className="class-card-header">
                    <h3>{cls.name}</h3>
                    {cls.subject && <span className="subject-tag">{cls.subject}</span>}
                  </div>
                  <div className="class-teacher">
                    <span>👨‍🏫 {cls.teacher_name}</span>
                  </div>
                  <div className="class-card-footer">
                    <span>Tap to enter</span>
                    <span className="arrow">→</span>
                  </div>
                </Link>
                {/* Quick note button */}
                <button
                  className="class-card-note-btn"
                  onClick={e => { e.stopPropagation(); setQuickNote({ classId: cls.id, open: true, text: '', saving: false }); }}
                >
                  📝 Add Note
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showJoin && (
        <JoinClassModal
          token={token}
          onClose={() => setShowJoin(false)}
          onJoined={() => { setShowJoin(false); loadClasses(); }}
        />
      )}

      {/* Quick note modal */}
      {quickNote?.open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setQuickNote(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>📝 Noti Nshya Yihuse</h3>
            <textarea
              autoFocus
              rows={5}
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Andika ikintu cyose wifuza..."
              value={quickNote.text}
              onChange={e => setQuickNote(q => ({ ...q, text: e.target.value }))}
              onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') saveQuickNote(); }}
            />
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Ctrl+Enter gufunga</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setQuickNote(null)}>Reka</button>
              <button
                className="btn btn-primary"
                disabled={quickNote.saving || !quickNote.text.trim()}
                onClick={saveQuickNote}
              >
                {quickNote.saving ? 'Kubika...' : '💾 Bika Noti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
