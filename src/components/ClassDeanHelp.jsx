import { useNavigate } from 'react-router-dom';
import './ClassDeanHelp.css';

export default function ClassDeanHelp({
  token,
  classId,
  className,
  isTeacher = false,
  buttonClassName = '',
  quizHint = '',
}) {
  const navigate = useNavigate();
  if (!classId) return null;

  return (
    <button
      type="button"
      className={`class-dean-help-btn${buttonClassName ? ` ${buttonClassName}` : ''}`}
      onClick={() => navigate('/alumni/ai-revision')}
    >
      🤖 AI Revision
    </button>
  );
}
