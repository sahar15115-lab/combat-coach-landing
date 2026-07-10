// Verify the locked scene stays VISUALLY pinned (wrap top ~= 0) when the viewport height
// toggles (in-app browser address bar) AND when a native scroll sneaks through.
import { chromium } from 'playwright';
const URL='http://localhost:8137';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:690},isMobile:true,hasTouch:true,deviceScaleFactor:3});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(900);
const cue=async()=>{ await p.evaluate(()=>{const c=document.getElementById('scrollCue'); if(c)c.click();}); await p.waitForTimeout(320); };
// reach community locked scene
await p.evaluate(()=>document.querySelector('#train').scrollIntoView()); await p.waitForTimeout(400);
for(let i=0;i<4;i++) await cue();                 // finish training -> #app
await p.evaluate(()=>document.querySelector('#app').scrollIntoView()); await p.waitForTimeout(300);
for(let i=0;i<4;i++) await cue();                 // finish app -> #testi
await p.evaluate(()=>document.querySelector('#community').scrollIntoView()); await p.waitForTimeout(400);
await cue();                                       // into community locked scene
await p.waitForTimeout(500);
const wrapTop=()=>p.evaluate(()=>{const w=document.querySelector('.commx-mobile'); return Math.round(w.getBoundingClientRect().top);});
const locked=()=>p.evaluate(()=>{const c=document.getElementById('scrollCue'); return true;}); // placeholder
console.log('community engaged, wrapTop=', await wrapTop());
// 1) viewport-height toggle (address bar show/hide)
const heights=[760,690,760,690,760]; let maxOff=0;
for(const h of heights){ await p.setViewportSize({width:390,height:h}); await p.waitForTimeout(220); const t=await wrapTop(); maxOff=Math.max(maxOff,Math.abs(t)); console.log('  h='+h+' -> wrapTop='+t); }
console.log('[TOGGLE] max |wrapTop| = '+maxOff+'px => '+(maxOff>12?'DRIFT (scene not pinned)':'pinned'));
// 2) simulate a native scroll that bypassed preventDefault (in-app browser)
await p.evaluate(()=>window.scrollBy(0,300)); await p.waitForTimeout(250);
const afterScroll=await wrapTop();
console.log('[NATIVE-SCROLL 300px] wrapTop='+afterScroll+' => '+(Math.abs(afterScroll)>12?'DRIFTED':'snapped back (pinned)'));
console.log('[console errors] '+(errs.length?errs.slice(0,3).join(' | '):'none'));
await b.close();
