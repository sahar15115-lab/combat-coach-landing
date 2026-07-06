// מדידת FCP + long tasks (חסימת קלט) על הדף המקומי, מעבד מואט x4
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.addInitScript(() => {
  window.__lt = [];
  new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration))))
    .observe({ type: 'longtask', buffered: true });
});
await p.goto('http://localhost:8137', { waitUntil: 'load' });
await p.waitForTimeout(6000);
const m = await p.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  const lt = window.__lt || [];
  return {
    FCP: fcp ? Math.round(fcp.startTime) : null,
    domInteractive: Math.round(nav.domInteractive),
    longTasks: lt.length,
    longTasksTotalMs: lt.reduce((s, d) => s + d, 0),
    blockingMs: lt.reduce((s, d) => s + Math.max(0, d - 50), 0), // TBT-style
  };
});
console.log(JSON.stringify(m));
await b.close();
