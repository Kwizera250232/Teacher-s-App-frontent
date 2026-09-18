const fs = require('fs');
const file = '/home/umunsi/htdocs/studentapi.umunsi.com/routes/coaching.js';
let c = fs.readFileSync(file, 'utf8');

const old = `    // Get current participants (joined, not left)
    const participants = await pool.query(
      \`SELECT csp.student_id, u.name, p.avatar_path
       FROM coaching_session_participants csp
       JOIN users u ON u.id = csp.student_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE csp.session_id = $1 AND csp.joined_at IS NOT NULL AND csp.left_at IS NULL\`,
      [sessionId]
    );`;

const add = `
    // Add teacher as participant so students can connect via WebRTC
    const teacherRow = await pool.query(
      \`SELECT cs.teacher_id AS student_id, u.name, p.avatar_path
       FROM coaching_sessions cs
       JOIN users u ON u.id = cs.teacher_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE cs.id = $1\`,
      [sessionId]
    );
    if (teacherRow.rows.length > 0) {
      const tId = teacherRow.rows[0].student_id;
      if (!participants.rows.find(p => p.student_id === tId)) participants.rows.push(teacherRow.rows[0]);
    }`;

if (c.includes(old)) {
  c = c.replace(old, old + add);
  fs.writeFileSync(file, c, 'utf8');
  console.log('OK: teacher added to participants');
} else {
  console.log('FAIL: pattern not found');
}
