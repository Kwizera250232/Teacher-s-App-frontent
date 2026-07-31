import { Link } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';

export default function MobileStaffHeader({
  user,
  roleLabel,
  onLogout,
  isImpersonating,
  stopImpersonation,
  basePath = '/teacher',
}) {
  return (
    <div className="mobile-staff-header">
      <div className="mobile-student-row1">
        <div className="mobile-student-name">
          <span className="mobile-student-greet" style={{ fontSize: 15, fontWeight: 700 }}>{user?.name}</span>
          <VerifiedBadge
            size={13}
            info={{
              items: [
                { icon: '👨‍🏫', label: 'Role', value: roleLabel },
                { icon: '📧', label: 'Email', value: user?.email },
              ],
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/messages" className="mobile-nav-text-btn mobile-nav-text-btn--muted" style={{ fontSize: 13 }}>
            💬
          </Link>
          <Link to="/profile" className="mobile-nav-text-btn" style={{ fontSize: 13 }}>
            👥
          </Link>
          <button type="button" className="mobile-nav-text-btn mobile-nav-text-btn--muted" onClick={onLogout} style={{ fontSize: 13 }}>
            🚪
          </button>
          {isImpersonating && (
            <button type="button" className="mobile-nav-text-btn" onClick={stopImpersonation} style={{ fontSize: 13 }}>
              ↩
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
