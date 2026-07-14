// Pre-push correctness check (coding-assistant's ask): on a real phone GSAP is inline →
// always loads → the ai-mode/cta-hide/app-scene ScrollTriggers DO run on mobile.
// Verify (a) nothing throws referencing removed #scrollCue/.mpanel-app, (b) ai-mode
// doesn't get stuck / double-toggle: it should be ON while an AI community slide is in
// view and OFF once the form (#check) is reached.
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
const errs=[];
p.on('pageerror',e=>errs.push('pageerror: '+e.message));
p.on('console',m=>{ if(m.type()==='error' && !/Failed to load resource/i.test(m.text())) errs.push('console: '+m.text()); });
await p.goto('http://localhost:8137/',{waitUntil:'load'});
await p.waitForTimeout(1200);

// record ai-mode transitions across a full human-paced scroll
await p.evaluate(()=>{ window.__ai=[]; new MutationObserver(()=>{ const on=document.body.classList.contains('ai-mode'); const last=window.__ai[window.__ai.length-1]; if(last!==on) window.__ai.push(on); }).observe(document.body,{attributes:true,attributeFilter:['class']}); window.__ai.push(document.body.classList.contains('ai-mode')); });
const docH=await p.evaluate(()=>document.documentElement.scrollHeight);
for(let y=0;y<=docH;y+=200){ await p.evaluate(v=>window.scrollTo(0,v),y); await p.waitForTimeout(70); }
// land on the form
await p.evaluate(()=>{const c=document.getElementById('check'); if(c) c.scrollIntoView();});
await p.waitForTimeout(500);

const aiSeq=await p.evaluate(()=>window.__ai);
const aiAtForm=await p.evaluate(()=>document.body.classList.contains('ai-mode'));
await b.close();

const noThrows = errs.length===0;
const aiFired = aiSeq.includes(true);           // ai-mode turned on somewhere (AI slide)
const aiOffAtForm = aiAtForm===false;           // and is gold again at the form (conversion)
console.log('(a) no JS errors on GSAP mobile path :', noThrows?'✅':'❌', errs.length?errs:'');
console.log('(b) ai-mode fired at AI slide        :', aiFired?'✅':'❌');
console.log('(b) ai-mode OFF (gold) at the form   :', aiOffAtForm?'✅':'❌', ' seq='+JSON.stringify(aiSeq));
const ok = noThrows && aiFired && aiOffAtForm;
console.log('\nPre-push check:', ok?'✅ SAFE TO PUSH':'❌ needs a look');
process.exit(ok?0:1);
