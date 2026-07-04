import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(1800);
// cue is a button
console.log('cue is <button>:', await p.evaluate(()=>document.getElementById('scrollCue')?.tagName)==='BUTTON');
console.log('cue text:', (await p.textContent('#scrollCue')).trim());
// scroll into training scene so cta-hide turns on
const trainTop = await p.evaluate(()=>document.querySelector('#train').getBoundingClientRect().top+scrollY);
await p.evaluate(y=>scrollTo(0,y+300), trainTop); await p.waitForTimeout(600);
console.log('cta-hide active:', await p.evaluate(()=>document.body.classList.contains('cta-hide')));
console.log('cue clickable (pointer-events):', await p.evaluate(()=>getComputedStyle(document.getElementById('scrollCue')).pointerEvents));
console.log('js errors:', errs.length?errs:'NONE');
await b.close();
