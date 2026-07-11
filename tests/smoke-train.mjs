import { chromium } from 'playwright';
const URL='http://localhost:8137/';
const b=await chromium.launch();
// --- MOBILE ---
const m=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const mp=await m.newPage(); const merr=[]; mp.on('pageerror',e=>merr.push(e.message));
mp.on('console',x=>{if(x.type()==='error'){const u=(x.location()&&x.location().url)||'';if(!u.includes('_vercel')&&!u.includes('fonts.g'))merr.push('console:'+x.text());}});
await mp.goto(URL,{waitUntil:'load'}); await mp.waitForTimeout(1200);
let ok=0,bad=0;const A=(l,c)=>{console.log((c?'✓ ':'✗ ')+l);c?ok++:bad++;};
await mp.evaluate(()=>document.getElementById('train').scrollIntoView()); await mp.waitForTimeout(800);
A('mobile: train rail exists', await mp.$('#trainRail')!==null);
A('mobile: 4 tcards', (await mp.$$('#trainRail .tcard')).length===4);
A('mobile: story segs = 4', (await mp.$$('#trailSegs i')).length===4);
A('mobile: a card is active', await mp.evaluate(()=>!!document.querySelector('.tcard.active')));
A('mobile: active card scaled (matrix)', await mp.evaluate(()=>getComputedStyle(document.querySelector('.tcard.active')).transform.includes('matrix')));
// navigate to card 1 via scrollIntoView center
await mp.evaluate(()=>document.querySelectorAll('.tcard')[1].scrollIntoView({inline:'center'})); await mp.waitForTimeout(600);
A('mobile: card 1 active after nav', await mp.evaluate(()=>document.querySelectorAll('.tcard')[1].classList.contains('active')));
A('mobile: seg 0 done after moving', await mp.evaluate(()=>document.querySelectorAll('#trailSegs i')[0].classList.contains('done')));
A('mobile: no JS errors', merr.length===0); if(merr.length)console.log('  ',merr.slice(0,4));
// --- DESKTOP ---
const d=await b.newContext({viewport:{width:1280,height:900}});
const dp=await d.newPage(); const derr=[]; dp.on('pageerror',e=>derr.push(e.message));
await dp.goto(URL,{waitUntil:'load'}); await dp.waitForTimeout(1200);
A('desktop: trainx-desktop visible', await dp.evaluate(()=>getComputedStyle(document.querySelector('.trainx-desktop')).display!=='none'));
A('desktop: trainx-mobile hidden', await dp.evaluate(()=>getComputedStyle(document.querySelector('.trainx-mobile')).display==='none'));
A('desktop: no JS errors', derr.length===0); if(derr.length)console.log('  ',derr.slice(0,4));
console.log(`\n${ok} passed, ${bad} failed`);
await b.close(); process.exit(bad?1:0);
