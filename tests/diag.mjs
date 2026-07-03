import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(2000);
const gaps = await p.evaluate(()=>{
  const r = el => el.getBoundingClientRect().top + scrollY;
  const secTop = s => { const e=document.querySelector(s); return e?Math.round(r(e)):null; };
  const H = innerHeight;
  const train = document.querySelector('.trainx-mobile'), app=document.querySelector('.appx-mobile'), comm=document.querySelector('.commx-mobile');
  const st = sel => { const ScrollTrigger=window.ScrollTrigger; const el=document.querySelector(sel);
    const t=ScrollTrigger.getAll().find(x=>x.trigger===el); return t?{start:Math.round(t.start),end:Math.round(t.end)}:null; };
  return {
    screenH:H,
    trainPin:st('.trainx-mobile'), appPin:st('.appx-mobile'), commPin:st('.commx-mobile'),
    sectionPadTop: getComputedStyle(document.querySelector('#app')).paddingTop,
  };
});
console.log(JSON.stringify(gaps,null,2));
// gap between train pin end and app pin start:
if(gaps.trainPin&&gaps.appPin){
  console.log('GAP train→app (px):', gaps.appPin.start-gaps.trainPin.end, '= screens:', ((gaps.appPin.start-gaps.trainPin.end)/gaps.screenH).toFixed(2));
}
if(gaps.appPin&&gaps.commPin){
  console.log('GAP app→comm (px):', gaps.commPin.start-gaps.appPin.end, '= screens:', ((gaps.commPin.start-gaps.appPin.end)/gaps.screenH).toFixed(2));
}
await b.close();
