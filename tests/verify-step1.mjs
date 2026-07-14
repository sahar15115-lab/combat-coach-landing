// Step 1 verification: mobile must initialize in ALL conditions —
// especially reduced-motion, which previously killed all mobile logic
// (it sat behind `if(reduce)return`). Tests the local file at 390x844.
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';

const FILE = pathToFileURL(path.resolve('combat-coach-landing.html')).href;

async function run(label, reducedMotion){
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:3,
    reducedMotion // 'reduce' | 'no-preference'
  });
  const page = await ctx.newPage();
  const errors = [];
  const failedUrls = [];
  page.on('pageerror', e => errors.push('pageerror: '+e.message));
  page.on('requestfailed', r => failedUrls.push(r.url()));
  // JS errors only (a missing font/analytics file is not a code fault)
  page.on('console', m => { if(m.type()==='error' && !/Failed to load resource/i.test(m.text())) errors.push('console.error: '+m.text()); });
  await page.goto(FILE, {waitUntil:'load'});
  await page.waitForTimeout(1200); // let rAF+setTimeout(initMobile) run

  const m = await page.evaluate(() => {
    const vh = innerHeight;
    const docH = document.documentElement.scrollHeight;
    const tcards = [...document.querySelectorAll('.trainx-mobile .tcard')];
    const tActive = tcards.filter(c=>c.classList.contains('active')).length;
    const appx = document.querySelector('.appx-mobile');
    const appPanels = appx ? [...appx.querySelectorAll('.mpanel')] : [];
    const appOn = appPanels.filter(p=>p.classList.contains('on')).length;
    const commx = document.querySelector('.commx-mobile');
    return {
      screens:+(docH/vh).toFixed(1), docH,
      tcards:tcards.length, tActive,
      appPinActive: appx ? appx.classList.contains('pin-active') : null,
      appPanels: appPanels.length, appOn,
      commPanels: commx ? commx.querySelectorAll('.mpanel').length : null,
      cueHidden: (()=>{ const c=document.getElementById('scrollCue'); return c? getComputedStyle(c).display==='none' : 'no-cue'; })()
    };
  });

  // confirm the community observer fires ai-mode. Only the last community panel is AI and it
  // sits next to #check, whose GSAP trigger (correctly) reverts ai-mode to gold at the form.
  // So capture the transient add with a MutationObserver during a fine scroll.
  await page.evaluate(() => {
    window.__aiEver = document.body.classList.contains('ai-mode');
    new MutationObserver(() => { if(document.body.classList.contains('ai-mode')) window.__aiEver = true; })
      .observe(document.body, {attributes:true, attributeFilter:['class']});
  });
  const steps = Math.ceil(m.docH / 200);
  for(let s=0; s<=steps; s++){ await page.evaluate(y => window.scrollTo(0,y), s*200); await page.waitForTimeout(60); }
  const aiSeen = await page.evaluate(()=>window.__aiEver);

  await browser.close();

  // core = the Step-1 regression proof: mobile inits at all. ai-mode is required specifically
  // in the reduce path (previously the whole mobile init was dead behind `if(reduce)return`).
  const core = m.tcards>0 && m.tActive===1 && m.appPinActive===true && m.appOn===1 && errors.length===0;
  const pass = core && (reducedMotion==='reduce' ? aiSeen : true);

  console.log(`\n[${label}]  ${pass?'✅ PASS':'❌ FAIL'}`);
  console.log('  screens:', m.screens, ' docH:', m.docH);
  console.log('  train tcards:', m.tcards, ' active:', m.tActive);
  console.log('  app pin-active:', m.appPinActive, ' panels:', m.appPanels, ' on:', m.appOn);
  console.log('  community panels:', m.commPanels, ' ai-mode after scroll:', aiSeen);
  console.log('  scrollCue hidden:', m.cueHidden);
  if(errors.length) console.log('  JS ERRORS:', errors);
  if(failedUrls.length) console.log('  (benign) failed loads:', [...new Set(failedUrls.map(u=>u.split('/').pop()))].join(', '));
  return pass;
}

const a = await run('motion: normal', 'no-preference');
const b = await run('motion: REDUCE (the old killer)', 'reduce');
console.log('\n=== Step 1 result:', (a&&b)?'✅ BOTH PASS — mobile inits regardless of reduced-motion':'❌ FAIL', '===');
process.exit(a&&b?0:1);
