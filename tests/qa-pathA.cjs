const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT = __dirname + '/shots/';

async function cue(page){ return page.evaluate(()=>{const c=document.getElementById('scrollCue');const s=getComputedStyle(c);return{vis:s.opacity!=='0'&&s.pointerEvents!=='none',op:s.opacity,cta:/cta-hide/.test(document.body.className)};}); }
async function clickCueReal(page){ const v=await cue(page); if(v.vis){ await page.locator('#scrollCue').click({force:true}); return true;} return false; }

async function run(w,h){
  const { browser, page, logs, cdp } = await makeCtx(pw, w, h);
  const T = { vp:`${w}x${h}`, logs, steps:[] };
  await page.goto(URL,{waitUntil:'load'}); await page.waitForTimeout(1300);

  // 1) engage TRAIN by real swipes until train aligned & locked
  for(let i=0;i<10;i++){ const s=await state(page); if(Math.abs(s.rects.train)<120 && s.scrollY>50) break; await touchSwipe(cdp,200,660,200,190,16); await page.waitForTimeout(500); }
  let s=await state(page); T.steps.push({at:'train',trainTop:s.rects.train,scrollY:s.scrollY,cue:await cue(page)});

  // 2) advance TRAIN with real floating-cue clicks until app aligned (train has 4 panels -> ~4 clicks)
  for(let i=0;i<7;i++){ const st=await state(page); if(Math.abs(st.rects.app)<120){break;} const ok=await clickCueReal(page); T.steps.push({trainAdv:i,clicked:ok,trainOn:st.scenes['.trainx-mobile'].on,appTop:st.rects.app}); await page.waitForTimeout(750); }
  await page.waitForTimeout(900); // settle smooth-scroll + ScrollTrigger
  s=await state(page); const cA=await cue(page);
  T.steps.push({at:'APP-arrived',appTop:s.rects.app,appOn:s.scenes['.appx-mobile'].on,scrollY:s.scrollY,cue:cA,appScene:/app-scene/.test(s.bodyCls)});
  await page.screenshot({path:SHOT+`qa-nav-pathA-${w}x${h}-appArrive.png`});

  // 3) PATH A core: advance app with FLOATING CUE only, all the way to testi
  for(let i=0;i<6;i++){
    const st=await state(page);
    if(Math.abs(st.rects.testi)<120){break;}
    const v=await cue(page); const ok= v.vis? (await page.locator('#scrollCue').click({force:true}),true):false;
    T.steps.push({appAdv:i,cueVis:v.vis,cta:v.cta,appOn:st.scenes['.appx-mobile'].on,clicked:ok});
    await page.waitForTimeout(800);
  }
  s=await state(page);
  T.result={landedTesti:Math.abs(s.rects.testi)<120,testiTop:s.rects.testi,communityTop:s.rects.community,cur:s.cur,scrollY:s.scrollY};
  await page.screenshot({path:SHOT+`qa-nav-pathA-${w}x${h}-final.png`});
  await browser.close();
  return T;
}
(async()=>{
  const out={};
  out.a844=await run(390,844);
  out.a700=await run(390,700);
  console.log(JSON.stringify(out,null,1));
})();
