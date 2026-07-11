// Shared QA helpers for scroll/nav audit. CommonJS.
const URL = process.env.QA_URL || 'https://combat-coach-landing.vercel.app';

async function makeCtx(pw, w, h) {
  const browser = await pw.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  });
  const page = await context.newPage();
  const logs = [];
  page.on('console', m => { if (m.type()==='error'||m.type()==='warning') logs.push('CONSOLE.'+m.type()+': '+m.text()); });
  page.on('pageerror', e => logs.push('PAGEERROR: '+(e && e.message)));
  page.on('requestfailed', r => { const u=r.url(); if(!/vercel|tally|speed-insights|analytics/.test(u)) logs.push('REQFAIL: '+r.method()+' '+u+' '+(r.failure()&&r.failure().errorText)); });
  const cdp = await context.newCDPSession(page);
  return { browser, context, page, logs, cdp };
}

async function touchSwipe(cdp, x1, y1, x2, y2, steps=12, holdMs=0) {
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:x1,y:y1}] });
  for (let i=1;i<=steps;i++){
    const x=x1+(x2-x1)*i/steps, y=y1+(y2-y1)*i/steps;
    await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x,y}] });
    await new Promise(r=>setTimeout(r,8));
  }
  if(holdMs) await new Promise(r=>setTimeout(r,holdMs));
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
}

async function state(page) {
  return await page.evaluate(() => {
    const ids = ['train','app','testi','community','fit','check','faq'];
    const rects = {};
    ids.forEach(id => { const el=document.getElementById(id); rects[id]= el? Math.round(el.getBoundingClientRect().top) : null; });
    // nearest section to viewport top
    let cur=null, best=1e9;
    ids.forEach(id=>{ const t=rects[id]; if(t!=null && Math.abs(t)<best){best=Math.abs(t); cur=id;} });
    const pins = [...document.querySelectorAll('.pin-active')].map(e=>e.className.split(' ').find(c=>c.endsWith('-mobile')||c.endsWith('-pin'))||e.className.slice(0,20));
    // which mpanel .on inside each scene
    const scenes={};
    ['.trainx-mobile','.appx-mobile','.commx-mobile'].forEach(sel=>{
      const w=document.querySelector(sel); if(!w) return;
      const ps=[...w.querySelectorAll('.mpanel')]; const on=ps.findIndex(p=>p.classList.contains('on'));
      scenes[sel]={n:ps.length,on};
    });
    const lb=document.getElementById('tstLb');
    return {
      scrollY: Math.round(window.scrollY), innerH: window.innerHeight,
      docH: document.documentElement.scrollHeight,
      rects, cur,
      bodyCls: document.body.className,
      pins, scenes,
      lbOpen: lb? lb.classList.contains('tst-on') : null,
      lbHasVideo: lb? !!lb.querySelector('video') : null,
      cueVisible: (()=>{const c=document.getElementById('scrollCue'); if(!c)return null; const s=getComputedStyle(c); return s.opacity!=='0' && s.pointerEvents!=='none';})(),
    };
  });
}

// try to advance the active mobile scene by clicking the floating cue if visible & enabled
async function clickCue(page){
  return await page.evaluate(()=>{ const c=document.getElementById('scrollCue'); if(!c) return 'no-cue'; const s=getComputedStyle(c); if(s.opacity==='0'||s.pointerEvents==='none') return 'hidden'; c.click(); return 'clicked'; });
}

module.exports = { URL, makeCtx, touchSwipe, state, clickCue };
