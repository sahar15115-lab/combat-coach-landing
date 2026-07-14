import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:8137/', {waitUntil:'load'});
await p.waitForTimeout(1200);
await p.evaluate(()=>document.getElementById('app').scrollIntoView());
await p.waitForTimeout(1500);
await p.screenshot({path:'tests/shots/app-restored-1.png'});
// tap the in-phone button → advance to screen 2, coach-mark should vanish
await p.evaluate(()=>{const btn=document.querySelector('.appx-mobile .mpanel.on [data-mnext]'); if(btn) btn.click();});
await p.waitForTimeout(900);
await p.screenshot({path:'tests/shots/app-restored-2.png'});
console.log('shots saved; app-tapped =', await p.evaluate(()=>document.getElementById('app').classList.contains('app-tapped')));
await b.close();
