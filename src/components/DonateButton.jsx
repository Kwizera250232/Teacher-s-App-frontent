import { useState } from 'react';
import './DonateButton.css';

export default function DonateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="donate-header-btn" onClick={() => setOpen(true)} title="Support UClass education">
        💛 DONATE
      </button>
      {open && (
        <div className="donate-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="donate-modal" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h3 style={{ marginBottom: 12 }}>Coming Soon!</h3>
            <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              This feature is coming soon so you will be able to donate to us to be able to work well.
              We are working hard to bring you a seamless donation experience. Stay tuned!
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
