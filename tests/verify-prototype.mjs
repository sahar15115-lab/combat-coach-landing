// Verify the training scroll-snap prototype on an emulated iPhone.
import { chromium } from 'playwright';
const URL = 'file:///C:/Users/sahar/OneDrive/Desktop/%D7%93%D7%A3%20%D7%A0%D7%97%D7%99%D7%AA%D7%94/prototype-train-snap.html';
const SHOT = 'C:/Users/sahar/AppData/Local/Temp/claude/C--Users-sahar-OneDrive-Desktop-----------------/0f925eef-3e49-4e83-8748-84e9be7eb4c0/scratchpad/proto';
import fs from 'fs'; fs.mkdirSync(SHOT,{recursive:true});
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:3 });
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(700);
let ok=0,bad=0; const A=(l,c)=>{console.log((c?'✓ ':'✗ ')+l);c?ok++:bad++;};
const st=()=>p.evaluate(()=>{
  const on=[...document.querySelectorAll('.slide')].findIndex(s=>s.classList.contains('in'));
  const dot=[...document.getElementById('dots').children].findIndex(d=>d.classList.contains('on'));
  const rail=document.getElementById('rail');
  return {on,dot,cw:rail.clientWidth,sl:Math.round(rail.scrollLeft),cont:document.getElementById('cont').classList.contains('show'),
    hint:parseFloat(getComputedStyle(document.getElementById('hint')).opacity),done:document.getElementById('train').classList.contains('done')};
});
const goSlide=(i)=>p.evaluate((i)=>document.querySelectorAll('.slide')[i].scrollIntoView({behavior:'instant',inline:'start',block:'nearest'}),i);

await p.evaluate(()=>document.getElementById('train').scrollIntoView()); await p.waitForTimeout(600);
let s=await st();
A('starts slide 0 (.in)', s.on===0); A('dot 0 on', s.dot===0); A('continue hidden', !s.cont);
await p.screenshot({path:SHOT+'/01-slide0.png'});

await goSlide(1); await p.waitForTimeout(600); s=await st();
A('slide 1 active after nav', s.on===1); A('dot 1 on', s.dot===1);
A('snapped to boundary (scrollLeft % clientWidth ≈ 0)', s.cw>0 && Math.abs(Math.abs(s.sl)%s.cw)<3);
A('swipe hint hides after moving', s.hint<0.5 || s.done);
await p.screenshot({path:SHOT+'/02-slide1.png'});

await goSlide(2); await p.waitForTimeout(400);
await goSlide(3); await p.waitForTimeout(600); s=await st();
A('last slide active', s.on===3); A('continue shows at last', s.cont);
A('snapped at last slide', s.cw>0 && Math.abs(Math.abs(s.sl)%s.cw)<3);
await p.screenshot({path:SHOT+'/03-slide3.png'});

// continue → natural page scroll (no lock)
const sy0=await p.evaluate(()=>Math.round(scrollY));
await p.click('#cont'); await p.waitForTimeout(900);
const sy1=await p.evaluate(()=>Math.round(scrollY));
A('continue scrolls to next area (not locked)', sy1>sy0+100);

// real touch-swipe → must land cleanly on a boundary (the "sticky" fear)
await p.evaluate(()=>document.getElementById('train').scrollIntoView()); await p.waitForTimeout(400);
await goSlide(0); await p.waitForTimeout(400);
const box=await p.$eval('#rail',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
await p.touchscreen.tap(box.x+box.w*0.5, box.y+box.h*0.5);
await p.mouse.move(box.x+box.w*0.82, box.y+box.h*0.5); await p.mouse.down();
await p.mouse.move(box.x+box.w*0.18, box.y+box.h*0.5,{steps:14}); await p.mouse.up();
await p.waitForTimeout(700); s=await st();
A('touch-swipe lands cleanly on a boundary (no mid-stuck)', s.cw>0 && Math.abs(Math.abs(s.sl)%s.cw)<6);
console.log('  after swipe: active slide='+s.on+'  scrollLeft%cw='+(s.cw?Math.abs(Math.abs(s.sl)%s.cw):'-'));

A('no JS errors', errs.length===0); if(errs.length) console.log('  errs:',errs.slice(0,3));
console.log(`\n${ok} passed, ${bad} failed  ·  screenshots in scratchpad/proto/`);
await b.close(); process.exit(bad?1:0);
