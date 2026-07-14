import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
await p.goto('http://localhost:8137/', {waitUntil:'load'});
await p.waitForTimeout(1000);
await p.evaluate(()=>document.getElementById('train').scrollIntoView());
await p.waitForTimeout(1000);
// force the warmup video to load + seek to a frame where the person is doing the move
await p.evaluate(async ()=>{
  const c=document.querySelector('.trainx-mobile .tcard[data-i="0"]');
  const v=c.querySelector('video');
  v.muted=true; v.setAttribute('playsinline','');
  // ensure source is active
  try{ v.load(); }catch(e){}
  await new Promise(r=>{ if(v.readyState>=1) r(); else v.addEventListener('loadedmetadata',r,{once:true}); setTimeout(r,2500); });
});
await p.waitForTimeout(800);
// grab 3 frames across the clip to locate the person
for(const t of [0.5, 1.5, 2.5]){
  await p.evaluate(async (tt)=>{
    const v=document.querySelector('.trainx-mobile .tcard[data-i="0"] video');
    v.currentTime=tt; await new Promise(r=>{ v.addEventListener('seeked',r,{once:true}); setTimeout(r,1200); });
  }, t);
  await p.waitForTimeout(500);
  await p.screenshot({path:`tests/shots/warmup-t${String(t).replace('.','_')}.png`});
}
console.log('warmup frames saved');
await b.close();
