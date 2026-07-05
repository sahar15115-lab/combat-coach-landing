# Ledger — צינור לידים: דף נחיתה ↔ Tally ↔ CRM (רעיונות 1+2 של סהר)

> Source of truth לפרויקט חוצה-מערכות. קרא לפני כל צעד, עדכן אחרי כל commit/פעולה.
> מנוהל ע"י עוזר המתכנת (coding-assistant protocol). התחלה: 2026-07-03.

## מפת המערכת (מאומת מהקוד — לא ניחוש)

| רכיב | מיקום | תפקיד |
|---|---|---|
| דף נחיתה | `Desktop\דף נחיתה` → Vercel `combat-coach-landing` (GitHub auto-deploy) | שיווק. יש בו שאלון פנימי ב-#check (יוחלף ב-Tally) |
| שאלון אמיתי | **Tally `44pM9o`** — "שאלון אפיון מהיר - Sahar Fitness", 20 עמודים | האינטייק. שדה גיל (גיל) כבר קיים; **אין** שדה זמינות/סלוטים |
| Webhook | `Projects\combat-coach-app\supabase\functions\jotform-webhook` (מטפל גם ב-Tally, `parsed.provider`) | Tally→ליד+אינטייק ב-Supabase. גיל נקלט בשורה ~462. יש e2e: `seeds/e2e_synthetic_tally_test.mjs` (21 בדיקות) |
| AI תוכניות | Edge Function `generate-draft-program` | אינטייק→טיוטת תוכנית (structured_draft, draft_cost_usd) |
| CRM | `Projects\combat-coach-admin` → Vercel `combat-coach-admin` ("סופר אדמין") | `/leads` (RPC `sa_leads_overview`, `sa_lead_detail`, `sa_update_lead`), `/analytics` משפך. Next.js+shadcn RTL |
| הודעות | מיגרציות 064/065: `scheduled_messages` + templates + **DB triggers** | INSERT אינטייק → `intake_thanks` (ללקוח, מיידי) + צ'ק-אינים 1d/7d/28d. Phase 0=שליחה ידנית מ-Retool; Phase 1 מתוכנן=WhatsApp Cloud API. `draft_ready_coach` לסהר קיים כתבנית |
| Make | org 8002144 (eu1), team 1916584 | **Free plan: מקס' 2 סצנות פעילות (1 תפוסה — Metricool 6131671), 1000 ops/חודש.** חיבורים: Airtable+Metricool בלבד. **אין WhatsApp/Gmail** |

