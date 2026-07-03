// בדיקת זרימה: מקליט וידאו של גלילה בקצב אנושי + רושם ציר-זמן מצבים ומנתח בעיות זרימה.
// Playwright מריץ Chromium אמיתי — האנימציות רצות (לא כמו הסימולטור שמקפיא rAF).
import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'http://localhost:8137';
const OUT = 'tests/flow';
fs.mkdirSync(OUT, { recursive: true });

const snap = () => {
  const on = sel => { const e = [...document.querySelectorAll(sel)]; return e.findIndex(x => x.classList.contains('on')); };
  const ph = document.querySelector('.appx-mobile .phone');
  return {
    y: Math.round(scrollY),
    train: on('.trainx-mobile .mpanel'),
    app: on('.appx-mobile .mpanel'),
    comm: on('.commx-mobile .mpanel'),
    rot: ph && window.gsap ? Math.round(gsap.getProperty(ph, 'rotationY')) : null,
    ai: document.body.classList.contains('ai-mode'),
    cta: document.body.classList.contains('cta-hide'),
    nav: +getComputedStyle(document.querySelector('#nav')).opacity.slice(0, 4),
  };
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(2500); // hero intro

const docH = await page.evaluate(() => document.documentElement.scrollHeight);
const H = 844;
const timeline = [];
const STEPS = 120;            // הרבה צעדים קטנים = גלילה חלקה ומציאותית
const perStep = (docH - H) / STEPS;

for (let i = 0; i <= STEPS; i++) {
  await page.evaluate(y => window.scrollTo(0, y), Math.round(i * perStep));
  await page.waitForTimeout(230); // ~28 שניות סה"כ — קצב קריאה-וגלילה אנושי
  timeline.push(await page.evaluate(snap));
}
await page.waitForTimeout(500);
await ctx.close(); // שומר את הווידאו
await browser.close();

// ---- ניתוח זרימה ----
const issues = [];
const scenes = ['train', 'app', 'comm'];
for (const s of scenes) {
  const seq = timeline.map(t => t[s]).filter(v => v >= 0);
  // דילוגים: קפיצה של יותר מ-1 בין דגימות סמוכות
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] - seq[i - 1] > 1) issues.push(`דילוג ב-${s}: ${seq[i - 1]}→${seq[i]}`);
    if (seq[i] < seq[i - 1]) issues.push(`נסיגה לאחור ב-${s}: ${seq[i - 1]}→${seq[i]} (ריצוד?)`);
  }
}
// אזורים מתים: 8+ דגימות רצופות בלי שום שינוי מצב
let dead = 0, deadMax = 0;
for (let i = 1; i < timeline.length; i++) {
  const a = timeline[i], b = timeline[i - 1];
  const same = a.train === b.train && a.app === b.app && a.comm === b.comm && a.ai === b.ai && a.cta === b.cta;
  dead = same ? dead + 1 : 0;
  deadMax = Math.max(deadMax, dead);
}
if (deadMax >= 10) issues.push(`אזור מת: ${deadMax} דגימות רצופות (~${(deadMax * 0.23).toFixed(1)}ש') בלי שום שינוי`);
// זווית הטלפון: טווח + האם יש "נחיתה הפוכה" (קרוב ל-±180 כשהאפליקציה פעילה)
const rots = timeline.filter(t => t.app >= 0 && t.rot != null).map(t => t.rot);
const rotMin = Math.min(...rots), rotMax = Math.max(...rots);
const stuckBack = rots.filter(r => Math.abs(((r % 360) + 360) % 360 - 180) < 35).length;
// מצב-AI: מתי נדלק/כבה
const aiOn = timeline.findIndex(t => t.ai);
const aiOff = timeline.length - 1 - [...timeline].reverse().findIndex(t => t.ai);

console.log(JSON.stringify({
  totalSamples: timeline.length,
  trainSeq: timeline.map(t => t.train).filter(v => v >= 0),
  appSeq: timeline.map(t => t.app).filter(v => v >= 0),
  commSeq: timeline.map(t => t.comm).filter(v => v >= 0),
  phoneRotRange: rots.length ? [rotMin, rotMax] : null,
  phoneFramesNearBackwards: stuckBack,
  aiModeOnAtSample: aiOn, aiModeOffAtSample: aiOff,
  deadZoneMaxSamples: deadMax,
  issues,
}, null, 2));
