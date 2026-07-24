import { Link } from 'react-router-dom';

export default function PremiumSidebar({ user, activeTab, onTabChange, onLogout, basePath = '/teacher' }) {
  const sidebarItems = [
    { id: 'classes', icon: '📚', label: 'Classes' },
    { id: 'chats', icon: '💬', label: 'Chats' },
    { id: 'class-now', icon: '📸', label: 'Class Now' },
    { id: 'inyandiko', icon: '✍️', label: 'Inyandiko' },
    { id: 'alumni', icon: '🎓', label: 'Alumni' },
    { id: 'tools', icon: '⚡', label: 'Tools' },
  ];

  const bottomItems = [
    { id: 'settings', icon: '⚙', label: 'Settings' },
    { id: 'help', icon: '❓', label: 'Help' },
    { id: 'logout', icon: '🚪', label: 'Logout', action: onLogout },
  ];

  return (
    <aside className="premium-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">UClass</span>
      </div>

      <nav className="sidebar-nav">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <nav className="sidebar-nav sidebar-nav--bottom">
          {bottomItems.map((item) => (
            item.id === 'logout' ? (
              <button
                key={item.id}
                type="button"
                className="sidebar-item sidebar-item--logout"
                onClick={item.action}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ) : (
              <button
                key={item.id}
                type="button"
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <div className="sidebar-help-card">
          <p className="help-card-title">Need help?</p>
          <button type="button" className="help-card-button">
            ▶ Watch Tutorial
          </button>
        </div>
      </div>
    </aside>
  );
}
