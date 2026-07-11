const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT=__dirname+'/shots/';
async function cue(page){ return page.evaluate(()=>{const c=document.getElementById('scrollCue');const s=getComputedStyle(c);return{vis:s.opacity!=='0'&&s.pointerEvents!=='none',op:s.opacity,cta:/cta-hide/.test(document.body.className)};}); }
(async()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw,390,844);
  const T={logs,steps:[]};
  await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);
  // engage train
  for(let i=0;i<10;i++){const s=await state(page); if(Math.abs(s.rects.train)<120&&s.scrollY>50)break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(500);}
  // finish train via floating cue -> land on app (stuck state)
  for(let i=0;i<7;i++){const s=await state(page); if(Math.abs(s.rects.app)<120)break; const v=await cue(page); if(v.vis) await page.locator('#scrollCue').click({force:true}); await page.waitForTimeout(750);}
  await page.waitForTimeout(1000);
  T.steps.push({at:'app-stuck',cue:await cue(page),appOn:(await state(page)).scenes['.appx-mobile'].on});

  // RECOVERY 1: tap the in-phone data-mnext button once
  const mnext=page.locator('.appx-mobile .mpanel.on .phone-cta[data-mnext]').first();
  const found=await mnext.count();
  if(found) await mnext.tap().catch(()=>{});
  await page.waitForTimeout(800);
  T.steps.push({at:'after-inphone-tap',found,cue:await cue(page),appOn:(await state(page)).scenes['.appx-mobile'].on});
  await page.screenshot({path:SHOT+'qa-nav-recover-afterInphone.png'});

  // RECOVERY 2: does the floating cue work now for the rest?
  for(let i=0;i<4;i++){
    const s=await state(page); if(Math.abs(s.rects.testi)<120)break;
    const v=await cue(page); const ok= v.vis?(await page.locator('#scrollCue').click({force:true}),true):false;
    T.steps.push({cueAdvance:i,cueVis:v.vis,appOn:s.scenes['.appx-mobile'].on,clicked:ok});
    await page.waitForTimeout(800);
  }
  const s=await state(page);
  T.result={reachedTesti:Math.abs(s.rects.testi)<120,testiTop:s.rects.testi,cur:s.cur};
  await browser.close();
  console.log(JSON.stringify(T,null,1));
})();
