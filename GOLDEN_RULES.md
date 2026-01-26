# GOLDEN RULES

## 🎨 Design & UI

- **NO PURPLE**: Purple, violet, magenta, or any gradients explicitly mixing red and blue to create purple are STRICTLY FORBIDDEN.
  - Forbidden Hex: `#800080` and similar violet shades.
  - Allowed Alternatives: Blue + Cyan (`#00BFFF`) or Blue + Aqua (`#00CED1`).
- **Glassmorphism**:
  - Use `rgba(255, 255, 255, 0.2)` for backgrounds.
  - Background Blur: `15px`.
  - Border Radius: `20px`.
  - NO blue overlays on red backgrounds.

## ⚠️ BEWARE OF SCOLDING (VERIFICATION FIRST)

- **NEVER ASSUME** conditional rendering matches CSS rules.
- **ALWAYS CHECK** if an element exists in the DOM before trying to style it.
- **DOUBLE-CHECK** implementation details to avoid frustration and "bahdala".
