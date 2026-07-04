import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(1500);
// scroll into app scene
const st=await p.evaluate(()=>{const el=document.querySelector('.appx-mobile');const t=ScrollTrigger.getAll().find(x=>x.trigger===el);return {start:t.start,end:t.end,N:document.querySelectorAll('.appx-mobile .mpanel').length};});
await p.evaluate(a=>scrollTo(0,a.start+(0.5/a.N)*(a.end-a.start)),st); await p.waitForTimeout(600);
const m=await p.evaluate(()=>{
  const nav=document.querySelector('#nav'); const navR=nav.getBoundingClientRect();
  const navVisible=getComputedStyle(nav).opacity;
  const phone=document.querySelector('.appx-mobile .mpanel.on .phone'); const phR=phone.getBoundingClientRect();
  return { navBottom:Math.round(navR.bottom), navOpacity:navVisible, phoneTop:Math.round(phR.top), phoneH:Math.round(phR.height),
    overlap: Math.round(navR.bottom - phR.top) };
});
console.log('nav bottom:', m.navBottom, '| nav opacity:', m.navOpacity, '| phone top:', m.phoneTop, '| phone height:', m.phoneH);
console.log('OVERLAP (nav covers phone by):', m.overlap, 'px', m.overlap>0?'❌ מכסה':'✓ נקי');
// pacing: app vs community scroll length
const app=await p.evaluate(()=>{const el=document.querySelector('.appx-mobile');const t=ScrollTrigger.getAll().find(x=>x.trigger===el);return Math.round((t.end-t.start)/innerHeight*100)/100;});
const comm=await p.evaluate(()=>{const el=document.querySelector('.commx-mobile');const t=ScrollTrigger.getAll().find(x=>x.trigger===el);return Math.round((t.end-t.start)/innerHeight*100)/100;});
console.log('app scroll length:', app, 'screens (4 screens) | community:', comm, 'screens (8 slides)');
await b.close();
