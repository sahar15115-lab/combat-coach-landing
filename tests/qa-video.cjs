const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function inViewEl(page, sel){ const h=await page.evaluateHandle((s)=>{const els=[...document.querySelectorAll(s)];return els.find(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;})||null;},sel); return h.asElement(); }
async function reachTesti(page,cdp){
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(500);}
  for(let i=0;i<6;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await page.evaluate(()=>{const c=document.getElementById('scrollCue');const st=getComputedStyle(c);return st.opacity!=='0'&&st.pointerEvents!=='none';}); if(v)await page.locator('#scrollCue').click({force:true}); else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(800);}
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.testi)<120)break; const el=await inViewEl(page,'.appx-mobile .mpanel.on .phone-cta'); if(el){ await el.click({force:true}).catch(()=>{}); } else await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(1000);}
}
(async()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const R={logs};
  try{
    await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
    await reachTesti(page,cdp); await page.waitForTimeout(1500);
    // bring liam (.tst-video) into rail view
    let liam=await inViewEl(page,'.tst-card.tst-video');
    for(let i=0;i<10 && !liam;i++){ const y=await page.evaluate(()=>{const el=document.getElementById('tstRail');const b=el.getBoundingClientRect();return b.top+b.height/2;}); await touchSwipe(cdp,330,y,70,y,14); await page.waitForTimeout(280); liam=await inViewEl(page,'.tst-card.tst-video'); }
    R.liamFound=!!liam;
    if(liam){
      await liam.click({force:true}).catch(e=>R.clickErr=String(e));
      await page.waitForTimeout(1400);
      R.opened=await page.evaluate(()=>document.getElementById('tstLb').classList.contains('tst-on'));
      R.t1=await page.evaluate(()=>{const v=document.querySelector('#tstLb video');return v?{ct:+v.currentTime.toFixed(2),paused:v.paused,muted:v.muted,controls:v.controls,readyState:v.readyState}:null;});
      await page.waitForTimeout(1600);
      R.t2=await page.evaluate(()=>{const v=document.querySelector('#tstLb video');return v?+v.currentTime.toFixed(2):null;});
      R.videoAdvanced = R.t1 && R.t2!=null && R.t2>R.t1.ct;
      await page.screenshot({path:SHOT+'qa-nav-video-open.png'});
      // close via X and confirm cleared/paused
      await page.locator('#tstLbClose').click({force:true}).catch(()=>{}); await page.waitForTimeout(500);
      R.afterClose=await page.evaluate(()=>{const lb=document.getElementById('tstLb');return {open:lb.classList.contains('tst-on'),bodyHtml:document.getElementById('tstLbBody').innerHTML.length,anyPlayingVideo:[...document.querySelectorAll('video')].some(v=>!v.paused&&v.currentTime>0&&!v.muted)};});
      // reopen + close via Escape
      await liam.click({force:true}).catch(()=>{}); await page.waitForTimeout(1000); R.reopened=await page.evaluate(()=>document.getElementById('tstLb').classList.contains('tst-on'));
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      R.afterEsc=await page.evaluate(()=>!document.getElementById('tstLb').classList.contains('tst-on'));
    }
  }catch(e){R.error=String(e&&e.stack||e);} finally{await browser.close(); console.log(JSON.stringify(R,null,1));}
})();
