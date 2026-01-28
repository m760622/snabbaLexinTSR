---
trigger: always_on
---

# SnabbaLexin Project Rules

> Project-specific rules for the Swedish-Arabic Dictionary app.

---

## 🎨 PROJECT_COLORS (SnabbaLexin)

> **Theme: Neon Cyber (Dark Mode Primary)**

| Role | Color | Hex |
|------|-------|-----|
| **Primary** | Neon Cyan | `#00f3ff` |
| **Background** | Deep Navy | `#020617` |
| **Surface** | Dark Slate | `#0f172a` |
| **Accent** | Sky Blue | `#0ea5e9` |
| **Success** | Emerald | `#10b981` |
| **Warning** | Amber | `#f59e0b` |
| **Danger** | Red | `#ef4444` |
| **Text Primary** | White | `#ffffff` |
| **Text Secondary** | Slate | `#cbd5e1` |

### 🚫 BANNED COLORS

| Color | Reason |
|-------|--------|
| `purple` | Purple Ban Rule |
| `violet` | Purple Ban Rule |
| `#667eea` | Purple variant |
| `#764ba2` | Purple variant |
| `#f093fb` | Pink-purple |
| Any shade of purple/violet | Strict prohibition |

---

## 📱 SNABBALEXIN_RULES

### Bilingual Requirement

- **All user-facing text:** Must be Swedish / Arabic
- **Format:** `Svenska / عربي` or stacked vertically
- **RTL Support:** Mandatory for Arabic text sections
- **Font direction:** Use `dir="rtl"` for Arabic-only elements

### Typography

| Usage | Font | Fallback |
|-------|------|----------|
| **Headings** | Outfit | Inter, sans-serif |
| **Body** | Inter | system-ui |
| **Arabic** | Noto Sans Arabic | sans-serif |
| **Monospace** | JetBrains Mono | monospace |

### Design Language

| Element | Style |
|---------|-------|
| **Cards** | Glassmorphism with cyan glow |
| **Buttons** | Rounded with hover glow |
| **Shadows** | Cyan-tinted (`rgba(0, 243, 255, x)`) |
| **Borders** | Semi-transparent cyan |
| **Animations** | Subtle, 0.2-0.3s duration |

### Component Naming

- CSS classes: `kebab-case` (e.g., `search-history-section`)
- TypeScript: `PascalCase` for classes, `camelCase` for functions
- Files: `kebab-case.ts` or `PascalCase.tsx` for React

---

## 📝 COMMIT_STYLE

### Format

```text
type(scope): message
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `style` | CSS/design changes (no logic) |
| `refactor` | Code restructure (no behavior change) |
| `docs` | Documentation only |
| `chore` | Build, config, dependencies |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |

### Scopes (SnabbaLexin)

- `search` - Search functionality
- `ui` - General UI changes
- `training` - Flashcard/training system
- `i18n` - Translations
- `a11y` - Accessibility
- `perf` - Performance

### Examples

```text
feat(search): add history save on result click
fix(training): prevent duplicate flashcards
style(ui): update daily challenge card to 60px height
```

---

## ✅ PRE-PUSH_CHECKLIST

> **Before every `git push`:**

### Mandatory Checks

- [ ] **Build passes:** `npm run build` completes without errors
- [ ] **No console errors:** Check browser DevTools
- [ ] **Mobile responsive:** Test on 375px viewport
- [ ] **Bilingual text:** All new UI has Swedish/Arabic

### Recommended Checks

- [ ] **Lint clean:** No red squiggles in IDE
- [ ] **Cross-browser:** Test on Chrome + Safari
- [ ] **Dark mode:** Verify colors work in dark theme
- [ ] **Accessibility:** Keyboard navigation works

### Quick Commands

```bash
# Build check
npm run build

# Lint check (if configured)
npm run lint

