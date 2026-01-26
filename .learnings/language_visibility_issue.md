# Language Visibility & CSS Conflict Protocol

**Problem:** Arabic text (and secondary languages) would disappear entirely when the app's interface language was set to Swedish.
**Context:** `StoryModal`, `Flashcards`, and `Bilingual Components`.
**Root Cause:**

* Global CSS rules (likely in `main.css` or `style.css`) were using aggressive selectors like `body.lang-sv [lang="ar"] { display: none; }` to toggle interface languages.
* This "blanket approach" unintentionally hid content that *should* be bilingual (e.g., a story with both Swedish and Arabic text).

**Solution (The "Nuclear" Option):**
To ensure content remains visible regardless of the UI language setting, we implemented specific overrides in component stylesheets (e.g., `StoryModal.css`).

```css
/* NUCLEAR OPTION: Force text visibility overriding any global language filters */
.story-modal-container [lang='ar'],
.story-modal-container [dir='rtl'],
.ar-fixed {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
}
```

**Key Learnings:**

1. **Never rely on global body classes** (like `.lang-sv`) to toggle visibility of *content* data (stories, dictionary entries). Only use them for *UI labels* (buttons, headers).
2. **Component Isolation:** Critical bilingual components must explicitly force visibility (`visibility: visible !important`) to "immunize" themselves against global theme/language switches.
3. **Testing Protocol:** Always test new bilingual features while the app is in "Swedish Only" mode to ensure data isn't accidentally hidden.
