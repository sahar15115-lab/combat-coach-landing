# Ledger — דף נחיתה "קומבאט קואץ׳" לרמה עולמית

> **Source of truth.** קרא לפני כל צעד, עדכן אחרי כל commit. נגד context decay.
> קובץ עבודה: `combat-coach-landing.html` · גיבוי פריסטין: `combat-coach-landing.v7-baseline.html` (לא נוגעים).
> repo ייעודי: `C:\Users\sahar\OneDrive\Desktop\דף נחיתה` · branch `main` · baseline commit `6b64685`.

---

## 0. הקשר

- **מוצר:** דף נחיתה RTL של תהליך הליווי של סהר שמש. שם מותג בדף = **"קומבאט קואץ׳"**; שם המאמן = **"סהר שמש"**; "Combat Coach" = שם האפליקציה בלבד.
- **סטאק בפועל (מאומת בקובץ):** HTML בודד · GSAP 3.12.5 + ScrollTrigger **inline** (לא CDN) ✅ · Heebo ✅ · RTL (`<html lang="he" dir="rtl">`) ✅ · fallback `no-js`→`js` בשורה 4 ✅.
- **CTA ראשי:** "בדיקת התאמה למחזור הקרוב" → `#check` (טופס שאלון רב-שלבי בדף). חוזר + sticky במובייל ✅.

## החלטות נעולות — סטטוס מול הקובץ

| # | החלטה | סטטוס בקובץ | צעד מטפל |
|---|---|---|---|
| 1 | סצנה אחת אמיתית בכל הרוחב, בלי פיצול דסקטופ/מובייל | ❌ **קיים פיצול** — `trainx-pin`+`mpanel` נפרד; `commx-pin`+פאנלים נפרדים | Step 3 |
| 2 | הסרת `scroll-snap-type` אם תופס אצבע | ⏳ לבדוק (`html{scroll-behavior:smooth}` בשורה 75) | Step 3 |
| 3 | fallback: תוכן גלוי בלי JS + reduced-motion | ⏳ יש `no-js/js`; לאמת IntersectionObserver + `setTimeout(showAll)` | Step 3/9 |
| 4 | iOS: `100svh` + `ignoreMobileResize` + refresh | ⏳ לאמת | Step 3 |
| 5 | וידאו: `muted loop playsinline poster preload=metadata` | ⏳ placeholders בלבד | Step 2 |

## טוקני מותג (`:root`, שורות 55–72) — כבר תואמים לנעול ✅

| טוקן | ערך בקובץ | נעול בתוכנית | תואם? |
|---|---|---|---|
| `--bg` | `#0A0A0A` | שחור `#0A0A0A` | ✅ |
| `--brand` | `#C9A84C` | זהב `#C9A84C` | ✅ |
| `--accent` | `#5AA9E6` | כחול-AI `#5AA9E6` | ✅ |
| פונט | Heebo | Heebo | ✅ |

> מסקנה: **Step 1 (סנכרון טוקנים) כמעט מיותר** — הערכים כבר נכונים. נותר: להסיר את הערת ה"PLACEHOLDER" המטעה (שורה 51) ולאמת type-scale/spacing מול רפרנס.

---

## סטטוס קונקטורים (נבדק Step 0)

| קונקטור | סטטוס | הערה |
|---|---|---|
| **Cloudinary** | ✅ מאומת | cloud `dprmdtmrk`. upload/transform זמינים. |
| **Figma** | ⚠️ מאומת אבל **View seat / starter** | קריאה+screenshots יעבדו; **יצירת frames (`use_figma`) כנראה חסומה**. הטוקנים כבר תואמים ידנית → אין חסימה מעשית ל-Step 1. |
| **Vercel** | ⏳ MCP רשום (`deploy_to_vercel`) | אימות auth נדחה ל-Step 8. CLI לא מותקן. |
| **higgsfield** | ✅ זמין | `generate_image/video` — למילוי פערי נכסים. |

## מלאי מדיה אמיתי ב-Cloudinary (מול הצורך)

