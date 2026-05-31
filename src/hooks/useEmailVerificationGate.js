import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { needsEmailVerification, isGatedClassTab } from '../utils/emailVerification';

export function useEmailVerificationGate() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [featureLabel, setFeatureLabel] = useState('');

  const guardTab = useCallback(
    (tabName, onAllowed) => {
      if (needsEmailVerification(user) && isGatedClassTab(tabName)) {
        setFeatureLabel(tabName);
        setModalOpen(true);
        return false;
      }
      if (onAllowed) onAllowed();
      return true;
    },
    [user]
  );

  const guardFeature = useCallback(
    (label, action) => {
      if (needsEmailVerification(user)) {
        setFeatureLabel(label);
        setModalOpen(true);
        return false;
      }
      if (action) action();
      return true;
    },
    [user]
  );

  const closeModal = () => setModalOpen(false);

  return { modalOpen, featureLabel, guardTab, guardFeature, closeModal, needsVerification: needsEmailVerification(user) };
}
