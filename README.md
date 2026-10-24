# Valley Real Life 2027

A NextGen Rock RMS theme

## About this theme

This theme is a light-first, editorial take on the Valley Real Life brand. It is built on warm, green-tinted neutrals and VRL's signature green (#9BC93C), with bold uppercase Montserrat headlines, generous breathing room, and soft rounded shapes. The page is mostly bright and open, with deliberate dark bands (the utility bar, mega menu, Students, Messages and the footer) that act as moments of contrast rather than a separate dark theme. Each ministry gets its own personality inside one shared system: Kids is lighter, rounder and brighter, with circular crops and a green gradient field, while Students is darker and grittier, with torn-edge photo scraps. Motion carries the story. Instead of a stack of disconnected blocks, the homepage scrolls as one continuous sequence: the hero hands off to Next Steps, sections pin and slide over one another like a deck of cards, and the footer fades in as the closing move. The aim is a site that feels alive and welcoming while still pointing every visitor toward a clear next step.

## Technical details

The design is prototyped in [Concepts/Home2027-v1.5.html](Concepts/Home2027-v1.5.html), a self-contained concept page built for leadership review. The theme is the Rock implementation of that concept: the global shell (utility bar, navigation, footer) is wired into Rock zones and Lava, and the homepage sections are carried over as hardcoded markup until each is converted into blocks. Notes in the concept and the theme marked `ROCK:` flag what each piece still needs from Rock (Lava, content channels, routes).

- **Design tokens in three tiers.** Ported from the VRL design system (v4): Tier 1 primitives (the `v-green` and `v-neutral` scales), Tier 2 semantic tokens (brand, surface, text, spacing, radius, elevation, motion), and Tier 3 component rules that use semantic tokens only. Colors are defined in OKLCH, and tints such as the brand wash and glow come from relative color syntax. The tokens are bridged to Rock's: `--brand` reads Rock's primary color, and Rock's font tokens point at Montserrat, so Rock's own blocks pick up the brand.
- **Minimal dependencies.** Only two external resources: Google Fonts (Montserrat) and GSAP 3 with ScrollTrigger, used for scroll choreography only and loaded only by the homepage layout. Icons are an inline SVG sprite (Tabler drawings under a neutral `i-` prefix, ready to be swapped for custom artwork); no icon font on the designed surfaces.
- **Scroll-driven layout.** The hero-to-Next-Steps handoff is a scrubbed GSAP timeline inside a sticky viewport, so it reverses when you scroll back up. The Next Gen, Messages and Events sections use `position: sticky`, with a JS-computed `--stick-top` and a per-section `--cover-dwell` that controls how long each section stays visible before the next one slides over it.
- **Progressive enhancement.** The page starts with a `no-js` class. Without JavaScript, or when `prefers-reduced-motion` is set, every section renders as a normal static layout. The mega menu opens on hover/focus with CSS alone, the drawer sections are `<details>`, and the care trigger is a real link. Motion and dialogs are layered on top, never required.
- **Modern, mobile-first CSS.** Fluid type and spacing use `clamp()`. Event cards use container queries. The nav row, mega menu and footer share one grid template (`--menu-grid`) whose column count follows the page tree, so sub-navigation lines up under its parent link.
- **State through data attributes.** Interactive pieces (header solid/stuck states, mega menu, mobile drawer, care dialog, Messages player, share menus) are driven by `data-*` attributes and ARIA state rather than class toggling.
- **Light mode only.** Rock's dark-mode scopes are neutralised in `_tokens.scss`; the dark bands are inversions inside a light page, not a theme.

### How the theme is put together

Rock v18's NextGen theme system: `theme.json` registers the theme and its admin fields, Rock rewrites the marker regions of `Styles/theme.css` when those fields are saved, and `styles-v2/core.css` supplies the token system and Rock's own component styles.

