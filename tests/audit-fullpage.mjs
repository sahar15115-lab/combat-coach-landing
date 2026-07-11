import { chromium } from 'playwright';
const URL='http://localhost:8137/';
const b=await chromium.launch();
const m=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await m.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));
p.on('console',x=>{if(x.type()==='error'){const u=(x.location()&&x.location().url)||'';if(!u.includes('_vercel')&&!u.includes('fonts.g'))errs.push(x.text());}});
await p.goto(URL,{waitUntil:'load'});await p.waitForTimeout(1200);
async function toggleJump(sel){
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(150);
  await p.evaluate(s=>document.querySelector(s).scrollIntoView(),sel); await p.waitForTimeout(500);
  const sy0=await p.evaluate(()=>Math.round(scrollY));
  let mx=0;
  for(const h of [760,690,760,690,760]){ await p.setViewportSize({width:390,height:h}); await p.waitForTimeout(200);
    mx=Math.max(mx,Math.abs((await p.evaluate(()=>Math.round(scrollY)))-sy0)); }
  return mx;
}
const areas=['#train','#app','#testi','#community'];
console.log('=== viewport-toggle jump per area (address-bar sim) ===');
let worst=0;
for(const a of areas){ const j=await toggleJump(a); worst=Math.max(worst,j); console.log('  '+a+': '+j+'px '+(j>40?'⚠️ JUMP':'✓')); }
console.log('  WORST: '+worst+'px => '+(worst>40?'UNSTABLE':'STABLE ✅'));
console.log('=== console/JS errors: '+(errs.length?errs.slice(0,3).join(' | '):'none')+' ===');
await b.close();