**קיים אמיתי:**
- 🎥 וידאו אימון portrait 9:16 (`owkmnfl5fjgaonaoqo41`, 464×832) — קליפ WhatsApp.
- 📱 3 סקרינשוטים של האפליקציה (1206×2622): `mfqoa2ztef4gjypw7dr2`, `gupogdplfr73or7erraz`, `qbrb91bn7k63prekndpl`.
- כל השאר ב-Cloudinary = **דוגמאות של Cloudinary** (samples/*, cld-sample*) — לא שמישות.

**חסר (פער אמיתי):** 3 וידאו אימון נוספים · hero visual · וידאו-בתוך-טלפון · 8 שקופיות קהילה · תמונות/וידאו אמיתיים לפי הצורך. → מקורות: צילום אמיתי של סהר (עדיף) או `higgsfield`.

## רשימת Placeholders (⚠️) בקובץ

| # | placeholder | שורות | מקור אפשרי |
|---|---|---|---|
| 1 | og:image (תמונת שיתוף 1200×630) | 12 | Cloudinary אחרי בחירת hero |
| 2 | Hero — מדיה מלאת-מסך | 131, 495 | צילום/higgsfield |
| 3 | Hero — וידאו רקע | 156 | קליפ אימון קיים? |
| 4 | וידאו בתוך הטלפון (state 0) | 222–226 | סקרינשוט/סקרין-רקורד |
| 5 | 4 וידאו אימון (חבל, עמידת ידיים, קואורדינציה, אגרוף תאילנדי) — דסקטופ+מובייל | 535–538, 558–574 | 1 קיים; 3 חסרים |
| 6 | 8 שקופיות קהילה (5 זהב התפתחות + 3 כחול AI) — דסקטופ+מובייל | 799–806, 816–845 | שקופיות ההרצאה |
| 7 | 3 עדויות מתאמנים | 759–761 | ציטוטים אמיתיים / להסתיר עד שיש |
| 8 | השלמות FAQ: טווח גילאים / מיקום אימון / משך מחזור | 957, 958, 963 | סהר משלים טקסט |
| 9 | webhook CRM/Make/WhatsApp לטופס | 1002 (TODO) | Airtable→Make הקיים |

---

## טבלת סטטוס צעדים

| צעד | תיאור | סטטוס |
|---|---|---|
| 0 | Setup + ledger + connector check + placeholders | ✅ |
| 1 | שדרוג מערכת הצבעים/עומק (① זהב מותך) + בנצ'מרק | ✅ (benchmark חי בוצע; שכבת ① הוחלה ואומתה) |
| 2 | צינור מדיה Cloudinary — החלפת placeholders | ☐ |
| 3 | תיקון גלילה ("נתקע") + reframe איחוד סצנות | 🟡 חלקי — snap הוסר ✅; איחוד → reframe (ראה למטה) |
| 4 | סצנת אימון: טקסט דינמי לפי שלב | ✅ 4 שלבים במיקומים מובחנים (מימין-תחתון→שמאל→עליון→מרכז) + כניסה מכיוונים שונים |
| 5 | טלפון: סיבוב על גלילה (גם מובייל) + תיקון stepper | ✅ דסקטופ כבר סובב; נוסף סיבוב 3D על 5 טלפוני מובייל (scrub); goToState clamp |
| 6 | קהילה: שקופיות full-bleed + מעבר ④ | ✅ full-bleed בדסקטופ+מובייל (מאומת 1265×820); scrim; מעבר טמפרטורה זהב→כחול (`.is-ai` על שקופיות AI, i≥5) |
| 7 | ליטוש רמה-עולמית (CTA/a11y/micro/og) | ✅ meta שיתוף (twitter card/theme-color); fallback ל-metal (לא נעלם); hover עקבי לכרטיסים. **og:image ממתין ל-hero (Step 2, מחר).** |
| 8 | פריסה ל-Vercel + Speed Insights + בדיקה בטלפון | 🟡 מוכן: script של Speed Insights + `index.html` להעלאה. פריסה=hand-off (כלי ה-deploy יפרוס את ה-CMS בטעות). דורש פעולה שלך + בדיקת טלפון. |
| 9 | אימות Playwright ×4 + סגירת Ledger | 🟡 אומת דרך Preview (Chromium): דסקטופ+מובייל JS-on ✅, 0 שגיאות console. no-JS ו-reduced-motion אומתו לוגית (CSS gated + probe=opacity1 + בלוקים display:block). Playwright לא מותקן בסביבה. |

## קריטריוני קבלה סופיים
☐ טוקנים מיושרים · ☐ 0 placeholders, מדיה מאופטמת · ☐ גלילה חלקה בלי "נתקע" · ☐ טקסט אימון דינמי · ☐ טלפון מסתובב (גם מובייל) · ☐ שקופיות full-bleed · ☐ CTA יחיד חוזר + sticky · ☐ a11y + reduced-motion + no-JS · ☐ LCP<2.5s CLS~0 · ☐ חי על Vercel אושר מהטלפון · ☐ Playwright ×4 ירוק.

## החלטות עיצוב נעולות (2026-07-01, אושר ע"י סהר)

- **סגנון בסיס לכל הדף = ① "זהב מותך":** זהב מטאלי כגרדיאנט על כותרות/CTA, שלוליות אור רדיאליות, שכבת גריין, glow על אלמנטים אינטראקטיביים, זכוכית מרוסנת.
- **מעבר טמפרטורה על גלילה:** זהב חם (גוף/אימון) → מתקרר → **④ "גוף×בינה"** (זהב פוגש כחול-AI עם תפר זוהר) באזור הקהילה/AI בסוף. יושב על 5 שקופיות זהב + 3 כחולות שכבר קיימות. (מיושם ב-Step 6.)
- **ה-CTA נשאר זהוב** לכל אורך הדף (עקביות המרה).

## Step 1 — מה בוצע (commit הבא)
- טוקנים חדשים ב-`:root`: `--brand-metal` (גרדיאנט זהב מטאלי), `--brand-sheen` (מילוי CTA), `--glow-gold`/`--glow-gold-strong`, `--bg-ambient` (שלוליות אור), `--surface-hi`, `--grain` (SVG feTurbulence data-URI, בלי קובץ חיצוני).
- `body::before` = אווירה גלובלית (fixed) · `html::after` = גריין (fixed).
- `.hero-title` + `.metal` = טקסט זהב מטאלי עם sheen מונפש (מכובה ב-reduced-motion).
- `.btn` = מילוי sheen + glow זהב.
- **תיקון ביצועים:** הוסר `mix-blend-mode` מהגריין (גרם ל-repaint יקר של כל המסך) — עכשיו overlay פשוט ב-opacity .045.
- **אומת:** computed-styles מאשרים החלה; אין שגיאות console; screenshot ראשוני מאשר מראה.

## ממצאים לטיפול בהמשך
- ⚠️ **גלישה אופקית ~265px @1000px רוחב** (מוסתרת ע"י `overflow-x:hidden`) — קיימת מ-v7, כנראה מהסצנות המפוצלות/pinned. → לטפל ב-**Step 3** (איחוד סצנות).
- הערת "PLACEHOLDER" בשורה ~51 מטעה (הצבעים אמיתיים) — ניקוי קוסמטי, לא דחוף.

## Step 3 — מה בוצע + reframe חשוב

**בוצע (commit):**
- הוסר `scroll-snap-type:y proximity` מ-`html` (שורה 454) — זה היה גורם ה"היאחזות"/תקיעה באצבע. אומת חי: `scroll-snap-type: none`. הפאנלים נשארים full-screen חלקים.

**Reframe של "איחוד לסצנה אחת" (החלטה הנדסית):**
קריאת `hard-won-fixes.md §6–7` + הקוד בפועל מגלה ש-v7 **כבר בנוי נכון**: כל סצנת דסקטופ pinned (`trainx/appx/commx`) עם:
- גרסת מובייל תואמת (`.X-mobile` / `.mpanel`) — toggle ב-`@media(max-width:900px)`.
- **fallback ל-no-JS** (שורות 448–450): סצנות pinned מוסתרות, בלוקים מוערמים מוצגים → תוכן תמיד גלוי.
- **fallback ל-reduced-motion** (שורות 441–447).

➡️ הפיצול דסקטופ-pinned / מובייל-panels הוא **הדפוס העמיד שהסקיל עצמו ממליץ עליו** (§7) — כי pinned scenes שבירים במובייל. "איחוד" מלא ל-DOM אחד **יסיר** את העמידות הזו ויחזיר את באג "נתקע בטלפון". לכן: **לא עושים rewrite מסוכן.** הכוונה של "לא שתי מציאויות שמתפצלות" מסופקת ע"י: אותו תוכן בשני הצדדים (מאומת), ואותה מערכת ויזואלית (① גלובלי). השדרוג החוויתי האמיתי ("לא משעמם") מגיע ב-**Steps 4/5/6** על אותו מבנה.

**overflow אופקי:** ה-265px כנראה **artifact של resize בלי `ScrollTrigger.refresh`** (GSAP מקפיא רוחב pin-spacer). ב-load יציב `invalidateOnRefresh:true`+refresh מטפלים. → לאמת סופית על מכשיר אמיתי ב-Step 8; לא נגעתי.

## Steps 8–9 — סטטוס אימות + מה שנותר לך

**אומת בסביבה (Preview = Chromium):** דסקטופ 1280 + מובייל 375 עם JS — הסצנות נרשמות, 5 טלפוני מובייל מקבלים סיבוב 3D, קהילה full-bleed + מעבר ④ עובד, **0 שגיאות console**. טוקני ① מוחלים (computed-styles).

**הערת סביבה חשובה:** ה-Preview הוא headless ולכן **לא מריץ אנימציות rAF** (GSAP) — לכן screenshots "נתקעו" ומצבי opacity נקראו 0. זו מגבלת כלי, לא באג. במכשיר אמיתי הכל מונפש כרגיל.

**no-JS / reduced-motion:** אומתו לוגית — הכללים גדורים ב-`html.js`; probe של `.reveal` במצב `no-js` = opacity 1; בלוקי מובייל `display:block`; reduced-motion כופה `opacity:1`. בלי JS אין GSAP ואין `.in` → הכל גלוי. **מומלץ** להריץ Playwright ×4 לפני השקה סופית (לא מותקן כאן), או להסתמך על בדיקת המכשיר האמיתי.

**כדי לפרוס (30 שניות, בחר אחד):**
1. **Netlify Drop** — גרור את `index.html` (או את כל התיקייה) ל-app.netlify.com/drop → תקבל URL → פתח בטלפון.
2. **Vercel** — vercel.com → Add New → גרור את התיקייה → URL. (Speed Insights נדלק בלשונית Analytics.)
> אל תריץ את כלי ה-deploy האוטומטי — הוא מכוון ל-CWD (ה-CMS) ויפרוס את הפרויקט הלא-נכון.

**לפני העלאה — לזכור:** `index.html` = עותק פריסה של `combat-coach-landing.html`. אחרי החלפת המדיה מחר — לרענן: `cp combat-coach-landing.html index.html`.

## סבב תיקונים מהקלטות אמיתיות (2026-07-02, מובייל WhatsApp + דסקטופ)

**אובחן מהפריימים (ffmpeg על שני הסרטונים של סהר):**
- 📱 A — כותרת hero נחתכה: ל-hero אין padding-top, התוכן התחיל מתחת ל-nav הקבוע. **תוקן:** `padding-top:6rem` במובייל. אומת: titleTop 138px > navH 71px.
- 📱 B — גלילה "עוברת לאורך" בלי תחושת רגע: **תוקן** בכניסה עדינה לכל `.mpanel` (IntersectionObserver → `.mseen`, gated `html.js`, fail-safe 3s, reduced-motion=גלוי). snap נשאר מבוטל.
- 🖥️ D1 — טקסט סצנת האפליקציה נצמד לטלפון (gap ~15px ב-1280): **תוקן** `width:min(36%,400px)` → gap 62px.
- 🖥️ D2 — "טקסט כפול" בקהילה (פלייסהולדר השקופית שיכפל את הכיתוב): **תוקן** — `.sph .stag/.stitle` מוסתרים, נשארת תגית `.snote` מקווקוות. יתבטל ממילא כשיגיעו שקופיות אמיתיות.
- אומת: 0 שגיאות console בשני ה-viewports. ⚠️ הערה: הסרטון של המובייל צולם ב-WhatsApp in-app browser — האימות הסופי חייב Safari/Chrome אמיתי (Step E).

**Step E (ממתין לסהר):** לפרוס מחדש את `dist/` ל-Vercel → לבדוק בטלפון בדפדפן אמיתי: כותרת שלמה, תחושת רגע-רגע, אין היאחזות.

## פתוחים לסהר (לא חוסמים בנייה)
- יעד ה-CTA הסופי: הטופס בדף שולח ל-CRM/Make/WhatsApp — איזה webhook? (Step 7).
- מדיה אמיתית: יש עוד וידאו/תמונות אימון מעבר לקליפ הבודד? (Step 2).
- עדויות: יש ציטוטים אמיתיים ממתאמנים, או להסתיר את הסקשן בינתיים? (Step 2/7).
