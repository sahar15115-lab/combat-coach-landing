const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function snap(page){ return page.evaluate(()=>{ const g=id=>{const e=document.getElementById(id);return e?Math.round(e.getBoundingClientRect().top):null;}; const c=document.getElementById('scrollCue');const cs=getComputedStyle(c); const commOn=(()=>{const w=document.querySelector('.commx-mobile');if(!w)return null;return [...w.querySelectorAll('.mpanel')].findIndex(p=>p.classList.contains('on'));})(); return {sy:Math.round(scrollY),testi:g('testi'),comm:g('community'),check:g('check'),cueVis:cs.opacity!=='0'&&cs.pointerEvents!=='none',cta:/cta-hide/.test(document.body.className),commOn}; }); }
async function reachTesti(page, cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(480);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){const b=await el.boundingBox(); await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});} else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
}
(async()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const R={steps:[]};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    await reachTesti(page,cdp);
    await page.waitForTimeout(2200); // SETTLE the goSection smooth scroll
    R.settled=await snap(page);
    // slow deliberate swipes; if a locked scene shows the cue, click it instead
    for(let i=0;i<16;i++){
      const s=await snap(page);
      if(s.check!=null && Math.abs(s.check)<140){ R.steps.push({i,reached:'check',...s}); break; }
      let act;
      if(s.cueVis){ await page.locator('#scrollCue').click({force:true}); act='cue'; }
      else { await touchSwipe(cdp,200,720,200,250,20); act='swipe'; }
      await page.waitForTimeout(800);
      R.steps.push({i,act,...(await snap(page))});
    }
    await page.screenshot({path:SHOT+'qa-nav-testiscroll2-end.png'});
  }catch(e){ R.error=String(e&&e.stack||e); }
  finally{ await browser.close(); console.log(JSON.stringify(R,null,1)); }
})();
