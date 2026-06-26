import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

// Animated flower/petal particles
function FlowerParticles({ active }) {
  if (!active) return null;
  const petals = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    size: 8 + Math.random() * 14,
    color: ['#ff6b9d', '#c44569', '#f8b500', '#ff9f43', '#ee5a24', '#f368e0', '#9b59b6'][Math.floor(Math.random() * 7)],
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

export default function AlumniOnboarding({ onClose, onComplete }) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=welcome, 2=flowers, 3=profile, 4=done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    bio: '',
    current_school_or_uni: '',
    current_occupation: '',
    dream_career: '',
    skills: '',
    interests: '',
    favorite_subject: '',
    favorite_teacher: '',
    personal_motto: '',
  });

  const handleJoin = async () => {
    setLoading(true);
    try {
      await api.post('/alumni/join');
      setStep(2);
      setTimeout(() => setStep(3), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...profile,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: profile.interests.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.put('/alumni/profile/me', payload);
      await refreshUser();
      setStep(4);
      setTimeout(() => {
        onComplete?.();
        navigate('/alumni/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'student') return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <FlowerParticles active={step === 2} />

      <div style={{
        background: '#fff', borderRadius: 20, maxWidth: 520, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.4s ease-out',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0 0' }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: s <= step ? '#667eea' : '#e2e8f0',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ padding: '32px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>Welcome to Alumni!</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              You've completed your studies. Join the Alumni community to connect with fellow graduates,
              share your compositions, earn rewards, and build your professional profile.
            </p>
            {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" disabled={loading} onClick={handleJoin}>
                {loading ? 'Joining...' : '🌸 Join Alumni'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 28, color: '#667eea' }}>
              🎉 Congratulations!
            </h2>
            <p style={{ color: '#64748b', fontSize: 16 }}>
              You're now part of the Alumni community!
            </p>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
              Let's complete your profile...
            </p>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: '24px 32px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 20 }}>Complete Your Profile</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
              Help others know you better. You can always update this later.
            </p>
            {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}

            {[
              { key: 'current_school_or_uni', label: 'Current School / University', placeholder: 'Where are you studying now?' },
              { key: 'current_occupation', label: 'Current Occupation', placeholder: 'Student, Developer, etc.' },
              { key: 'dream_career', label: 'Dream Career', placeholder: 'What do you aspire to be?' },
              { key: 'favorite_subject', label: 'Favorite Subject', placeholder: 'Math, Science, History...' },
              { key: 'favorite_teacher', label: 'Favorite Teacher', placeholder: 'Who inspired you most?' },
              { key: 'personal_motto', label: 'Personal Motto', placeholder: 'Your life motto or quote' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={profile[field.key]}
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
                    fontSize: 14,
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Skills (comma separated)</label>
              <input
                type="text"
                placeholder="Programming, Writing, Public Speaking..."
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Interests (comma separated)</label>
              <input
                type="text"
                placeholder="Music, Sports, Technology, Art..."
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" disabled={loading} onClick={handleProfileSave}>
                {loading ? 'Saving...' : '✨ Complete & Go to Alumni'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 24, color: '#059669' }}>All Set!</h2>
            <p style={{ color: '#64748b' }}>Redirecting to your Alumni dashboard...</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
