import { useState, useRef, useEffect } from 'react';
import { api } from '../../api';

const LOADING_MESSAGES = [
  '🧠 Ndimo gutekereza...',
  '⏳ Buretse gato...',
  '✅ Maze kubibona!',
];

const SUBJECTS = [
  // Primary subjects
  'Mathematics', 'English', 'Kinyarwanda', 'French', 'Science and Elementary Technology (SET)',
  'Social and Religious Studies (SST)', 'Creative Arts', 'Physical Education and Sports (PES)',
  'ICT', 'Entrepreneurship',
  // Secondary — Sciences
  'Biology', 'Chemistry', 'Physics', 'Mathematics (Secondary)', 'General Science',
  // Secondary — Humanities
  'Geography', 'History', 'Civics', 'Economics', 'Entrepreneurship (Secondary)',
  'Religious Education', 'Social Studies',
  // Secondary — Languages
  'English (Secondary)', 'Literature in English', 'Kinyarwanda Literature', 'French (Secondary)',
  'Kiswahili', 'German',
  // Secondary — Commercial
  'Accounting', 'Economics (Secondary)', 'Business Studies',
  // Secondary — Technical
  'Computer Science', 'ICT (Secondary)', 'Technical Drawing', 'Agriculture',
  // Other
  'Other',
];

const GRADE_OPTIONS = ['P1','P2','P3','P4','P5','P6','S1','S2','S3','S4','S5','S6'];

const QUIZ_TYPES = [
  'National Exam Past Paper',
  'Mid-term Exam',
  'End of Term Exam',
  'Chapter Review',
  'General Knowledge Quiz',
  'Mock Exam',
  'Revision Quiz',
];

const YEARS = ['Any year', ...Array.from({ length: 51 }, (_, i) => 2000 + i)];

