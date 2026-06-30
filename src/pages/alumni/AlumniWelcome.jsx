import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

function FlowerParticles({ active }) {
  if (!active) return null;
  const petals = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 4,
    size: 8 + Math.random() * 16,
    color: ['#ff6b9d', '#c44569', '#f8b500', '#ff9f43', '#ee5a24', '#f368e0', '#9b59b6', '#667eea', '#10b981'][Math.floor(Math.random() * 9)],
  }));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', zIndex: 10000, overflow: 'hidden',
    }}>
      {petals.map((p) => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.left}%`,
          top: '-20px',
          width: p.size,
          height: p.size,
          borderRadius: '50% 0 50% 0',
          background: p.color,
          opacity: 0.85,
          animation: `fall ${p.duration}s ${p.delay}s linear forwards`,
          transform: 'rotate(45deg)',
        }} />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function AlumniWelcome({ onComplete }) {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=flowers, 2=done
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Auto-join alumni after 2 seconds of flowers
    const timer = setTimeout(() => {
      handleAutoJoin();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAutoJoin = async () => {
    if (joining) return;
    setJoining(true);
    try {
      // If already alumni (graduated by teacher), skip join and just refresh
      if (user.role === 'alumni') {
        setStep(2);
        setTimeout(() => {
          onComplete?.();
          navigate('/alumni/feed');
        }, 2500);
        return;
      }
      const res = await api.post('/alumni/join', {}, token);
      if (res.token && res.user) {
        login(res.token, res.user);
      }
      setStep(2);
      setTimeout(() => {
        onComplete?.();
        navigate('/alumni/feed');
      }, 2500);
    } catch (err) {
      console.error('Auto join failed:', err);
      // Still proceed to alumni feed
      setStep(2);
      setTimeout(() => {
        onComplete?.();
        navigate('/alumni/feed');
      }, 2000);
    }
  };

  if (!user || (user.role !== 'student' && user.role !== 'alumni')) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <FlowerParticles active={step === 1} />

      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 32px',
        maxWidth: 420, width: '90%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 10001,
      }}>
        {step === 1 && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎓🌸🎉</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
              Welcome to Alumni!
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: '0 0 20px' }}>
              {user.name}, you are now part of the UClass Alumni family! All your class memories, friends, and achievements are here.
            </p>
            <div style={{ color: '#667eea', fontWeight: 700, fontSize: 14 }}>
              Preparing your alumni space...
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅🚀</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
              You're All Set!
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>
              Taking you to your alumni dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
