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
