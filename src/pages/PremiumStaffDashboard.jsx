import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import PremiumSidebar from '../components/PremiumSidebar';
import PremiumClassCard from '../components/PremiumClassCard';
import './PremiumDashboard.css';

export default function PremiumStaffDashboard({ token, user, onLogout, basePath = '/teacher' }) {
  const [activeTab, setActiveTab] = useState('classes');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });

  useEffect(() => {
    loadClasses();
  }, [token]);

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes', token);
      setClasses(res);
      if (res.length > 0) {
        setSelectedClass(res[0]);
        await loadClassStats(res[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStats = async (classId) => {
    try {
      const studentsRes = await api.get(`/classes/${classId}/students`, token);
      const total = studentsRes.length;
      
      // For demo purposes, we'll calculate present/absent
      // In production, this would come from attendance API
      const present = Math.floor(total * 0.87);
      const absent = total - present;
      
      setStats({ total, present, absent });
    } catch (err) {
      console.error('Failed to load class stats:', err);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  if (loading) {
    return (
      <div className="premium-dashboard">
        <div className="premium-main">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ fontSize: '18px', color: '#6B7280' }}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-dashboard">
      <PremiumSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={onLogout}
        basePath={basePath}
      />

      <main className="premium-main">
        <nav className="premium-top-nav">
          <div className="welcome-section">
            <h1>
              Welcome back,<br />
              <span className="greeting">{user?.name} 👋</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="school-selector">
              🏫 Bright School ▼
            </div>
            <Link to="/profile" className="profile-avatar">
              {user?.name?.charAt(0) || 'U'}
            </Link>
          </div>
        </nav>

        {activeTab === 'classes' && selectedClass && (
          <>
            <PremiumClassCard
              classData={selectedClass}
              studentCount={stats.total}
              presentCount={stats.present}
              absentCount={stats.absent}
            />

            <footer className="premium-footer">
              <div className="footer-date">📅 {getDayName()}</div>
              <div className="footer-quote">
                "Education is the most powerful weapon which you can use to change the world."
              </div>
              <div className="footer-brand">❤️ Made for Teachers in Rwanda</div>
            </footer>
          </>
        )}

        {activeTab === 'chats' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '12px' }}>Chats</h2>
            <p style={{ color: '#6B7280' }}>Select a chat from the sidebar</p>
          </div>
        )}

        {activeTab === 'alumni' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '12px' }}>Alumni</h2>
            <p style={{ color: '#6B7280' }}>
              <Link to="/alumni/directory" style={{ color: '#5A3FFF', textDecoration: 'none' }}>
                View Alumni Directory →
              </Link>
            </p>
          </div>
        )}

        {activeTab === 'tools' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '12px' }}>Tools</h2>
            <p style={{ color: '#6B7280' }}>Select a tool from the sidebar</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '12px' }}>Settings</h2>
            <p style={{ color: '#6B7280' }}>Settings coming soon</p>
          </div>
        )}

        {activeTab === 'help' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '12px' }}>Help</h2>
            <p style={{ color: '#6B7280' }}>Watch the tutorial video to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}
