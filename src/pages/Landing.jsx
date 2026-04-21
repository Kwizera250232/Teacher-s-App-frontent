import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setCodeError('Please enter a valid class code.');
      return;
    }
    setCodeError('');
    navigate(`/register?role=student&code=${trimmed}`);
  };

  return (
    <div className="landing-root">
      <div className="landing-hero">
        <div className="landing-brand">
          <span className="landing-logo">🎓</span>
          <h1>EduApp</h1>
          <p>The smart platform for teachers and students</p>
        </div>

        <div className="landing-cards">
          <div className="landing-card teacher-card" onClick={() => navigate('/register?role=teacher')}>
            <div className="landing-card-icon">👨‍🏫</div>
            <h2>I'm a Teacher</h2>
            <p>Create classes, share notes, assign homework and quizzes to your students.</p>
            <button className="landing-btn teacher-btn">Create a Class →</button>
          </div>

          <div className="landing-divider">
            <span>or</span>
          </div>

          <div className="landing-card student-card">
            <div className="landing-card-icon">👩‍🎓</div>
            <h2>I'm a Student</h2>
            <p>Enter the class code your teacher gave you to join instantly.</p>
            <form className="landing-code-form" onSubmit={handleJoin}>
              <input
                type="text"
                className="landing-code-input"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(''); }}
                placeholder="Class code (e.g. X7P9Q2)"
                maxLength={10}
                autoComplete="off"
                spellCheck="false"
              />
              {codeError && <p className="landing-code-error">{codeError}</p>}
              <button type="submit" className="landing-btn student-btn">Join Class →</button>
            </form>
            <p className="landing-have-account">
              Have an account?{' '}
              <button className="landing-link" onClick={() => navigate(code.trim() ? `/login?code=${code.trim().toUpperCase()}` : '/login')}>Log in</button>
            </p>
          </div>
        </div>

        <div className="landing-footer">
          Already have an account?{' '}
          <button className="landing-link" onClick={() => navigate('/login')}>Log in</button>
        </div>
      </div>
    </div>
  );
}
