# SnabbaLexin Tech Stack

> **Hybrid Architecture** - React + Vanilla TypeScript

---

## 🏗️ Architecture Overview

هذا المشروع يستخدم **نهجًا هجينًا** (Hybrid Approach) لتحقيق أفضل توازن بين الأداء وسهولة الصيانة:

| الجزء | التقنية | السبب |
|-------|---------|-------|
| **البحث والقاموس** | Vanilla TypeScript | سرعة قصوى، بدون React overhead |
| **صفحات التعلم** | Vanilla TypeScript | أداء عالي للتفاعلات |
| **الألعاب** | Vanilla TypeScript | استجابة فورية |
| **الإعدادات المتقدمة** | React (TSX) | إدارة حالة معقدة |

---

## 📱 Design Constraints

- **Max Width**: `414px` (iPhone 8 Plus / 11 Pro Max)
- **Mobile-Only**: التصميم موجه حصرياً للموبايل
- **No Desktop Breakpoints**: لا يوجد دعم لشاشات أكبر

---

## ⚛️ React Usage

React يُستخدم **فقط** في واجهة الإعدادات المتقدمة (`FullSettings.tsx`):

### لماذا React للإعدادات؟

1. **State Management**
   - `useState` للأقسام القابلة للطي (Collapsible Sections)
   - إدارة حالة الـ Checkboxes والـ Sliders

2. **Side Effects**
   - `useEffect` لجلب/حفظ الإعدادات من `localStorage`
   - مزامنة الإعدادات عبر الصفحات

3. **Component Architecture**
   - تنظيم الخيارات الكثيرة في مكونات منظمة
   - سهولة الصيانة والتوسع

4. **Props System**
   - `accentColor`, `onAccentChange`
   - تمرير البيانات بين المكونات بشكل واضح

### مثال

```tsx
// src/components/FullSettings.tsx
const [expandedSection, setExpandedSection] = useState<string | null>(null);

useEffect(() => {
  const savedSettings = localStorage.getItem('appSettings');
  if (savedSettings) {
    setSettings(JSON.parse(savedSettings));
  }
}, []);
```

---

## 🚀 Vanilla TypeScript Usage

باقي التطبيق يستخدم **Vanilla TypeScript** للأسباب التالية:

### المميزات

1. **Zero Runtime Overhead**
   - لا Virtual DOM
   - لا Reconciliation

2. **Direct DOM Manipulation**
   - `querySelector`, `addEventListener`
   - أسرع من React في العمليات البسيطة

3. **Smaller Bundle Size**
   - بدون React/ReactDOM (~40KB gzipped)

### الملفات الرئيسية

```
src/
├── app.ts              # Main app entry
├── search.ts           # Search functionality
├── welcome.ts          # Welcome screen
├── learn/
│   ├── LearnViewManager.ts
│   ├── flashcards.ts
│   ├── cognates.ts
│   └── asmaUlHusna.ts
└── games/
    ├── flashcards.ts
    └── ...
```

---

## 📦 Build Tools

| Tool | Purpose |
|------|---------|
| **Vite** | Dev server & bundler |
| **TypeScript** | Type safety |
| **ESLint** | Linting |

---

## 🎨 Styling

| Approach | Usage |
|----------|-------|
| **Vanilla CSS** | جميع الصفحات |
| **CSS Custom Properties** | Theming |
| **No CSS-in-JS** | للأداء |

---

## 📊 Performance Benefits

| Metric | React-Only | Hybrid Approach |
|--------|------------|-----------------|
| **Bundle Size** | ~150KB | ~80KB |
| **First Paint** | ~300ms | ~150ms |
| **Interactivity** | ~400ms | ~200ms |

---

## 🔗 File Structure

```
snabbaLexinTSR/
├── src/
│   ├── app.ts                    # Vanilla TS
│   ├── components/
│   │   └── FullSettings.tsx      # React ⚛️
│   └── learn/
│       └── *.ts                  # Vanilla TS
├── assets/
│   └── css/
│       └── *.css                 # Vanilla CSS
└── *.html                        # Multi-page app
```

---

> **الخلاصة**: استخدام React حيث يضيف قيمة حقيقية (الإعدادات المعقدة)، و Vanilla TS للباقي لضمان أفضل أداء ممكن.
