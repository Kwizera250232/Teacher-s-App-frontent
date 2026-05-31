import { Link } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import DonateButton from './DonateButton';

export default function MobileStudentHeader({
  user,
  onLogout,
  onParentInvite,
  isImpersonating,
  stopImpersonation,
}) {
  return (
    <div className="mobile-student-header">
      <div className="mobile-student-row1">
        <div className="mobile-student-name">
          <span className="mobile-student-greet">{user?.name}</span>
          <VerifiedBadge
            size={14}
            info={{
              items: [
                { icon: '👩‍🎓', label: 'Role', value: 'Student' },
                { icon: '📧', label: 'Email', value: user?.email },
              ],
            }}
          />
        </div>
        <Link to="/profile" className="btn btn-secondary btn-sm mobile-profile-btn">
          Profile
        </Link>
      </div>
      <div className="mobile-student-row2">
        <Link to="/student/notes" className="mobile-student-chip">
          My Notes
        </Link>
        <button type="button" className="mobile-student-chip mobile-student-chip--ghost" onClick={onLogout}>
          Logout
        </button>
        <DonateButton compact />
        <button
          type="button"
          className="mobile-student-icon-btn"
          onClick={onParentInvite}
          title="Invite parent"
          aria-label="Invite parent"
        >
          <span className="mobile-student-icon-inner" aria-hidden>👪</span>
        </button>
        {isImpersonating && (
          <button type="button" className="mobile-student-chip" onClick={stopImpersonation}>
            ↩ Admin
          </button>
        )}
      </div>
    </div>
  );
}
