import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';
import AIRevisionBadge from './AIRevisionBadge';
import AppNotificationsBell from './AppNotificationsBell';
import './AlumniLayout.css';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home', path: '/alumni/feed' },
  { icon: '🎒', label: 'Primary Things', path: '/alumni/primary-things' },
  { icon: '🤖', label: 'AI Revision', path: '/alumni/ai-revision' },
  { icon: '✍️', label: 'Composition', path: '/alumni/compose' },
  { icon: '👥', label: 'Colleagues', path: '/alumni/colleagues' },
  { icon: '💬', label: 'Groups', path: '/alumni/groups' },
  { icon: '📚', label: 'Library', path: '/alumni/library' },
  { icon: '📄', label: 'Past Papers', path: '/alumni/past-papers' },
  { icon: '👤', label: 'Profile', path: '/alumni/profile/me' },
  { icon: '💰', label: 'Wallet', path: '/alumni/wallet' },
  { icon: '🌟', label: 'Opportunities', path: '/alumni/opportunities' },
  { icon: '🎓', label: 'Education Hub', path: '/education-hub' },
];

export default function AlumniLayout({ children, showTopWriters = true, fullWidth = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPath = location.pathname;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const getProfilePath = () => {
    if (user?.id) return `/alumni/profile/${user.id}`;
    return '/alumni/directory';
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div onClick={() => { navigate('/alumni/feed'); setSidebarOpen(false); }} style={{ marginBottom: 24, paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>U</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Alumni</h1>
      </div>

      {/* Compose Button */}
      <button onClick={() => { navigate('/alumni/compose'); setSidebarOpen(false); }} style={{ width: '100%', padding: '12px 16px', borderRadius: 24, border: 'none', background: '#667eea', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 20, boxShadow: '0 4px 14px rgba(102,126,234,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        ✍️ New Article
      </button>

      {/* Notifications Bell */}
      <div style={{ marginBottom: 12 }}>
        <AppNotificationsBell basePath="/alumni" />
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path);
          const finalPath = item.path === '/alumni/profile/me' ? getProfilePath() : item.path;
          return (
            <Link key={item.path} to={finalPath} onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: isActive ? '#667eea' : '#475569', fontWeight: isActive ? 700 : 500, fontSize: 14, background: isActive ? '#f0f7ff' : 'transparent', transition: 'all 0.2s' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Mini Profile */}
      {user && (
        <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(user.id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {(user.name || '?')[0]}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
              {user.name}
              <VerifiedBadge size={12} userId={user.id} onViewProfile={() => navigate(getProfilePath())} />
              <AIRevisionBadge size={12} userId={user.id} />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>@{user.email?.split('@')[0]}</div>
          </div>
        </div>
      )}

      {/* Logout */}
      {user && (
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <span>🚪</span> Logout
        </button>
      )}
    </>
  );

  const mobileNavItems = [
    { icon: '🏠', label: 'Home', path: '/alumni/feed' },
    { icon: '👥', label: 'Connections', path: '/alumni/colleagues' },
    { icon: '💬', label: 'Group', path: '/alumni/groups' },
    { icon: '🌟', label: 'Opportunities', path: '/alumni/opportunities' },
    { icon: '🎓', label: 'EduHub', path: '/education-hub' },
    { icon: '☰', label: 'Menu', action: () => setSidebarOpen(true) },
  ];

  return (
    <div className="alumni-layout">
      {/* MOBILE: Top bar */}
      {isMobile && (
        <div className="alumni-mobile-header">
          <button className="alumni-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="alumni-mobile-logo">
            <span className="alumni-mobile-logo-mark">U</span>
            <span>Student.umunsi</span>
          </div>
          <div className="alumni-mobile-actions">
            <button onClick={() => navigate('/alumni/search')}>🔍</button>
            <AppNotificationsBell basePath="/alumni" />
            <div className="alumni-mobile-profile" onClick={() => navigate(getProfilePath())}>
              {(user?.name || 'U')[0]}
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR - Desktop */}
      {!isMobile && (
        <aside className="alumni-desktop-sidebar">
          {sidebarContent}
        </aside>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} className="alumni-sidebar-backdrop" />
          <aside className="alumni-mobile-sidebar">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <main className={`alumni-main ${isMobile ? 'alumni-main-mobile' : ''} ${fullWidth ? 'alumni-main-fullwidth' : ''}`}>
        {children}
      </main>

      {/* RIGHT SIDEBAR - Desktop */}
      {!isMobile && showTopWriters && !fullWidth && (
        <aside className="alumni-desktop-rightbar">
          {/* Search */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '10px 16px', marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 16 }}>🔍</span>
            <input type="text" placeholder="Search alumni..." style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent' }} />
          </div>

          {/* Premium Card */}
          <div style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', borderRadius: 16, padding: 18, color: '#fff', marginBottom: 16, boxShadow: '0 4px 14px rgba(124,58,237,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>👑</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Go Premium</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.5, color: '#ede9fe' }}>Unlock extra features and a better experience for your alumni journey.</p>
            <button onClick={() => navigate('/alumni/premium')} style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none', background: '#fff', color: '#7c3aed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Upgrade Now</button>
          </div>

          {/* Refer & Earn Card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>🎁</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>Refer & Earn</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.5, color: '#64748b' }}>Invite friends and earn amazing rewards together.</p>
            <button onClick={() => { const link = `${window.location.origin}/register?ref=${user?.id || ''}`; navigator.clipboard?.writeText(link); alert('Referral link copied!'); }} style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #7c3aed', background: '#fff', color: '#7c3aed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Invite Now</button>
          </div>

          {/* Top Writers */}
          <TopWriters token={user?.token} />

          {/* Quick Stats */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>📊 Your Stats</h3>
            {[{label:'Articles',value:'0',icon:'✍️'},{label:'Reads',value:'0',icon:'👁️'},{label:'Followers',value:'0',icon:'👥'},{label:'Wallet',value:'RWF 0',icon:'💰'}].map((stat) => (
              <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13 }}><span>{stat.icon}</span>{stat.label}</div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <nav className="alumni-mobile-nav">
          {mobileNavItems.map((item) => {
            const isActive = item.path && (currentPath === item.path || currentPath.startsWith(item.path));
            return (
              <button
                key={item.label}
                className={`alumni-mobile-nav-item ${isActive ? 'alumni-mobile-nav-active' : ''}`}
                onClick={() => item.action ? item.action() : navigate(item.path)}
              >
                <span className="alumni-mobile-nav-icon">{item.icon}</span>
                <span className="alumni-mobile-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function TopWriters({ token }) {
  const [writers, setWriters] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    api.get('/alumni/top-writers', token)
      .then((data) => setWriters(data.writers || []))
      .catch(() => setWriters([]));
  }, [token]);

  const displayWriters = writers.length > 0 ? writers : [
    { id: 1, name: 'Kwizera Tr', school: 'Bright School', articles: 5, avatar: 'K' },
    { id: 2, name: 'Ishimwe Div', school: 'Bright School', articles: 3, avatar: 'I' },
    { id: 3, name: 'Keza Marie', school: 'Green Hills', articles: 2, avatar: 'M' },
    { id: 4, name: 'Niyonzima J', school: 'Bright School', articles: 2, avatar: 'N' },
    { id: 5, name: 'Mugabo Eric', school: 'Kigali Sec', articles: 1, avatar: 'E' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>🏆 Top Writers</h3>
      {displayWriters.map((w, i) => (
        <div key={w.id || i} onClick={() => navigate(`/alumni/profile/${w.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < displayWriters.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${(w.id * 137) % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>{w.avatar || w.name?.[0] || '?'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{w.name}</span>
              <VerifiedBadge size={14} userId={w.id} onViewProfile={() => navigate(`/alumni/profile/${w.id}`)} />
              <AIRevisionBadge size={14} userId={w.id} />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{w.school || 'UClass'} · {w.articles} articles</div>
          </div>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>#{i + 1}</span>
        </div>
      ))}
    </div>
  );
}
