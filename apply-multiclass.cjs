const fs = require('fs');
const file = 'C:\\STUDENT APP\\frontend\\src\\components\\LiveCoachingPanel.jsx';
let c = fs.readFileSync(file, 'utf8');

// Detect line ending
const usesCRLF = c.includes('\r\n');
const nl = usesCRLF ? '\r\n' : '\n';
console.log('Line ending:', usesCRLF ? 'CRLF' : 'LF');

// 1. Update loadCreateData to also fetch teacher's classes
const old1 = [
  '      const [qz, studs] = await Promise.all([',
  '        api.get(`/classes/${classId}/quizzes`, token),',
  '        api.get(`/classes/${classId}/classroom`, token),',
  '      ]);',
  '      setQuizzes(qz || []);',
  '      setStudents(studs?.students || []);'
].join(nl);
const new1 = [
  '      const [qz, studs, myClasses] = await Promise.all([',
  '        api.get(`/classes/${classId}/quizzes`, token),',
  '        api.get(`/classes/${classId}/classroom`, token),',
  '        api.get(`/classes/my`, token),',
  '      ]);',
  '      setQuizzes(qz || []);',
  '      setStudents(studs?.students || []);',
  '      setTeacherClasses((myClasses || []).filter(cl => String(cl.id) !== String(classId)));'
].join(nl);
if (c.includes(old1)) { c = c.replace(old1, new1); console.log('OK: loadCreateData'); }
else console.log('FAIL: loadCreateData');

// 2. Pass teacherClasses to CreateSessionModal
const old2 = [
  '      {showCreate && (',
  '        <CreateSessionModal',
  '          classId={classId}',
  '          token={token}',
  '          quizzes={quizzes}',
  '          students={students}',
  '          onClose={() => setShowCreate(false)}'
].join(nl);
const new2 = [
  '      {showCreate && (',
  '        <CreateSessionModal',
  '          classId={classId}',
  '          token={token}',
  '          quizzes={quizzes}',
  '          students={students}',
  '          teacherClasses={teacherClasses}',
  '          onClose={() => setShowCreate(false)}'
].join(nl);
if (c.includes(old2)) { c = c.replace(old2, new2); console.log('OK: pass teacherClasses'); }
else console.log('FAIL: pass teacherClasses');

// 3. Update CreateSessionModal signature + add selectedClassIds state
const old3 = [
  'function CreateSessionModal({ classId, token, quizzes, students, onClose, onCreated, onError, onSuccess }) {',
  "  const [title, setTitle] = useState('');",
  "  const [topic, setTopic] = useState('');",
  "  const [description, setDescription] = useState('');",
  "  const [scheduledAt, setScheduledAt] = useState('');",
  "  const [quizId, setQuizId] = useState('');",
  '  const [selectedStudents, setSelectedStudents] = useState(new Set());',
  '  const [countOfficial, setCountOfficial] = useState(false);',
  '  const [saving, setSaving] = useState(false);'
].join(nl);
const new3 = [
  'function CreateSessionModal({ classId, token, quizzes, students, teacherClasses = [], onClose, onCreated, onError, onSuccess }) {',
  "  const [title, setTitle] = useState('');",
  "  const [topic, setTopic] = useState('');",
  "  const [description, setDescription] = useState('');",
  "  const [scheduledAt, setScheduledAt] = useState('');",
  "  const [quizId, setQuizId] = useState('');",
  '  const [selectedStudents, setSelectedStudents] = useState(new Set());',
  '  const [countOfficial, setCountOfficial] = useState(false);',
  '  const [saving, setSaving] = useState(false);',
  '  const [selectedClassIds, setSelectedClassIds] = useState(new Set());',
  '',
  '  const toggleClass = (id) => {',
  '    setSelectedClassIds(prev => {',
  '      const next = new Set(prev);',
  '      if (next.has(id)) next.delete(id);',
  '      else next.add(id);',
  '      return next;',
  '    });',
  '  };'
].join(nl);
if (c.includes(old3)) { c = c.replace(old3, new3); console.log('OK: modal signature + state'); }
else console.log('FAIL: modal signature + state');

