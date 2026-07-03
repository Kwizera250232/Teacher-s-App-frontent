// 1000+ engaging composition topics for students — generated programmatically
const BASE_TOPICS = [
  'Describe a person who has inspired you and explain why.',
  'My journey after graduation: challenges and triumphs.',
  'The teacher who changed my life forever.',
  'If I could go back to school, what would I do differently?',
  'Technology and education in Rwanda: opportunities and challenges.',
  'My dream for my community and how I plan to achieve it.',
  'The value of friendship in my life.',
  'A time I overcame a major challenge.',
  'The future of Rwanda: my vision for the next 20 years.',
  'What makes a good leader?',
  'The importance of reading books in the digital age.',
  'How I balance school, family, and personal goals.',
  'My favorite subject and why it matters to me.',
  'A lesson I learned from failure.',
  'Why education is the key to success.',
  'The role of youth in building a better Rwanda.',
  'My personal motto and why I live by it.',
  'How sports shaped my character.',
  'The impact of social media on students today.',
  'My hero is not famous — here is why.',
  'What I would invent to help my school.',
  'The best advice I ever received.',
  'A tradition in my family that I value.',
  'Why I want to study at university.',
  'The power of kindness: a story from my life.',
  'My favorite book and what it taught me.',
  'How I prepare for exams effectively.',
  'The importance of saving money as a student.',
  'A place in Rwanda I would love to visit.',
  'My career dream and the steps to reach it.',
  'How I handle peer pressure.',
  'The meaning of success in my eyes.',
  'Why volunteer work matters.',
  'A memorable school trip I will never forget.',
  'How music influences my mood and studies.',
  'The benefits of learning a new language.',
  'My relationship with my parents.',
  'What I am grateful for today.',
  'How I stay motivated during difficult times.',
  'The importance of honesty in friendships.',
  'A time I helped someone in need.',
  'My thoughts on climate change in Rwanda.',
  'How agriculture shapes our future.',
  "The role of women in Rwanda's development.",
  'Why mental health matters for students.',
  'My first day at secondary school.',
  'How I plan to give back to my country.',
  'The importance of time management.',
  'What makes my school special.',
  'A skill I want to learn and why.',
  'How I overcame stage fright.',
  'The person I admire most in my family.',
  'My experience with online learning.',
  'Why teamwork is essential in life.',
  'How I define happiness.',
  'The challenges of being a teenager today.',
  'My favorite memory from primary school.',
  'How I deal with disappointment.',
  'The importance of respecting elders.',
  'What I would do if I were president for a day.',
  'How science can solve problems in my village.',
  'My daily routine and why it works for me.',
  'The best gift I ever received.',
  'How I express my creativity.',
  'Why I believe in second chances.',
  "A teacher's advice that changed my mindset.",
  'How I plan to start a small business.',
  'The importance of clean water in our community.',
  'My favorite Rwandan proverb and its meaning.',
  'How I handle bullying at school.',
  'The role of discipline in achieving goals.',
  'Why I want to become a doctor.',
  'My experience participating in a debate.',
  'How ICT is transforming our classrooms.',
  'The importance of nutrition for students.',
  'A time I had to make a difficult decision.',
  'My thoughts on equal education for all.',
  'How I stay physically active.',
  'The value of patience in life.',
  'Why I respect farmers.',
  'My favorite Rwandan hero and why.',
  'How I use the internet for learning.',
  'The importance of apologizing when wrong.',
  'A story about forgiveness that touched me.',
  "How I plan to support my siblings' education.",
  "The impact of tourism on Rwanda's economy.",
  'Why I chose my future career path.',
  'How I manage stress during exams.',
  'The importance of community service.',
  'My favorite way to relax after school.',
  'What makes a good friend.',
  'How I would improve my school.',
  'The benefits of waking up early.',
  'Why I love my country, Rwanda.',
  'A time I surprised myself with courage.',
  'How I budget my pocket money.',
  'The importance of goal setting.',
  'My thoughts on school uniforms.',
  'How I celebrate my achievements.',
  'The role of religion or spirituality in my life.',
  'Why I want to learn coding.',
  'A memorable conversation with a stranger.',
  'How I handle criticism.',
  'The importance of protecting our environment.',
  'My favorite season in Rwanda and why.',
  'How I plan to travel and learn from other cultures.',
  'What I would tell my future self.',
  'Why I admire entrepreneurs.',
  'How I study best.',
  'The importance of keeping promises.',
];

