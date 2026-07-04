import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(1500);
// Fix 4: cue centered — its center x should be ~ viewport center (195)
await p.evaluate(()=>{document.body.classList.add('cta-hide');});
const cueC = await p.evaluate(()=>{const e=document.querySelector('.scroll-cue');const r=e.getBoundingClientRect();return Math.round(r.left+r.width/2);});
console.log('cue center X:', cueC, '(viewport center=195)', Math.abs(cueC-195)<8?'✓ centered':'✗ off');
// Fix 3: nav has both CTAs
console.log('nav CTAs:', await p.locator('.nav .cta-primary').count(), 'primary +', await p.locator('.nav .cta-secondary').count(), 'secondary');
// Fix 2: community dwell param applied (check by counting comm pin + endPct via trigger range)
const comm = await p.evaluate(()=>{const el=document.querySelector('.commx-mobile');const t=ScrollTrigger.getAll().find(x=>x.trigger===el);return t?Math.round((t.end-t.start)/innerHeight*100)/100:null;});
console.log('community scroll length:', comm, 'screens (was ~5.6, now longer)');
await b.close();
