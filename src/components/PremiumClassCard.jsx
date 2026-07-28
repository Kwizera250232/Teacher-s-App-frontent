import { Link } from 'react-router-dom';

export default function PremiumClassCard({
  classData,
  studentCount,
  graduatedCount = 0,
  basePath = '/teacher',
}) {
  const name = classData?.name || 'Class';
  const badge = name.trim().slice(0, 3).toUpperCase();

  return (
    <div className="premium-class-card">
      <div className="class-card-header">
        <div className="class-badge">
          <span className="class-badge-text">{badge}</span>
        </div>
        <div className="class-info">
          <h1 className="class-name">{name}</h1>
          {classData?.subject && <p className="class-subject">{classData.subject}</p>}
          <p className="class-code">Class Code: {classData?.class_code || '—'}</p>
        </div>
      </div>

      <div className="class-stats">
        <div className="stat-card stat-card--students">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">Students</div>
            <div className="stat-value">{studentCount}</div>
          </div>
        </div>

        <div className="stat-card stat-card--present">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <div className="stat-label">Graduated</div>
            <div className="stat-value">{graduatedCount}</div>
          </div>
        </div>

        <div className="stat-card stat-card--absent">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-label">Quiz reports</div>
            <div className="stat-value">
              <Link
                to={`${basePath}/classes/${classData?.id}?tab=Quiz reports`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                Open
              </Link>
            </div>
          </div>
        </div>
      </div>

      {graduatedCount > 0 && studentCount === 0 && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280' }}>
          All {graduatedCount} students of this class graduated to Alumni. Share code{' '}
          <strong>{classData?.class_code}</strong> to add new students.
        </p>
      )}

      <div className="class-action">
        <Link to={`${basePath}/classes/${classData?.id}`} className="premium-action-button">
          Open Class
        </Link>
      </div>
    </div>
  );
}
