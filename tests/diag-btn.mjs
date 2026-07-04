import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(1800);
const st = await p.evaluate(()=>{ const el=document.querySelector('.appx-mobile'); const t=ScrollTrigger.getAll().find(x=>x.trigger===el); return {start:t.start,end:t.end,N:document.querySelectorAll('.appx-mobile .mpanel').length}; });
// go to panel 0 center
await p.evaluate(y=>scrollTo(0,y), Math.round(st.start+(0.5/st.N)*(st.end-st.start))); await p.waitForTimeout(800);
const before = await p.evaluate(()=>({ y:Math.round(scrollY), active:[...document.querySelectorAll('.appx-mobile .mpanel')].findIndex(m=>m.classList.contains('on')) }));
// what element is actually at the button's center? (detect overlay blocking)
const hit = await p.evaluate(()=>{
  const btn=document.querySelector('.appx-mobile .mpanel:nth-child(1) .phone-cta');
  if(!btn) return {err:'no btn'};
  const r=btn.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2;
  const top=document.elementFromPoint(cx,cy);
  return { btnText:btn.textContent.trim(), rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},
    topEl:top? (top.className||top.tagName)+'' : 'none', isButtonOrChild: btn.contains(top)||top===btn };
});
// try clicking it
try{ await p.click('.appx-mobile .mpanel:nth-child(1) .phone-cta', {timeout:3000}); }catch(e){ console.log('CLICK ERR:', e.message.slice(0,80)); }
await p.waitForTimeout(1200);
const after = await p.evaluate(()=>({ y:Math.round(scrollY), active:[...document.querySelectorAll('.appx-mobile .mpanel')].findIndex(m=>m.classList.contains('on')) }));
console.log('hit-test:', JSON.stringify(hit));
console.log('before:', JSON.stringify(before), '→ after:', JSON.stringify(after));
console.log('advanced?', after.active>before.active || after.y>before.y+50);
await b.close();
