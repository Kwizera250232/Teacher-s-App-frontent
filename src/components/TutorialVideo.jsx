import { useState } from 'react';
import './TutorialVideo.css';

const DEFAULT_SRC = '/videos/uclass-tutorial.mp4';
const DEFAULT_POSTER = '/images/landing/656642666_1404974461657878_6540421227514327794_n.jpg';

/**
 * Embeddable tutorial / how-to video with optional modal fullscreen.
 */
export default function TutorialVideo({
  title = 'How to use UClass',
  subtitle = 'Step-by-step guide — teachers, students, parents & guests',
  src = DEFAULT_SRC,
  poster = DEFAULT_POSTER,
  compact = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  const player = (
    <video
      className="tutorial-video__player"
      controls
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={title}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support HTML5 video.
    </video>
  );

  if (compact) {
    return (
      <div className={`tutorial-video tutorial-video--compact ${className}`.trim()}>
        <button
          type="button"
          className="tutorial-video__compact-btn"
          onClick={() => setOpen(true)}
          aria-label={`Play ${title}`}
        >
          <span className="tutorial-video__play-icon" aria-hidden="true">▶</span>
          <span>
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
        </button>
        {open && (
          <div className="tutorial-video__modal" role="dialog" aria-modal="true" aria-label={title}>
            <div className="tutorial-video__modal-backdrop" onClick={() => setOpen(false)} />
            <div className="tutorial-video__modal-body">
              <button type="button" className="tutorial-video__close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
              {player}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className={`tutorial-video ${className}`.trim()} aria-labelledby="tutorial-video-heading">
      <div className="tutorial-video__header">
        <h2 id="tutorial-video-heading">{title}</h2>
        {subtitle && <p className="tutorial-video__subtitle">{subtitle}</p>}
      </div>
      <div className="tutorial-video__frame">{player}</div>
      <p className="tutorial-video__hint">
        Personal details are blurred in this guide. Search <strong>UClass Student Umunsi</strong> on Google or visit{' '}
        <a href="https://student.umunsi.com" target="_blank" rel="noopener noreferrer">student.umunsi.com</a>.
      </p>
    </section>
  );
}

export function TutorialVideoDownloadLink({ src = DEFAULT_SRC, label = 'Download tutorial video (MP4)' }) {
  return (
    <a className="tutorial-video__download" href={src} download="uclass-how-to-use.mp4">
      ⬇ {label}
    </a>
  );
}
