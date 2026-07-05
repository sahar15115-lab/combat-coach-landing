// Button-carousel test: slides advance ONLY on button tap; last slide continues to next section.
import { chromium } from 'playwright';
const URL='http://localhost:8137';
let ok=0, bad=0; const A=(l,c)=>{ console.log((c?'✓ ':'✗ ')+l); c?ok++:bad++; };
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
page.on('console',m=>{ if(m.type()!=='error')return; const u=(m.location()&&m.location().url)||''; if(!u.includes('_vercel')&&!u.includes('fonts.g'))errs.push(m.text()); });
await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1500);

const onIdx=(sel)=>page.evaluate(s=>{const ps=[...document.querySelectorAll(s+' .mpanel')];return ps.findIndex(p=>p.classList.contains('on'));},sel);
const clickCue=async()=>{ await page.evaluate(()=>document.getElementById('scrollCue').click()); await page.waitForTimeout(350); };

// no scroll-jacking: the mobile scenes must NOT create ScrollTrigger pins anymore
const pinnedST=await page.evaluate(()=>ScrollTrigger.getAll().filter(s=>s.pin&&/trainx|appx|commx/.test((s.trigger&&s.trigger.className)||'')).length);
A('no ScrollTrigger pins on mobile scenes (was the bug source)', pinnedST===0);

// bring training scene into view so it's the active scene
await page.evaluate(()=>document.querySelector('#train').scrollIntoView()); await page.waitForTimeout(900);
A('training starts on slide 0', await onIdx('.trainx-mobile')===0);
await clickCue(); A('tap → slide 1', await onIdx('.trainx-mobile')===1);
await clickCue(); A('tap → slide 2', await onIdx('.trainx-mobile')===2);
await clickCue(); A('tap → slide 3 (last)', await onIdx('.trainx-mobile')===3);
// tap on last slide → continue to #app
await clickCue(); await page.waitForTimeout(900);
const appVisible=await page.evaluate(()=>{const r=document.querySelector('#app').getBoundingClientRect();return r.top< window.innerHeight*0.6 && r.bottom>0;});
A('tap on last slide → scrolled to #app', appVisible);

// app scene: phone-cta advances the phone screens
await page.evaluate(()=>document.querySelector('#app').scrollIntoView()); await page.waitForTimeout(900);
A('app starts on slide 0', await onIdx('.appx-mobile')===0);
await page.evaluate(()=>{const b=document.querySelector('.appx-mobile .mpanel.on .phone-cta'); if(b)b.click();}); await page.waitForTimeout(350);
A('phone button → app slide 1', await onIdx('.appx-mobile')===1);

// community: advancing past slide 5 turns on ai-mode
await page.evaluate(()=>document.querySelector('#community').scrollIntoView()); await page.waitForTimeout(900);
for(let i=0;i<5;i++){ await clickCue(); }
A('community reached slide 5', await onIdx('.commx-mobile')===5);
A('ai-mode ON at slide 5 (gold→blue)', await page.evaluate(()=>document.body.classList.contains('ai-mode')));

A('no console errors', errs.length===0); if(errs.length) console.log('  errs:',errs.slice(0,4));
console.log(`\n${ok} passed, ${bad} failed`);
await b.close(); process.exit(bad?1:0);
