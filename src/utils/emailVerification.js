/** Tabs / areas that require a confirmed email before use */
export const GATED_CLASS_TABS = [
  'Feed',
  'Announcements',
  'Notes',
  'Homework',
  'Quizzes',
  'Leaderboard',
  'Discussion',
  'Students',
  'Classmates',
];

export function needsEmailVerification(user) {
  if (!user) return false;
  if (user.role === 'admin') return false;
  return user.email_verified === false;
}

export function isGatedClassTab(tabName) {
  return GATED_CLASS_TABS.includes(tabName);
}
