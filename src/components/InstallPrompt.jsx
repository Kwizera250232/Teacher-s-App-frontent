import { useEffect, useState } from 'react';
import './InstallPrompt.css';

const STORAGE_KEY = 'uclass_pwa_installed';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed or user already accepted
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    let deferredEvent = null;

    const handler = e => {
      e.preventDefault();
      deferredEvent = e;
      // Show popup after 5 seconds
      setTimeout(() => {
        setPrompt(deferredEvent);
        setVisible(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !prompt) return null;

  const handleInstall = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, '1');
      // Record installation on server
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiBase}/pwa/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_agent: navigator.userAgent }),
      }).catch(() => {});
    }
    setVisible(false);
  };

  const handleDismiss = () => setVisible(false);

  return (
    <div className="install-backdrop" onClick={handleDismiss}>
      <div className="install-popup" onClick={e => e.stopPropagation()}>
        <button className="install-close" onClick={handleDismiss} aria-label="Close">✕</button>
        <div className="install-icon">🎓</div>
        <div className="install-name">UClass</div>
        <button className="install-btn" onClick={handleInstall}>
          📲 INSTALL THIS APP
        </button>
      </div>
    </div>
  );
}
