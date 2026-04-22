import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import AdminSchools from '../components/admin/AdminSchools';
import AdminTeachers from '../components/admin/AdminTeachers';
import AdminStudents from '../components/admin/AdminStudents';
import AdminClasses from '../components/admin/AdminClasses';
import AdminContent from '../components/admin/AdminContent';
import AdminAnnouncements from '../components/admin/AdminAnnouncements';
import AdminReports from '../components/admin/AdminReports';
import AdminSettings from '../components/admin/AdminSettings';
import './AdminDashboard.css';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'schools', label: 'Schools', icon: '🏫' },
  { key: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
  { key: 'students', label: 'Students', icon: '👩‍🎓' },
  { key: 'classes', label: 'Classes', icon: '📚' },
  { key: 'content', label: 'Content', icon: '📝' },
  { key: 'announcements', label: 'Announcements', icon: '📢' },
  { key: 'reports', label: 'Reports', icon: '💬' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (page === 'dashboard') {
      api.get('/admin/stats', token).then(setStats).catch(() => {});
      api.get('/admin/activity', token).then(setActivity).catch(() => {});
    }
  }, [page, token]);

  const maxCount = activity.length ? Math.max(...activity.map(d => parseInt(d.count))) : 1;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-brand">
          <span className="admin-logo">🎓</span>
          {sidebarOpen && <span className="admin-brand-text">UClass Admin</span>}
        </div>
        <nav className="admin-nav">
          {NAV.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${page === item.key ? 'active' : ''}`}
              onClick={() => setPage(item.key)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={logout}>
            <span className="admin-nav-icon">🚪</span>
            {sidebarOpen && <span className="admin-nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <h1 className="admin-page-title">{NAV.find(n => n.key === page)?.label}</h1>
          <div className="admin-user-info">
            <span>👤 {user?.name}</span>
            <span className="admin-badge">Admin</span>
          </div>
        </header>

        <div className="admin-content">
          {page === 'dashboard' && (
            <div className="admin-dashboard">
              {/* Stats Cards */}
              <div className="stats-grid">
                {[
                  { label: 'Schools', value: stats?.schools, icon: '🏫', color: '#6366f1' },
                  { label: 'Teachers', value: stats?.teachers, icon: '👨‍🏫', color: '#0ea5e9' },
                  { label: 'Students', value: stats?.students, icon: '👩‍🎓', color: '#10b981' },
                  { label: 'Classes', value: stats?.classes, icon: '📚', color: '#f59e0b' },
                  { label: 'Quizzes', value: stats?.quizzes, icon: '📝', color: '#ef4444' },
                  { label: 'Homework', value: stats?.homework, icon: '📋', color: '#8b5cf6' },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ '--accent': s.color }}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-info">
                      <div className="stat-value">{s.value ?? '—'}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Chart */}
              <div className="admin-card">
                <h3 className="admin-card-title">📈 New Registrations (Last 14 Days)</h3>
                {activity.length === 0 ? (
                  <p className="empty-text">No activity data yet.</p>
                ) : (
                  <div className="activity-chart">
                    {activity.map(d => (
                      <div key={d.day} className="chart-bar-wrap">
                        <div
                          className="chart-bar"
                          style={{ height: `${(parseInt(d.count) / maxCount) * 100}%` }}
                          title={`${d.count} registrations`}
                        />
                        <div className="chart-label">
                          {new Date(d.day).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {page === 'schools' && <AdminSchools token={token} />}
          {page === 'teachers' && <AdminTeachers token={token} />}
          {page === 'students' && <AdminStudents token={token} />}
          {page === 'classes' && <AdminClasses token={token} />}
          {page === 'content' && <AdminContent token={token} />}
          {page === 'announcements' && <AdminAnnouncements token={token} />}
          {page === 'reports' && <AdminReports token={token} />}
          {page === 'settings' && <AdminSettings token={token} />}
        </div>
      </div>
    </div>
  );
}
