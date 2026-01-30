# SnabbaLexin Design & Development Pitfalls
>
> Lessons learned from fixing Layout, i18n, and Styling issues.

## 1. Global CSS Interference

**Issue:**  `style.css` imposes global rules (e.g., `body { padding: 2rem; }`) that break layout for specific full-screen or mobile-optimized pages (like `profile.html` or `training.html`).
**Solution:**

- Always explicitely reset box-model properties in page-specific CSS if exact alignment is needed.
- Use `padding: 0 !important` if global styles have high specificity or loading order issues.
- **Rule:** Mobile views (`max-width: 414px`) must have `padding: 0` on `body` to properly align fixed headers.

## 2. Header Alignment & Centering

**Issue:** Using `flex: 1` or sibling-dependent calculation for titles (e.g. between a Back Button and nothing) results in "off-center" titles.
**Solution:**

- **Absolute Centering:** Use `position: absolute; left: 0; right: 0; text-align: center;` for headers.
- **Pointer Events:** Set `pointer-events: none` on the title container so it doesn't block clicks on buttons underneath/above specific z-indices.

## 3. Bilingual Text Handling (i18n)

**Issue:**

- **Concatenation:** If `i18n` logic fails to toggle classes, adjacent text spans will merge (e.g. "Min Profilملفي الشخصي").
- **Hardcoding:** Some components (`BadgesSection`) were hardcoded in one language, breaking consistency.
**Solution:**
- **Initialization:** Always import `i18n-apply` or call `LanguageManager.init()` in EVERY entry point (`.ts` file).
- **CSS Safety Net:** Add a global CSS rule to insert separators for adjacent bilingual spans:

  ```css
  .sv-text + .ar-text::before {
      content: " / ";
      padding: 0 4px;
  }
  ```

- **Never Hardcode:** Always use bilingual structure `<span class="sv">..</span><span class="ar">..</span>` even for static text.

## 4. Browser Caching

**Issue:** CSS fixes do not appear for users due to aggressive browser caching.
**Solution:**

- **Versioning:** Always append `?v=xyz` (e.g., `?v=fix4`) to CSS links in HTML when deploying critical style fixes.

## 🚨 PWA & Mobile View Pitfalls (Added 2026-01-28)

### 1. The "Ghost CSS" Trap (Service Worker Cache)

- **Problem:** PWA Service Workers aggressively cache CSS/JS. "Refreshing" Chrome often loads the *old* file even after you edit it.
- **Solution:** ALWAYS append a version query string (e.g., `style.css?v=2.1`) when pushing critical UI fixes. Do NOT trust `Cmd+R` alone for PWAs.

### 2. Flexbox Alignment Blindness

- **Problem:** `display: flex` defaults to `flex-start` (left). This makes centered mobile UIs look unbalanced if the container is wider than the content.
- **Solution:** For any centered mobile UI, explicitly set `justify-content: center` on the flex container.

### 3. The "Unconstrained Header" Mistake

- **Problem:** Setting `max-width: 414px` on the *content* but leaving the *header* as `width: 100%` creates a disjointed look on desktop.
- **Solution:** Apply the `max-width` constraint to the **Parent Container** (or both header & main) to ensure the entire vertical slice looks like a phone.
