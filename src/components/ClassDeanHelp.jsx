import { useState } from 'react';
import UmunsiAiModal from './UmunsiAiModal';
import './ClassDeanHelp.css';

/** Dean class AI — only inside a class page (no floating popup). */
export default function ClassDeanHelp({ token, classId, className, isTeacher = false, buttonClassName = '' }) {
  const [open, setOpen] = useState(false);
  if (!classId) return null;

  return (
    <>
      <button
        type="button"
        className={`class-dean-help-btn${buttonClassName ? ` ${buttonClassName}` : ''}`}
        onClick={() => setOpen(true)}
      >
        🎓 Dean · Class help
      </button>
      {open && (
        <UmunsiAiModal
          classId={classId}
          className={className || 'Class'}
          token={token}
          isTeacher={isTeacher}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
