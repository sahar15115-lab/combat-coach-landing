// verification shot: gold "חבילת הפרימיום" badge at the top of the COMMUNITY section — desktop + mobile
import { chromium } from 'playwright';
const b = await chromium.launch();

const report = async (p, label) => console.log(label, await p.evaluate(()=>
  [...document.querySelectorAll('.prem-badge')].map(el=>{
    const r=el.getBoundingClientRect(), cs=getComputedStyle(el);
    return {parent:el.parentElement.className.trim(), text:el.textContent,
      w:Math.round(r.width), h:Math.round(r.height), top:Math.round(r.top),
      bg:cs.backgroundImage.slice(0,40)};
  })));

// ---- desktop ----
const dp = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await dp.goto('http://localhost:8137/', {waitUntil:'load'});
await dp.waitForTimeout(1200);
await dp.evaluate(()=>document.querySelector('.commx-lead').scrollIntoView({block:'start'}));
await dp.waitForTimeout(800);
await report(dp, 'desktop badges:');
await dp.screenshot({path:'tests/shots/premium-badge-desktop.png'});
// app stage 04 must NOT carry a badge anymore
await dp.evaluate(()=>document.getElementById('app').scrollIntoView());
await dp.waitForTimeout(500);
for (let i=0;i<60;i++){
  if (await dp.evaluate(()=>document.querySelector('.appx-stage .ax.on')?.dataset.i==='3')) break;
  await dp.evaluate(()=>window.scrollBy(0,120)); await dp.waitForTimeout(150);
}
console.log('app stage 04 badge present?', await dp.evaluate(()=>!!document.querySelector('.ax[data-i="3"] .prem-badge')));
await dp.screenshot({path:'tests/shots/premium-badge-app-clean.png'});

// ---- mobile ----
const mp = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
await mp.goto('http://localhost:8137/', {waitUntil:'load'});
await mp.waitForTimeout(1200);
await mp.evaluate(()=>document.getElementById('community').scrollIntoView({block:'start'}));
await mp.waitForTimeout(1000);
await report(mp, 'mobile badges:');
await mp.screenshot({path:'tests/shots/premium-badge-mobile.png'});

await b.close();
console.log('shots saved');
