const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function snap(page){ return page.evaluate(()=>{ const g=id=>{const e=document.getElementById(id);return e?Math.round(e.getBoundingClientRect().top):null;}; const c=document.getElementById('scrollCue');const cs=getComputedStyle(c); return {sy:Math.round(scrollY),testi:g('testi'),comm:g('community'),check:g('check'),app:g('app'),cueVis:cs.opacity!=='0'&&cs.pointerEvents!=='none',cta:/cta-hide/.test(document.body.className)}; }); }
// touch-scroll test: 4 swipes, return net scrollY delta
async function touchScrollDelta(page,cdp){ const a=(await state(page)).scrollY; for(let i=0;i<4;i++){ await touchSwipe(cdp,200,720,200,250,20); await page.waitForTimeout(500);} return (await state(page)).scrollY-a; }

async function deepLink(hash){
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const o={hash,logs};
  try{
    await page.goto(URL+hash,{waitUntil:'load'}); await page.waitForTimeout(2000);
    o.landed=await snap(page);
    o.touchDelta=await touchScrollDelta(page,cdp);
    o.afterTouch=await snap(page);
    await page.screenshot({path:SHOT+`qa-nav-deeplink-${hash.replace('#','')}.png`});
  }catch(e){o.error=String(e);} finally{await browser.close();}
  return o;
}
async function appFlowThenEscape(){
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const o={logs,scenario:'app-flow-to-testi-then-menu'};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    // reach testi via app flow
    for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(480);}
    for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
    for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){const b=await el.boundingBox(); await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});} else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(720);}
    await page.waitForTimeout(2000);
    o.atTesti=await snap(page);
    o.touchDeltaAtTesti=await touchScrollDelta(page,cdp);  // expect ~0 (locked)
    // ESCAPE via top menu: open menu, click a nav link (e.g. #community / הקהילה, or any)
    // find nav links
    o.navLinks=await page.evaluate(()=>[...document.querySelectorAll('header a[href^="#"], nav a[href^="#"], .nav a[href^="#"]')].map(a=>a.getAttribute('href')));
    // try clicking a link to #community
    const link=await page.$('a[href="#community"]')||await page.$('a[href="#check"]');
    if(link){ await link.click({force:true}); await page.waitForTimeout(1500); }
    o.afterMenu=await snap(page);
    o.touchDeltaAfterMenu=await touchScrollDelta(page,cdp);
    await page.screenshot({path:SHOT+'qa-nav-appflow-escape.png'});
  }catch(e){o.error=String(e&&e.stack||e);} finally{await browser.close();}
  return o;
}
(async()=>{
  const R={};
  R.deep_testi=await deepLink('#testi');
  R.deep_community=await deepLink('#community');
  R.deep_check=await deepLink('#check');
  R.appFlow=await appFlowThenEscape();
  console.log(JSON.stringify(R,null,1));
})();
