# Valley Real Life 2027

A NextGen Rock RMS theme

## About this theme

This theme is a light-first, editorial take on the Valley Real Life brand. It is built on warm, green-tinted neutrals and VRL's signature green (#9BC93C), with bold uppercase Montserrat headlines, generous breathing room, and soft rounded shapes. The page is mostly bright and open, with deliberate dark bands (the utility bar, mega menu, Students, Messages and the footer) that act as moments of contrast rather than a separate dark theme. Each ministry gets its own personality inside one shared system: Kids is lighter, rounder and brighter, with circular crops and a green gradient field, while Students is darker and grittier, with torn-edge photo scraps. Motion carries the story. Instead of a stack of disconnected blocks, the homepage scrolls as one continuous sequence: the hero hands off to Next Steps, sections pin and slide over one another like a deck of cards, and the footer fades in as the closing move. The aim is a site that feels alive and welcoming while still pointing every visitor toward a clear next step.

## Technical details

The design is prototyped in [Concepts/Home2027-v1.5.html](Concepts/Home2027-v1.5.html), a self-contained concept page built for leadership review and for handing off into this Rock theme. Notes in that file marked `ROCK:` flag where static demo markup should become Lava, content channel items, or Rock blocks.

- **Design tokens in three tiers.** Ported from the VRL design system (v4): Tier 1 primitives (the `v-green` and `v-neutral` scales), Tier 2 semantic tokens (brand, surface, text, spacing, radius, elevation, motion), and Tier 3 component rules that use semantic tokens only. Colors are defined in OKLCH, and tints such as the brand wash and glow come from relative color syntax (`oklch(from var(--brand) ...)`).
- **Minimal dependencies.** Only two external resources: Google Fonts (Montserrat) and GSAP 3 with ScrollTrigger, used for scroll choreography only. Icons are Tabler Icons inlined as an SVG sprite, with no icon font.
- **Scroll-driven layout.** The hero-to-Next-Steps handoff is a scrubbed GSAP timeline inside a sticky viewport, so it reverses when you scroll back up. The Next Gen, Messages and Events sections use `position: sticky`, with a JS-computed `--stick-top` and a per-section `--cover-dwell` that controls how long each section stays visible before the next one slides over it.
- **Progressive enhancement.** The page starts with a `no-js` class. Without JavaScript, or when `prefers-reduced-motion` is set, every section renders as a normal static layout (for example, the step cards sit in a plain grid). Motion is layered on top, never required.
- **Modern, responsive CSS.** Fluid type and spacing use `clamp()`. Event cards use container queries. The mega menu highlights columns with `:has()`. The nav row, mega menu and footer share one grid template (`--menu-grid`) so sub-navigation lines up under its parent link. On phones, the side-by-side Kids/Students band falls back to two stacked sections with `display: contents`.
- **State through data attributes.** Interactive pieces (header solid/stuck states, mega menu, mobile nav, care modal, Messages player, share menus) are driven by `data-*` attributes and ARIA state rather than class toggling, which keeps the CSS readable and the markup accessible.
- **Review tooling.** Concept-only switchers (marked `REVIEW`) let reviewers compare design options side by side. They are meant to be removed once a direction is chosen.
- **Theme build (planned).** The project is still in the HTML concept stage. Once the design is settled, it will be built as a theme on Rock v18's NextGen theme system (`theme.json` fields and styles-v2 tokens). The scaffold already includes a Sass build (`npm run build`) and a validation script (`npm run check`) for the theme and master page bindings.

Created by Kjell Nygren
[Github repository for this theme](https://github.com/ValleyRealLife/2027-VRL-External)