// Predefined quiz templates — user picks one, system auto-fills grade/subject/type
const QUIZ_TEMPLATES = [
  // Primary — National Exams
  { label: 'P6 English — National Exam', grade: 'P6', subject: 'English', type: 'National Exam Past Paper' },
  { label: 'P6 Mathematics — National Exam', grade: 'P6', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'P6 Kinyarwanda — National Exam', grade: 'P6', subject: 'Kinyarwanda', type: 'National Exam Past Paper' },
  { label: 'P6 French — National Exam', grade: 'P6', subject: 'French', type: 'National Exam Past Paper' },
  { label: 'P6 SET — National Exam', grade: 'P6', subject: 'Science and Elementary Technology (SET)', type: 'National Exam Past Paper' },
  { label: 'P6 SST — National Exam', grade: 'P6', subject: 'Social and Religious Studies (SST)', type: 'National Exam Past Paper' },
  { label: 'P6 Social Studies — National Exam', grade: 'P6', subject: 'Social and Religious Studies (SST)', type: 'National Exam Past Paper' },
  { label: 'P6 Religious Studies — National Exam', grade: 'P6', subject: 'Social and Religious Studies (SST)', type: 'National Exam Past Paper' },
  { label: 'P6 Creative Arts — National Exam', grade: 'P6', subject: 'Creative Arts', type: 'National Exam Past Paper' },
  { label: 'P6 PES — National Exam', grade: 'P6', subject: 'Physical Education and Sports (PES)', type: 'National Exam Past Paper' },
  { label: 'P6 ICT — National Exam', grade: 'P6', subject: 'ICT', type: 'National Exam Past Paper' },
  { label: 'P6 Entrepreneurship — National Exam', grade: 'P6', subject: 'Entrepreneurship', type: 'National Exam Past Paper' },
  // P1-P5
  { label: 'P1 Mathematics — National Exam', grade: 'P1', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'P1 English — National Exam', grade: 'P1', subject: 'English', type: 'National Exam Past Paper' },
  { label: 'P2 Mathematics — National Exam', grade: 'P2', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'P2 English — National Exam', grade: 'P2', subject: 'English', type: 'National Exam Past Paper' },
  { label: 'P3 Mathematics — National Exam', grade: 'P3', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'P3 English — National Exam', grade: 'P3', subject: 'English', type: 'National Exam Past Paper' },
  { label: 'P3 Kinyarwanda — National Exam', grade: 'P3', subject: 'Kinyarwanda', type: 'National Exam Past Paper' },
  { label: 'P4 Mathematics — National Exam', grade: 'P4', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'P4 English — National Exam', grade: 'P4', subject: 'English', type: 'National Exam Past Paper' },
  { label: 'P4 Kinyarwanda — National Exam', grade: 'P4', subject: 'Kinyarwanda', type: 'National Exam Past Paper' },
  { label: 'P4 SET — National Exam', grade: 'P4', subject: 'Science and Elementary Technology (SET)', type: 'National Exam Past Paper' },
  { label: 'P4 SST — National Exam', grade: 'P4', subject: 'Social and Religious Studies (SST)', type: 'National Exam Past Paper' },
  { label: 'P5 Mathematics — National Exam', grade: 'P5', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'P5 English — National Exam', grade: 'P5', subject: 'English', type: 'National Exam Past Paper' },
  { label: 'P5 Kinyarwanda — National Exam', grade: 'P5', subject: 'Kinyarwanda', type: 'National Exam Past Paper' },
  { label: 'P5 SET — National Exam', grade: 'P5', subject: 'Science and Elementary Technology (SET)', type: 'National Exam Past Paper' },
  { label: 'P5 SST — National Exam', grade: 'P5', subject: 'Social and Religious Studies (SST)', type: 'National Exam Past Paper' },
  // Secondary — National Exams (O-level)
  { label: 'S3 Mathematics — National Exam', grade: 'S3', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'S3 Biology — National Exam', grade: 'S3', subject: 'Biology', type: 'National Exam Past Paper' },
  { label: 'S3 Chemistry — National Exam', grade: 'S3', subject: 'Chemistry', type: 'National Exam Past Paper' },
  { label: 'S3 Physics — National Exam', grade: 'S3', subject: 'Physics', type: 'National Exam Past Paper' },
  { label: 'S3 English — National Exam', grade: 'S3', subject: 'English', type: 'National Exam Past Paper' },
  { label: 'S3 Kinyarwanda — National Exam', grade: 'S3', subject: 'Kinyarwanda', type: 'National Exam Past Paper' },
  { label: 'S3 French — National Exam', grade: 'S3', subject: 'French', type: 'National Exam Past Paper' },
  { label: 'S3 Geography — National Exam', grade: 'S3', subject: 'Geography', type: 'National Exam Past Paper' },
  { label: 'S3 History — National Exam', grade: 'S3', subject: 'History', type: 'National Exam Past Paper' },
  { label: 'S3 Civics — National Exam', grade: 'S3', subject: 'Civics', type: 'National Exam Past Paper' },
  { label: 'S3 Entrepreneurship — National Exam', grade: 'S3', subject: 'Entrepreneurship', type: 'National Exam Past Paper' },
  { label: 'S3 Computer Science — National Exam', grade: 'S3', subject: 'Computer Science', type: 'National Exam Past Paper' },
  { label: 'S3 Religious Education — National Exam', grade: 'S3', subject: 'Religious Education', type: 'National Exam Past Paper' },
  { label: 'S3 Kiswahili — National Exam', grade: 'S3', subject: 'Kiswahili', type: 'National Exam Past Paper' },
  // Secondary — National Exams (A-level)
  { label: 'S6 Mathematics — National Exam', grade: 'S6', subject: 'Mathematics', type: 'National Exam Past Paper' },
  { label: 'S6 Biology — National Exam', grade: 'S6', subject: 'Biology', type: 'National Exam Past Paper' },
  { label: 'S6 Chemistry — National Exam', grade: 'S6', subject: 'Chemistry', type: 'National Exam Past Paper' },
  { label: 'S6 Physics — National Exam', grade: 'S6', subject: 'Physics', type: 'National Exam Past Paper' },
  { label: 'S6 Geography — National Exam', grade: 'S6', subject: 'Geography', type: 'National Exam Past Paper' },
  { label: 'S6 History — National Exam', grade: 'S6', subject: 'History', type: 'National Exam Past Paper' },
  { label: 'S6 Economics — National Exam', grade: 'S6', subject: 'Economics', type: 'National Exam Past Paper' },
  { label: 'S6 Accounting — National Exam', grade: 'S6', subject: 'Accounting', type: 'National Exam Past Paper' },
  { label: 'S6 Literature in English — National Exam', grade: 'S6', subject: 'Literature in English', type: 'National Exam Past Paper' },
  { label: 'S6 Computer Science — National Exam', grade: 'S6', subject: 'Computer Science', type: 'National Exam Past Paper' },
  // Secondary — other exams
  { label: 'S1 Mathematics — Mid-term', grade: 'S1', subject: 'Mathematics', type: 'Mid-term Exam' },
  { label: 'S2 Mathematics — Mid-term', grade: 'S2', subject: 'Mathematics', type: 'Mid-term Exam' },
  { label: 'S4 Mathematics — Mock Exam', grade: 'S4', subject: 'Mathematics', type: 'Mock Exam' },
  { label: 'S4 Biology — Mock Exam', grade: 'S4', subject: 'Biology', type: 'Mock Exam' },
  { label: 'S4 Chemistry — Mock Exam', grade: 'S4', subject: 'Chemistry', type: 'Mock Exam' },
  { label: 'S4 Physics — Mock Exam', grade: 'S4', subject: 'Physics', type: 'Mock Exam' },
  { label: 'S5 Mathematics — Mock Exam', grade: 'S5', subject: 'Mathematics', type: 'Mock Exam' },
  { label: 'S5 Biology — Mock Exam', grade: 'S5', subject: 'Biology', type: 'Mock Exam' },
  // Revision quizzes
  { label: 'P6 Mathematics — Revision Quiz', grade: 'P6', subject: 'Mathematics', type: 'Revision Quiz' },
  { label: 'P6 English — Revision Quiz', grade: 'P6', subject: 'English', type: 'Revision Quiz' },
  { label: 'P6 SET — Revision Quiz', grade: 'P6', subject: 'Science and Elementary Technology (SET)', type: 'Revision Quiz' },
  { label: 'P6 SST — Revision Quiz', grade: 'P6', subject: 'Social and Religious Studies (SST)', type: 'Revision Quiz' },
  { label: 'S3 Biology — Revision Quiz', grade: 'S3', subject: 'Biology', type: 'Revision Quiz' },
  { label: 'S3 Chemistry — Revision Quiz', grade: 'S3', subject: 'Chemistry', type: 'Revision Quiz' },
  { label: 'S3 Physics — Revision Quiz', grade: 'S3', subject: 'Physics', type: 'Revision Quiz' },
];

