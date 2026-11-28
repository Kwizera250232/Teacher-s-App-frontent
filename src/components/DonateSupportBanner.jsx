import DonateButton from './DonateButton';
import './DonateSupportBanner.css';

const WHAT_WE_DO = [
  { icon: '👩‍🏫', title: 'Teachers', text: 'prepare lessons, notes & homework for every class' },
  { icon: '📝', title: 'Students', text: 'take quizzes & homework at home, revision anywhere' },
  { icon: '🎥', title: 'Live Studying', text: 'teachers coach students live from home' },
  { icon: '📊', title: 'Schools', text: 'Mid-Term, End-Term & Yearly report cards generated' },
];

export default function DonateSupportBanner({ compact = false }) {
  if (compact) {
    return (
      <div className="donate-banner donate-banner-compact">
        <div className="donate-banner-text">
          <strong>💛 Support UClass Education</strong>
          <p>Keep learning tools free for Rwanda's schools — donate via MTN MoMo.</p>
        </div>
        <DonateButton />
      </div>
    );
  }

  return (
    <section className="donate-hero">
      <div className="donate-hero-inner">
        <div className="donate-hero-left">
          <div className="donate-hero-badge">💛 Community supported</div>
          <h2 className="donate-hero-title">Keep Rwanda's classrooms learning</h2>
          <p className="donate-hero-sub">
            UClass is the school platform built for Rwanda — your donation keeps it running
            and free for every teacher, student and school.
          </p>

          <div className="donate-hero-grid">
            {WHAT_WE_DO.map((w) => (
              <div key={w.title} className="donate-hero-item">
                <span className="donate-hero-icon">{w.icon}</span>
                <div>
                  <div className="donate-hero-item-title">{w.title}</div>
                  <div className="donate-hero-item-text">{w.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="donate-hero-cta">
          <div className="donate-cta-card">
            <div className="donate-cta-amounts">
              <span>500</span><span>1,000</span><span>2,500</span><span>5,000+</span>
            </div>
            <div className="donate-cta-label">RWF via MTN MoMo</div>
            <DonateButton />
            <p className="donate-cta-note">Approve on your phone — takes 10 seconds</p>
          </div>
        </div>
      </div>
    </section>
  );
}
