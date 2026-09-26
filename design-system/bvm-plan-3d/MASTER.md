# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** BVM PLAN 3D
**Generated:** 2026-09-26 16:38:10
**Category:** Construction/Architecture
**Design Dials:** Variance 6/10 (Balanced / Modern) | Motion 5/10 (Standard) | Density 4/10 (Standard)

---

## Global Rules

### Color Palette

> Arbitrage BVM : la recommandation « gris industriel + orange sécurité » est appliquée pour
> l'accent (appels à l'action, prix). L'identité BVM (nuit + cyan) est conservée pour les
> surfaces et l'univers plan/3D. Palette appliquée dans `bvm-plan-3d/css/style.css`.

| Role | Hex | CSS Variable (site) | Contraste vérifié |
|------|-----|---------------------|-------------------|
| Surface sombre (hero, écrans) | `#0A1317` | `--night` | — |
| Surface sombre relevée | `#0F1C22` | `--night-2` | — |
| Surface claire (plans) | `#ECF0EE` | `--paper` | — |
| Texte sur sombre | `#E8F0F2` | `--snow` | 16:1 sur `--night` |
| Texte secondaire sur sombre | `#9DB0B7` | `--snow-soft` | 8:1 |
| Texte sur clair | `#0C171B` | `--ink` | 16:1 sur `--paper` |
| Texte secondaire sur clair | `#44565C` | `--ink-soft` | 6,9:1 |
| Libellés discrets sur clair | `#56696F` | `--ink-faint` | 5:1 |
| Marque / plan / 3D (cyan BVM) | `#19B5E8` | `--cyan` | 7,9:1 sur `--night` |
| Cyan texte sur clair | `#086D91` | `--cyan-deep` | 5:1 |
| Accent / CTA (orange sécurité) | `#EA580C` | `--orange` | texte `#140801` dessus : 5,9:1 |
| Accent survol / prix sur sombre | `#F97316` | `--orange-hi` | 6:1 sur `--night-2` |
| Orange texte sur clair | `#B23A0B` | `--orange-deep` | 5,2:1 |
| Erreur | `#FF8A73` | `--error` | 7:1 sur `--night-2` |

**Note :** le texte blanc sur `#EA580C` (spécification d'origine du bouton) ne fait que 3,6:1 ;
le site utilise un texte quasi noir sur l'orange.

### Typography

> Le résultat généré (Inter + Playfair Display, humeur « éditorial / luxe ») ne correspond pas à
> un configurateur de construction ; la paire vérifiée lors de la recherche SaaS précédente est retenue.

- **Titres :** Archivo, largeur étendue (125 %), 650–800 — lecture « architecture / technique »
- **Texte :** Plus Jakarta Sans 400–700 (recommandation ui-ux-pro-max pour SaaS / web apps)
- **Cotes, étiquettes, montants :** IBM Plex Mono 400–500, chiffres tabulaires
- **Google Fonts :** `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400..700&display=swap`

### Spacing Variables

*Density: 4/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #EA580C;
  color: #140801; /* blanc = 3,6:1, insuffisant */
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #64748B;
  border: 2px solid #64748B;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #64748B;
  outline: none;
  box-shadow: 0 0 0 3px #64748B20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Hero-Centric Design

- **Conversion Strategy:** One primary CTA. Let the hero dominate the initial viewport without hiding the next content cue. Use a static hero and non-pulsing CTA when reduced motion is requested; provide video controls. Pause hero media offscreen/hidden and keep the final hero message and CTA static under reduced motion.
- **CTA Placement:** Hero dominant (center/bottom) + Sticky nav CTA
- **Section Order:** Full-bleed Hero (headline + visual) > Single value prop strip > Key benefit or proof > Primary CTA

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ 2D-only layouts
- ❌ Poor image quality
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