| Path | What lives there |
| --- | --- |
| `theme.json` | Tells Rock this is a NextGen theme; the fields shown in the admin theme editor |
| `Layouts/Site.Master` | The site shell: global alert, utility bar, header and footer zones, fonts, scripts, icon sprite |
| `Layouts/Homepage.aspx` | Homepage: the Main zone plus the homepage-only scripts (GSAP, `home.js`) |
| `Layouts/InnerDefault.aspx` | Interior pages (the default): page header (SideImage by default, or SimpleStripe, per the `PageHeaderStyle` page attribute) + Feature, Main, Section A–D zones in the 1240px container |
| `Layouts/FullWidth.aspx` | Deprecated copy of InnerDefault, kept until its pages are reassigned in Rock; then delete it |
| `Layouts/Landing.aspx` | Section landing pages: title band with the page description, Feature / Main / Section A zones |
| `Layouts/Blank.aspx`, `Dialog.aspx`, `Error.aspx` | Rock's required utility layouts (from the reference template) |
| `Assets/Lava/UtilityBar.lava` | HTML block include: Request care · Give · Login (or the account menu when signed in), plus the care dialog |
| `Assets/Lava/PageNav.lava` | Page Menu template: nav row, mega menu and mobile drawer from one block |
| `Assets/Lava/Home.lava` | HTML block include: the hero / Next Steps and Kids + Students sections, hardcoded from the concept for now |
| `Assets/Lava/HomeMessages.lava` | HTML block include: Messages (live Resi player or the latest message + play in place, the 7 previous series, blurred series background), via entity commands |
| `Assets/Lava/HomeEvents.lava` | HTML block include: the homepage's What's Happening cards (live events via a `{% sql %}` query adapted from the Connect theme) + the footer runway |
| `Assets/Lava/Footer.lava` | HTML block include: the menu reflected (reads the page tree), visit info, bar |
| `Assets/Lava/SubpageList.lava` | HTML block include for Landing pages: the current page's children as alternating image cards (`PageImage`, optional `CallToAction` page attributes) |
| `Assets/Lava/PopularPages.lava` | HTML block include (first used on the 404 page): the most-viewed pages one level below the nav sections, ranked from the Interaction table over 90 days |
| `Assets/Lava/SiteSearch.lava` | HTML block include: the search pill with live results (fetched from a Lava Application endpoint as you type; rendered in place when the URL has `?q=`) |
| `Assets/Lava/SiteSearchResults.lava` | The search results fragment, shared by the endpoint and `SiteSearch.lava`: pages on this site, messages, series, queried directly with SQL |
| `Assets/Lava/Partials/IconSprite.lava` | The inline SVG icon sprite + logo ink filter, included once by `Site.Master` |
| `Assets/Scripts/theme.js` | Site-wide behaviour: header, mega menu, drawer, care dialog, cover sections, footer reveal |
| `Assets/Scripts/home.js` | Homepage only: events rail, Messages player, GSAP choreography |
| `Styles/theme.scss` | Entry point: Rock's marker comments, partial order, `core.css` import |
| `Styles/_tokens.scss` | Rock base tokens (must match `theme.json`) + the VRL tiers + light-mode lock |
| `Styles/_base.scss` … `_page.scss` | One partial per region: base, utility bar, header, care modal, footer, interior page |
| `Styles/_site-alert.scss` | The global alert banner, including how to add seasonal looks (e.g. `alert-christmas`) |
| `Styles/_home.scss` | Homepage section styles |
| `Styles/_popular-pages.scss` | Popular pages cards (horizontal event-card style) |
| `Styles/_search.scss` | Site search: the design system's search pill and the grouped live results |
| `tools/` | `build.mjs` (the theme build), `check-theme.mjs` and `check-master-bindings.mjs` (gates) |
| `Resources/RockNextgenThemeTemplate/` | The boilerplate NextGen starter theme, kept as reference only |

### Rock setup

Blocks to add on the site (parent page **41952**). The first three go at the Site level so every layout shares them:

