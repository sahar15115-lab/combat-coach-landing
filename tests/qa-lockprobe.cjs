const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function reachTesti(page, cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(480);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
  let path=[];
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){const b=await el.boundingBox(); path.push('tap-inphone'); await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});} else {path.push('swipe'); await touchSwipe(cdp,200,660,200,190,16);} await page.waitForTimeout(720);}
  return path;
}
async function overflowInfo(page){ return page.evaluate(()=>{ const b=getComputedStyle(document.body),h=getComputedStyle(document.documentElement); const fixedEls=[...document.querySelectorAll('body *')].filter(e=>{const s=getComputedStyle(e);return (s.position==='fixed'||s.position==='sticky')&&e.getBoundingClientRect().height>innerHeight*0.8;}).map(e=>e.className&&(''+e.className).slice(0,30)); return {bodyOverflow:b.overflow,bodyOverflowY:b.overflowY,htmlOverflow:h.overflow,htmlOverflowY:h.overflowY,bodyPos:b.position,scrollY:Math.round(scrollY),maxScroll:Math.round(document.documentElement.scrollHeight-innerHeight),bigFixed:fixedEls}; }); }
(async()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const R={logs};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    R.reachPath = await reachTesti(page,cdp);
    R.atTesti = await overflowInfo(page);
    // programmatic scrollBy
    const p1=await page.evaluate(()=>{const a=scrollY;window.scrollBy(0,500);return {before:Math.round(a),after:Math.round(scrollY)};}); await page.waitForTimeout(300);
    R.scrollBy500=p1;
    const p2=await page.evaluate(()=>{const a=scrollY;window.scrollTo(0,4000);return {before:Math.round(a),after:Math.round(scrollY)};}); await page.waitForTimeout(300);
    R.scrollTo4000=p2;
    // does a wheel move it?
    const wb=(await state(page)).scrollY; await page.mouse.wheel(0,800); await page.waitForTimeout(400); R.wheel={before:wb,after:(await state(page)).scrollY};
    // top-nav anchor click to #check (bypasses touch) — does the page navigate?
    await page.evaluate(()=>window.scrollTo(0,2641)); await page.waitForTimeout(300);
    const navBefore=(await state(page)).scrollY;
    const link = await page.$('header a[href="#check"], a[href="#check"]');
    if(link){ await link.click({force:true}).catch(()=>{}); await page.waitForTimeout(1200); }
    R.navToCheck={found:!!link,before:navBefore,after:(await state(page)).scrollY, cur:(await state(page)).cur};
    await page.screenshot({path:SHOT+'qa-nav-lockprobe.png'});
    // Is there a scroll listener snapping back? set scrollTop directly on scrollingElement and re-read after rAF
    R.forceScroll = await page.evaluate(async()=>{ document.scrollingElement.scrollTop=3500; await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return {set:3500,got:Math.round(document.scrollingElement.scrollTop)}; });
  }catch(e){ R.error=String(e&&e.stack||e); }
  finally{ await browser.close(); console.log(JSON.stringify(R,null,1)); }
})();
