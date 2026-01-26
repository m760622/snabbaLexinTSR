# Design Rule: The "Purple Ban" 🚫🟣

**Context:** The User has a strict preference against the color purple (and its variants: Violet, Magenta, Pink) in the UI.

**Rule:**

1. **Forbidden Colors:**
    * Purple (#800080, #A020F0, etc.)
    * Magenta / Fuchsia (#FF00FF)
    * Pink (#FFC0CB, #EC4899)
    * Violet
    * Any HSL hue between **260° and 340°**.

2. **Allowed Alternatives:**
    * **Primary:** Blue, Cyan, Teal, Emerald.
    * **Accent/Warm:** Orange, Amber, Gold.
    * **Danger:** Pure Red (#EF4444) or Orange-Red (#EA580C) - *No Pinkish-Reds*.

3. **Implementation Check:**
    * When adding gradients, always verify the hue range.
    * Review `settings.html` icons and `premium-design.css` regularly.
    * **Grep Check:** `grep -iE "purple|magenta|violet|#ec4899" .`

**Why?** To maintain a consistent, preferred aesthetic for the stakeholder.
