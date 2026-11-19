import { API_BASE } from '../api';

const LS_NOTES = 'ucl_offline_notes_v1';
const LS_QUIZZES = 'ucl_offline_quizzes_v1';
const LS_QUEUE = 'ucl_offline_queue_v1';

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full */ }
}
function emit(type, extra = {}) {
  window.dispatchEvent(new CustomEvent('ucl-offline-event', { detail: { type, ...extra } }));
}
export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

// ── NOTES ──────────────────────────────────────────────────────────────
export function saveNoteForOffline(note) {
  const notes = read(LS_NOTES, {});
  notes[note.id] = {
    id: note.id,
    title: note.title || 'Note',
    content: note.content || '',
    color: note.color || '#fff9c4',
    savedAt: Date.now(),
  };
  write(LS_NOTES, notes);
  emit('NOTE_SAVED_OFFLINE');
  return notes[note.id];
}
export function getOfflineNotes() {
  const notes = read(LS_NOTES, {});
  return Object.values(notes).sort((a, b) => b.savedAt - a.savedAt);
}
export function removeOfflineNote(id) {
  const notes = read(LS_NOTES, {});
  delete notes[id];
  write(LS_NOTES, notes);
}
export function isNoteDownloaded(id) {
  return Boolean(read(LS_NOTES, {})[id]);
}

// ── QUIZZES ────────────────────────────────────────────────────────────
export function saveQuizForOffline({ classId, quizId, title, subject, questions, meta }) {
  const quizzes = read(LS_QUIZZES, {});
  const key = `${classId}:${quizId}`;
  quizzes[key] = {
    classId, quizId,
    title: title || meta?.title || 'Quiz',
    subject: subject || meta?.subject || meta?.class_subject || '',
    questions,
    meta: meta || null,
    savedAt: Date.now(),
  };
  write(LS_QUIZZES, quizzes);
  emit('QUIZ_SAVED_OFFLINE', { count: getPendingCount() });
  return quizzes[key];
}
export function getQuizForOffline(classId, quizId) {
  return read(LS_QUIZZES, {})[`${classId}:${quizId}`] || null;
}
export function getOfflineQuizzes() {
  return Object.values(read(LS_QUIZZES, {})).sort((a, b) => b.savedAt - a.savedAt);
}
export function removeOfflineQuiz(classId, quizId) {
  const quizzes = read(LS_QUIZZES, {});
  delete quizzes[`${classId}:${quizId}`];
  write(LS_QUIZZES, quizzes);
}
export function isQuizDownloaded(classId, quizId) {
  return Boolean(getQuizForOffline(classId, quizId));
}

// ── SUBMISSION QUEUE ───────────────────────────────────────────────────
export function queueQuizSubmission({ classId, quizId, answers, token }) {
  const queue = read(LS_QUEUE, []);
  queue.push({
    id: `${classId}:${quizId}:${Date.now()}`,
    classId, quizId, answers, token,
    savedAt: Date.now(),
  });
  write(LS_QUEUE, queue);
  emit('QUIZ_SAVED_OFFLINE', { count: queue.length });
  return queue.length;
}
export function getPendingCount() {
  return read(LS_QUEUE, []).length;
}
export function getPendingSubmissions() {
  return read(LS_QUEUE, []);
}
export function removePendingSubmission(id) {
  write(LS_QUEUE, read(LS_QUEUE, []).filter((q) => q.id !== id));
}

// ── SYNC ───────────────────────────────────────────────────────────────
export async function flushPending() {
  if (!isOnline()) return { synced: 0, remaining: getPendingCount() };
  const queue = read(LS_QUEUE, []);
  if (!queue.length) return { synced: 0, remaining: 0 };

  let synced = 0;
  for (const item of queue) {
    try {
      const res = await fetch(
        `${API_BASE}/classes/${item.classId}/quizzes/${item.quizId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') || item.token
              ? { Authorization: `Bearer ${localStorage.getItem('token') || item.token}` }
              : {}),
          },
          body: JSON.stringify({ answers: item.answers }),
        }
      );
      if (res.ok) {
        removePendingSubmission(item.id);
        synced += 1;
      } else {
        break; // auth/server error — stop and retry later
      }
    } catch {
      break; // still offline or network down
    }
  }
  const remaining = getPendingCount();
  if (synced > 0) emit('QUIZ_SYNCED', { count: synced });
  if (remaining === 0 && synced > 0) emit('ALL_QUIZZES_SYNCED');
  return { synced, remaining };
}
