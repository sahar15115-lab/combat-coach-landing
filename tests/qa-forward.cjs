const pw = require('playwright');
const { URL, makeCtx, touchSwipe, state, clickCue } = require('./qa-nav-lib.cjs');
const SHOT = __dirname + '/shots/';

async function swipeDown(page, cdp, px=470){ await touchSwipe(cdp, 200, 660, 200, 660-px, 16); await page.waitForTimeout(480); }

// scroll+advance like a real user until `id` section is aligned to top (|top|<130)
async function reachSection(page, cdp, id, trace, tag) {
  for (let i=0;i<28;i++){
    const s = await state(page);
    if (Math.abs(s.rects[id]) < 130) { return s; }
    const locked = ['train','app','community'].find(x => Math.abs(s.rects[x]) < 130 && x!==id);
    // locked scene above target -> advance it via floating cue
    if (locked && s.rects[id] > 0) {
      const r = await clickCue(page);
      trace.push({ reach:id, i, action:'cue', cueResult:r, locked, on:(s.scenes['.'+locked+'x-mobile']||{}).on });
      await page.waitForTimeout(620);
    } else {
      trace.push({ reach:id, i, action:'swipe', scrollY:s.scrollY, targTop:s.rects[id] });
      await swipeDown(page, cdp);
    }
  }
  return await state(page);
}

async function advanceSceneToLast(page, sceneSel, trace) {
  const key = '.'+sceneSel+'-mobile';
  for (let k=0;k<6;k++){
    const s = await state(page);
    const sc = s.scenes[key]||{}; if (sc.on >= sc.n-1) return s;
    const r = await clickCue(page); trace.push({ advLast:sceneSel, on:sc.on, cueResult:r });
    await page.waitForTimeout(560);
  }
  return await state(page);
}

async function run(tag, w, h, entry) {
  const { browser, page, logs, cdp } = await makeCtx(pw, w, h);
  const trace = [];
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: SHOT+`qa-nav-${tag}-01hero.png` });

  // reach app scene
  await reachSection(page, cdp, 'app', trace, tag);
  let s = await state(page);
  const appEng = { at:'app-engaged', cur:s.cur, appTop:s.rects.app, on:(s.scenes['.appx-mobile']||{}).on, scrollY:s.scrollY, cta:/cta-hide/.test(s.bodyCls), appScene:/app-scene/.test(s.bodyCls) };
  await page.screenshot({ path: SHOT+`qa-nav-${tag}-03app.png` });

  // advance app to last slide
  await advanceSceneToLast(page, 'appx', trace);
  s = await state(page);
  const appLast = { at:'app-last', on:(s.scenes['.appx-mobile']||{}).on, appTop:s.rects.app };
  await page.screenshot({ path: SHOT+`qa-nav-${tag}-04applast.png` });

  // ENTRY into testi
  let entryInfo;
  if (entry === 'cue') {
    const r = await clickCue(page); await page.waitForTimeout(1100);
    entryInfo = { via:'floating-cue', cueResult:r };
  } else {
    const go = page.locator('.appx-mobile .mpanel.on .phone-cta[data-goto="#testi"]').first();
    const cnt = await go.count();
    if (cnt) await go.tap({timeout:4000}).catch(e=>entryInfo={tapErr:String(e)});
    await page.waitForTimeout(1100);
    entryInfo = Object.assign({ via:'in-phone-button', found:cnt }, entryInfo||{});
  }
  s = await state(page);
  const landed = { at:'AFTER-entry', via:entry, cur:s.cur, testiTop:s.rects.testi, communityTop:s.rects.community, scrollY:s.scrollY, lbOpen:s.lbOpen };
  await page.screenshot({ path: SHOT+`qa-nav-${tag}-05testi.png` });

  // testi -> community
  let comm=null;
  for (let i=0;i<10;i++){
    s = await state(page);
    if (Math.abs(s.rects.community) < 130 || s.pins.some(p=>p.includes('commx')) && s.rects.community<200 && s.rects.community>-200) break;
    await swipeDown(page, cdp);
  }
  s = await state(page);
  comm = { at:'testi->community', cur:s.cur, commTop:s.rects.community, cta:/cta-hide/.test(s.bodyCls), commOn:(s.scenes['.commx-mobile']||{}).on, scrollY:s.scrollY };
  await page.screenshot({ path: SHOT+`qa-nav-${tag}-06community.png` });

  await browser.close();
  return { tag, entry, appEng, appLast, entryInfo, landed, comm, logs };
}

(async () => {
  const out = {};
  out.A_cueEntry = await run('cueA', 390, 844, 'cue');
  out.B_phoneEntry = await run('phoneB', 390, 844, 'phone');
  console.log(JSON.stringify(out, null, 1));
})();