# Start dev server for manual testing
npm run dev
```

---

## 🔒 SECURITY_RULES

### Data Protection

- **No hardcoded secrets:** API keys, tokens in `.env` only
- **localStorage:** Non-sensitive data only (preferences, history)
- **User input:** Always sanitize before display (XSS prevention)
- **CSP headers:** Configured in Netlify for production

### Code Security

- **Dependencies:** Review before adding (check npm audit)
- **innerHTML:** Use `textContent` when possible
- **eval():** Never use
- **External scripts:** Minimize, use SRI when needed

---

## 📊 PERFORMANCE_TARGETS

> **Core Web Vitals Targets for SnabbaLexin**

| Metric | Target | Current |
|--------|--------|---------|
| **First Contentful Paint** | < 1.5s | ✅ |
| **Largest Contentful Paint** | < 2.5s | ✅ |
| **First Input Delay** | < 100ms | ✅ |
| **Cumulative Layout Shift** | < 0.1 | ✅ |

### App-Specific Targets

| Operation | Target |
|-----------|--------|
| **Bundle size (gzipped)** | < 500KB |
| **Dictionary load** | < 2s |
| **Search latency** | < 100ms |
| **Debounce input** | 150ms |
| **Animation duration** | 200-300ms |

### Optimization Rules

- **Lazy load:** Images, heavy components
- **Debounce:** Search input, resize events
- **Memoize:** Expensive calculations
- **Virtual scroll:** For large lists (> 100 items)

---

## 🧪 TESTING_RULES

### Coverage Requirements

| Change Type | Required Testing |
|-------------|------------------|
| **New feature** | At least 1 unit test |
| **Bug fix** | Regression test |
| **UI change** | Visual verification screenshot |
| **Refactor** | Existing tests must pass |

### Critical Paths (Always Test)

1. **Search:** Query → Results → Click → Details
2. **Training:** Add → Review → Rate → Progress
3. **Favorites:** Add → List → Remove
4. **Settings:** Change → Persist → Reload

### Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- SearchManager.test.ts

# Visual regression (if configured)
npm run test:visual
```

---

## 📂 FILE_STRUCTURE

### Directory Organization

```text
src/
├── components/        # React components (PascalCase.tsx)
├── managers/          # Business logic (NameManager.ts)
├── utils/             # Utility functions (name.ts)
├── hooks/             # React hooks (useName.ts)
├── types/             # TypeScript types (name.d.ts)
└── styles/            # Component-specific styles

assets/
├── css/               # Global CSS files
├── images/            # Static images
└── fonts/             # Custom fonts
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **React Components** | PascalCase | `TrainingView.tsx` |
| **Managers/Classes** | PascalCase | `SearchManager.ts` |
| **Utilities** | camelCase | `normalizeArabic.ts` |
| **CSS Files** | kebab-case | `search-cards.css` |
| **CSS Classes** | kebab-case | `.search-history-section` |

### File Size Limits

- **Max lines per file:** 500 (split if larger)
- **Max functions per file:** 15
- **Max component props:** 10

---

## 🚀 DEPLOYMENT_RULES

### Branch Strategy

| Branch | Environment | Auto-Deploy |
|--------|-------------|-------------|
| `main` | Production | ✅ Netlify |
| `dev` | Staging | ❌ Manual |
| `feature/*` | Local only | ❌ |

### Deployment Checklist

1. **Pre-deploy:**
   - [ ] `npm run build` passes
   - [ ] No console errors
   - [ ] Changelog updated (if breaking change)

2. **Deploy:**
   - [ ] Commit with proper message
   - [ ] Push to `main`
   - [ ] Netlify auto-deploys

3. **Post-deploy:**
   - [ ] Verify on production URL
   - [ ] Check mobile responsiveness
   - [ ] Monitor for errors (console)

### Version Bumping

- **Major (x.0.0):** Breaking changes, major redesign
- **Minor (0.x.0):** New features, significant improvements
- **Patch (0.0.x):** Bug fixes, small tweaks

Update both `package.json` and `changelog.html`

---

## 🎯 USER_PRIORITIES

> **Decision-making hierarchy for SnabbaLexin**

### Priority Order

1. **🚀 Performance** - Fast search is core value
2. **🌍 Accessibility** - Bilingual (Swedish/Arabic) is mandatory
3. **📱 Mobile-first** - Primary usage is mobile
4. **📴 Offline capability** - PWA for reliable access
5. **✨ Aesthetics** - Premium "Neon Cyber" feel
6. **🧠 Learning** - Training system effectiveness

### Trade-off Guidelines

| Conflict | Winner |
|----------|--------|
| Performance vs Aesthetics | Performance |
| Features vs Simplicity | Simplicity |
| Speed vs Accuracy (search) | Speed first, refine later |
| New feature vs Bug fix | Bug fix |

### Target Users

- **Primary:** Arabic speakers learning Swedish
- **Secondary:** Swedish speakers learning Arabic
- **Context:** Students, immigrants, language learners
- **Devices:** 70% mobile, 30% desktop

---
