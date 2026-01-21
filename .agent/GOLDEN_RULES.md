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

### كيف تختبر؟

1. افتح المكون في المتصفح
2. تأكد أن `body` لديه class `lang-sv`
3. استخدم DevTools للتحقق من computed style:

   ```javascript
   getComputedStyle(document.querySelector('.your-arabic-element')).display
   // يجب أن يكون "block" وليس "none"
   ```

---

## 📝 القواعد القادمة

> أضف هنا أي دروس مستفادة جديدة...

---

**لا حول ولا قوة إلا بالله العلي العظيم** 🤲
