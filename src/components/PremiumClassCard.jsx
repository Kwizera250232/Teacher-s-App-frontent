export default function PremiumClassCard({ classData, studentCount, presentCount, absentCount }) {
  const attendanceRate = studentCount > 0 ? ((presentCount / studentCount) * 100).toFixed(1) : 0;
  const absentRate = studentCount > 0 ? ((absentCount / studentCount) * 100).toFixed(1) : 0;

  return (
    <div className="premium-class-card">
      <div className="class-card-header">
        <div className="class-badge">
          <span className="class-badge-text">P6</span>
        </div>
        <div className="class-info">
          <h1 className="class-name">P6 A</h1>
          <p className="class-subject">Languages</p>
          <p className="class-code">Class Code: LKGAY5</p>
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
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Present</div>
            <div className="stat-value">{presentCount}</div>
            <div className="stat-rate">{attendanceRate}%</div>
          </div>
        </div>

        <div className="stat-card stat-card--absent">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-label">Absent</div>
            <div className="stat-value">{absentCount}</div>
            <div className="stat-rate">{absentRate}%</div>
          </div>
        </div>
      </div>

      <div className="class-action">
        <button type="button" className="premium-action-button">
          Start Class
        </button>
      </div>
    </div>
  );
}