| Zone | Block | Settings |
| --- | --- | --- |
| Alert | HTML Content | content: just the message, written in the editor (no HTML needed) · schedule with the block's Display from / to dates · optional CSS Class (Advanced) for a seasonal look |
| Utility | HTML Content | content: `{% include '~~/Assets/Lava/UtilityBar.lava' %}` · Enabled Lava Commands: **RockEntity** (the account menu lists My Account, page 42015, and its child pages) |
| Navigation | Page Menu | Root Page: 41952 · Number of Levels: 2 · Template: `{% include '~~/Assets/Lava/PageNav.lava' %}` |
| Footer | HTML Content | content: `{% include '~~/Assets/Lava/Footer.lava' %}` · Enabled Lava Commands: **RockEntity** |
| Main (homepage only, Page level) | HTML Content | content: `{% include '~~/Assets/Lava/Home.lava' %}` · Cache Duration: 0 while iterating |
| Main (homepage only, Page level, after the Home block) | HTML Content | content: `{% include '~~/Assets/Lava/HomeMessages.lava' %}` · Enabled Lava Commands: **RockEntity** · Cache Duration: 0 while iterating |
| Main (homepage only, Page level, after the Messages block, last in the zone) | HTML Content | content: `{% include '~~/Assets/Lava/HomeEvents.lava' %}` · Enabled Lava Commands: **Sql** · Cache Duration: 0 while iterating |
| Main (404 page, or any page that offers search, Page level) | HTML Content | content: `{% include '~~/Assets/Lava/SiteSearch.lava' %}` · Enabled Lava Commands: **RockEntity, Sql** |
| Section A (404 page, Page level) | HTML Content | content: `{% include '~~/Assets/Lava/PopularPages.lava' %}` · Enabled Lava Commands: **Cache, RockEntity, Sql** |

**Live search endpoint:** under Admin Tools → Lava Applications, add a GET endpoint (slug `site/search` in application 1, giving `/api/v2/lava-app/1/site/search`; change `searchEndpoint` in `SiteSearch.lava` if yours differs), open to all users (it only returns public content), Enabled Lava Commands **RockEntity, Sql**, with this code:

```
{% assign searchQuery = QueryString.q %}
{% include '~/Themes/2027 VRL External/Assets/Lava/SiteSearchResults.lava' %}
```

**Page header style:** create a Page attribute `PageHeaderStyle` (Single-Select, values `SideImage^Side image,SimpleStripe^Simple stripe`, default `SideImage`) under Admin Tools → Entity Attributes (entity type: Page). InnerDefault pages use SideImage when it's empty: a card with the title, the page Description and the `PageImage` overlapping a gray stripe. SimpleStripe is the plain gray band.

**Excluding the alert from a page:** create a Page attribute `ExcludeGlobalAlert` (Boolean, shown as a checkbox, default unchecked) under Admin Tools → Entity Attributes (entity type: Page). Check it on pages that shouldn't show the alert, such as the login page; `Site.Master` then doesn't render the banner there. Visitors who dismiss the alert won't see it again for the rest of their browser session, but a different message shows again.

Give the app pool write access to the theme folder (Rock saves theme-editor choices into `theme.css`), then restart Rock so it registers the theme. Non-page details in the nav and footer (address, service times, office and playground hours, social links, the Discover and Privacy links) are hardcoded in `PageNav.lava` and `Footer.lava` for now, duplicated between the two, until they are pulled from schedules, campus and global attributes.

### Building the styles

`Styles/theme.css` is generated; never edit it by hand, and never reword the `/* CSS Overrides … */` comments in `theme.scss` (Rock searches for them word for word).

Always build with `npm run build`, never a bare `sass` call. Rock writes the icon-set imports (Tabler, Font Awesome; its admin UI needs them) into the Top override region of `theme.css`, and a plain compile wipes them. `tools/build.mjs` carries that region over from the existing file, or seeds it from `theme.json`'s `availableIconSets`, and `npm run check` fails if it's missing. The Bottom region (theme-editor values, custom CSS) is intentionally reset on each build; Rock rewrites it on the next theme save.

```sh
npm install        # once: installs dart-sass into node_modules (git-ignored)
npm run build      # compiles Styles/theme.scss -> Styles/theme.css, keeping Rock's icon imports
npm run check      # verifies markers, theme.json ↔ _tokens.scss sync, import order, Site.Master bindings
npm run watch      # rebuilds on every save
```

If you change a default colour or font, change it in both `theme.json` and `Styles/_tokens.scss`; `npm run check` tells you if they drift.

### The concept and the theme

`Styles/_home.scss`, `Assets/Lava/Home.lava`, `Assets/Scripts/home.js` and `Assets/Lava/Partials/IconSprite.lava` were first ported from the concept by a script. The theme is now the source of truth: edit these files directly. The concept files in `Concepts/` stay as the design reference and are never modified.

Created by Kjell Nygren
[Github repository for this theme](https://github.com/ValleyRealLife/2027-VRL-External)
