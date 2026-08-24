import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TeacherMobileMenu.css';

export default function TeacherMobileMenu({ user, roleLabel, hubTab, onTabChange, onLogout, basePath }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const tabItems = [
    { id: 'classes', icon: '📚', label: 'Classes' },
    { id: 'chats', icon: '💬', label: 'Chats' },
    { id: 'class-now', icon: '📸', label: 'Class Now' },
    { id: 'quiz-reports', icon: '📊', label: 'Quiz Reports' },
    { id: 'ai-quiz', icon: '🤖', label: 'AI Quiz Gen' },
    { id: 'inyandiko', icon: '✍️', label: 'Inyandiko' },
    { id: 'alumni', icon: '🎓', label: 'Alumni' },
    { id: 'tools', icon: '⚡', label: 'Tools' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  const handleTab = (id) => {
    onTabChange(id);
    setOpen(false);
  };

  return (
    <>
      <div className="teacher-menu-toggle">
        <button
          type="button"
          className="teacher-menu-toggle__btn"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <span className="teacher-menu-toggle__bar" />
          <span className="teacher-menu-toggle__bar" />
          <span className="teacher-menu-toggle__bar" />
        </button>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>UClass</span>
      </div>

      {open && <div className="teacher-menu-overlay" onClick={() => setOpen(false)} />}

      <aside className={`teacher-menu-drawer${open ? ' teacher-menu-drawer--open' : ''}`}>
        <div className="teacher-menu-header">
          <div className="teacher-menu-user">
            <div className="teacher-menu-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="teacher-menu-userinfo">
              <strong>{user?.name}</strong>
              <span>{roleLabel}</span>
            </div>
          </div>
          <button
            type="button"
            className="teacher-menu-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="teacher-menu-nav">
          {tabItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`teacher-menu-item${hubTab === item.id ? ' teacher-menu-item--active' : ''}`}
              onClick={() => handleTab(item.id)}
            >
              <span className="teacher-menu-item__icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="teacher-menu-divider" />

        <div className="teacher-menu-links">
          <Link to="/messages" className="teacher-menu-link" onClick={() => setOpen(false)}>
            <span className="teacher-menu-item__icon">💬</span>
            <span>Messages</span>
          </Link>
          <Link to="/profile" className="teacher-menu-link" onClick={() => setOpen(false)}>
            <span className="teacher-menu-item__icon">👤</span>
            <span>My Profile</span>
          </Link>
          <Link to="/alumni/admin" className="teacher-menu-link" onClick={() => setOpen(false)}>
            <span className="teacher-menu-item__icon">⚙️</span>
            <span>Alumni Admin</span>
          </Link>
        </div>

        <div className="teacher-menu-divider" />

        <div className="teacher-menu-footer">
          <button type="button" className="teacher-menu-logout" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
