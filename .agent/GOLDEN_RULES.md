# 🔱 القواعد الذهبية للمشروع | Golden Rules

> **هذا الملف يحتوي على الدروس المستفادة والقواعد الذهبية التي يجب مراعاتها دائماً**
>
> **This file contains lessons learned and golden rules that must always be followed**

---

## 🚨 Rule #1: Arabic Text Visibility in Swedish Mode (lang-sv)

> **تاريخ الاكتشاف:** 2026-01-21
> **الوقت المستغرق للحل:** ~يوم كامل
> **الأهمية:** 🔴 حرجة جداً

### المشكلة (The Problem)

عند إضافة أي عنصر جديد يحتوي على نص عربي باستخدام `lang="ar"` أو `dir="rtl"`، سيتم **إخفاؤه تلقائياً** في الوضع السويدي بسبب القاعدة العامة في `style.css`:

```css
/* style.css - السطر ~12306 */
body.lang-sv [dir="rtl"]:not(.card *):not(.details-page-container *):not(.quiz-option),
body.lang-sv .ar-text,
body.lang-sv .arabic-text,
body.lang-sv .text-ar,
body.lang-sv [lang="ar"],
body.lang-sv .bilingual-ar,
body.lang-sv .word-arb:not(.card .word-arb):not(.details-page-container *):not(.cognate-card *),
body.lang-sv .subtitle-ar {
  display: none !important;
}
```

### لماذا حدثت المشكلة في Flashcards؟

العنصر `.flashcard-translation` كان يُنشأ بـ `lang="ar"`:

```html
<div class="flashcard-translation" dir="rtl" lang="ar">${item.arb}</div>
```

لكن **لم يكن مستثنى** من القاعدة العامة مثل `.card *` أو `.details-page-container *`!

### الحل ✅

**عند إضافة أي مكون جديد يعرض نصاً عربياً:**

1. **أضف استثناءً في القاعدة العامة** في `style.css`:

   ```css
   body.lang-sv [lang="ar"]:not(.your-new-component *),
   body.lang-sv [dir="rtl"]:not(.your-new-component *),
   ```

2. **أو أضف Override Rule** في ملف CSS الخاص بالمكون:

   ```css
   body.lang-sv .your-new-component .arabic-element {
       display: block !important;
       visibility: visible !important;
       opacity: 1 !important;
   }
   ```

### المكونات المستثناة حالياً ✅

| المكون | الاستثناء |
|--------|-----------|
| `.card *` | ✅ مستثنى |
| `.details-page-container *` | ✅ مستثنى |
| `.quiz-option` | ✅ مستثنى |
| `.cognate-card *` | ✅ مستثنى |
| `.flashcard-wrapper *` | ✅ مستثنى (تمت إضافته 2026-01-21) |
| `.story-modal-container *` | ✅ مستثنى (تمت إضافته 2026-01-25) |
| `.story-sentence-pair *` | ✅ مستثنى (حل مشكلة الترجمة العربية) |

### كيف تختبر؟

1. افتح المكون في المتصفح
2. تأكد أن `body` لديه class `lang-sv`
3. استخدم DevTools للتحقق من computed style:

   ```javascript
   getComputedStyle(document.querySelector('.your-arabic-element')).display
   // يجب أن يكون "block" وليس "none"
   ```

---

## 🚨 Rule #2: Code Verification & Syntax Integrity (التحقق من الكود وسلامة الأقواس)

> **الأهمية:** 🔴 يمنع حدوث كارثة (Critical)
> **Trigger:** All Code Edits

### القاعدة (The Rule)

**يجب عليك (YOU MUST) التحقق من الكود وخلوه من الأخطاء قبل أي تعديل.**
تأكد من عدم فقدان أو نقصان أحد الأقواس كما يحدث طوال الوقت معك فهذا شيء سيء جدا وغير احترافي ومعيب ومهين.

### Checklist Before Applying Updates

1. **Count Brackets:** Ensure every `{`, `(`, `[` has a matching closing counterpart.
2. **HTML Structure:** Ensure no closing tags like `</div>` or `</button>` are lost or duplicated.
3. **Context Check:** When using `replace_file_content`, ensure the `TargetContent` is unique and the `ReplacementContent` seamlessly fits.
4. **No Assumptions:** Do not assume the code is correct; verify it.

---

---

## 🚨 Rule #3: Code Preservation & Integrity (الحفاظ على الكود وتكامله)

> **الأهمية:** 🔴 حرجة (Critical)
> **Trigger:** Refactoring / specific-updates

### القاعدة (The Rule)

**يُمنع منعاً باتاً حذف أو استبدال أي كود حالي غير متعلق مباشرة بالمهمة المطلوبة.**

