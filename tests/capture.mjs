// לוכד מסע-משתמש מלא לצילומים — חומר לסקירת UX
import { chromium } from 'playwright';
const URL = 'http://localhost:8137';
const browser = await chromium.launch();

async function journey(label, viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const H = viewport.height;
  const doc = await page.evaluate(() => document.documentElement.scrollHeight);
  // capture at 14 evenly-spaced depths through the whole page
  const shots = 14;
  for (let i = 0; i < shots; i++) {
    const y = Math.round((doc - H) * (i / (shots - 1)));
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `tests/ux/${label}-${String(i).padStart(2,'0')}.png` });
  }
  await ctx.close();
}

await journey('m', { width: 390, height: 844 }, true);
await journey('d', { width: 1280, height: 820 }, false);
await browser.close();
console.log('captured');
