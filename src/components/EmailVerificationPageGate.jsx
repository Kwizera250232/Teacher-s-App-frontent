import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { needsEmailVerification } from '../utils/emailVerification';
import EmailVerificationModal from './EmailVerificationModal';

export default function EmailVerificationPageGate({ children, featureLabel = 'this page' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!needsEmailVerification(user)) {
    return children;
  }

  return (
    <>
      <EmailVerificationModal
        open
        featureLabel={featureLabel}
        onClose={() => navigate(-1)}
      />
      <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
        Confirm your email to open {featureLabel}.
      </div>
    </>
  );
}