1. **Scope Containment:** عند تعديل وظيفة معينة، لا تلمس أي وظائف أخرى أو استيرادات (Imports) أو تعليقات (Comments) خارج نطاق التغيير.
2. **Smart Patches:** إذا كان الملف طويلاً، استخدم أدوات التعديل الجزئي (`replace_file_content` مع `StartLine`/`EndLine` دقيقين) بدلاً من استبدال الملف بالكامل.
3. **Forbidden Actions:**
    * ❌ حذف دوال (Functions) لم يُطلب حذفها "لتنظيف الملف".
    * ❌ تغيير صياغة (Refactoring) كود يعمل بالفعل دون طلب صريح.
    * ❌ إزالة تعليقات المطورين السابقين (TODOs / FIXMEs).

**الهدف:** التعديل الجراحي الدقيق دون آثار جانبية (Legacy Code Preservation).

---

## 🚨 Rule #4: Swedish Language & Arabic Data Integrity (قاعدة اللغة السويدية وبيانات العربية)

> **الأهمية:** 🟠 عالية (High)
> **Trigger:** UI Implementation / Content Display

### القاعدة (The Rule)

**واجهة المستخدم (UI) والتعليمات البرمجية تكون بالسويدية، ولكن يُمنع منعاً باتاً إخفاء أو تجاهل بيانات اللغة العربية (Arabic Data) القادمة من الذكاء الاصطناعي.**

1. **UI Language:** كافة القوائم، الأزرار، والرسائل النظامية يجب أن تكون بالسويدية (Swedish) كلغة أولى.
1. **UI Language:** كافة القوائم، الأزرار، والرسائل النظامية يجب أن تكون بالسويدية (Swedish) كلغة أولى.
1. **Educational Data:** المحتوى التعليمي (كلمات، جمل، قصص) هو **ثنائي اللغة**.
    * ❌ **ممنوع:** فلترة حقول الترجمة (`arabic`, `translation`, `ar`) بحجة أن "التطبيق سويدي".
    * ✅ **مطلوب:** عرض النص العربي بوضوح (اتجاه RTL، خط Tajawal) لأنه "جزء أساسي من العملية التعليمية".
1. **Visualization:** يجب أن يكون النص العربي مميزاً بصرياً ولا يختلط بالنص السويدي (استخدم `StoryModal` كمثال جيد: حاويات منفصلة + خطوط مختلفة).
1. **Content vs UI:** **يُمنع منعاً باتاً عرض أي محتوى تعليمي بالسويدية دون إظهار ترجمته العربية المرافقة له في نفس الشاشة، والتمييز بين لغة الواجهة (UI) ولغة المحتوى (Content).**
1. **No CSS Hiding:** يُمنع استخدام خاصية `display: none` أو `opacity: 0` على أي عنصر داخل `StoryModal` بغض النظر عن لغة الواجهة.
1. **Independent Rendering:** مكون `StoryModal` يعمل بنظام العرض المستقل (Independent Rendering) ولا يخضع لنظام تبديل اللغات العالمي.
1. **Mandatory Bilingual Zone:** يعتبر `StoryModal` منطقة ثنائية اللغة إجبارية (Mandatory Bilingual Zone)، ويجب عرض اللغتين فيها دائماً بشكل متزامن.

---

## 📝 القواعد القادمة

> أضف هنا أي دروس مستفادة جديدة...

---

**لا حول ولا قوة إلا بالله العلي العظيم** 🤲

---

## 🚨 Rule #5: User Verification Protocol (بروتوكول التحقق من المستخدم)

> **الأهمية:** 🔴 P0 (Mandatory)
> **Trigger:** All Requests / Ambiguous Tasks

### القاعدة (The Rule)

**يُمنع منعاً باتاً تنفيذ أي كود دون شرح الفهم والحصول على تأكيد صريح.**

1.  **EXPLAIN FIRST:**
    *   اشرح بوضوح ما فهمته من طلب المستخدم (باللغة العربية).
    *   مثال: "فهمت أنك تريد تغيير لون الخلفية للكارت فقط."

2.  **OFFER OPTIONS:**
    *   إذا كان الطلب يحتمل أكثر من معنى، لا تخمن.
    *   اعرض خيارات مرقمة (1، 2، 3).
    *   مثال:
        1.  تغيير اللون لكل الكروت.
        2.  تغيير اللون للكارت النشط فقط.

3.  **WAIT FOR CONFIRMATION:**
    *   لا تكتب أي كود (`write`, `replace`, `exec`) حتى يرد المستخدم برقم الخيار أو كلمة "نعم".
    *   **Zero Trust:** لا تفترض فهمك للسياق الضمني إذا كان يتعارض مع ما تراه. اسأل دائماً.
