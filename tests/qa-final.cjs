const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function snap(page){ return page.evaluate(()=>{ const g=id=>{const e=document.getElementById(id);return e?Math.round(e.getBoundingClientRect().top):null;}; return {sy:Math.round(scrollY),testi:g('testi'),comm:g('community'),check:g('check')}; }); }
// dispatch a REAL cancelable touchmove sequence and detect if page.blockScroll prevented it
async function probeLocked(page,x,y){
  return page.evaluate(({x,y})=>{
    const el=document.elementFromPoint(x,y)||document.body;
    const mk=(type,cy)=>{ const t=new Touch({identifier:1,target:el,clientX:x,clientY:cy}); return new TouchEvent(type,{cancelable:true,bubbles:true,touches:type==='touchend'?[]:[t],targetTouches:type==='touchend'?[]:[t],changedTouches:[t]}); };
    el.dispatchEvent(mk('touchstart',y));
    const move=mk('touchmove',y-60);
    el.dispatchEvent(move);
    el.dispatchEvent(mk('touchend',y-60));
    return {targetTag:el.tagName+'.'+((''+el.className).slice(0,20)), movePrevented:move.defaultPrevented};
  },{x,y});
}
async function reachTestiSlow(page,cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(500);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(800);}
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){ await el.click({force:true}).catch(()=>{}); } else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(1100);}
}
async function run(w,h){
  const { browser, page, logs, cdp } = await makeCtx(pw,w,h);
  const o={vp:`${w}x${h}`,logs};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    await reachTestiSlow(page,cdp);
    await page.waitForTimeout(2500);
    o.atTesti=await snap(page);
    o.lockedProbe=await probeLocked(page,195,Math.round(h*0.82));
    // touch scroll DOWN delta
    const d0=(await state(page)).scrollY; for(let i=0;i<4;i++){await touchSwipe(cdp,200,Math.round(h*0.85),200,Math.round(h*0.28),20);await page.waitForTimeout(500);} o.touchDown=(await state(page)).scrollY-d0;
    // touch scroll UP delta
    const u0=(await state(page)).scrollY; for(let i=0;i<4;i++){await touchSwipe(cdp,200,Math.round(h*0.28),200,Math.round(h*0.85),20);await page.waitForTimeout(500);} o.touchUp=(await state(page)).scrollY-u0;
    // wait 5s to see if lock self-clears, then retry
    await page.waitForTimeout(5000);
    const w0=(await state(page)).scrollY; for(let i=0;i<3;i++){await touchSwipe(cdp,200,Math.round(h*0.85),200,Math.round(h*0.28),20);await page.waitForTimeout(500);} o.touchAfter5s=(await state(page)).scrollY-w0;
    await page.screenshot({path:SHOT+`qa-nav-final-${w}x${h}.png`});
  }catch(e){o.error=String(e&&e.stack||e);} finally{await browser.close();}
  return o;
}
(async()=>{
  const R={};
  R.r844=await run(390,844);
  R.r700=await run(390,700);
  console.log(JSON.stringify(R,null,1));
})();
