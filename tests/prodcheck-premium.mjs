// post-deploy check: is the premium-badge + all-ages copy live in production?
import { chromium } from 'playwright';
const URL = 'https://combat-coach-landing.vercel.app/';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
const errs = [];
p.on('pageerror', e=>errs.push(e.message));
await p.goto(URL, {waitUntil:'load'});
await p.waitForTimeout(1500);
const out = await p.evaluate(()=>({
  ageRangeGone: !document.body.innerHTML.includes('14-25'),
  hero: document.querySelector('.hero-duo-copy p')?.textContent.trim(),
  badgeCount: document.querySelectorAll('.prem-badge').length,
  badgeParents: [...document.querySelectorAll('.prem-badge')].map(e=>e.parentElement.className.trim()),
  appStage04HasBadge: !!document.querySelector('.ax[data-i="3"] .prem-badge')
    || !!document.querySelector('.mpanel-appcopy.accent .prem-badge'),
  faqAges: [...document.querySelectorAll('#faq details')]
    .find(d=>d.querySelector('summary').textContent.includes('גילאים'))?.querySelector('p').textContent.trim(),
}));
// visible badge in the community section on mobile
await p.evaluate(()=>document.getElementById('community').scrollIntoView({block:'start'}));
await p.waitForTimeout(900);
out.visibleBadge = await p.evaluate(()=>{
  const el=[...document.querySelectorAll('.prem-badge')].find(e=>e.getClientRects().length);
  if(!el) return null; const r=el.getBoundingClientRect();
  return {text:el.textContent, parent:el.parentElement.className.trim(), w:Math.round(r.width), h:Math.round(r.height)};
});
await p.screenshot({path:'tests/shots/prod-premium-badge.png'});
console.log(JSON.stringify(out, null, 2));
console.log('page errors:', errs.length ? errs : 'none');
await b.close();
