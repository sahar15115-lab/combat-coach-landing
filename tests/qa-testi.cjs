const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';

async function inViewEl(page, sel){
  const h = await page.evaluateHandle((s)=>{ const els=[...document.querySelectorAll(s)];
    return els.find(e=>{const r=e.getBoundingClientRect(); return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null; }, sel);
  return h.asElement();
}
async function tapCenter(cdp, box){ const x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); }
async function inViewTap(page, cdp, sel){ const el=await inViewEl(page,sel); if(!el) return false; const b=await el.boundingBox(); if(!b) return false; await tapCenter(cdp,b); return true; }
async function reachTesti(page, cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(480);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const t=await inViewTap(page,cdp,'.appx-mobile .mpanel.on .phone-cta'); if(!t) await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
  return await state(page);
}
async function railInfo(page){ return page.evaluate(()=>{const r=document.getElementById('tstRail'); if(!r)return null; const b=r.getBoundingClientRect(); return {scrollLeft:Math.round(r.scrollLeft), sw:Math.round(r.scrollWidth/3), max:Math.round(r.scrollWidth-r.clientWidth), top:Math.round(b.top), midY:Math.round(b.top+b.height/2), inView:b.top<innerHeight&&b.bottom>0};}); }
async function lbState(page){ return page.evaluate(()=>{const lb=document.getElementById('tstLb'); if(!lb)return null; const v=lb.querySelector('video'); const img=lb.querySelector('img'); return {open:lb.classList.contains('tst-on'), disp:getComputedStyle(lb).display, hasVideo:!!v, hasImg:!!img, vt: v?+v.currentTime.toFixed(2):null, vpaused: v?v.paused:null, imgComplete: img?(img.complete&&img.naturalWidth>0):null};}); }
async function openImgCard(page,cdp){ // tap an in-view image card until lb opens (retry, incl. tst-zoom)
  for(let a=0;a<4;a++){ if(!(await inViewTap(page,cdp,'.tst-card:not(.tst-video)'))) return 'no-card'; await page.waitForTimeout(500); if((await lbState(page)).open) return 'open'; }
  // fallback: JS-open via first zoom key
  await page.evaluate(()=>{const z=document.querySelector('.tst-zoom'); if(z)z.click();}); await page.waitForTimeout(400);
  return (await lbState(page)).open?'open-viaZoom':'FAILED';
}
async function safeClose(page,fn){ try{ await fn(); }catch(e){} await page.waitForTimeout(400); }

(async()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const R={logs,phase:{}};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    const s0=await reachTesti(page,cdp);
    R.phase.reached={testiTop:s0.rects.testi,cur:s0.cur,scrollY:s0.scrollY};
    await page.screenshot({path:SHOT+'qa-nav-testi-01arrive.png'});

    // rail loop
    const rail0=await railInfo(page); const seq=[rail0.scrollLeft];
    for(let i=0;i<8;i++){ const ri=await railInfo(page); await touchSwipe(cdp,330,ri.midY,70,ri.midY,14); await page.waitForTimeout(280); seq.push((await railInfo(page)).scrollLeft); }
    for(let i=0;i<10;i++){ const ri=await railInfo(page); await touchSwipe(cdp,70,ri.midY,330,ri.midY,14); await page.waitForTimeout(220); seq.push((await railInfo(page)).scrollLeft); }
    const rf=await railInfo(page);
    R.phase.rail={sw:rf.sw,max:rf.max,scrollLeftSeq:seq, wrappedWithinBounds: seq.every(v=>v>=-5 && v<=rf.max+5)};
    await page.screenshot({path:SHOT+'qa-nav-testi-02rail.png'});

    // lightbox image + close X
    const o1=await openImgCard(page,cdp); R.phase.lbImg={open:o1, afterOpen:await lbState(page)};
    await page.screenshot({path:SHOT+'qa-nav-testi-03lb-img.png'});
    await safeClose(page,()=>page.locator('#tstLbClose').click({force:true}));
    R.phase.lbImg.afterCloseX=await lbState(page);

    // close via backdrop
    const o2=await openImgCard(page,cdp); const openBd=await lbState(page);
    await safeClose(page,()=>page.mouse.click(8,8));
    R.phase.lbBackdrop={open:o2,openBd, afterBackdrop:await lbState(page)};

    // close via Escape
    const o3=await openImgCard(page,cdp); const openEsc=await lbState(page);
    await safeClose(page,()=>page.keyboard.press('Escape'));
    R.phase.lbEscape={open:o3,openEsc, afterEsc:await lbState(page)};

    // video liam
    let vf=await inViewTap(page,cdp,'.tst-card.tst-video');
    if(!vf){ for(let i=0;i<8;i++){ const ri=await railInfo(page); await touchSwipe(cdp,330,ri.midY,70,ri.midY,14); await page.waitForTimeout(260); if(await inViewTap(page,cdp,'.tst-card.tst-video')){vf=true;break;} } }
    await page.waitForTimeout(1200); const vOpen=await lbState(page);
    await page.waitForTimeout(1300); const vPlaying=await lbState(page);
    await page.screenshot({path:SHOT+'qa-nav-testi-04lb-video.png'});
    await safeClose(page,()=>page.locator('#tstLbClose').click({force:true}));
    const vClosed=await lbState(page);
    R.phase.video={vf,vOpen,vPlaying,advanced:(vPlaying&&vOpen&&vPlaying.vt>vOpen.vt),vClosed};

    // PAST BUG: after open+close, rail swipe + page scroll down
    const beforeScroll=(await state(page)).scrollY; const railBefore=(await railInfo(page)).scrollLeft;
    const ri=await railInfo(page); await touchSwipe(cdp,330,ri.midY,90,ri.midY,14); await page.waitForTimeout(300);
    const railAfter=(await railInfo(page)).scrollLeft;
    for(let i=0;i<5;i++){ await touchSwipe(cdp,200,770,200,240,16); await page.waitForTimeout(420); }
    const aft=await state(page);
    R.phase.afterCloseMobility={beforeScroll,afterScroll:aft.scrollY,pageScrolled:aft.scrollY>beforeScroll+40,railBefore,railAfter,railMoved:railAfter!==railBefore,curAfter:aft.cur};
    await page.screenshot({path:SHOT+'qa-nav-testi-05afterclose.png'});

    // double-tap
    for(let i=0;i<6;i++){ const s=await state(page); if(Math.abs(s.rects.testi)<180)break; await touchSwipe(cdp,200,240,200,730,16); await page.waitForTimeout(350); }
    const el=await inViewEl(page,'.tst-card:not(.tst-video)');
    if(el){ const b=await el.boundingBox(); if(b){ await tapCenter(cdp,b); await tapCenter(cdp,b); } }
    await page.waitForTimeout(600); const dbl=await lbState(page);
    await safeClose(page,()=>page.keyboard.press('Escape'));
    R.phase.doubleTap={dblOpen:dbl, afterEsc:await lbState(page)};
  }catch(e){ R.error=String(e&&e.stack||e); }
  finally{ await browser.close(); console.log(JSON.stringify(R,null,1)); }
})();
