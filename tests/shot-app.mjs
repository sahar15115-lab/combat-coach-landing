import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(1800);
const st = await p.evaluate(()=>{ const el=document.querySelector('.appx-mobile'); const t=ScrollTrigger.getAll().find(x=>x.trigger===el); return {start:t.start,end:t.end,N:document.querySelectorAll('.appx-mobile .mpanel').length}; });
// panel 1 (app home + "איך זה עובד?" in-phone button)
await p.evaluate(y=>scrollTo(0,y), Math.round(st.start+(0.5/st.N)*(st.end-st.start))); await p.waitForTimeout(900);
await p.screenshot({path:'tests/shots/app-panel1.png'});
await b.close(); console.log('shot saved');
