const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state } = require('./qa-nav-lib.cjs');
const SHOT = __dirname + '/shots/';

async function cueInfo(page){
  return await page.evaluate(()=>{
    const c=document.getElementById('scrollCue'); const s=getComputedStyle(c);
    return { opacity:s.opacity, pe:s.pointerEvents, cta:/cta-hide/.test(document.body.className), appScene:/app-scene/.test(document.body.className),
      trainTop:Math.round(document.getElementById('train').getBoundingClientRect().top),
      appTop:Math.round(document.getElementById('app').getBoundingClientRect().top) };
  });
}
// universal on-screen advance: prefer floating cue if visible, else in-phone button, else swipe
async function realAdvance(page, cdp, prefer){
  const cueVis = await page.evaluate(()=>{const c=document.getElementById('scrollCue');const s=getComputedStyle(c);return s.opacity!=='0'&&s.pointerEvents!=='none';});
  if (prefer==='cue' && cueVis){ await page.locator('#scrollCue').click(); return 'cue'; }
  // in-phone visible button on the active panel
  const goto = page.locator('.mpanel.on .phone-cta[data-goto], .appx-desktop .ax [data-goto]');
  const mnext = page.locator('.mpanel.on .phone-cta[data-mnext]');
  if (await goto.count() && await goto.first().isVisible()) { await goto.first().tap().catch(()=>{}); return 'goto-btn'; }
  if (await mnext.count() && await mnext.first().isVisible()) { await mnext.first().tap().catch(()=>{}); return 'mnext-btn'; }
  if (cueVis){ await page.locator('#scrollCue').click(); return 'cue'; }
  await touchSwipe(cdp, 200, 660, 200, 190, 16); return 'swipe';
}

(async ()=>{
  const { browser, page, logs, cdp } = await makeCtx(pw, 390, 844);
  const rep = { logs, walk: [], appCueProbe: [] };
  await page.goto(URL, { waitUntil:'load' }); await page.waitForTimeout(1300);

  // Walk down to the APP scene using the FLOATING CUE where possible (real user).
  for (let i=0;i<14;i++){
    const s = await state(page);
    if (Math.abs(s.rects.app) < 130) break;               // app aligned to top
    const act = await realAdvance(page, cdp, 'cue');
    rep.walk.push({ i, act, cur:s.cur, appTop:s.rects.app });
    await page.waitForTimeout(650);
  }
  // We are on app slide 0. Probe the floating cue STABILITY for 2.5s.
  for (let k=0;k<5;k++){ rep.appCueProbe.push(await cueInfo(page)); await page.waitForTimeout(500); }
  await page.screenshot({ path: SHOT+'qa-nav-appcue-slide0.png' });

  // Try to advance the app scene with the FLOATING CUE only (PATH A feasibility).
  let advancedByCue = 0;
  for (let k=0;k<4;k++){
    const before = (await state(page)).scenes['.appx-mobile'].on;
    const vis = await page.evaluate(()=>{const c=document.getElementById('scrollCue');const s=getComputedStyle(c);return s.opacity!=='0'&&s.pointerEvents!=='none';});
    if (vis){ await page.locator('#scrollCue').click(); }
    await page.waitForTimeout(600);
    const after = (await state(page)).scenes['.appx-mobile'].on;
    rep.walk.push({ probeCueAdvance:k, cueVisible:vis, on_before:before, on_after:after });
    if (after>before) advancedByCue++;
    if (after>=3) break;
  }
  rep.cueCanAdvanceApp = advancedByCue>0;

  // Now finish reaching testi via WHATEVER works (in-phone buttons), to confirm the scene is navigable.
  for (let i=0;i<8;i++){
    const s = await state(page);
    if (Math.abs(s.rects.testi) < 130) break;
    await realAdvance(page, cdp, 'auto');
    await page.waitForTimeout(700);
  }
  const s2 = await state(page);
  rep.reachedTesti = { testiTop:s2.rects.testi, cur:s2.cur, scrollY:s2.scrollY };
  await page.screenshot({ path: SHOT+'qa-nav-appcue-testi.png' });

  await browser.close();
  console.log(JSON.stringify(rep, null, 1));
})();
