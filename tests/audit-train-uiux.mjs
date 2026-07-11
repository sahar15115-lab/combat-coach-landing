// UI/UX audit of the new training card-carousel — mobile, in-app-browser sim, RTL, a11y, responsive.
import { chromium } from 'playwright';
const URL='http://localhost:8137/';
const SHOT='C:/Users/sahar/AppData/Local/Temp/claude/C--Users-sahar-OneDrive-Desktop-----------------/0f925eef-3e49-4e83-8748-84e9be7eb4c0/scratchpad/proto';
const b=await chromium.launch();
const findings=[]; const F=(sev,area,msg)=>findings.push({sev,area,msg});

// ---------- 1) MOBILE load + carousel states ----------
const m=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
const p=await m.newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message));
p.on('console',x=>{if(x.type()==='error'){const u=(x.location()&&x.location().url)||'';if(!u.includes('_vercel')&&!u.includes('fonts.g'))errs.push('console:'+x.text());}});
await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(1200);
await p.evaluate(()=>document.getElementById('train').scrollIntoView()); await p.waitForTimeout(800);
if(errs.length) F('HIGH','load','console/JS errors: '+errs.slice(0,3).join(' | '));

const state=()=>p.evaluate(()=>{
  const cards=[...document.querySelectorAll('.tcard')];
  const active=cards.findIndex(c=>c.classList.contains('active'));
  const acEl=cards[active];
  const rail=document.getElementById('trainRail');
  const seg=[...document.querySelectorAll('#trailSegs i')];
  return {active, scale:acEl?getComputedStyle(acEl).transform:'', cw:rail.clientWidth, sl:Math.round(rail.scrollLeft),
    copyOpacity:acEl?getComputedStyle(acEl.querySelector('.tcard-copy')).opacity:'0',
    segDone:seg.filter(s=>s.classList.contains('done')).length, segCur:seg.findIndex(s=>s.classList.contains('cur')),
    hintVisible: getComputedStyle(document.getElementById('trainHint')).display!=='none'};
});
let s=await state();
if(s.active!==0) F('MED','carousel','entry active card is not 0 (got '+s.active+')');
if(!s.scale.includes('matrix')) F('HIGH','carousel','active card has no scale emphasis');
if(parseFloat(s.copyOpacity)<0.9) F('MED','carousel','active copy entrance not fully shown ('+s.copyOpacity+')');
if(s.segCur!==0) F('MED','story-bar','segment 0 not current at entry');
await p.screenshot({path:SHOT+'/audit-01-entry.png'});

// peek check: is the next card partially visible to the LEFT (RTL forward)?
const peek=await p.evaluate(()=>{
  const cards=[...document.querySelectorAll('.tcard')];
  const r0=cards[0].getBoundingClientRect(), r1=cards[1].getBoundingClientRect();
  return {c0_right:Math.round(r0.right),c0_left:Math.round(r0.left),c1_right:Math.round(r1.right),c1_left:Math.round(r1.left),vw:innerWidth};
});
// in RTL, card1 (next) should peek on the LEFT edge (its right edge > 0 and left < 0-ish)
if(!(peek.c1_right>0 && peek.c1_right<peek.vw*0.35)) F('MED','peek','next card peek on left edge unclear: '+JSON.stringify(peek));

// ---------- 2) snap mechanics: navigate all 4 ----------
for(let i=1;i<4;i++){
  await p.evaluate((i)=>document.querySelectorAll('.tcard')[i].scrollIntoView({inline:'center',block:'nearest'}),i);
  await p.waitForTimeout(550); s=await state();
  if(s.active!==i) F('HIGH','snap','card '+i+' not active after nav (got '+s.active+')');
  if(s.cw>0 && Math.abs(Math.abs(s.sl)%s.cw)>4) F('MED','snap','card '+i+' not snapped to boundary (residual '+(Math.abs(s.sl)%s.cw)+')');
}
s=await state();
if(s.segDone<3) F('MED','story-bar','segments not filling as you advance ('+s.segDone+' done at last)');
if(s.hintVisible) F('LOW','hint','swipe hint still visible after moving through cards');
await p.screenshot({path:SHOT+'/audit-02-last.png'});