export default function AIQuizGenerator({ token, classId, classes }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [chunkInfo, setChunkInfo] = useState('');
  const [examHeader, setExamHeader] = useState('');
  const [mode, setMode] = useState('paste'); // 'paste' or 'auto'
  const [numQuestions, setNumQuestions] = useState(20);
  const [year, setYear] = useState('');
  const [quizType, setQuizType] = useState('National Exam Past Paper');
  const [template, setTemplate] = useState('');
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const textareaRef = useRef(null);

  // When a template is selected, auto-fill grade/subject/type/title
  const handleTemplateChange = (val) => {
    setTemplate(val);
    if (val === '') return;
    const t = QUIZ_TEMPLATES.find(q => q.label === val);
    if (t) {
      setGradeLevel(t.grade);
      setSubject(t.subject);
      setQuizType(t.type);
      if (!title.trim()) setTitle(`${t.grade} ${t.subject} — ${t.type}`);
    }
  };

  // Show loading messages one by one (no loop)
  useEffect(() => {
    if (!loading) { setLoadingMsgIdx(0); return; }
    const timers = [
      setTimeout(() => setLoadingMsgIdx(1), 3000),
      setTimeout(() => setLoadingMsgIdx(2), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, [loading]);

  const handleGenerate = async (isPreview = false) => {
    setError('');
    setSuccess('');
    setPreviewQuestions(null);

    if (!content.trim()) { setError('Please paste lesson content or exam questions.'); return; }
    if (!title.trim()) { setError('Please enter a quiz title.'); return; }
    if (!selectedClass) { setError('Please select a class.'); return; }
    if (!gradeLevel.trim()) { setError('Please select a grade level.'); return; }
    if (!subject.trim()) { setError('Please select a subject.'); return; }

    setLoading(true);
    try {
      const endpoint = isPreview
        ? `/classes/${selectedClass}/ai-quiz/preview`
        : `/classes/${selectedClass}/ai-quiz/generate`;

      const body = isPreview
        ? { content: content.trim(), grade_level: gradeLevel.trim(), subject: subject.trim() }
        : { content: content.trim(), title: title.trim(), description: description.trim(), subject: subject.trim(), grade_level: gradeLevel.trim() };

      const r = await api.post(endpoint, body, token);

      if (isPreview) {
        setPreviewQuestions(r.questions);
        setChunkInfo(r.message);
        setExamHeader(r.examHeader || '');
        setPreviewMode(true);
      } else {
        setSuccess(`✅ Quiz "${r.quiz.title}" created with ${r.questions.length} questions! Students can take it now.`);
        setContent(''); setTitle(''); setDescription('');
        setPreviewQuestions(null);
        setExamHeader('');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async (isPreview = false) => {
    setError('');
    setSuccess('');
    setPreviewQuestions(null);

    if (!title.trim()) { setError('Please enter a quiz title.'); return; }
    if (!selectedClass) { setError('Please select a class.'); return; }
    if (!template) { setError('Please pick a quiz template.'); return; }
    if (!gradeLevel.trim()) { setError('Please select a grade level.'); return; }
    if (!subject.trim()) { setError('Please select a subject.'); return; }

    setLoading(true);
    try {
      const r = await api.post(
        `/classes/${selectedClass}/ai-quiz/auto-generate`,
        {
          title: title.trim(),
          description: template || description.trim(),
          grade_level: gradeLevel.trim(),
          subject: subject.trim(),
          num_questions: numQuestions,
          year: year && year !== 'Any year' ? year : '',
          quiz_type: quizType,
          preview_only: isPreview,
        },
        token
      );

      if (isPreview) {
        setPreviewQuestions(r.questions);
        setChunkInfo(r.message);
        setExamHeader(r.examHeader || '');
        setPreviewMode(true);
      } else {
        setSuccess(`✅ Quiz "${r.quiz.title}" created with ${r.questions.length} questions! Students can take it now.`);
        setTitle(''); setDescription('');
        setPreviewQuestions(null);
        setExamHeader('');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!title.trim()) { setError('Please enter a quiz title before saving.'); return; }
    if (!gradeLevel.trim()) { setError('Please select a grade level.'); return; }
    if (!subject.trim()) { setError('Please select a subject.'); return; }
    setError('');
    setLoading(true);
    try {
      const r = await api.post(
        `/classes/${selectedClass}/ai-quiz/generate`,
        { content: content.trim(), title: title.trim(), description: description.trim(), subject: subject.trim(), grade_level: gradeLevel.trim() },
        token
      );
      setSuccess(`✅ Quiz "${r.quiz.title}" created with ${r.questions.length} questions! Students can take it now.`);
      setContent(''); setTitle(''); setDescription('');
      setPreviewQuestions(null);
      setPreviewMode(false);
    } catch (err) {
      setError(err.message || 'Failed to save quiz.');
    } finally {
      setLoading(false);
    }
  };

  const charCount = content.length;
  const estimatedQuestions = Math.max(5, Math.min(40, Math.ceil(charCount / 300)));

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, color: '#111827', margin: 0 }}>🤖 AI Quiz Generator</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
          AI generates MCQ quiz questions with correct answers — from your content or on its own.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
        <button
          onClick={() => setMode('paste')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            background: mode === 'paste' ? '#7c3aed' : 'transparent', color: mode === 'paste' ? '#fff' : '#64748b',
          }}
        >
          📝 Paste Content
        </button>
        <button
          onClick={() => setMode('auto')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            background: mode === 'auto' ? '#7c3aed' : 'transparent', color: mode === 'auto' ? '#fff' : '#64748b',
          }}
        >
          🧠 Auto-Generate (No Content Needed)
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{error}</div>}
      {success && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{success}</div>}

      {/* Class selector */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Class *</label>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(parseInt(e.target.value, 10))}
          style={{ width: '100%', maxWidth: 400, padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14 }}
        >
          <option value="">— Select a class —</option>
          {(classes || []).map(c => (
            <option key={c.id} value={c.id}>{c.name}{c.subject ? ` (${c.subject})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Quiz metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Quiz Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. National Exam 2024 — Mathematics"
            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Grade Level *</label>
          <select
            value={gradeLevel}
            onChange={e => setGradeLevel(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' }}
          >
            <option value="">— Select grade —</option>
            <optgroup label="Primary">
              {['P1','P2','P3','P4','P5','P6'].map(g => <option key={g} value={g}>{g}</option>)}
            </optgroup>
            <optgroup label="Secondary">
              {['S1','S2','S3','S4','S5','S6'].map(g => <option key={g} value={g}>{g}</option>)}
            </optgroup>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Subject *</label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' }}
          >
            <option value="">— Select subject —</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Quiz Template selector — replaces free-text description */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Quiz Template * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(pick one — auto-fills grade, subject & type)</span></label>
        <select
          value={template}
          onChange={e => handleTemplateChange(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' }}
        >
          <option value="">— Pick a quiz template —</option>
          <optgroup label="Primary National Exams (P6)">
            {QUIZ_TEMPLATES.filter(t => t.grade === 'P6' && t.type === 'National Exam Past Paper').map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </optgroup>
          <optgroup label="Primary National Exams (P1-P5)">
            {QUIZ_TEMPLATES.filter(t => t.grade.startsWith('P') && t.grade !== 'P6' && t.type === 'National Exam Past Paper').map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </optgroup>
          <optgroup label="Secondary National Exams (O-Level S3)">
            {QUIZ_TEMPLATES.filter(t => t.grade === 'S3' && t.type === 'National Exam Past Paper').map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </optgroup>
          <optgroup label="Secondary National Exams (A-Level S6)">
            {QUIZ_TEMPLATES.filter(t => t.grade === 'S6' && t.type === 'National Exam Past Paper').map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </optgroup>
          <optgroup label="Mid-term & Mock Exams">
            {QUIZ_TEMPLATES.filter(t => t.type === 'Mid-term Exam' || t.type === 'Mock Exam').map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </optgroup>
          <optgroup label="Revision Quizzes">
            {QUIZ_TEMPLATES.filter(t => t.type === 'Revision Quiz').map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </optgroup>
        </select>
      </div>

      {/* Content textarea — only in paste mode */}
      {mode === 'paste' && (
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
          Paste Lesson / Exam Content *
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`Paste your lesson notes, national exam questions, textbook content, or any material here...

Example:
1. What is the capital of Rwanda?
A) Huye  B) Kigali  C) Musanze  D) Rubavu

2. The chemical formula for water is...
A) CO2  B) H2O  C) O2  D) NaCl

