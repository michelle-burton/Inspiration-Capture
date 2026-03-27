# Design System Document: Creative Companion

## 1. Overview & Creative North Star
**Creative North Star: "The Neon Curator"**

This design system is engineered to bridge the gap between the raw, expressive energy of a **Creative Studio** and the precise, high-performance logic of a **Tech Startup**. In the chaotic, visually saturated environment of a professional convention, this system acts as a focused lens. It moves away from "standard" dashboard aesthetics, instead favoring a **High-End Editorial** approach.

We break the "template" look through:
- **Intentional Asymmetry:** Using the spacing scale (e.g., `10` vs `12`) to create a rhythmic, non-linear flow.
- **Atmospheric Depth:** Replacing rigid borders with glowing gradients and tonal shifts.
- **Dynamic Scale:** Utilizing hyper-bold display type against utilitarian labels to create an authoritative, curated hierarchy.

---

## 2. Colors & Surface Philosophy
The palette is a high-contrast interplay between deep "Void" backgrounds and electric "Neon" accents.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. A `surface-container-low` card sitting on a `surface` background is the only "border" you need. This creates a sophisticated, seamless interface that feels like a singular piece of hardware rather than a web page.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of tinted, frosted glass.
- **Base Level:** `surface` (#0d0e12) for the main canvas.
- **Lower Level:** `surface-container-low` (#121318) for secondary navigation or background grouping.
- **Highest Level:** `surface-container-highest` (#24252b) for primary interactive cards.
- **Nesting:** Always elevate importance by moving "up" the container tier (Lowest → Highest).

### The "Glass & Gradient" Rule
To capture the "Creative Studio" energy, use **Glassmorphism** for floating elements (Action Buttons, Overlays). Use `surface-variant` at 60% opacity with a `backdrop-blur` of 20px. 
**Signature Texture:** For Hero CTAs, use a linear gradient from `primary` (#81ecff) to `primary-container` (#00e3fd) at a 135-degree angle to provide a "liquid" feel.

---

## 3. Typography
The system utilizes two distinct voices: **Space Grotesk** for architectural impact and **Manrope** for human readability.

- **Display (Space Grotesk):** Massive, bold, and unapologetic. Use `display-lg` (3.5rem) for section intros to anchor the user's eye in a crowded room.
- **Headline (Space Grotesk):** Used for primary navigation titles. These should feel like a tech-startup's mission statement.
- **Title & Body (Manrope):** The "Note-taking" engine. Use `body-lg` for user-generated content and `title-sm` for metadata. Manrope’s geometric yet friendly nature ensures legibility during fast-paced convention networking.
- **Labels (Manrope):** Use `label-md` in `on-surface-variant` (#abaab0) for technical data points (booth numbers, timestamps).

---

## 4. Elevation & Depth
We eschew traditional material shadows in favor of **Tonal Layering** and **Ambient Glows.**

- **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-low` section creates a "recessed" look, perfect for input fields.
- **Ambient Shadows:** For floating modals, use an extra-diffused shadow: `blur: 40px`, `y: 20px`, `opacity: 8%`. The shadow color must be a tinted version of `secondary` (#a68cff) to simulate the glow of a neon sign.
- **The "Ghost Border" Fallback:** If a container requires extra definition on complex backgrounds, use a **Ghost Border**: `outline-variant` (#47484c) at **15% opacity**. Never use 100% opaque strokes.
- **Glassmorphism:** Apply to any element that "hovers" over the main content (e.g., a sticky header). Use `surface-container` with 70% opacity and a heavy blur to let the vibrant `tertiary` (#ff6c95) accents bleed through from behind.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`). Roundedness: `full`. No border. Text: `on-primary` (Bold).
- **Secondary:** Surface-container-high fill with a `primary` Ghost Border (20% opacity).
- **Tertiary:** Text-only in `secondary` (#a68cff) with an icon. No background.

### Cards & Lists
- **The "No Divider" Rule:** Forbid the use of divider lines. Separate list items using `spacing-4` (1rem) of vertical white space or a subtle shift from `surface-container-low` to `surface-container`.
- **Convention Cards:** Use `rounded-xl` (1.5rem). The header of the card should use `headline-sm` to make the booth name or artist name pop.

### Quick Capture Inputs
- **Input Fields:** Use `surface-container-lowest` with a `rounded-md` (0.75rem) corner. The active state should not be a border change, but a subtle "glow" using a 1px `primary` ghost border at 40% opacity.

### Selection Chips
- Use `rounded-full` with `secondary-container` backgrounds. When selected, the chip should "ignite" with a `secondary` fill and `on-secondary` text.

---

## 6. Do's and Don'ts

### Do
- **Do** use `tertiary` (#ff6c95) sparingly as a "hot" accent for urgent notifications or "Live" convention events.
- **Do** embrace negative space. If a screen feels crowded, increase the spacing from `8` (2rem) to `12` (3rem).
- **Do** use `rounded-full` for all action-oriented elements (buttons, chips) to contrast against the `rounded-xl` content containers.

### Don't
- **Don't** use pure white (#ffffff). Always use `on-surface` (#faf8fe) to prevent eye strain in dark environments.
- **Don't** use standard "Drop Shadows." If it doesn't look like a soft neon glow, it doesn't belong in this system.
- **Don't** use 1px borders to separate content. Let the tonal shifts of the `surface-container` scale do the work.
- **Don't** center-align everything. Use left-aligned "Editorial" layouts to maintain the "Creative Studio" aesthetic.