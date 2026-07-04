import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:8137',{waitUntil:'load'}); await p.waitForTimeout(2000);
await p.screenshot({path:'tests/shots/hero-dualcta.png'});
// measure hierarchy: primary should be visually heavier (filled) vs secondary (ghost/transparent bg)
const pr = await p.evaluate(()=>{const e=document.querySelector('.cta-primary');const s=getComputedStyle(e);return {bg:s.backgroundImage.slice(0,20),text:e.textContent.trim()};});
const se = await p.evaluate(()=>{const e=document.querySelector('.cta-secondary');const s=getComputedStyle(e);return {bg:s.backgroundColor,border:s.borderColor.slice(0,20),text:e.textContent.trim()};});
console.log('primary:', JSON.stringify(pr));
console.log('secondary:', JSON.stringify(se));
await b.close();
