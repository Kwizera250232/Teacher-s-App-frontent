import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [classPreview, setClassPreview] = useState(null);

  useEffect(() => {
    if (code.trim().length >= 5) {
      api.get(`/classes/preview/${code.trim().toUpperCase()}`)
        .then(data => setClassPreview(data))
        .catch(() => setClassPreview(null));
    } else {
      setClassPreview(null);
    }
  }, [code]);

  const handleJoin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setCodeError('Please enter a valid class code.');
      return;
    }
    setCodeError('');
    navigate(`/join?code=${trimmed}`);
  };

  return (
    <div className="landing-root">
      <div className="landing-hero">
        <div className="landing-brand">
          <span className="landing-logo">🎓</span>
          <h1>UClass</h1>
          <p>Urubuga rw'inyigisho rw'abarimu n'abanyeshuri</p>
        </div>

        <div className="landing-cards">
          <div className="landing-card teacher-card" onClick={() => navigate('/register?role=teacher')}>
            <div className="landing-card-icon">👨‍🏫</div>
            <h2>Ndi Umwarimu</h2>
            <p>Fungura amadarasa, sangira inyigisho, ha abanyeshuri imirimo n'ibizamini.</p>
            <button className="landing-btn teacher-btn">Fungura Ishuri →</button>
          </div>

          <div className="landing-divider">
            <span>or</span>
          </div>

          <div className="landing-card student-card">
            <div className="landing-card-icon">👩‍🎓</div>
            <h2>Ndi Umunyeshuri</h2>
            <p>Injiza kode y'ishuri umwarimu wawe yakuguye winjire vuba.</p>
            <form className="landing-code-form" onSubmit={handleJoin}>
              <input
                type="text"
                className="landing-code-input"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(''); }}
                placeholder="Kode y'ishuri (urugero: X7P9Q2)"
                maxLength={10}
                autoComplete="off"
                spellCheck="false"
              />
              {classPreview && (
                <div className="landing-class-preview">
                  <strong>🏫 {classPreview.name}</strong>
                  {classPreview.subject && <span>📖 {classPreview.subject}</span>}
                  <span>👨‍🏫 Umwarimu: {classPreview.teacher_name}</span>
                </div>
              )}
              {codeError && <p className="landing-code-error">{codeError}</p>}
              <button type="submit" className="landing-btn student-btn">Injira mu Ishuri →</button>
            </form>
            <p className="landing-have-account">
              Usanzwe ufite konti?{' '}
              <button className="landing-link" onClick={() => navigate(code.trim() ? `/join?code=${code.trim().toUpperCase()}` : '/login')}>Injira</button>
            </p>
          </div>
        </div>

        <div className="landing-footer">
          Usanzwe ufite konti?{' '}
          <button className="landing-link" onClick={() => navigate('/login')}>Injira</button>
        </div>
      </div>
    </div>
  );
}
