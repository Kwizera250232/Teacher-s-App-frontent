#!/usr/bin/env node
/**
 * Records privacy-safe tutorial clips (viewport only — no browser URL bar).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.TUTORIAL_BASE || 'http://localhost:3000';
const CLIPS = path.join(__dirname, 'tutorial-clips');
const DEMO_PATH = path.join(__dirname, 'tutorial-demo.json');

const PRIVACY_CSS = `
  .dash-user, .dash-user *, .phub-sub, .guest-class-card p,
  .verified-badge, input[type="email"], input[type="password"],
  .class-code, [data-class-code], .msg-sender, .thread-meta,
  .parent-child-name, .phub-child-chip, .auth-form input,
  .code-big, .class-hero-code, .class-hero h1,
  a[href^="mailto:"], .dean-messages .user-bubble { 
    filter: blur(7px) !important; 
    user-select: none !important;
  }
  .dash-user::after, .class-code::after { content: '' !important; }
`;

async function injectPrivacy(page) {
  await page.addInitScript((css) => {
    const el = document.createElement('style');
    el.id = 'tutorial-privacy';
    el.textContent = css;
    document.documentElement.appendChild(el);
  }, PRIVACY_CSS);
}

async function recordScene(name, fn, holdMs = 1200) {
  fs.mkdirSync(CLIPS, { recursive: true });
  const dest = path.join(CLIPS, `${name}.webm`);
  if (process.env.SKIP_EXISTING === '1' && fs.existsSync(dest)) {
    console.log('skip existing', dest);
    return dest;
  }
  const dir = fs.mkdtempSync(path.join(CLIPS, `${name}-`));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir, size: { width: 1280, height: 720 } },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await injectPrivacy(page);
  try {
    await fn(page);
    await page.waitForTimeout(holdMs);
  } finally {
    await context.close();
    await browser.close();
  }
  const webm = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
  if (!webm) throw new Error(`No recording for ${name}`);
  fs.renameSync(path.join(dir, webm), dest);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('recorded', dest);
  return dest;
}

async function loginTeacher(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[placeholder*="schoolname"]', { timeout: 15000 });
  await page.locator('input[placeholder*="schoolname"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/dashboard/, { timeout: 25000 });
}

async function main() {
  const demo = JSON.parse(fs.readFileSync(DEMO_PATH, 'utf8'));
  const { teacherEmail, teacherPassword, classId } = demo;

  await recordScene('01-google', async (page) => {
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    const box = page.locator('textarea[name="q"], input[name="q"]').first();
    await box.click();
    await box.fill('UClass student umunsi');
    await page.waitForTimeout(800);
  }, 2000);

  await recordScene('02-home', async (page) => {
    await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'smooth' }));
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.scrollBy({ top: 1200, behavior: 'smooth' }));
    await page.waitForTimeout(1600);
  }, 800);

  await recordScene('03-signup', async (page) => {
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    for (const role of ['student', 'teacher', 'parent', 'guest']) {
      const btn = page.locator(`button, [role="button"], label`).filter({ hasText: new RegExp(role, 'i') }).first();
      if (await btn.count()) {
        await btn.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(700);
      }
    }
    await page.goto(`${BASE}/register?role=guest`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  }, 600);

  await recordScene('04-dean', async (page) => {
    await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle' });
    const deanBtn = page.locator('button[aria-label*="Dean"], button').filter({ hasText: /Dean|🎓/ }).first();
    await deanBtn.click({ timeout: 5000 });
    await page.waitForTimeout(600);
    const input = page.locator('input[placeholder*="Dean"], textarea[placeholder*="Dean"]').first();
    await input.fill('How do students join a class?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2200);
  }, 800);

  await recordScene('05-dashboard', async (page) => {
    await loginTeacher(page, teacherEmail, teacherPassword);
    await page.waitForTimeout(1200);
  }, 1000);

  await recordScene('06-class-list', async (page) => {
    await loginTeacher(page, teacherEmail, teacherPassword);
    const link = page.locator('a, button').filter({ hasText: /Science Demo|Demo Class|Math/i }).first();
    await link.click({ timeout: 8000 }).catch(async () => {
      await page.locator('.class-card, .staff-class-card, a[href*="/classes/"]').first().click();
    });
    await page.waitForURL(/classes\//, { timeout: 10000 });
    await page.waitForTimeout(800);
  }, 600);

  await recordScene('07-notes', async (page) => {
    await loginTeacher(page, teacherEmail, teacherPassword);
    await page.goto(`${BASE}/teacher/classes/${classId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.tab', { timeout: 15000 });
    await page.locator('button.tab', { hasText: 'Notes' }).click();
    await page.waitForTimeout(1500);
  }, 800);

  await recordScene('08-homework', async (page) => {
    await loginTeacher(page, teacherEmail, teacherPassword);
    await page.goto(`${BASE}/teacher/classes/${classId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.tab', { timeout: 15000 });
    await page.locator('button.tab', { hasText: 'Homework' }).click();
    await page.waitForTimeout(1500);
  }, 800);

  await recordScene('09-feed', async (page) => {
    await loginTeacher(page, teacherEmail, teacherPassword);
    await page.goto(`${BASE}/teacher/classes/${classId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.tab', { timeout: 15000 });
    await page.locator('button.tab', { hasText: 'Feed' }).click();
    await page.waitForTimeout(1500);
  }, 800);

  await recordScene('10-outro', async (page) => {
    await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(1800);
  }, 600);

  console.log('All clips saved to', CLIPS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
