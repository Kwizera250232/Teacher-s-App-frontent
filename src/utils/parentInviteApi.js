import { api } from '../api';

function isMissingRouteError(err) {
  const msg = String(err?.message || '');
  return /404/.test(msg) || /not found/i.test(msg) || /Cannot (GET|POST)/i.test(msg);
}

function isRetryableStudentInviteError(err) {
  const msg = String(err?.message || '');
  if (isMissingRouteError(err)) return true;
  if (/insufficient role/i.test(msg)) return true;
  if (/Forbidden/i.test(msg) && /student/i.test(msg) === false) return true;
  return false;
}

/** Create parent invite link — tries routes supported across API versions. */
export async function createParentInviteLink({ token, studentId, selfStudentId }) {
  if (studentId) {
    return api.post(`/parent/students/${studentId}/parent-link`, {}, token);
  }

  const id = selfStudentId;
  const attempts = [
    () => api.post('/auth/parent-invite', {}, token),
    () => api.post('/student/parent-invite', {}, token),
    () => api.post('/parent/my/parent-invite', {}, token),
  ];
  if (id) {
    attempts.push(() => api.post(`/parent/students/${id}/parent-link`, {}, token));
  }

  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
      if (!isRetryableStudentInviteError(err)) throw err;
    }
  }

  throw new Error(
    'Parent invite is not ready on the server yet. Ask your teacher for a parent link from the class Students tab.'
  );
}

/** Load students for teacher parent-invite picker (fallback if API route missing). */
export async function loadInvitableStudents(token) {
  try {
    const rows = await api.get('/parent/invitable-students', token);
    if (Array.isArray(rows) && rows.length) return rows;
  } catch (e) {
    if (!isMissingRouteError(e)) throw e;
  }

  const classes = await api.get('/classes', token);
  const list = Array.isArray(classes) ? classes : [];
  const merged = [];
  const seen = new Set();

  await Promise.all(
    list.map(async (cls) => {
      try {
        const students = await api.get(`/classes/${cls.id}/students`, token);
        (students || []).forEach((s) => {
          const key = `${cls.id}-${s.id}`;
          if (seen.has(key)) return;
          seen.add(key);
          merged.push({
            id: s.id,
            name: s.name,
            class_id: cls.id,
            class_name: cls.name,
          });
        });
      } catch {
        /* skip class */
      }
    })
  );

  merged.sort((a, b) => {
    const c = (a.class_name || '').localeCompare(b.class_name || '');
    return c !== 0 ? c : (a.name || '').localeCompare(b.name || '');
  });

  return merged;
}
