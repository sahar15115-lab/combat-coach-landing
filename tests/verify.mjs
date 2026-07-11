// אימות ×4: דסקטופ / מובייל / בלי-JS / תנועה-מופחתת — רץ מול השרת המקומי (serve.js על 8137)
import { chromium } from 'playwright';
const URL = 'http://localhost:8137';
const results = [];
const check = (name, cond) => { results.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) process.exitCode = 1; };

const browser = await chromium.launch();

// 1) דסקטופ 1280, JS פועל
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const u = (m.location() && m.location().url) || '';
    // רעש צפוי מקומית: Speed Insights קיים רק ב-Vercel; Google Fonts חסום ב-sandbox
    if (u.includes('_vercel') || u.includes('fonts.g')) return;
    errors.push(m.text());
  });
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1800);
  check('desktop: h1 קומבאט אתלט', (await page.textContent('.hero-title')).includes('קומבאט אתלט'));
  check('desktop: pins registered (>=8)', await page.evaluate(() => ScrollTrigger.getAll().length >= 8));
  check('desktop: 4 train videos', await page.locator('.trainx-desktop video').count() === 4);
  check('desktop: 4 app screens', await page.locator('.appx-desktop .ps.media').count() === 4);
  check('desktop: nav hidden at top', await page.evaluate(() => getComputedStyle(document.querySelector('#nav')).opacity === '0'));
  check('desktop: title before white kicker', await page.evaluate(() => {
    const t = document.querySelector('.hero-title'), k = document.querySelector('.hero-eyebrow');
    return t && k && (t.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
  }));
  check('desktop: top CTA present, sticky gone', await page.evaluate(() =>
    !!document.querySelector('.hero-topcta') && !document.querySelector('.sticky-cta')));
  check('desktop: coach label above photo', (await page.textContent('.coach-label')).includes('סהר שמש'));
  check('desktop: inactive app stages ignore clicks', await page.evaluate(() =>
    [...document.querySelectorAll('.appx-stage .ax:not(.on)')].every(a => getComputedStyle(a).pointerEvents === 'none')));
  check('desktop: scroll-cue is gold tag', await page.evaluate(() =>
    getComputedStyle(document.querySelector('.scroll-cue')).borderRadius === '999px'));
  check('desktop: no console errors', errors.length === 0);
  await page.screenshot({ path: 'tests/shots/desktop-hero.png' });
  await ctx.close();
}

// 2) מובייל 390, JS פועל
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1800);
  check('mobile: native-scroll layout (train rail + app crossfade + community unlocked)', await page.evaluate(() => !!document.getElementById('trainRail') && document.querySelector('.appx-mobile').classList.contains('pin-active') && !document.querySelector('.commx-mobile').classList.contains('pin-active')));
  check('mobile: hero title below nav area', await page.evaluate(() => document.querySelector('.hero-title').getBoundingClientRect().top > 80));
  check('mobile: 4 journey buttons', await page.locator('.appx-mobile .phone-cta').count() === 4);
  check('mobile: scroll-cue exists', await page.locator('.scroll-cue').count() === 1);
  await page.screenshot({ path: 'tests/shots/mobile-hero.png' });
  await ctx.close();
}

// 3) בלי JavaScript — הבדיקה הקריטית: כל התוכן חייב להיות גלוי
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  check('no-js: reveals visible', await page.evaluate(() => getComputedStyle(document.querySelector('.reveal')).opacity === '1'));
  check('no-js: mobile panels shown', await page.evaluate(() => getComputedStyle(document.querySelector('.trainx-mobile')).display !== 'none'));
  check('no-js: nav visible', await page.evaluate(() => getComputedStyle(document.querySelector('#nav')).opacity === '1'));
  check('no-js: training card copy visible', await page.evaluate(() => getComputedStyle(document.querySelector('.tcard-copy')).opacity === '1'));
  await page.screenshot({ path: 'tests/shots/nojs-mobile.png' });
  await ctx.close();
}

// 4) תנועה מופחתת
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(800);
  check('reduced: reveals visible', await page.evaluate(() => getComputedStyle(document.querySelector('.reveal')).opacity === '1'));
  check('reduced: mobile training shown', await page.evaluate(() => getComputedStyle(document.querySelector('.trainx-mobile')).display !== 'none'));
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