// ---------- 3) viewport-toggle robustness (the historical breaker) ----------
await p.evaluate(()=>document.querySelectorAll('.tcard')[1].scrollIntoView({inline:'center'})); await p.waitForTimeout(400);
const sy0=await p.evaluate(()=>Math.round(scrollY));
const heights=[760,690,760,690,760]; let maxJump=0;
for(const h of heights){ await p.setViewportSize({width:390,height:h}); await p.waitForTimeout(220);
  const sy=await p.evaluate(()=>Math.round(scrollY)); maxJump=Math.max(maxJump,Math.abs(sy-sy0)); }
console.log('[viewport-toggle] maxJump='+maxJump+'px');
if(maxJump>40) F('HIGH','robustness','vertical jump on viewport-height toggle: '+maxJump+'px (should be ~0)');
await p.setViewportSize({width:390,height:844});

// ---------- 4) small screen + landscape ----------
await p.setViewportSize({width:320,height:568}); await p.waitForTimeout(500);
await p.evaluate(()=>document.getElementById('train').scrollIntoView()); await p.waitForTimeout(500);
const small=await p.evaluate(()=>{
  const t=document.querySelector('.trail-title').getBoundingClientRect();
  const nav=document.getElementById('nav').getBoundingClientRect();
  const card=document.querySelector('.tcard.active').getBoundingClientRect();
  return {titleTop:Math.round(t.top),navBottom:Math.round(nav.bottom),titleUnderNav:t.top<nav.bottom, cardBottom:Math.round(card.bottom),vh:innerHeight,cardOverflow:card.bottom>innerHeight+4};
});
if(small.titleUnderNav) F('MED','responsive','on 320px, scene title is under the nav');
if(small.cardOverflow) F('LOW','responsive','on 320px, active card overflows viewport bottom');
await p.screenshot({path:SHOT+'/audit-03-small.png'});
await p.setViewportSize({width:740,height:360}); await p.waitForTimeout(500);
await p.screenshot({path:SHOT+'/audit-04-landscape.png'});

// ---------- 5) a11y: reduced-motion + roles + tap targets ----------
const rm=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const rp=await rm.newPage(); await rp.goto(URL,{waitUntil:'load'}); await rp.waitForTimeout(900);
await rp.evaluate(()=>document.getElementById('train').scrollIntoView()); await rp.waitForTimeout(500);
const a11y=await rp.evaluate(()=>{
  const rail=document.getElementById('trainRail');
  const copyTrans=getComputedStyle(document.querySelector('.tcard-copy')).transitionDuration;
  return {role:rail.getAttribute('aria-roledescription'), hasLabel:!!rail.getAttribute('aria-label'),
    reducedKillsAnim: copyTrans==='0s'||copyTrans==='0s, 0s'};
});
if(!a11y.role) F('MED','a11y','rail missing aria-roledescription (carousel)');
if(!a11y.reducedKillsAnim) F('LOW','a11y','reduced-motion may not disable copy transition ('+')');
await rm.close();

// ---------- 6) desktop unaffected ----------
const d=await b.newContext({viewport:{width:1280,height:900}});
const dp=await d.newPage(); const derr=[]; dp.on('pageerror',e=>derr.push(e.message));
await dp.goto(URL,{waitUntil:'load'}); await dp.waitForTimeout(1000);
const desk=await dp.evaluate(()=>({dt:getComputedStyle(document.querySelector('.trainx-desktop')).display, mob:getComputedStyle(document.querySelector('.trainx-mobile')).display}));
if(desk.dt==='none') F('HIGH','desktop','trainx-desktop hidden on desktop');
if(desk.mob!=='none') F('HIGH','desktop','trainx-mobile shown on desktop (should be hidden)');
if(derr.length) F('HIGH','desktop','desktop JS errors: '+derr.slice(0,2).join(' | '));

// ---------- report ----------
const order={HIGH:0,MED:1,LOW:2};
findings.sort((a,c)=>order[a.sev]-order[c.sev]);
console.log('\n===== UI/UX AUDIT — TRAINING CAROUSEL =====');
if(!findings.length) console.log('✓ no issues found across load / carousel / snap / viewport-toggle / RTL-peek / responsive / a11y / desktop');
findings.forEach(f=>console.log('['+f.sev+'] '+f.area+': '+f.msg));
console.log('\nconsole errors:', errs.length?errs.slice(0,4):'none');
console.log('screenshots: audit-01-entry, 02-last, 03-small, 04-landscape');
await b.close();
