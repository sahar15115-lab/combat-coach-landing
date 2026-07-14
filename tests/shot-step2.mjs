import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:8137/', {waitUntil:'load'});
await p.waitForTimeout(1200);
await p.evaluate(()=>document.getElementById('app').scrollIntoView());
await p.waitForTimeout(1500); // let lazy images hydrate + active anim
await p.screenshot({path:'tests/shots/step2-app-card1.png'});
// swipe to card 2
await p.evaluate(()=>{const r=document.getElementById('appRail');const c=r.querySelectorAll('.acard')[1];c.scrollIntoView({inline:'center'});});
await p.waitForTimeout(1200);
await p.screenshot({path:'tests/shots/step2-app-card2.png'});
await b.close();
console.log('shots saved');
