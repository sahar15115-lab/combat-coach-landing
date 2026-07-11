import { chromium } from 'playwright';
const S='C:/Users/sahar/AppData/Local/Temp/claude/C--Users-sahar-OneDrive-Desktop-----------------/0f925eef-3e49-4e83-8748-84e9be7eb4c0/scratchpad/proto';
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const p=await c.newPage();
await p.goto('http://localhost:8137/',{waitUntil:'load'});await p.waitForTimeout(1300);
// app
await p.evaluate(()=>document.getElementById('app').scrollIntoView());await p.waitForTimeout(800);
await p.screenshot({path:S+'/audit-app.png'});
// community — scroll through each stacked panel
const n=await p.evaluate(()=>document.querySelectorAll('.commx-mobile .mpanel').length);
console.log('community panels:',n);
for(let i=0;i<n;i++){
  await p.evaluate((i)=>document.querySelectorAll('.commx-mobile .mpanel')[i].scrollIntoView({block:'start'}),i);
  await p.waitForTimeout(700);
  const info=await p.evaluate((i)=>{const el=document.querySelectorAll('.commx-mobile .mpanel')[i];const r=el.getBoundingClientRect();return {h:Math.round(r.height),clipped:el.scrollHeight>Math.round(r.height)+4,sh:el.scrollHeight};},i);
  console.log('  panel',i,JSON.stringify(info));
  await p.screenshot({path:S+'/audit-comm-'+i+'.png'});
}
await b.close();console.log('done');
