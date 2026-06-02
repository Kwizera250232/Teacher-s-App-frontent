import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassMomentsHero from './ClassMomentsHero';
import StudentSocialFeed from '../StudentSocialFeed';

const STORAGE_KEY = 'student_class_updates_fold_open';
const TAB_KEY = 'student_class_updates_tab';

/**
 * Collapsible classroom updates — below classes; teacher photos + Facebook-style class activities.
 */
export default function ClassMomentsFold({
  preview,
  feedPath = '/student/class-moments',
  defaultOpen = false,
  classes = [],
  token,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '1') return true;
      if (stored === '0') return false;
    } catch {
      /* ignore */
    }
    return defaultOpen;
  });
  const [section, setSection] = useState(() => {
    try {
      const t = localStorage.getItem(TAB_KEY);
      if (t === 'activities' || t === 'moments') return t;
    } catch {
      /* ignore */
    }
    return 'moments';
  });

  const count = preview?.today_count ?? 0;
  const unread = preview?.unread ?? 0;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, section);
    } catch {
      /* ignore */
    }
  }, [section]);

  const summary =
    count > 0
      ? `${count} update${count === 1 ? '' : 's'} today`
      : 'Photos and class activities from your classes';

  return (
    <section className="cm-fold" aria-label="Classroom updates">
      <div className="cm-fold-header">
        <button
          type="button"
          className="cm-fold-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="cm-fold-toggle-icon" aria-hidden>
            {open ? '▼' : '▶'}
          </span>
          <span className="cm-fold-toggle-text">
            <span className="cm-fold-title">📸 Classroom updates</span>
            <span className="cm-fold-sub">{summary}</span>
          </span>
          {unread > 0 && (
            <span className="cm-fold-badge">{unread} new</span>
          )}
        </button>
        <button
          type="button"
          className="cm-fold-open-link"
          onClick={() => navigate(feedPath)}
        >
          Teacher photos
        </button>
      </div>
      {open && (
        <div className="cm-fold-body">
          <p className="cm-fold-hint">
            Optional — open when class is done. Homework and quizzes stay in each class above.
          </p>
          <div className="cm-fold-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={section === 'moments'}
              className={section === 'moments' ? 'active' : ''}
              onClick={() => setSection('moments')}
            >
              📸 Teacher updates
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === 'activities'}
              className={section === 'activities' ? 'active' : ''}
              onClick={() => setSection('activities')}
            >
              💬 Class activities
            </button>
          </div>
          {section === 'moments' && (
            <ClassMomentsHero preview={preview} feedPath={feedPath} />
          )}
          {section === 'activities' && token && (
            <StudentSocialFeed classes={classes} token={token} embedded />
          )}
        </div>
      )}
    </section>
  );
}
