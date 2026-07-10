// Harness: simulate an in-app browser (Instagram/WhatsApp) on iPhone —
// dynamic viewport height (address-bar show/hide) + safe-area notch — and detect
// (a) top content hidden under the fixed nav / notch, (b) scroll jump/snap when the
// viewport height toggles mid-scroll (the video bug).
import { chromium } from 'playwright';

const URL = process.env.QA_URL || 'http://localhost:8137/';
const SAFE_TOP = 47, SAFE_BOTTOM = 34; // iPhone notch/home-indicator

const b = await chromium.launch();
// Instagram in-app browser: ~390 wide; visible height smaller due to its own chrome.
// "bar shown" ≈ 690, "bar hidden" ≈ 760 (toggles as you scroll).
const ctx = await b.newContext({ viewport: { width: 390, height: 690 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(URL, { waitUntil: 'load' });
// inject a fake safe-area so env(safe-area-inset-*) is non-zero (chromium reports 0)
await p.addStyleTag({ content: `:root{ --qa-sat:${SAFE_TOP}px; --qa-sab:${SAFE_BOTTOM}px; }` });
await p.waitForTimeout(800);

const cue = async () => { await p.evaluate(() => { const c = document.getElementById('scrollCue'); if (c) c.click(); }); await p.waitForTimeout(320); };

// --- reach the community area (train 4 + app 4 + into community) ---
await p.evaluate(() => document.querySelector('#train').scrollIntoView()); await p.waitForTimeout(400);
for (let i = 0; i < 4; i++) await cue();
await p.evaluate(() => document.querySelector('#app').scrollIntoView()); await p.waitForTimeout(300);
for (let i = 0; i < 4; i++) await cue();
await p.evaluate(() => document.querySelector('#testi').scrollIntoView()); await p.waitForTimeout(400);
await p.evaluate(() => document.querySelector('#community').scrollIntoView()); await p.waitForTimeout(400);
await cue(); // into first interactive slide
await p.waitForTimeout(500);

// --- B) scroll-jump test: toggle viewport height (simulate address-bar show/hide) ---
const sy0 = await p.evaluate(() => Math.round(scrollY));
const onIdx0 = await p.evaluate(() => [...document.querySelectorAll('.commx-mobile .mpanel')].findIndex(x => x.classList.contains('on')));
const heights = [760, 690, 760, 690, 760];
const jumps = [];
for (const h of heights) {
  await p.setViewportSize({ width: 390, height: h });
  await p.waitForTimeout(250);
  const sy = await p.evaluate(() => Math.round(scrollY));
  const idx = await p.evaluate(() => [...document.querySelectorAll('.commx-mobile .mpanel')].findIndex(x => x.classList.contains('on')));
  jumps.push({ h, sy, idx });
}
const maxJump = Math.max(...jumps.map(j => Math.abs(j.sy - sy0)));
console.log('[VIEWPORT-TOGGLE] start sy=' + sy0 + ' idx=' + onIdx0);
jumps.forEach(j => console.log('  h=' + j.h + ' -> sy=' + j.sy + ' idx=' + j.idx + (Math.abs(j.sy - sy0) > 40 ? '  JUMP' : '')));
console.log('  maxJump=' + maxJump + 'px => ' + (maxJump > 40 ? 'UNSTABLE (jumps on chrome toggle)' : 'stable'));

// --- A) top-content-under-nav / notch test at a few scenes ---
async function topCheck(label) {
  return p.evaluate((lbl) => {
    const nav = document.getElementById('nav').getBoundingClientRect();
    // simulate notch: content within top SAFE px is "under the notch"
    const SAFE = 47;
    const on = document.querySelector('.commx-mobile .mpanel.on, .appx-mobile .mpanel.on, .trainx-mobile .mpanel.on');
    let firstTop = null, name = lbl;
    if (on) { const t = on.querySelector('.kit-eyebrow, .mpanel-copy, h3, .txscene-hero'); if (t) firstTop = Math.round(t.getBoundingClientRect().top); }
    return { navBottom: Math.round(nav.bottom), firstTop, underNav: firstTop != null && firstTop < Math.round(nav.bottom), underNotch: firstTop != null && firstTop < SAFE };
  }, label);
}
const tc = await topCheck('community');
console.log('[TOP] navBottom=' + tc.navBottom + ' firstContentTop=' + tc.firstTop + ' underNav=' + tc.underNav + ' underNotch=' + tc.underNotch);
console.log('[CONSOLE errors] ' + (errs.length ? errs.slice(0, 3).join(' | ') : 'none'));

await p.screenshot({ path: 'tests/shots/qa-inapp-community.png' });
await b.close();
