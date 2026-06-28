// This file contains additional alumni backend routes
// To be appended to routes/alumni.js on the server

// ── Alumni History: Notes, Quizzes, Homework ──

router.get('/my-notes', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query('SELECT class_id, school_id FROM users WHERE id = $1', [req.user.id]);
    const { class_id } = userRes.rows[0] || {};
    if (!class_id) return res.json({ notes: [] });
    const notes = await pool.query(
      'SELECT n.*, u.name as teacher_name FROM notes n LEFT JOIN users u ON n.teacher_id = u.id WHERE n.class_id = $1 ORDER BY n.created_at DESC',
      [class_id]
    );
    res.json({ notes: notes.rows });
  } catch (err) {
    console.error('[alumni/my-notes]', err);
    res.status(500).json({ error: 'Failed to load notes' });
  }
});

router.get('/my-quizzes', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query('SELECT class_id FROM users WHERE id = $1', [req.user.id]);
    const { class_id } = userRes.rows[0] || {};
    if (!class_id) return res.json({ quizzes: [] });
    const quizzes = await pool.query(
      `SELECT q.*, qr.score, qr.status FROM quizzes q
       LEFT JOIN quiz_results qr ON q.id = qr.quiz_id AND qr.student_id = $1
       WHERE q.class_id = $2 ORDER BY q.created_at DESC`,
      [req.user.id, class_id]
    );
    res.json({ quizzes: quizzes.rows });
  } catch (err) {
    console.error('[alumni/my-quizzes]', err);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

router.get('/my-homework', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query('SELECT class_id FROM users WHERE id = $1', [req.user.id]);
    const { class_id } = userRes.rows[0] || {};
    if (!class_id) return res.json({ homework: [] });
    const homework = await pool.query(
      `SELECT h.*, hs.grade as my_grade FROM homework h
       LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = $1
       WHERE h.class_id = $2 ORDER BY h.created_at DESC`,
      [req.user.id, class_id]
    );
    res.json({ homework: homework.rows });
  } catch (err) {
    console.error('[alumni/my-homework]', err);
    res.status(500).json({ error: 'Failed to load homework' });
  }
});

// ── Admin Routes for Alumni Content ──

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'head_teacher') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Books
router.get('/library', authenticateToken, async (req, res) => {
  try {
    const books = await pool.query('SELECT * FROM alumni_library ORDER BY created_at DESC');
    res.json({ books: books.rows });
  } catch (err) {
    console.error('[alumni/library]', err);
    res.status(500).json({ error: 'Failed to load books' });
  }
});

router.post('/admin/books', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, section, cover_url, download_url, description } = req.body;
    const result = await pool.query(
      'INSERT INTO alumni_library (title, author, section, cover_url, download_url, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, author, section, cover_url, download_url, description]
    );
    res.json({ success: true, book: result.rows[0] });
  } catch (err) {
    console.error('[admin/books]', err);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

router.put('/admin/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, section, cover_url, download_url, description } = req.body;
    const result = await pool.query(
      'UPDATE alumni_library SET title=$1, author=$2, section=$3, cover_url=$4, download_url=$5, description=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [title, author, section, cover_url, download_url, description, req.params.id]
    );
    res.json({ success: true, book: result.rows[0] });
  } catch (err) {
    console.error('[admin/books/update]', err);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

router.delete('/admin/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM alumni_library WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/books/delete]', err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Opportunities
router.get('/opportunities', authenticateToken, async (req, res) => {
  try {
    const opps = await pool.query('SELECT * FROM alumni_opportunities ORDER BY created_at DESC');
    res.json({ opportunities: opps.rows });
  } catch (err) {
    console.error('[alumni/opportunities]', err);
    res.status(500).json({ error: 'Failed to load opportunities' });
  }
});

router.post('/admin/opportunities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, category, organization, location, deadline, link, description } = req.body;
    const result = await pool.query(
      'INSERT INTO alumni_opportunities (title, category, organization, location, deadline, link, description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, category, organization, location, deadline, link, description]
    );
    res.json({ success: true, opportunity: result.rows[0] });
  } catch (err) {
    console.error('[admin/opportunities]', err);
    res.status(500).json({ error: 'Failed to add opportunity' });
  }
});

router.put('/admin/opportunities/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, category, organization, location, deadline, link, description } = req.body;
    const result = await pool.query(
      'UPDATE alumni_opportunities SET title=$1, category=$2, organization=$3, location=$4, deadline=$5, link=$6, description=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, category, organization, location, deadline, link, description, req.params.id]
    );
    res.json({ success: true, opportunity: result.rows[0] });
  } catch (err) {
    console.error('[admin/opportunities/update]', err);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

router.delete('/admin/opportunities/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM alumni_opportunities WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/opportunities/delete]', err);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

// Past Papers
router.get('/past-papers', authenticateToken, async (req, res) => {
  try {
    const papers = await pool.query('SELECT * FROM alumni_past_papers ORDER BY year DESC, created_at DESC');
    res.json({ papers: papers.rows });
  } catch (err) {
    console.error('[alumni/past-papers]', err);
    res.status(500).json({ error: 'Failed to load past papers' });
  }
});

router.post('/admin/past-papers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, subject, year, pdf_url } = req.body;
    const result = await pool.query(
      'INSERT INTO alumni_past_papers (title, subject, year, pdf_url) VALUES ($1,$2,$3,$4) RETURNING *',
      [title, subject, year, pdf_url]
    );
    res.json({ success: true, paper: result.rows[0] });
  } catch (err) {
    console.error('[admin/past-papers]', err);
    res.status(500).json({ error: 'Failed to add past paper' });
  }
});

