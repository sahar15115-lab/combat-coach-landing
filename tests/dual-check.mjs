import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(1800);
console.log('primary CTA:', (await p.locator('.cta-primary').textContent()).trim(), '→', await p.locator('.cta-primary').getAttribute('data-tally-form'));
console.log('secondary CTA:', (await p.locator('.cta-secondary').textContent()).trim(), '→', await p.locator('.cta-secondary').getAttribute('data-tally-form'));
console.log('in-phone buttons (.phone-cta):', await p.locator('.appx-mobile .phone-cta').count(), '(expect 4)');
console.log('old external axbtn gone from mobile app:', await p.locator('.appx-mobile > .mpanel > .axbtn').count()===0);
console.log('mnext still wired inside phone:', await p.locator('.appx-mobile .phone-cta[data-mnext]').count());
// scroll into app scene, check cue hidden
const appTop = await p.evaluate(()=>document.querySelector('#app').getBoundingClientRect().top+scrollY);
await p.evaluate(y=>scrollTo(0,y+400), appTop); await p.waitForTimeout(700);
console.log('app-scene class active:', await p.evaluate(()=>document.body.classList.contains('app-scene')));
console.log('cue hidden in app scene (opacity):', await p.evaluate(()=>getComputedStyle(document.getElementById('scrollCue')).opacity));
console.log('js errors:', errs.length?errs:'NONE');
await b.close();