// 4. Update submit to send additional_class_ids
const old4 = [
  '      const result = await api.post(`/classes/${classId}/coaching-sessions`, {',
  '        title: title.trim(),',
  '        topic: topic.trim() || undefined,',
  '        description: description.trim() || undefined,',
  '        scheduled_at: scheduledAt || undefined,',
  '        quiz_id: quizId ? parseInt(quizId) : undefined,',
  '        invited_student_ids: selectedStudents.size > 0 ? [...selectedStudents] : undefined,',
  '        count_toward_official: countOfficial,',
  '      }, token);',
  "      onSuccess?.('Session created. Students notified.');"
].join(nl);
const new4 = [
  '      const result = await api.post(`/classes/${classId}/coaching-sessions`, {',
  '        title: title.trim(),',
  '        topic: topic.trim() || undefined,',
  '        description: description.trim() || undefined,',
  '        scheduled_at: scheduledAt || undefined,',
  '        quiz_id: quizId ? parseInt(quizId) : undefined,',
  '        invited_student_ids: selectedStudents.size > 0 ? [...selectedStudents] : undefined,',
  '        count_toward_official: countOfficial,',
  '        additional_class_ids: selectedClassIds.size > 0 ? [...selectedClassIds].map(id => parseInt(id)) : undefined,',
  '      }, token);',
  "      const extraMsg = selectedClassIds.size > 0 ? ` (+${selectedClassIds.size} other class${selectedClassIds.size > 1 ? 'es' : ''})` : '';",
  "      onSuccess?.(`Session created. Students notified${extraMsg}.`);"
].join(nl);
if (c.includes(old4)) { c = c.replace(old4, new4); console.log('OK: submit additional_class_ids'); }
else console.log('FAIL: submit additional_class_ids');

// 5. Add multi-class selector UI before Exercise / Quiz field
const old5 = [
  "        <div style={{ marginBottom: 12 }}>",
  "          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Exercise / Quiz (optional)</label>"
].join(nl);
const new5 = [
  "        {/* Multi-class selector — invite students from other classes */}",
  "        {teacherClasses.length > 0 && (",
  "          <div style={{ marginBottom: 12 }}>",
  "            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>",
  "              Also include other classes (optional)",
  "            </label>",
  "            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px' }}>",
  "              Students from selected classes will be invited to this session too.",
  "            </p>",
  "            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto', border: '2px solid #e2e8f0', borderRadius: 8, padding: 8 }}>",
  "              {teacherClasses.map(cl => (",
  "                <label key={cl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', padding: '4px 6px', borderRadius: 6, background: selectedClassIds.has(String(cl.id)) ? '#eef2ff' : 'transparent' }}>",
  "                  <input",
  "                    type=\"checkbox\"",
  "                    checked={selectedClassIds.has(String(cl.id))}",
  "                    onChange={() => toggleClass(String(cl.id))}",
  "                    style={{ width: 16, height: 16, cursor: 'pointer' }}",
  "                  />",
  "                  <span style={{ fontWeight: 600 }}>{cl.name}</span>",
  "                  {cl.subject && <span style={{ fontSize: 11, color: '#64748b' }}>— {cl.subject}</span>}",
  "                </label>",
  "              ))}",
  "            </div>",
  "            {selectedClassIds.size > 0 && (",
  "              <p style={{ fontSize: 11, color: '#667eea', margin: '4px 0 0', fontWeight: 600 }}>",
  "                ✓ {selectedClassIds.size} additional class{selectedClassIds.size > 1 ? 'es' : ''} selected",
  "              </p>",
  "            )}",
  "          </div>",
  "        )}",
  "",
  "        <div style={{ marginBottom: 12 }}>",
  "          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Exercise / Quiz (optional)</label>"
].join(nl);
if (c.includes(old5)) { c = c.replace(old5, new5); console.log('OK: multi-class UI'); }
else console.log('FAIL: multi-class UI');

fs.writeFileSync(file, c, 'utf8');
console.log('DONE');