const CAREERS = [
  'doctor', 'nurse', 'teacher', 'lawyer', 'engineer', 'journalist', 'pilot',
  'chef', 'software developer', 'pharmacist', 'accountant', 'architect',
  'veterinary doctor', 'journalist', 'social worker', 'psychologist',
  'civil engineer', 'electrical engineer', 'mechanical engineer', 'data scientist',
  'graphic designer', 'fashion designer', 'film producer', 'music producer',
  'cyber security expert', 'artificial intelligence researcher', 'robotics engineer',
  'biomedical engineer', 'renewable energy engineer', 'marine biologist',
  'zoologist', 'geologist', 'astronomer', 'meteorologist', 'forensic scientist',
  'criminologist', 'nutritionist', 'midwife', 'public health expert',
  'environmental scientist', 'agricultural economist', 'urban planner',
  'hospitality manager', 'tourism manager', 'game developer', 'actuarial scientist',
  'biotechnologist', 'nanotechnologist', 'aviiation expert', 'linguist',
];

const THEMES = [
  'The importance of {x} in my life.',
  'A day in the life of a {x}.',
  'Why I want to become a {x}.',
  'How a {x} can change a community.',
  'The challenges and rewards of being a {x}.',
  'My role model who is a {x}.',
  'What I would do as a {x} to help Rwanda.',
  'The skills needed to be a great {x}.',
  'A story about a {x} who inspired me.',
  'How technology is changing the work of a {x}.',
];

const VALUES = [
  'honesty', 'kindness', 'patience', 'courage', 'humility', 'generosity',
  'compassion', 'integrity', 'perseverance', 'optimism', 'wisdom', 'empathy',
  'loyalty', 'respect', 'responsibility', 'self-discipline', 'gratitude',
  'forgiveness', 'tolerance', 'curiosity', 'creativity', 'determination',
  'modesty', 'sincerity', 'authenticity', 'reliability', 'consistency',
  'adaptability', 'resilience', 'open-mindedness',
];

const VALUE_TEMPLATES = [
  'The importance of {x} in my daily life.',
  'A time I learned the value of {x}.',
  'How {x} can transform a community.',
  'Why {x} matters more than success.',
  'A story about {x} from my family.',
  'How I practice {x} at school.',
  'The role of {x} in leadership.',
  'Why I admire people who show {x}.',
  'How {x} builds strong friendships.',
  'A lesson about {x} I will never forget.',
];

const PLACES = [
  'Kigali', 'Huye', 'Musanze', 'Rubavu', 'Nyagatare', 'Karongi', 'Rusizi',
  'Bugesera', 'Rwamagana', 'Muhanga', 'Ruhengeri', 'Cyangugu', 'Gitarama',
  'Butare', 'Kibungo', 'Byumba', 'Gisenyi', 'Kibuye', 'Nyanza', 'Kayonza',
];

const PLACE_TEMPLATES = [
  'My favorite memory of visiting {x}.',
  'What I love about {x}.',
  'A day I spent in {x} that I will never forget.',
  'How {x} has changed since I was young.',
  'Why I want to return to {x} one day.',
  'The beauty of {x} in the rainy season.',
  'A cultural experience I had in {x}.',
  'What {x} taught me about Rwanda.',
  'My dream to work in {x}.',
  'How {x} inspires me to work hard.',
];

const SUBJECTS = [
  'mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography',
  'English', 'Kinyarwanda', 'French', 'economics', 'literature', 'computer science',
  'agriculture', 'entrepreneurship', 'accounting', 'civic education',
  'religion', 'physical education', 'art', 'music',
];

const SUBJECT_TEMPLATES = [
  'Why I love studying {x}.',
  'How {x} helps me understand the world.',
  'My favorite {x} lesson and why.',
  'A project in {x} that I am proud of.',
  'How I plan to use {x} in my future career.',
  'The most difficult {x} topic and how I mastered it.',
  'Why every student should study {x}.',
  'How {x} connects to real life in Rwanda.',
  'A {x} teacher who inspired me.',
  'My study tips for excelling in {x}.',
];

function expand(topics, items, templates) {
  for (const item of items) {
    for (const tpl of templates) {
      topics.push(tpl.replace('{x}', item));
    }
  }
}

const topics = [...BASE_TOPICS];
expand(topics, CAREERS, THEMES);
expand(topics, VALUES, VALUE_TEMPLATES);
expand(topics, PLACES, PLACE_TEMPLATES);
expand(topics, SUBJECTS, SUBJECT_TEMPLATES);

// Deduplicate
export const COMPOSITION_TOPICS = [...new Set(topics)];

export function getRandomTopic() {
  return COMPOSITION_TOPICS[Math.floor(Math.random() * COMPOSITION_TOPICS.length)];
}

export function getTopicsByCategory(category) {
  if (category === 'all') return COMPOSITION_TOPICS;
  if (category === 'careers') return COMPOSITION_TOPICS.filter(t => CAREERS.some(c => t.toLowerCase().includes(c)));
  if (category === 'values') return COMPOSITION_TOPICS.filter(t => VALUES.some(v => t.toLowerCase().includes(v)));
  if (category === 'places') return COMPOSITION_TOPICS.filter(t => PLACES.some(p => t.includes(p)));
  if (category === 'subjects') return COMPOSITION_TOPICS.filter(t => SUBJECTS.some(s => t.toLowerCase().includes(s)));
  return COMPOSITION_TOPICS;
}