The AI will read ALL of this and create a proper MCQ quiz with correct answers. Nothing will be skipped.`}
          style={{
            width: '100%', minHeight: 280, padding: '12px 14px',
            border: '1.5px solid #cbd5e1', borderRadius: 10, fontSize: 14,
            fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
            background: '#fafafa',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
          <span>{charCount.toLocaleString()} characters pasted</span>
          <span>~{estimatedQuestions} questions expected</span>
        </div>
      </div>
      )}

      {/* Auto-generate settings — only in auto mode */}
      {mode === 'auto' && (
        <div style={{ background: '#faf5ff', borderRadius: 10, padding: 14, marginBottom: 16, border: '1.5px solid #e9d5ff' }}>
          <p style={{ fontSize: 13, color: '#6b21a8', margin: '0 0 10px' }}>
            🌐 AI izakora gushaka ku murongo (Google) amakuru y'ikizamini cya <strong>{gradeLevel || 'the selected grade'}</strong> — <strong>{subject || 'the selected subject'}</strong>{year && year !== 'Any year' ? <> — <strong>{year}</strong></> : null}, hanyuma ikarema ibibazo n'ibisubzo. Nta byangombwa ko gukora copy-paste!
          </p>

          {/* Quiz Type + Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Quiz Type</label>
              <select
                value={quizType}
                onChange={e => setQuizType(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                {QUIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Past Paper Year</label>
              <select
                value={year || 'Any year'}
                onChange={e => setYear(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Number of Questions: {numQuestions}</label>
            <input
              type="range"
              min="5"
              max="50"
              value={numQuestions}
              onChange={e => setNumQuestions(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#7c3aed' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>5</span><span>20</span><span>35</span><span>50</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading animation */}
      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 20px', background: '#faf5ff', borderRadius: 12, marginBottom: 16, border: '1.5px solid #e9d5ff',
        }}>
          <div style={{
            width: 56, height: 56, border: '4px solid #e9d5ff', borderTop: '4px solid #7c3aed',
            borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16,
          }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#6b21a8', textAlign: 'center', transition: 'opacity 0.3s' }}>
            {LOADING_MESSAGES[loadingMsgIdx]}
          </div>
          <div style={{ fontSize: 12, color: '#a78bfa', marginTop: 8 }}>
            Searching the web & generating questions with AI...
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Action buttons */}
      {!loading && (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => mode === 'auto' ? handleAutoGenerate(true) : handleGenerate(true)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: '1.5px solid #7c3aed', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', background: '#fff', color: '#7c3aed',
          }}
        >
          👁️ Preview Questions
        </button>
        <button
          onClick={() => mode === 'auto' ? handleAutoGenerate(false) : handleGenerate(false)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', background: '#7c3aed', color: '#fff',
          }}
        >
          ⚡ Generate & Save Quiz
        </button>
      </div>
      )}

      {/* Preview Questions */}
      {previewMode && previewQuestions && (
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1.5px solid #e2e8f0', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 18, color: '#111827', margin: 0 }}>
              📋 Preview — {previewQuestions.length} Questions
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPreviewMode(false)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', cursor: 'pointer' }}
              >
                ✕ Close
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={loading}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600,
                  background: '#16a34a', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Saving...' : '✓ Save as Quiz'}
              </button>
            </div>
          </div>
          {chunkInfo && <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{chunkInfo}</p>}

          {examHeader && (
            <div style={{
              background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)', borderRadius: 10,
              padding: '16px 20px', marginBottom: 14, border: '2px solid #1e3a5f',
            }}>
              {examHeader.split('\n').map((line, i) => (
                <div key={i} style={{
                  fontSize: i === 0 ? 12 : i === 1 ? 16 : 14,
                  fontWeight: i === 1 ? 700 : 500,
                  color: i === 0 ? '#93c5fd' : '#fff',
                  textAlign: 'center',
                  marginBottom: 2,
                  letterSpacing: i === 1 ? '0.5px' : 'normal',
                }}>
                  {line}
                </div>
              ))}
            </div>
          )}

          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {previewQuestions.map((q, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 8 }}>
                  {i + 1}. {q.question}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {['a', 'b', 'c', 'd'].map(letter => (
                    <div
                      key={letter}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 13,
                        background: q.correct_answer === letter ? '#f0fdf4' : '#f8fafc',
                        border: q.correct_answer === letter ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        color: q.correct_answer === letter ? '#15803d' : '#475569',
                        fontWeight: q.correct_answer === letter ? 600 : 400,
                      }}
                    >
                      <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{letter})</span> {q[`option_${letter}`]}
                      {q.correct_answer === letter && ' ✓'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      {!previewQuestions && !loading && (
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: 16, border: '1.5px solid #bfdbfe' }}>
          <h4 style={{ fontSize: 14, color: '#1e40af', margin: '0 0 8px' }}>💡 How it works</h4>
          <ul style={{ fontSize: 13, color: '#374151', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>📝 Paste Content mode:</strong> Paste lessons/exams — AI reads everything and creates MCQs</li>
            <li><strong>🧠 Auto-Generate mode:</strong> Pick a quiz template + year — AI searches Google & creates real exam questions</li>
            <li><strong>Quiz Template</strong> auto-fills grade, subject & exam type — just pick one</li>
            <li><strong>Select year</strong> to get questions from a specific national exam year</li>
            <li><strong>Preview</strong> the generated questions before saving</li>
            <li><strong>Save</strong> creates a real quiz in your class — students can take it immediately</li>
            <li>Questions follow the exact same format as your existing quizzes (A/B/C/D options)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
