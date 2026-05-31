import { api } from '../api';

function isMissingRouteError(err) {
  const msg = String(err?.message || '');
  return /404/.test(msg) || /not found/i.test(msg) || /Cannot (GET|POST)/i.test(msg);
}

/** Create parent invite link — tries routes supported across API versions. */
export async function createParentInviteLink({ token, studentId, selfStudentId }) {
  if (studentId) {
    return api.post(`/parent/students/${studentId}/parent-link`, {}, token);
  }

  const id = selfStudentId;
  const attempts = [
    () => api.post('/parent/my/parent-invite', {}, token),
    () => api.post('/student/parent-invite', {}, token),
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
      if (!isMissingRouteError(err)) throw err;
    }
  }

  throw lastError || new Error(
    'Parent invite is not available on the server yet. Ask your teacher to send you a parent link from their class.'
  );
}
