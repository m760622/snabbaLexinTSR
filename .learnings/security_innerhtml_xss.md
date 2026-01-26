# Security Risk: innerHTML & XSS

**Problem:** We found multiple instances of `innerHTML` being used to render untrusted text content (e.g., in `wordWheelGame.ts`).
**Risk:** This exposed the application to **Cross-Site Scripting (XSS)** attacks, where malicious scripts could be injected via data inputs (dictionary files or user inputs).

**Mitigation Protocol:**

1. **Strict Ban:** Do NOT use `innerHTML` unless absolutely necessary for rendering trusted static HTML structures.
2. **Safe Alternatives:**
    * Use `textContent` for plain text.
    * Use `innerText` if style-aware text content is needed.
    * Create DOM elements programmatically (`document.createElement`) and append them.
    * Sanitize data if raw HTML must be used (e.g., using DOMPurify).

**Example Fix:**

```typescript
// ❌ Dangerous
element.innerHTML = word.definition;

// ✅ Safe
element.textContent = word.definition;
```
