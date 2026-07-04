import { chromium } from 'playwright';
const b=await chromium.launch();
// SHORT viewport like an in-app browser
const p=await (await b.newContext({viewport:{width:390,height:700},isMobile:true})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(1500);
const st=await p.evaluate(()=>{const el=document.querySelector('.appx-mobile');const t=ScrollTrigger.getAll().find(x=>x.trigger===el);return {start:t.start,end:t.end,N:document.querySelectorAll('.appx-mobile .mpanel').length};});
let worst=-999;
for(let i=0;i<st.N;i++){
  await p.evaluate(a=>scrollTo(0,a.start+((a.i+0.5)/a.N)*(a.end-a.start)),{...st,i}); await p.waitForTimeout(650);
  const m=await p.evaluate(()=>{const nav=document.querySelector('#nav').getBoundingClientRect();const ph=document.querySelector('.appx-mobile .mpanel.on .phone').getBoundingClientRect();return Math.round(nav.bottom-ph.top);});
  console.log(`panel ${i+1}: nav covers phone by ${m}px`, m>4?'❌':'✓');
  worst=Math.max(worst,m);
}
console.log('WORST overlap:', worst, worst<=4?'✓ נקי בכל הפאנלים':'❌ עדיין מכסה');
// nav height + both CTAs fit
const nav=await p.evaluate(()=>{const n=document.querySelector('#nav .wrap');return {h:Math.round(n.getBoundingClientRect().height),overflow:n.scrollWidth-n.clientWidth,ctas:document.querySelectorAll('#nav .cta-primary, #nav .cta-secondary').length};});
console.log('nav height:', nav.h+'px | overflow:', nav.overflow, '| CTAs:', nav.ctas);
await p.screenshot({path:'tests/shots/app-fit-short.png'});
await b.close();
