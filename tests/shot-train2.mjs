import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:8137/', {waitUntil:'load'});
await p.waitForTimeout(1200);
await p.evaluate(()=>document.getElementById('train').scrollIntoView());
await p.waitForTimeout(1500);
await p.screenshot({path:'tests/shots/train-warmup2.png'});
const info = await p.evaluate(()=>{
  const c=document.querySelector('.trainx-mobile .tcard.active')||document.querySelector('.tcard');
  const v=c&&c.querySelector('video'); const media=c&&c.querySelector('.tcard-media');
  const r=c?c.getBoundingClientRect():{};
  return {cardW:Math.round(r.width),cardH:Math.round(r.height),
    videoObjPos:v?getComputedStyle(v).objectPosition:'n/a',
    videoObjFit:v?getComputedStyle(v).objectFit:'n/a',
    mediaBg:media?getComputedStyle(media).backgroundPosition:'n/a'};
});
console.log(JSON.stringify(info,null,1));
await b.close();