## אילוצים והחלטות
- לסהר **אין רקע בתכנות** — אני מבצע הכל; ממנו רק קליקים של OAuth/הדבקות שאני מנחה במדויק.
- **אין** Tally API key שמור, **אין** supabase CLI מותקן (יש `supabase/config.toml`, project_id=combat-coach-app). Deploy ידרוש `npx supabase login` (קליק דפדפן של סהר) או access token.
- **לא בונים מסלול הודעות מקביל** — מכבדים את מערכת ה-scheduled_messages הקיימת (יש בה ביטולים/תנאים). ה-auto-reply ללקוח = כבר קיים (Phase 0 ידני). מה שנוסיף: פינג מיידי לסהר.
- Tally תומך בכמה webhooks לטופס → מוסיפים webhook שני ל-Make **בלי לגעת בצינור החי**.
- מיתוג: התוכנית=קומבאט אתלט, האפליקציה=קומבאט קואץ'.
- קטינים 14-17: חובה checkbox הסכמת הורה ב-Tally.
- סלוטים של סהר: ראשון 19:30 · שלישי 19:30 · שישי 12:00 · שני+רביעי 10:00-12:00. גיל 14-17 רואים רק ערבים+שישי (בי"ס בבקרים); 18+ רואים הכל.

## תוכנית + סטטוס

| שלב | מה | סטטוס |
|---|---|---|
| **A** | דף הנחיתה → Tally: embed ב-#check + 3 CTA popup עם `source=landing`; השאלון הפנימי הוסר; fallback no-JS | ✅ deployed. 21/21 verify + tally-check (iframe/3 buttons/lib/no-errors) |
| **B** | התראה על ליד: **התראות מייל מובנות של Tally** → sahar15115@gmail.com (אושר מפורשות), נושא "ליד חדש 🥊". חוסך את סצנת Make האחרונה. תשובה ללקוח = מנגנון scheduled_messages הקיים (intake_thanks) | ✅ מאומת ב-API. סהר לבדוק: מילוי-בדיקה → מייל מגיע |
| **C** | Tally (דרך API key): נוסף עמוד "אילו ימים/שעות" (5 סלוטים) + checkbox הסכמת הורה + הערת בי"ס. גיל-guardrail **רך** (תוויות "מתאים ל-18+" + הערה), לא conditional-logic קשיח (schema מתועד חלקית, סיכון לטופס חי). גיבוי מלא לפני: `tally-backups/form-44pM9o-*` | ✅ 105 בלוקים, PUBLISHED, טופס ציבורי 200 |
| **D** | אגרגציה סלוט×גיל: **`scripts/slot-report.mjs`** קורא ישירות מ-Tally API (בלי לגעת בצינור החי!). מפתח מ-env. | ✅ עובד (ריק כי דאטת-בדיקה ישנה) |

**החלטות מפתח:**
- Step D בוצע בדרך **בטוחה** (דוח מ-Tally) במקום מיגרציית Supabase + שינוי webhook — כי זה צינור חי עם e2e. הצינור **לא נגעתי בו**: הוספתי רק שדות לטופס (webhook parse-by-label מתעלם משדות לא-מוכרים). מיגרציה/ווידג'ט-דשבורד = אופציונלי, דורש `supabase login` של סהר.
- מפתח Tally: שימוש ב-env בלבד, לא בקוד. `tally-backups/` ב-gitignore. **מומלץ שסהר יחדש את המפתח בסיום.**
- גיל-filter קשיח ב-Tally = 30 שניות ב-UI של Tally אם ירצה, או ניסיון API זהיר בהמשך.

## שיבוץ סקילים
- **coach-humanizer**: ניסוח מייל ההתראה לסהר + (בהמשך) תבניות WhatsApp. נכנס ב-B.
- **security-auditor**: סקירת שינוי ה-webhook (קלט ציבורי!) לפני deploy. נכנס ב-D.
- **combat-coach-design**: ווידג'ט סלוט×גיל בדשבורד (master-detail, סטטוס=צבע+אייקון+טקסט). נכנס ב-D.
- **Playwright suites** (verify/flow בריפו הנחיתה): אחרי A.

## סבב UX (2026-07-04) — כפתור-בתוך-אפליקציה + CTA כפול + טופס קצר

- **Q1 (כפתור כפול):** אושר — הוסתר "המשך" הצף בסצנת האפליקציה (`body.app-scene .scroll-cue{display:none}`, ScrollTrigger ל-#app). באימון/קהילה הוא נשאר (אין שם כפתור פנימי).
- **כפתור בתוך הטלפון (Update A):** 4 כפתורי המסע במובייל עברו מ-`.axbtn` מתחת לטלפון ל-`.phone-cta` *בתוך* `.phone-screen` (אזור אגודל, זהב מטאלי, מסלול AI כחול לפאנל 4). scrim על `.mpanel-app .phone-screen::after` מכסה את ה-UI המצויר. **לקח:** scrim כ-`::before` של הכפתור נצבע מעל הרקע שלו (stacking) — הועבר ל-::after של המסך. הטלפון הוגדל (מובייל 62→68svh, דסקטופ 330→355px). אומת ויזואלית (screenshot).
- **CTA כפול (Update B):** design-scanner אישר — 2 מסלולים שונים = לא dilution (266% חל רק על 2 CTA לאותה מטרה). ראשי **"בניית תוכנית חינם"** (זהב מלא) → Tally 44pM9o; משני **"השארת פרטים"** (ghost) → **טופס קצר חדש `VLyPrl`** (שם/טלפון/גיל/סלוטים/הסכמת הורה, 6 עמודים, PUBLISHED, מייל התראה מופעל). js-tally קורא `data-tally-form`. nav+comm-cta עודכנו.
- אומת: 21/21 verify + anti-skip בשני הכיוונים + screenshots (כפתור-בטלפון נראה native, היררכיית CTA ברורה). 0 שגיאות.

## סבב תיקוני-באגים (2026-07-04) — 4 באגים, שורש מאובחן לכל אחד

- **B1 — כפתורי טלפון לא מקדמו:** שורש כפול — (א) `.psfull` תפס לחיצות (media→pointer-events:none), (ב) **הפאנלים מוערמים inset:0 בגלילה ו-blanket `.phone-cta{pointer-events:auto}` הפעיל את כל 4 הכפתורים — האחרון (panel 4) תפס הכל.** תיקון: `.msnap.pin-active .mpanel-app.on .phone-cta{pointer-events:auto}` (רק הפעיל). אומת: 3/3 כפתורים מקדמים 0→1→2→3.
- **B2 — קהילה מהירה:** `pinMobileScene` קיבל param רביעי `minDwell`; קהילה: endPct 560→760 + dwell 720ms. אורך גלילה 5.6→7.6 מסך.
- **B3 — כפתורים נעלמים בגלילה:** נוסף CTA משני (`השארת פרטים`, ghost) גם ל-nav → שני המסלולים לכל אורך הדף. אומת: nav overflow=0 (לא צפוף).
- **B4 — "המשך" לא ממורכז:** באג RTL — `inset-inline-start:50%`+translateX הזיז הצידה. תוקן ל-`left:50%`. מרכז X=195=מרכז מסך.
- אומת: 21/21 verify + screenshots. **לקח:** בסצנות pinned מוערמות, אסור blanket pointer-events — רק `.on`.

## סבב עיצוב-נאב + קצב (2026-07-04 לילה) — התייעצות design-scanner + combat-coach-design

- **בעיה:** נאב קבוע (2 CTA) דרס את ראש מוקאפ הטלפון בסצנת האפליקציה, בעיקר במסכים נמוכים / in-app browsers (svh לא יציב). המשתמש צילם ב-WhatsApp Business browser.
- **design-scanner:** ① נאב דק תמידי מול ② נאב מסתתר-בגלילה. **combat-coach-design פסק ①** — לדף נחיתה (מטרה=המרה) ה-CTA הוא המלך, חייב להישאר; ② מתאים לאפליקציה/מגזין.
- **יושם ①:** נאב קומפקטי (padding-block .85→.45rem, לוגו 1.22→1.08rem, nav CTAs padding מוקטן/גובה 38px). טלפון 68→**58svh** (min 510). `.mpanel-app` padding-top=`calc(3.5rem + env(safe-area-inset-top))` — הטלפון ממורכז *מתחת* לנאב. אומת ב-viewport נמוך (390×700): worst overlap = **-22px (רווח, לא כיסוי)** בכל 4 הפאנלים.
- **קצב הואט שוב:** app endPct 460→560 + dwell 520→700; community endPct 760→820 + dwell 720→850. anti-skip עדיין תקין בשני הכיוונים.
- אומת: 21/21 verify + screenshot (טלפון נקי מתחת לנאב). **לקח:** תוכן מסך-מלא מתחת ל-nav קבוע — חובה padding-top=nav+safe-area ו-svh, לא vh.
- ⚠️ תזכורת לסהר: לבדוק ב-Safari/Chrome אמיתי, לא ב-WhatsApp browser (svh מעוות שם).

## סנכרון טופס↔דף (2026-07-04) — סהר ערך את 44pM9o בעצמו

- **44pM9o עכשiv 18 שאלות** (סהר בנה מחדש): שם/גיל/**מין(חדש)**/משקל/טלפון/מטרה/מיקום/ותק/תדירות/זמן/ציוד/(משקולות מותנה)/מתח/שכיבות/שינה/כאב-מפרקי/תודה. הודעת סיום מותאמת ("48 שעות").
- **שאלת הזמינות + הסכמת הורה שהוספתי קודם ל-44pM9o — נעלמו** (סהר ערך מגרסה בלי התוספת). זה תקין: הזמינות נשארה ב-**VLyPrl** (השארת פרטים). חלוקה נקייה: 44pM9o=תוכנית, VLyPrl=זמינות/ליד.
- **אין סנכרון ידני** — הדף מטמיע live (iframe+popup). כל עריכה ב-Tally מופיעה מיד.
- **תוקן:** קופי סקשן #check התאים לטופס הקצר ("בדיקת התאמה · כמה שאלות קצרות") אבל מטמיע את המלא (18ש') → עודכן ל"בונים לך תוכנית אימון אישית" + לינק inline ל-VLyPrl.
- ⚠️ **דגל ל-Step 5:** `jotform-webhook` מנתח שדות **לפי label** (`findByLabel(/^גיל$/)` וכו'). סהר שינה מבנה/labels + הוסיף מין — **חובה לוודא שה-parsing עדיין תופס** לפני שמחברים ל-CRM, אחרת ה-AI יבנה תוכנית על נתונים חסרים.

## מה נשאר מסהר (אבקש בזמן הנכון, מרוכז)
1. OAuth Gmail ב-Make (קליק אחד) — שלב B.
2. הדבקת webhook URL ב-Tally Integrations — שלב B.
3. Tally API key (Settings→API keys→Create) או עריכה משותפת בדפדפן — שלב C.
4. `npx supabase login` (קליק דפדפן) — שלב D.
5. עתידי (לא חוסם): הקמת WhatsApp Business Cloud API מול מטא ל-Phase 1.
