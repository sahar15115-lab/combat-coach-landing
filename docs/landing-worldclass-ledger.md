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
| 1 | סנכרון טוקנים מ-Figma + בנצ'מרק (design-scanner) | ☐ (טוקנים כבר תואמים; נותר benchmark+ניקוי) |
| 2 | צינור מדיה Cloudinary — החלפת placeholders | ☐ |
| 3 | תיקון גלילה ("נתקע") + איחוד לסצנה-אחת | ☐ |
| 4 | סצנת אימון: טקסט דינמי לפי שלב | ☐ |
| 5 | טלפון: סיבוב על גלילה (גם מובייל) + תיקון stepper | ☐ |
| 6 | קהילה: שקופיות full-bleed | ☐ |
| 7 | ליטוש רמה-עולמית (CTA/a11y/micro/og) | ☐ |
| 8 | פריסה ל-Vercel + Speed Insights + בדיקה בטלפון | ☐ |
| 9 | אימות Playwright ×4 + סגירת Ledger | ☐ |

## קריטריוני קבלה סופיים
☐ טוקנים מיושרים · ☐ 0 placeholders, מדיה מאופטמת · ☐ גלילה חלקה בלי "נתקע" · ☐ טקסט אימון דינמי · ☐ טלפון מסתובב (גם מובייל) · ☐ שקופיות full-bleed · ☐ CTA יחיד חוזר + sticky · ☐ a11y + reduced-motion + no-JS · ☐ LCP<2.5s CLS~0 · ☐ חי על Vercel אושר מהטלפון · ☐ Playwright ×4 ירוק.

## פתוחים לסהר (לא חוסמים בנייה)
- יעד ה-CTA הסופי: הטופס בדף שולח ל-CRM/Make/WhatsApp — איזה webhook? (Step 7).
- מדיה אמיתית: יש עוד וידאו/תמונות אימון מעבר לקליפ הבודד? (Step 2).
- עדויות: יש ציטוטים אמיתיים ממתאמנים, או להסתיר את הסקשן בינתיים? (Step 2/7).
