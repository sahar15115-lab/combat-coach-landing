import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(2000);

const activePanel = () => p.evaluate(()=>{
  const on = sel => { const e=[...document.querySelectorAll(sel)]; return e.findIndex(x=>x.classList.contains('on')); };
  return { train:on('.trainx-mobile .mpanel'), app:on('.appx-mobile .mpanel'), comm:on('.commx-mobile .mpanel') };
});

// focus on the APP scene (has the phone spin) — find its pin range
const st = await p.evaluate(()=>{ const el=document.querySelector('.appx-mobile'); const t=ScrollTrigger.getAll().find(x=>x.trigger===el); return {start:Math.round(t.start),end:Math.round(t.end)}; });

async function sweep(label, from, to, steps){
  const seq=[];
  for(let i=0;i<=steps;i++){
    const y = Math.round(from + (to-from)*i/steps);
    await p.evaluate(v=>scrollTo(0,v), y);
    await p.waitForTimeout(120); // FAST scroll — stress the anti-skip
    seq.push((await activePanel()).app);
  }
  // detect skips (change >1 between consecutive DISTINCT values)
  let skips=0, prev=seq[0];
  for(const v of seq){ if(v>=0){ if(prev>=0 && Math.abs(v-prev)>1) skips++; prev=v; } }
  const clean = seq.filter(v=>v>=0);
  console.log(`${label}: ${clean.join('')}  → skips=${skips}`);
  return skips;
}

// FAST down then FAST up through the app scene
const down = await sweep('DOWN (fast)', st.start, st.end, 14);
const up   = await sweep('UP   (fast)', st.end, st.start, 14);
console.log(down===0 && up===0 ? '\n✅ אין דילוגים בשני הכיוונים' : '\n❌ יש דילוגים');
await b.close();
