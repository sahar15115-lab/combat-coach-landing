// R-21 surgery: (1) move the two GSAP <script> blocks from <head> to just before the
// main script; (2) wrap everything below the hero init in initBelowTheFold(), scheduled
// one frame after first paint. Aborts loudly if any anchor is not where expected.
import fs from 'fs';
const F = 'combat-coach-landing.html';
const src = fs.readFileSync(F, 'utf8');
const lines = src.split('\n');
const die = (m) => { console.error('ABORT:', m); process.exit(1); };

// ---- locate GSAP blocks (head) ----
const gsapStart = lines.findIndex((l, i) => l.trim() === '<script>' && (lines[i + 2] || '').includes('GSAP 3.12.5'));
if (gsapStart < 0) die('GSAP start not found');
let stEnd = -1, opens = 0, idx = gsapStart;
// two consecutive blocks: find the second </script> from gsapStart
let closes = 0;
for (let i = gsapStart; i < lines.length; i++) {
  if (lines[i].trim() === '</script>') { closes++; if (closes === 2) { stEnd = i; break; } }
}
if (stEnd < 0) die('ScrollTrigger end not found');
if (!lines.slice(gsapStart, stEnd).join('\n').includes('ScrollTrigger 3.12.5')) die('ScrollTrigger block not inside range');
if (stEnd - gsapStart > 40) die('GSAP range suspiciously large: ' + (gsapStart + 1) + '-' + (stEnd + 1));

const gsapBlock = lines.slice(gsapStart, stEnd + 1);

// ---- locate main script ----
const mainOpen = lines.findIndex((l, i) => l.trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes("getElementById('nav')"));
if (mainOpen < 0) die('main script not found');
if (mainOpen < stEnd) die('main script before GSAP?');

// ---- split point: after the hero parallax line ----
const heroPar = lines.findIndex((l, i) => i > mainOpen && l.includes(".hero-bg .ph-media'") && l.includes('yPercent:12'));
if (heroPar < 0) die('hero parallax anchor not found');

// ---- main IIFE end: first column-0 "})();"" followed by </script>, after mainOpen ----
let mainEnd = -1;
for (let i = heroPar; i < lines.length; i++) {
  if (lines[i] === '})();' && (lines[i + 1] || '').trim() === '</script>') { mainEnd = i; break; }
}
if (mainEnd < 0) die('main IIFE end not found');

// ---- perform edits (bottom-up so indices stay valid) ----
// 1) wrap deferred section
lines.splice(mainEnd, 0,
  '  }',
  "  // R-21: מריצים את אתחול הסצנות פריים אחד אחרי הציור הראשון — הדף מגיב מיד ללחיצות.",
  '  requestAnimationFrame(function(){ setTimeout(initBelowTheFold,0); });'
);
lines.splice(heroPar + 1, 0,
  '',
  '  // R-21: כל מה שמתחת למסך הראשון (סצנות/טריגרים/דמו) מאותחל אחרי הציור הראשון.',
  '  function initBelowTheFold(){'
);

// 2) move GSAP blocks: insert before main <script>, then remove from head
const mainOpenNow = lines.findIndex((l, i) => l.trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes("getElementById('nav')"));
lines.splice(mainOpenNow, 0, '<!-- R-21: GSAP הועבר מה-head לכאן — הדף מצטייר לפני שמנוע האנימציות נטען -->', ...gsapBlock);
lines.splice(gsapStart, gsapBlock.length); // remove original (indices above insertion point unaffected? insertion was AFTER gsapStart, so original still at gsapStart)

fs.writeFileSync(F, lines.join('\n'));
console.log('OK: GSAP moved (lines', gsapStart + 1, '-', stEnd + 1, '→ before main script), deferred wrapper installed.');
