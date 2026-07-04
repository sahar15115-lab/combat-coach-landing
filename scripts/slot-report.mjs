// דוח תזמון קבוצות: קורא תשובות מ-Tally ומקבץ סלוט × קבוצת-גיל.
// שימוש:  TALLY_KEY=xxx node scripts/slot-report.mjs
// המפתח נקרא מ-env בלבד — לעולם לא נשמר בקוד.
const KEY = process.env.TALLY_KEY;
if (!KEY) { console.error('חסר TALLY_KEY בסביבה'); process.exit(1); }
const FORM = '44pM9o';
const H = { Authorization: `Bearer ${KEY}` };

// שולף את כל התשובות (עם pagination)
async function allSubs() {
  let page = 1, out = [], questions = null;
  for (;;) {
    const r = await fetch(`https://api.tally.so/forms/${FORM}/submissions?page=${page}&limit=100`, { headers: H });
    if (!r.ok) throw new Error(`submissions ${r.status}`);
    const d = await r.json();
    questions ||= d.questions || [];
    out.push(...(d.submissions || []).filter(s => s.isCompleted));
    if (!d.hasMore) break; page++;
  }
  return { subs: out, questions };
}

const bucket = (age) => age == null ? 'לא ידוע' : age <= 17 ? '14-17' : age <= 24 ? '18-24' : '25+';

// ממיר answer של שאלה ל-list טקסטים (מטפל ב-checkbox שהם מזהי-אפשרויות)
function answerTexts(q, ans) {
  if (ans == null) return [];
  const opts = q?.options || q?.calculatedOptions || [];
  const idToText = Object.fromEntries(opts.map(o => [o.id, o.text]));
  const arr = Array.isArray(ans) ? ans : [ans];
  return arr.map(v => idToText[v] ?? (typeof v === 'string' ? v : JSON.stringify(v)));
}

const { subs, questions } = await allSubs();
const qById = Object.fromEntries(questions.map(q => [q.id, q]));
const ageQ = questions.find(q => /^גיל/.test(q.title || ''));
const slotQ = questions.find(q => /ימים ושעות|אימון קבוצתי/.test(q.title || ''));

console.log(`\n📊 דוח תזמון קבוצות — ${subs.length} נרשמים שהשלימו את השאלון\n`);
if (!slotQ) { console.log('⚠️ שדה הסלוטים עדיין לא נענה ע"י אף נרשם (יתמלא כשיגיעו לידים אמיתיים).'); }

const SLOTS = ['ראשון 19:30', 'שלישי 19:30', 'שישי 12:00', 'שני 10:00-12:00', 'רביעי 10:00-12:00'];
const GROUPS = ['14-17', '18-24', '25+'];
const matrix = {}; SLOTS.forEach(s => matrix[s] = { '14-17': 0, '18-24': 0, '25+': 0, 'לא ידוע': 0 });

for (const s of subs) {
  const byQ = Object.fromEntries((s.responses || []).map(r => [r.questionId, r.answer]));
  const age = ageQ ? Number(byQ[ageQ.id]) : null;
  const grp = bucket(Number.isFinite(age) ? age : null);
  const chosen = slotQ ? answerTexts(qById[slotQ.id], byQ[slotQ.id]) : [];
  for (const slot of SLOTS) {
    if (chosen.some(c => c.includes(slot.split(' ')[0]) && c.includes(slot.split(' ')[1] || ''))) matrix[slot][grp]++;
  }
}

// טבלה
const pad = (s, n) => (s + '').padEnd(n);
console.log(pad('סלוט', 22) + GROUPS.map(g => pad(g, 8)).join(''));
console.log('─'.repeat(46));
for (const slot of SLOTS) {
  const teens = matrix[slot]['14-17'];
  const morning = /10:00/.test(slot);
  const flag = morning && teens > 0 ? '  ⚠️ נוער בבוקר?' : '';
  console.log(pad(slot, 22) + GROUPS.map(g => pad(matrix[slot][g], 8)).join('') + flag);
}
console.log('\nהמלצה: קבוצת 14-17 → הסלוט עם הכי הרבה נוער (ערב/שישי). קבוצת 18-24 → סלוט הבוקר עם הכי הרבה מבוגרים.\n');
