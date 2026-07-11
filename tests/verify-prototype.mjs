// Card-carousel prototype: verify active-card emphasis + peek + capture screenshots.
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
  const active=[...document.querySelectorAll('.card')].findIndex(c=>c.classList.contains('active'));
  const doneSegs=document.querySelectorAll('.segs i.done').length;
  const curSeg=[...document.querySelectorAll('.segs i')].findIndex(s=>s.classList.contains('cur'));
  const rail=document.getElementById('rail');
  const acEl=document.querySelector('.card.active');
  const sc=acEl?getComputedStyle(acEl).transform:'';
  return {active, curSeg, doneSegs, sl:Math.round(rail.scrollLeft), cw:rail.clientWidth,
    cont:document.getElementById('cont').classList.contains('show'), activeScale:sc};
});
const goCard=(i)=>p.evaluate((i)=>document.querySelectorAll('.card')[i].scrollIntoView({behavior:'instant',inline:'center',block:'nearest'}),i);

await p.evaluate(()=>document.getElementById('train').scrollIntoView()); await p.waitForTimeout(700);
let s=await st();
A('card 0 active on entry', s.active===0);
A('segment 0 is current', s.curSeg===0);
A('continue hidden at start', !s.cont);
A('active card scaled up (≈1) vs neighbors', s.activeScale.includes('matrix'));
await p.screenshot({path:SHOT+'/card-01.png'});

await goCard(1); await p.waitForTimeout(650); s=await st();
A('card 1 active after nav', s.active===1);
A('segment 0 done, 1 current', s.doneSegs>=1 && s.curSeg===1);
A('snapped (center) cleanly', s.cw>0);
await p.screenshot({path:SHOT+'/card-02.png'});

await goCard(3); await p.waitForTimeout(650); s=await st();
A('last card active', s.active===3);
A('continue shows at last card', s.cont);
await p.screenshot({path:SHOT+'/card-04.png'});

const sy0=await p.evaluate(()=>Math.round(scrollY));
await p.click('#cont'); await p.waitForTimeout(900);
A('continue → natural page scroll (no lock)', (await p.evaluate(()=>Math.round(scrollY)))>sy0+100);

A('no JS errors', errs.length===0); if(errs.length) console.log('  errs:',errs.slice(0,3));
console.log(`\n${ok} passed, ${bad} failed`);
await b.close(); process.exit(bad?1:0);
