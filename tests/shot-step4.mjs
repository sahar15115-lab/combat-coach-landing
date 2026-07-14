import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:8137/', {waitUntil:'load'});
await p.waitForTimeout(1200);
const vh = await p.evaluate(()=>innerHeight);
const docH = await p.evaluate(()=>document.documentElement.scrollHeight);
console.log('docH:', docH, 'screens:', (docH/vh).toFixed(1));
// community: report each panel height + capture
const comm = await p.evaluate(()=>{
  const ps=[...document.querySelectorAll('.commx-mobile .mpanel')];
  return ps.map(p=>Math.round(p.getBoundingClientRect().height));
});
console.log('community panel heights:', comm, ' (was 812 each = 100svh)');
await p.evaluate(()=>document.getElementById('community').scrollIntoView());
await p.waitForTimeout(900);
await p.screenshot({path:'tests/shots/step4-comm-intro.png'});
// scroll down through community
await p.evaluate(()=>window.scrollBy(0, innerHeight*0.9));
await p.waitForTimeout(700);
await p.screenshot({path:'tests/shots/step4-comm-slide.png'});
await b.close();
console.log('shots saved');
