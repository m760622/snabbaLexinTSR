# design-system: Cyberpunk Energy ⚡

A premium, neon-infused design language for SnabbaLexin, characterized by glowing borders, pulse animations, and glassmorphism.

## 🎨 Core Colors

| Element | Color | Value |
|---------|-------|-------|
| **Background (Outer)** | Deep Navy | `#0f172a` |
| **Surface (Inner)** | Dark Slate | `rgba(30, 41, 59, 0.9)` |
| **Accent (Neon)** | Neon Cyan | `#00f3ff` |
| **Level: Beginner** | Emerald | `#10b981` |
| **Level: Intermediate**| Amber | `#f59e0b` |
| **Level: Advanced** | Red | `#ef4444` |

## ✨ Key Effects

### 1. Glassmorphism Card

```css
.cyber-card {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
    border: 1px solid rgba(0, 243, 255, 0.3);
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
}
```

### 2. Energy Bar (Left Edge)

A vertical bar that pulses with energy on the left side of cards.

```css
.cyber-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, rgba(0, 243, 255, 0.9), rgba(0, 243, 255, 0));
    animation: energyPulse 2s ease-in-out infinite;
}
```

### 3. Scanlines Overlay

Animated horizontal lines that move vertically across the surface.

```css
.cyber-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(0deg, rgba(0, 243, 255, 0.03) 0px, transparent 1px, transparent 2px);
    animation: scanMove 8s linear infinite;
    pointer-events: none;
}
```

## 🎞️ Animations

### energyPulse

```css
@keyframes energyPulse {
    0%, 100% { opacity: 0.6; filter: blur(0px); }
    50% { opacity: 1; filter: blur(2px); box-shadow: 0 0 10px currentColor; }
}
```

### scanMove

```css
@keyframes scanMove {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
}
```

## ⌨️ Usage Guidelines

1. **Contrast**: Always use high-contrast text (White/Slate-200) on dark surfaces.
2. **Icons**: Use SVG icons with `drop-shadow(0 0 4px rgba(0, 243, 255, 0.6))` to make them glow.
3. **Typography**: Use Swedish (Inter/Outfit) on left and Arabic (Tajawal/Noto Sans Arabic) on right.
