const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function reachTesti(page,cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(500);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(800);}
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){ await el.click({force:true}).catch(()=>{}); } else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(1000);}
}
async function arrivalTrial(){
  const { browser, page, cdp } = await makeCtx(pw,390,844);
  let r={};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    await reachTesti(page,cdp); await page.waitForTimeout(2500);
    const s0=(await state(page)).scrollY;
    r.testiTop=(await state(page)).rects.testi;
    // 5 down-swipes; can we make progress to community/check?
    for(let i=0;i<5;i++){await touchSwipe(cdp,200,720,200,250,20);await page.waitForTimeout(600);}
    const s1=(await state(page)).scrollY;
    r.downDelta=s1-s0;
    r.stuck = Math.abs(r.downDelta) < 40;
  }catch(e){r.error=String(e);} finally{await browser.close();}
  return r;
}
async function reloadTest(scrollTo,label){
  const { browser, page, cdp, logs } = await makeCtx(pw,390,844);
  let r={label,logs};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1200);
    await page.evaluate((y)=>window.scrollTo(0,y),scrollTo); await page.waitForTimeout(800);
    r.beforeReload=(await state(page)).scrollY;
    await page.reload({waitUntil:'load'}); await page.waitForTimeout(1800);
    r.afterReload=(await state(page)).scrollY;
    // try a down-swipe after reload
    const a=(await state(page)).scrollY; for(let i=0;i<4;i++){await touchSwipe(cdp,200,720,200,250,20);await page.waitForTimeout(500);} r.postReloadSwipeDelta=(await state(page)).scrollY-a;
    r.postReloadCur=(await state(page)).cur;
    await page.screenshot({path:SHOT+`qa-nav-reload-${label}.png`});
  }catch(e){r.error=String(e);} finally{await browser.close();}
  return r;
}
(async()=>{
  const R={arrivals:[]};
  for(let i=0;i<3;i++){ R.arrivals.push(await arrivalTrial()); }
  R.stuckCount=R.arrivals.filter(a=>a.stuck).length;
  R.reload_deepCheck=await reloadTest(5000,'deep-check');
  R.reload_inApp=await reloadTest(1800,'in-app');
  R.reload_inTesti=await reloadTest(2641,'in-testi');
  console.log(JSON.stringify(R,null,1));
})();
