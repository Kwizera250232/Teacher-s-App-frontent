import { Link } from 'react-router-dom';

export default function PremiumClassCard({
  classData,
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
        <Link to={`${basePath}/classes/${classData?.id}`} className="premium-action-button premium-action-button--open">
          Open
        </Link>
      </div>
    </div>
  );
}
