import { chromium } from 'playwright';
const URL='http://localhost:8137/';
const b=await chromium.launch();
let ok=0,bad=0;const A=(l,c)=>{console.log((c?'✓ ':'✗ ')+l);c?ok++:bad++;};
// MOBILE
const m=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await m.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR:'+e.message));
p.on('console',x=>{if(x.type()==='error'){const u=(x.location()&&x.location().url)||'';if(!u.includes('_vercel')&&!u.includes('fonts.g'))errs.push('console:'+x.text());}});
await p.goto(URL,{waitUntil:'load'});await p.waitForTimeout(1300);
A('mobile: no JS errors (syntax OK)',errs.length===0);if(errs.length)console.log('  ',errs.slice(0,5));
// training
await p.evaluate(()=>document.getElementById('train').scrollIntoView());await p.waitForTimeout(700);
A('train: card active',await p.evaluate(()=>!!document.querySelector('.tcard.active')));
A('train: floating cue hidden',await p.evaluate(()=>{var c=document.getElementById('scrollCue');return !c||getComputedStyle(c).display==='none';}));
// app: horizontal card carousel (same pattern as training)
await p.evaluate(()=>document.getElementById('app').scrollIntoView());await p.waitForTimeout(700);
A('app: card active',await p.evaluate(()=>!!document.querySelector('.appx-mobile .acard.active')));
A('app: 4 cards present',await p.evaluate(()=>document.querySelectorAll('.appx-mobile .acard').length===4));
A('app: no leftover pin-active/mpanel',await p.evaluate(()=>!document.querySelector('.appx-mobile.pin-active')&&document.querySelectorAll('.appx-mobile .mpanel').length===0));
// app free scroll: page can scroll past app without lock
const beforeY=await p.evaluate(()=>Math.round(scrollY));
await p.evaluate(()=>window.scrollBy(0,600));await p.waitForTimeout(200);
A('app: page scrolls freely (no lock)',(await p.evaluate(()=>Math.round(scrollY)))>beforeY+200);
// community: natural scroll + ai-mode on AI slide
await p.evaluate(()=>document.getElementById('community').scrollIntoView());await p.waitForTimeout(600);
A('community: reached (in view)',await p.evaluate(()=>{const r=document.getElementById('community').getBoundingClientRect();return r.top<window.innerHeight&&r.bottom>0;}));
const commPanels=await p.evaluate(()=>document.querySelectorAll('.commx-mobile .mpanel').length);
A('community: panels present ('+commPanels+')',commPanels>0);
// scroll to last community panel → ai-mode
await p.evaluate(()=>{var ps=document.querySelectorAll('.commx-mobile .mpanel');ps[ps.length-1].scrollIntoView();});await p.waitForTimeout(700);
A('community: ai-mode ON at AI slide (blue)',await p.evaluate(()=>document.body.classList.contains('ai-mode')));
// DESKTOP
const d=await b.newContext({viewport:{width:1280,height:900}});const dp=await d.newPage();const derr=[];
dp.on('pageerror',e=>derr.push(e.message));
await dp.goto(URL,{waitUntil:'load'});await dp.waitForTimeout(1000);
A('desktop: no JS errors',derr.length===0);if(derr.length)console.log('  ',derr.slice(0,3));
A('desktop: trainx-desktop visible',await dp.evaluate(()=>getComputedStyle(document.querySelector('.trainx-desktop')).display!=='none'));
console.log(`\n${ok} passed, ${bad} failed`);
await b.close();process.exit(bad?1:0);
