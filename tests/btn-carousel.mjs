// Locked button-slideshow test: each scene locks the screen until you tap through ALL its
// slides. CENTRAL check: you cannot reach #app without seeing all 4 training slides.
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
const clickCue=async()=>{ await page.evaluate(()=>document.getElementById('scrollCue').click()); await page.waitForTimeout(320); };
const inView=(sel)=>page.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top<window.innerHeight*0.5&&r.bottom>0;},sel);
// dispatch a real cancelable wheel; returns true if the scroll-lock swallowed it
const wheelBlocked=()=>page.evaluate(()=>{const ev=new WheelEvent('wheel',{deltaY:400,cancelable:true,bubbles:true});window.dispatchEvent(ev);return ev.defaultPrevented;});

A('no ScrollTrigger pins on mobile scenes', await page.evaluate(()=>ScrollTrigger.getAll().filter(s=>s.pin&&/trainx|appx|commx/.test((s.trigger&&s.trigger.className)||'')).length)===0);

// engage training
await page.evaluate(()=>document.querySelector('#train').scrollIntoView()); await page.waitForTimeout(900);
A('training starts on slide 0', await onIdx('.trainx-mobile')===0);

// ***** CENTRAL: locked — cannot skip past training *****
A('LOCKED on entry (scroll gesture swallowed)', await wheelBlocked()===true);
A('#app NOT reachable before seeing all training slides', !(await inView('#app')));

await clickCue(); A('tap → slide 1', await onIdx('.trainx-mobile')===1);
A('still LOCKED on slide 1', await wheelBlocked()===true);
await clickCue(); A('tap → slide 2', await onIdx('.trainx-mobile')===2);
A('still LOCKED on slide 2', await wheelBlocked()===true);
await clickCue(); A('tap → slide 3 (last)', await onIdx('.trainx-mobile')===3);
A('UNLOCKED after last slide seen', await wheelBlocked()===false);

// continue → #app
await clickCue(); await page.waitForTimeout(900);
A('after all 4 slides seen → #app reached', await inView('#app'));

// app scene re-locks; the in-phone button advances; must complete it too (can't skip)
await page.waitForTimeout(300);
A('app starts on slide 0', await onIdx('.appx-mobile')===0);
A('app LOCKED on entry (cannot skip)', await wheelBlocked()===true);
await page.evaluate(()=>{const b=document.querySelector('.appx-mobile .mpanel.on .phone-cta'); if(b)b.click();}); await page.waitForTimeout(320);
A('phone button → app slide 1', await onIdx('.appx-mobile')===1);
await clickCue(); await clickCue(); A('app → slide 3 (last)', await onIdx('.appx-mobile')===3);
await clickCue(); await page.waitForTimeout(900); // continue → #community
A('after app completed → #community reached', await inView('#community'));

// community: tap through to slide 5 → ai-mode gold→blue
A('community starts on slide 0', await onIdx('.commx-mobile')===0);
for(let i=0;i<5;i++) await clickCue();
A('community reached slide 5', await onIdx('.commx-mobile')===5);
A('ai-mode ON at slide 5 (gold→blue)', await page.evaluate(()=>document.body.classList.contains('ai-mode')));

A('no console errors', errs.length===0); if(errs.length) console.log('  errs:',errs.slice(0,4));
console.log(`\n${ok} passed, ${bad} failed`);
await b.close(); process.exit(bad?1:0);
