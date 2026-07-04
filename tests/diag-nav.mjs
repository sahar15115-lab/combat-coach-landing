import { chromium } from 'playwright';
const b=await chromium.launch();
// desktop: nav crowding when scrolled
const pd=await (await b.newContext({viewport:{width:1280,height:820}})).newPage();
await pd.goto('http://localhost:8137',{waitUntil:'load'}); await pd.waitForTimeout(1500);
await pd.evaluate(()=>scrollTo(0,innerHeight*1.2)); await pd.waitForTimeout(500);
const navOverflow = await pd.evaluate(()=>{const n=document.querySelector('.nav .wrap');return n.scrollWidth-n.clientWidth;});
console.log('desktop nav horizontal overflow:', navOverflow, navOverflow<=2?'✓ fits':'✗ crowded');
await pd.screenshot({path:'tests/shots/nav-desktop.png'});
await pd.context().close();
// mobile: click each of the 3 mnext buttons advances
const pm=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await pm.goto('http://localhost:8137',{waitUntil:'load'}); await pm.waitForTimeout(1500);
const st=await pm.evaluate(()=>{const el=document.querySelector('.appx-mobile');const t=ScrollTrigger.getAll().find(x=>x.trigger===el);return {start:t.start,end:t.end,N:document.querySelectorAll('.appx-mobile .mpanel').length};});
for(let i=0;i<3;i++){
  await pm.evaluate(a=>scrollTo(0,a.start+((a.i+0.5)/a.N)*(a.end-a.start)),{...st,i}); await pm.waitForTimeout(700);
  const act=await pm.evaluate(()=>[...document.querySelectorAll('.appx-mobile .mpanel')].findIndex(m=>m.classList.contains('on')));
  try{ await pm.click(`.appx-mobile .mpanel:nth-child(${i+1}) .phone-cta`,{timeout:2500});}catch(e){console.log(`panel ${i} click err`);}
  await pm.waitForTimeout(900);
  const act2=await pm.evaluate(()=>[...document.querySelectorAll('.appx-mobile .mpanel')].findIndex(m=>m.classList.contains('on')));
  console.log(`panel ${i+1} button: ${act}→${act2}`, act2>act?'✓':'✗');
}
await b.close();
