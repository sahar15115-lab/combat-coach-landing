const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function snap(page){ return page.evaluate(()=>{ const g=id=>{const e=document.getElementById(id);return e?Math.round(e.getBoundingClientRect().top):null;}; const c=document.getElementById('scrollCue');const cs=getComputedStyle(c); const commOn=(()=>{const w=document.querySelector('.commx-mobile');if(!w)return null;return [...w.querySelectorAll('.mpanel')].findIndex(p=>p.classList.contains('on'));})(); return {sy:Math.round(scrollY),docH:document.documentElement.scrollHeight,testi:g('testi'),comm:g('community'),check:g('check'),fit:g('fit'),cueVis:cs.opacity!=='0'&&cs.pointerEvents!=='none',cta:/cta-hide/.test(document.body.className),commOn}; }); }
async function reachTesti(page, cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(480);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){const b=await el.boundingBox(); await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});} else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
}
(async()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const R={logs,swipes:[],cue:[]};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    await reachTesti(page,cdp);
    R.atTesti=await snap(page);
    // individual vertical swipes down, full state after each
    for(let i=0;i<7;i++){ await touchSwipe(cdp,200,780,200,220,18); await page.waitForTimeout(550); R.swipes.push(await snap(page)); }
    await page.screenshot({path:SHOT+'qa-nav-diag2-afterswipes.png'});
    // if community locked (comm≈0), try floating cue to advance it
    for(let k=0;k<7;k++){ const s=await snap(page); const vis=s.cueVis; if(vis) await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,780,200,220,18); await page.waitForTimeout(650); R.cue.push({k,vis,...(await snap(page))}); }
    await page.screenshot({path:SHOT+'qa-nav-diag2-aftercue.png'});

    // ---- CARD TAP isolation ----
    await page.evaluate(()=>{const t=document.getElementById('testi');window.scrollTo({top:t.getBoundingClientRect().top+scrollY,behavior:'auto'});}); await page.waitForTimeout(700);
    const card=await inViewEl(page,'.tst-card:not(.tst-video)');
    const probe={};
    if(card){
      probe.beforeCls=await card.evaluate(e=>e.className);
      await card.click().catch(err=>probe.clickErr=String(err)); await page.waitForTimeout(500);
      probe.afterClickLB=await page.evaluate(()=>document.getElementById('tstLb').classList.contains('tst-on'));
      probe.afterClickCls=await card.evaluate(e=>e.className);
      await page.keyboard.press('Escape').catch(()=>{}); await page.waitForTimeout(300);
      // try dispatch a native click via JS
      await card.evaluate(e=>e.click()); await page.waitForTimeout(500);
      probe.afterJsClickLB=await page.evaluate(()=>document.getElementById('tstLb').classList.contains('tst-on'));
      await page.keyboard.press('Escape').catch(()=>{}); await page.waitForTimeout(300);
      // tap
      await card.tap().catch(err=>probe.tapErr=String(err)); await page.waitForTimeout(500);
      probe.afterTapLB=await page.evaluate(()=>document.getElementById('tstLb').classList.contains('tst-on'));
      await page.keyboard.press('Escape').catch(()=>{});
    } else probe.noCard=true;
    R.cardProbe=probe;
  }catch(e){ R.error=String(e&&e.stack||e); }
  finally{ await browser.close(); console.log(JSON.stringify(R,null,1)); }
})();