router.put('/admin/past-papers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, subject, year, pdf_url } = req.body;
    const result = await pool.query(
      'UPDATE alumni_past_papers SET title=$1, subject=$2, year=$3, pdf_url=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [title, subject, year, pdf_url, req.params.id]
    );
    res.json({ success: true, paper: result.rows[0] });
  } catch (err) {
    console.error('[admin/past-papers/update]', err);
    res.status(500).json({ error: 'Failed to update past paper' });
  }
});

router.delete('/admin/past-papers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM alumni_past_papers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/past-papers/delete]', err);
    res.status(500).json({ error: 'Failed to delete past paper' });
  }
});

// ── Auto-sync: Teacher content → Alumni ──
// When teacher creates quiz, also make it available to alumni

router.post('/sync-quiz', authenticateToken, async (req, res) => {
  try {
    const { quiz_id } = req.body;
    if (!quiz_id) return res.status(400).json({ error: 'quiz_id required' });
    // Mark quiz as alumni_visible
    await pool.query('UPDATE quizzes SET alumni_visible = TRUE WHERE id = $1', [quiz_id]);
    res.json({ success: true, message: 'Quiz synced to alumni' });
  } catch (err) {
    console.error('[alumni/sync-quiz]', err);
    res.status(500).json({ error: 'Failed to sync quiz' });
  }
});

// Dean AI quiz search
router.get('/dean-quizzes', authenticateToken, async (req, res) => {
  try {
    const quizzes = await pool.query(
      'SELECT q.*, COUNT(qq.id) as question_count FROM quizzes q LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id WHERE q.alumni_visible = TRUE GROUP BY q.id ORDER BY q.created_at DESC LIMIT 20'
    );
    res.json({ quizzes: quizzes.rows });
  } catch (err) {
    console.error('[dean-quizzes]', err);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

router.get('/dean-quizzes/search', authenticateToken, async (req, res) => {
  try {
    const { grade, subject } = req.query;
    const searchTerm = (grade || '') + ' ' + (subject || '');
    const quizzes = await pool.query(
      "SELECT q.* FROM quizzes q WHERE q.alumni_visible = TRUE AND (q.title ILIKE $1 OR q.category ILIKE $2) ORDER BY q.created_at DESC LIMIT 10",
      ['%' + searchTerm + '%', '%' + (subject || '') + '%']
    );
    res.json({ quizzes: quizzes.rows });
  } catch (err) {
    console.error('[dean-quizzes/search]', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/dean-quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1 AND alumni_visible = TRUE', [req.params.id]);
    const questions = await pool.query('SELECT * FROM quiz_questions WHERE quiz_id = $1', [req.params.id]);
    res.json({ quiz: quiz.rows[0], questions: questions.rows });
  } catch (err) {
    console.error('[dean-quizzes/id]', err);
    res.status(500).json({ error: 'Failed to load quiz' });
  }
});

router.post('/dean-quizzes/submit', authenticateToken, async (req, res) => {
  try {
    const { quiz_id, answers, score } = req.body;
    await pool.query(
      'INSERT INTO alumni_quiz_results (user_id, quiz_id, answers, score, created_at) VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (user_id, quiz_id) DO UPDATE SET answers=$3, score=$4, created_at=NOW()',
      [req.user.id, quiz_id, JSON.stringify(answers), score]
    );
    res.json({ success: true, score });
  } catch (err) {
    console.error('[dean-quizzes/submit]', err);
    res.status(500).json({ error: 'Failed to submit' });
  }
});
