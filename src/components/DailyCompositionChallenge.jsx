import { useState, useEffect } from 'react';
import { api } from '../api';
import './DailyCompositionChallenge.css';

const REWARD_AMOUNT = 'Rwf 1,000';
const TIME_LIMIT = '60 min';
const WINNERS = 'Daily';

export default function DailyCompositionChallenge({ token }) {
  const [challenge, setChallenge] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showWriter, setShowWriter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gmail, setGmail] = useState('');
  const [momo, setMomo] = useState('');
  const [names, setNames] = useState('');
  const [noCopyPaste, setNoCopyPaste] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get('/alumni/composition-challenge/today', token);
        setChallenge(data.challenge || null);
        setAlreadySubmitted(data.alreadySubmitted || null);
      } catch (e) {
        setError(e.message || 'Failed to load challenge.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const minWords = challenge?.min_words || 150;
  const maxWords = challenge?.max_words || 500;
  const isValid = content.trim().length >= 50 && wordCount >= minWords && wordCount <= maxWords && noCopyPaste;

  const handleSubmit = async () => {
    if (!challenge || !isValid) return;
    setSaving(true);
    setSubmitError('');
    try {
      const res = await api.post(`/alumni/composition-challenge/${challenge.id}/submit`, {
        title: title.trim() || challenge.topic,
        content,
        gmail_address: gmail.trim() || null,
        momo_number: momo.trim() || null,
        names: names.trim() || null,
      }, token);
      setAlreadySubmitted(res.submission || { status: 'pending' });
      setSubmitSuccess(true);
      setShowWriter(false);
    } catch (e) {
      setSubmitError(e.message || 'Failed to submit.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (error) return null;
  if (!challenge) return null;

  return (
    <>
      <div className="dcc-card" id="daily-composition-challenge">
        <div className="dcc-left-accent" />

        <div className="dcc-header">
          <div className="dcc-header-left">
            <div className="dcc-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </div>
            <span className="dcc-title">Daily Composition Challenge</span>
          </div>
          <div className="dcc-header-right">
            <span className="dcc-reward-badge">⭐ Earn Rewards</span>
          </div>
        </div>

        <div className="dcc-body">
          <div className="dcc-info">
            <span className="dcc-topic-label">Today&apos;s Topic</span>
            <h2 className="dcc-topic">{challenge.topic}</h2>
            <p className="dcc-subtitle">{challenge.prompt}</p>

            <div className="dcc-stats">
              <div className="dcc-stat">
                <div className="dcc-stat-icon dcc-stat-blue">A</div>
                <div>
                  <div className="dcc-stat-label">Word Limit</div>
                  <div className="dcc-stat-value">{minWords} – {maxWords}</div>
                </div>
              </div>
              <div className="dcc-stat">
                <div className="dcc-stat-icon dcc-stat-blue">⏱</div>
                <div>
                  <div className="dcc-stat-label">Time Limit</div>
                  <div className="dcc-stat-value">{TIME_LIMIT}</div>
                </div>
              </div>
              <div className="dcc-stat">
                <div className="dcc-stat-icon dcc-stat-green">🏆</div>
                <div>
                  <div className="dcc-stat-label">Top Reward</div>
                  <div className="dcc-stat-value">{REWARD_AMOUNT}</div>
                </div>
              </div>
              <div className="dcc-stat">
                <div className="dcc-stat-icon dcc-stat-pink">🎁</div>
                <div>
                  <div className="dcc-stat-label">Winners</div>
                  <div className="dcc-stat-value">{WINNERS}</div>
                </div>
              </div>
            </div>

            <div className="dcc-actions">
              <button className="dcc-btn-outline" onClick={() => setShowGuidelines(true)}>
                <span>📖</span> View Guidelines
              </button>
              {alreadySubmitted ? (
                <button className="dcc-btn-primary dcc-btn-disabled" disabled>
                  <span>✓</span> Submitted
                </button>
              ) : (
                <button className="dcc-btn-primary" onClick={() => setShowWriter(true)}>
                  <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                      <path d="M2 2l7.586 7.586" />
                      <circle cx="11" cy="11" r="2" />
                    </svg>
                  </span>
                  Start Writing
                </button>
              )}
            </div>
          </div>

          <div className="dcc-illustration" aria-hidden="true">
            <div className="dcc-illustration-bg" />
            <div className="dcc-notebook">
              <div className="dcc-notebook-spine" />
              <div className="dcc-notebook-heart">♡</div>
            </div>
            <div className="dcc-pencil">✏️</div>
            <div className="dcc-plant">🌿</div>
            <div className="dcc-sparkle">✨</div>
            <div className="dcc-sparkle2">✨</div>
          </div>
        </div>
      </div>

      {alreadySubmitted && (
        <div className="dcc-submitted-banner">
          <span>🎉</span>
          <div>
            <strong>You submitted today!</strong>
            <span>Status: <span className={`dcc-status ${alreadySubmitted.status}`}>{alreadySubmitted.status}</span></span>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="dcc-success-banner">
          <span>✅</span> Your composition was submitted! Good luck.
        </div>
      )}

      {showGuidelines && (
        <div className="dcc-modal-overlay" onClick={() => setShowGuidelines(false)}>
          <div className="dcc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📖 Composition Guidelines</h3>
            <p className="dcc-guideline-topic"><strong>Topic:</strong> {challenge.topic}</p>
            <div className="dcc-guideline-body">
              {challenge.guidelines ? (
                challenge.guidelines.split('\n').map((line, i) => <p key={i}>{line}</p>)
              ) : (
                <p>Write an original composition on the topic. Be clear, creative, and stick to the word limit.</p>
              )}
              <ul>
                <li>Minimum {minWords} words, maximum {maxWords} words.</li>
                <li>Submit before the time limit expires.</li>
                <li>Winners are chosen daily and rewarded in <strong>RWF</strong>.</li>
                <li>Provide a valid Gmail address, MoMo number and your names to receive the reward if your article wins.</li>
                <li><strong>No copy-paste</strong> — original work only.</li>
              </ul>
            </div>
            <button className="dcc-btn-primary" onClick={() => setShowGuidelines(false)}>Got it</button>
          </div>
        </div>
      )}

      {showWriter && (
        <div className="dcc-modal-overlay" onClick={() => setShowWriter(false)}>
          <div className="dcc-modal dcc-modal-lg" onClick={(e) => e.stopPropagation()}>
            <h3>✍️ Write Your Composition</h3>
            <p className="dcc-writer-topic"><strong>Topic:</strong> {challenge.topic}</p>

            <label className="dcc-label">Title</label>
            <input
              className="dcc-input"
              type="text"
              placeholder="Give your composition a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label className="dcc-label">Your Composition</label>
            <textarea
              className="dcc-textarea"
              placeholder="Start writing here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="dcc-word-count">
              {wordCount} / {maxWords} words {wordCount < minWords && `(min ${minWords})`}
            </div>

            <div className="dcc-reward-info">
              <span>💰</span>
              <p>Provide a valid Gmail address, MoMo number and your names to receive the reward in case your article wins.</p>
            </div>

            <div className="dcc-reward-fields">
              <div>
                <label className="dcc-label">Full names</label>
                <input
                  className="dcc-input"
                  type="text"
                  placeholder="Your full names"
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                />
              </div>
              <div>
                <label className="dcc-label">Gmail address</label>
                <input
                  className="dcc-input"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                />
              </div>
              <div>
                <label className="dcc-label">MoMo number</label>
                <input
                  className="dcc-input"
                  type="text"
                  placeholder="07XX..."
                  value={momo}
                  onChange={(e) => setMomo(e.target.value)}
                />
              </div>
            </div>

            <label className="dcc-checkbox">
              <input
                type="checkbox"
                checked={noCopyPaste}
                onChange={(e) => setNoCopyPaste(e.target.checked)}
              />
              <span>I confirm this is my original work — <strong>no copy-paste</strong>.</span>
            </label>

            {submitError && <div className="dcc-alert">{submitError}</div>}

            <div className="dcc-modal-actions">
              <button className="dcc-btn-outline" onClick={() => setShowWriter(false)}>Cancel</button>
              <button
                className="dcc-btn-primary"
                disabled={saving || !isValid}
                onClick={handleSubmit}
              >
                {saving ? 'Submitting...' : 'Submit Composition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
