#!/usr/bin/env node
/**
 * Seeds anonymized demo data for the tutorial video recorder.
 */
const API = process.env.TUTORIAL_API || 'http://localhost:5000/api';

async function req(method, path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${method} ${path} → ${res.status}`);
  return data;
}

async function main() {
  const teacher = await req('POST', '/auth/register', {
    name: 'Demo Teacher',
    password: 'TutorialDemo123',
    role: 'teacher',
    school_email_local: 'demoteacher',
    staff_school_name: 'Demo School',
  }).catch(async (e) => {
    if (!String(e.message).includes('already')) throw e;
    return req('POST', '/auth/login', {
      email: 'demoteacher@demoschool.edu',
      password: 'TutorialDemo123',
    });
  });

  const token = teacher.token;
  const classes = await req('GET', '/classes', null, token);
  let cls = classes.find((c) => c.name === 'Science Demo Class');
  if (!cls) {
    cls = await req('POST', '/classes', {
      name: 'Science Demo Class',
      subject: 'Science',
      grade_level: 'S2',
    }, token);
  }

  const classId = cls.id;
  const notes = await req('GET', `/classes/${classId}/notes`, null, token);
  if (!notes.some((n) => n.title === 'Lesson 1 — Cells')) {
    await req('POST', `/classes/${classId}/notes`, { title: 'Lesson 1 — Cells' }, token);
  }

  const hw = await req('GET', `/classes/${classId}/homework`, null, token);
  if (!hw.some((h) => h.title === 'Lab Report — Plants')) {
    await req('POST', `/classes/${classId}/homework`, {
      title: 'Lab Report — Plants',
      description: 'Write a short report about plant cells.',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    }, token);
  }

  const posts = await req('GET', `/classroom-feed/${classId}/posts`, null, token).catch(() => []);
  if (!posts.some((p) => p.body?.includes('Daily activity'))) {
    await req('POST', `/classroom-feed/${classId}/posts`, {
      post_type: 'text',
      body: 'Daily activity: Group discussion on ecosystems 🌱',
    }, token);
  }

  const out = {
    teacherEmail: teacher.login_email || teacher.user?.email || 'demoteacher@demoschool.edu',
    teacherPassword: 'TutorialDemo123',
    classId,
    className: cls.name,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
