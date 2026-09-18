const fs = require('fs');
const file = '/home/umunsi/htdocs/studentapi.umunsi.com/routes/classes.js';
let c = fs.readFileSync(file, 'utf8');

const old = `router.get('/my', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      \`SELECT c.*, u.name AS teacher_name
       FROM classes c
       JOIN class_members cm ON c.id = cm.class_id
       JOIN users u ON c.teacher_id = u.id
       WHERE cm.student_id = $1
       ORDER BY cm.joined_at DESC\`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});`;

const nw = `router.get('/my', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const result = await pool.query(
        \`SELECT c.*, u.name AS teacher_name
         FROM classes c
         JOIN class_members cm ON c.id = cm.class_id
         JOIN users u ON c.teacher_id = u.id
         WHERE cm.student_id = $1
         ORDER BY cm.joined_at DESC\`,
        [req.user.id]
      );
      return res.json(result.rows);
    }
    // Teacher / head_teacher / admin — return classes they teach
    const result = await pool.query(
      \`SELECT c.*, u.name AS teacher_name
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.teacher_id = $1
       ORDER BY c.created_at DESC\`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});`;

if (c.includes(old)) {
  c = c.replace(old, nw);
  fs.writeFileSync(file, c, 'utf8');
  console.log('OK: /classes/my now supports teachers');
} else {
  console.log('FAIL: pattern not found');
}
