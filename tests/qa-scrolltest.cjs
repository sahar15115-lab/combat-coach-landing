const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function reachTesti(page, cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(480);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){const b=await el.boundingBox(); await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});} else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
  return await state(page);
}
async function scrollProbe(page,cdp,label){
  const y0=(await state(page)).scrollY;
  await touchSwipe(cdp,200,780,200,220,18); await page.waitForTimeout(500);
  const yTouch=(await state(page)).scrollY;
  await page.mouse.wheel(0,600); await page.waitForTimeout(500);
  const yWheel=(await state(page)).scrollY;
  const yProg=await page.evaluate(()=>{window.scrollBy(0,400);return Math.round(window.scrollY);});
  await page.waitForTimeout(300);
  return {label, y0, touchDelta:yTouch-y0, wheelDelta:yWheel-yTouch, progDelta:yProg-yWheel, finalCur:(await state(page)).cur};
}
(async()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const R={logs};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    await reachTesti(page,cdp);
    // A) scroll BEFORE any lightbox
    R.beforeLB = await scrollProbe(page,cdp,'before-lightbox');
    // scroll back up to testi for the tap test
    await page.evaluate(()=>{const t=document.getElementById('testi');window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY,behavior:'auto'});}); await page.waitForTimeout(700);
    // B) card tap opens lightbox (Playwright proper tap)
    const imgCard = await inViewEl(page,'.tst-card:not(.tst-video)');
    let cardTapOpened=null;
    if(imgCard){ await imgCard.tap().catch(()=>{}); await page.waitForTimeout(600); cardTapOpened=await page.evaluate(()=>document.getElementById('tstLb').classList.contains('tst-on')); }
    R.cardTapOpensLB=cardTapOpened;
    // close if open
    await page.keyboard.press('Escape').catch(()=>{}); await page.waitForTimeout(400);
    // C) liam video card tap
    let liam = await inViewEl(page,'.tst-card.tst-video');
    if(!liam){ for(let i=0;i<8;i++){ const r=await page.evaluate(()=>{const el=document.getElementById('tstRail');const b=el.getBoundingClientRect();return b.top+b.height/2;}); await touchSwipe(cdp,330,r,70,r,14); await page.waitForTimeout(260); liam=await inViewEl(page,'.tst-card.tst-video'); if(liam)break; } }
    let vid={found:!!liam};
    if(liam){ await liam.tap().catch(()=>{}); await page.waitForTimeout(1400);
      vid.open=await page.evaluate(()=>document.getElementById('tstLb').classList.contains('tst-on'));
      vid.t1=await page.evaluate(()=>{const v=document.querySelector('#tstLb video');return v?+v.currentTime.toFixed(2):null;});
      await page.waitForTimeout(1400);
      vid.t2=await page.evaluate(()=>{const v=document.querySelector('#tstLb video');return v?+v.currentTime.toFixed(2):null;});
      vid.playing = vid.t2!=null && vid.t1!=null && vid.t2>vid.t1;
      await page.screenshot({path:SHOT+'qa-nav-scroll-video.png'});
      await page.locator('#tstLbClose').click({force:true}); await page.waitForTimeout(500);
      vid.closedPaused=await page.evaluate(()=>{const v=document.querySelector('#tstLb video');return v?v.paused:'no-video-el(cleared)';});
      vid.lbClosed=await page.evaluate(()=>!document.getElementById('tstLb').classList.contains('tst-on'));
    }
    R.video=vid;
    // D) scroll AFTER lightbox open+close
    await page.evaluate(()=>{const t=document.getElementById('testi');window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY,behavior:'auto'});}); await page.waitForTimeout(600);
    R.afterLB = await scrollProbe(page,cdp,'after-lightbox');
  }catch(e){ R.error=String(e&&e.stack||e); }
  finally{ await browser.close(); console.log(JSON.stringify(R,null,1)); }
})();
