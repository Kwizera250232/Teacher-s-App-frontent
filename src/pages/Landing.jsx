import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

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

          <div className="landing-card student-card" onClick={() => navigate('/register?role=student')}>
            <div className="landing-card-icon">👩‍🎓</div>
            <h2>I'm a Student</h2>
            <p>Join your class using the code your teacher gave you, then access all materials.</p>
            <button className="landing-btn student-btn">Join a Class →</button>
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
