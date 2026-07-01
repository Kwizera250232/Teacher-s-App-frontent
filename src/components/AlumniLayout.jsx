import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home', path: '/alumni/feed' },
  { icon: '🎒', label: 'Primary Things', path: '/alumni/primary-things' },
  { icon: '🤖', label: 'Dean AI', path: '/alumni/dean' },
  { icon: '✍️', label: 'Composition', path: '/alumni/compose' },
  { icon: '👥', label: 'Colleagues', path: '/alumni/colleagues' },
  { icon: '💬', label: 'Groups', path: '/alumni/groups' },
  { icon: '📚', label: 'Library', path: '/alumni/library' },
  { icon: '📄', label: 'Past Papers', path: '/alumni/past-papers' },
  { icon: '👤', label: 'Profile', path: '/alumni/profile/me' },
  { icon: '💰', label: 'Wallet', path: '/alumni/wallet' },
  { icon: '🌟', label: 'Opportunities', path: '/alumni/opportunities' },
];

export default function AlumniLayout({ children, showTopWriters = true }) {
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* MOBILE: Hamburger */}
      {isMobile && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position: 'fixed', top: 12, left: 12, zIndex: 3000, width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#667eea', color: '#fff', fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>☰</button>
      )}

      {/* LEFT SIDEBAR - Desktop */}
      {!isMobile && (
        <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e2e8f0', padding: '20px 12px', position: 'fixed', left: 0, top: 0, bottom: 0, overflowY: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          {sidebarContent}
        </aside>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 }} />
          <aside style={{ width: 260, background: '#fff', padding: '20px 12px', position: 'fixed', left: 0, top: 0, bottom: 0, overflowY: 'auto', zIndex: 2100, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : 240, marginRight: isMobile || !showTopWriters ? 0 : 300, padding: isMobile ? '60px 12px 20px' : '20px 24px', minWidth: 0 }}>
        {children}
      </main>

      {/* RIGHT SIDEBAR - Desktop */}
      {!isMobile && showTopWriters && (
        <aside style={{ width: 280, padding: '20px 12px', position: 'fixed', right: 0, top: 0, bottom: 0, overflowY: 'auto', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {/* Search */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '10px 16px', marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 16 }}>🔍</span>
            <input type="text" placeholder="Search alumni..." style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent' }} />
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
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{w.school || 'UClass'} · {w.articles} articles</div>
          </div>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>#{i + 1}</span>
        </div>
      ))}
    </div>
  );
}
