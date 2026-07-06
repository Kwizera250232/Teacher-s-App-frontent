import { useNavigate } from 'react-router-dom';

export default function AIRevisionBadge({ size = 14, userId = null }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate('/alumni/ai-revision');
      }}
      title="AI Assessment Revision — Practice quizzes, instant marking & AI feedback"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: '1px 5px',
        borderRadius: 6,
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        fontSize: size * 0.7,
        fontWeight: 700,
        cursor: 'pointer',
        lineHeight: 1,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      🤖
    </button>
  );
}
