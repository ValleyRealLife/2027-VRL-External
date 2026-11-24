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
| `Layouts/InnerDefault.aspx` | Interior pages (the default): page header (SideImage by default; the `PageHeaderStyle` page attribute picks another style, such as Banner, or none) + Feature, Main, Section A–D zones in the 1240px container |
| `Layouts/FullWidth.aspx` | Deprecated copy of InnerDefault, kept until its pages are reassigned in Rock; then delete it |
| `Layouts/Landing.aspx` | Section landing pages: the same page header (SimpleGradStripe by default, per the `PageHeaderStyle` page attribute) + Feature / Main / Section A zones |
| `Layouts/Blank.aspx`, `Dialog.aspx`, `Error.aspx` | Rock's required utility layouts (from the reference template). Blank also loads Montserrat, the icon sprite and theme.js (deferred) and marks `html.is-framed` inside an iframe, for pages shown in the site's pop-ups (Life Group details) |
| `Assets/Lava/UtilityBar.lava` | HTML block include: Request care · Give · Login (or the account menu when signed in), plus the care dialog |
| `Assets/Lava/PageNav.lava` | Page Menu template: nav row, mega menu and mobile drawer from one block |
| `Assets/Lava/Home.lava` | HTML block include: the hero / Next Steps and Kids + Students sections, hardcoded from the concept for now |
| `Assets/Lava/HomeMessages.lava` | HTML block include: Messages (live Resi player or the latest message + play in place, the 7 previous series, blurred series background), via entity commands |
| `Assets/Lava/HomeEvents.lava` | HTML block include: the homepage's What's Happening cards (live events via a `{% sql %}` query adapted from the Connect theme) + the footer runway |
| `Assets/Lava/Events.lava` | HTML block include for the events page: Featured rail (audience 150), audience filter chips, All events grid (`{% sql %}`, calendar 1) |
| `Assets/Lava/EventDetail.lava` | Lava Template for the Calendar Event Item Occurrence Lava block on the event detail page (route `events/{EventOccurrenceId}`): header photo + og:image from the event, description, when / contact / note card, Details URL or Register, Add to calendar, Share; PromotionStart gate |
| `Assets/Lava/EventRelated.lava` | HTML block include under the event detail block: "You might also like" rail (shared audiences, then page views from the Interaction table, then soonest) |
| `Assets/Lava/Partials/EventVisibleOccurrences.lava` | Shared SQL CTEs: upcoming occurrences past their PromotionStart, with IsNew (Events.lava, EventRelated.lava) |
| `Assets/Lava/Partials/EventCard.lava` | The event card, shared by HomeEvents.lava and Events.lava |
| `Assets/Lava/Footer.lava` | HTML block include: the menu reflected (reads the page tree), visit info, bar |
| `Assets/Lava/SubpageList.lava` | HTML block include for Landing pages: the current page's children as alternating image cards (`PageImage`, optional `CallToAction` page attributes) |
| `Assets/Lava/PopularPages.lava` | HTML block include (first used on the 404 page): the most-viewed pages one level below the nav sections, ranked from the Interaction table over 90 days |
| `Assets/Lava/LiveService.lava` | HTML block include for the watch-live page: a status bar (Live now / See you next weekend) and the message widget (today's message beside the Resi player in the service window, the latest message otherwise), What's next cards and featured events. One block for now; each band is a self-contained section ready to become its own block |
| `Assets/Lava/MessagesLatest.lava` | HTML block include for the messages page: a Live now bar during the live window, then the latest message (Rock media player, title, date · speaker, series, Content) |
| `Assets/Lava/SeriesBrowse.lava` | HTML block include for the messages page: "All series" divider, every started series as cards with a Grid / Detail toggle (Detail adds About / Messages tabs linking to each message), revealed in batches as you scroll |
| `Assets/Lava/SeriesDetail.lava` | HTML block include for the series page: YouTube's watch layout: the player with the message's details under it and the series' messages as a playlist beside it, plus a Theater mode (each message is its own URL on the same page, `/{series}/{message}`, with cross-document view transitions; `/{series}` alone redirects to its newest message), and popular messages from page views below |
| `Assets/Lava/MyAccount.lava` | HTML block include for the My Account page: a bento grid of the signed-in person's profile, family (one Manage family button to the profile page), giving summary with Give and Manage giving, communication preferences, groups (leaders get Manage) and connection requests; empty tiles are left out |
| `Assets/Lava/ManageGiving.lava` | HTML block include for the manage-giving page: pill tabs (Summary, Payment methods, Recurring, History) that show and hide whole blocks by CSS Class, the Merlin Give button, and the Summary panel (this year / last year / last gift / recurring, recent gifts) |
| `Assets/Lava/GivingRecurringEmpty.lava` | HTML block include for the Recurring tab: a "No recurring gifts yet" tile with a Merlin button, shown only when the family has no active scheduled gifts |
| `Assets/Lava/GivingStatements.lava` | Lava Template for the Contribution Statement List Lava block: a list of statement-year links (left of the Transaction Report on desktop, if that block is shown) |
| `Assets/Lava/Partials/MerlinGive.lava` | The green Give button that opens Simple Donation's Merlin widget (loads Merlin's script once per page) |
| `Assets/Lava/Partials/LatestMessage.lava` | The message widget: a player beside the title, date · speaker, shortened Content and series tag. `latest` mode (Rock media player, newest watchable message) or `live` mode (Resi player, today's message); options for a tag above the title and a View previous messages link. Shared by `MessagesLatest.lava` and both states of the live page |
| `Assets/Lava/Partials/MessageResources.lava` | A message's Sermon notes (child item `YouVersionURL`) and Group questions (`GroupQuestions` URL, else `GroupQuestionsFile`) as pill links opening in a new tab; used by the series page's control strip and the message widget |
| `Assets/Lava/LoginMedia.lava` | HTML block include for the login page: the PageImage of the page in `?returnurl=`, shown beside the login form from 900px |
| `Assets/Lava/SiteSearch.lava` | HTML block include: the search pill with live results (fetched from a Lava Application endpoint as you type; rendered in place when the URL has `?q=`) |
| `Assets/Lava/SiteSearchResults.lava` | The search results fragment, shared by the endpoint and `SiteSearch.lava`: pages on this site, messages, series, queried directly with SQL |
| `Assets/Lava/Partials/IconSprite.lava` | The inline SVG icon sprite + logo ink filter, included once by `Site.Master` |
| `Assets/Scripts/theme.js` | Site-wide behaviour: header, mega menu, drawer, care dialog, cover sections, footer reveal |
| `Assets/Scripts/home.js` | Homepage only: Messages player, GSAP choreography (the events rail arrows are in theme.js) |
| `Styles/theme.scss` | Entry point: Rock's marker comments, partial order, `core.css` import |
| `Styles/_tokens.scss` | Rock base tokens (must match `theme.json`) + the VRL tiers + light-mode lock |
| `Styles/_base.scss` … `_page.scss` | One partial per region: base, utility bar, header, care modal, footer, interior page |
| `Styles/_site-alert.scss` | The global alert banner, including how to add seasonal looks (e.g. `alert-christmas`) |
| `Styles/_home.scss` | Homepage section styles (also the event card and rail, used by the events page) |
| `Styles/_events.scss` | The events page: filter chips, count, All events grid |
| `Styles/_content.scss` | Content pages (hand-built HTML in an HTML block): lead, ink band, pull quote, photo split, verse, meeting times, photo mosaic, image gallery, social pills, photo placeholders, tiles, books, FAQ, the **On this page** glass jump list (`.content-toc-scope`, highlight in theme.js), numbered items, scripture lines, green panel, photos, photo cards |
| `Resources/PageContent/` | Content pages' source: the approved text (`.md`) and the HTML block content built from it (`OurBeliefs.html`), plus notes explaining a page's changes for approval (`Care-notes.md`, `Lifegroups-notes.md`) |
| `Styles/_video-hero.scss` | The video hero: a page's opening ink band with its featured video hanging out of the band into the page (split or stacked layout) |
| `Styles/_group-finder.scss` | The group finder (LifeGroupSearch.lava): the quiz card (progress, answer buttons with counts, Back / Next), the results head (count, Soonest / Closest to me, Start over), the sticky filter bar (a button per question; its panel grows the bar and pushes the cards down instead of covering them), the left-out note, the group cards (Drop in sticker, childcare icon), and the view transition when filters or sort change (cards slide, new ones fade in) |
| `Styles/_group-detail.scss` | The Life Group card (LifeGroupDetails.lava): page and in-pop-up (`html.is-framed`) variants, band, facts, map (approximate circle), the flattened registration form on the back; and the finder's pop-up (`.group-modal`: iframe sized to its page, sticky close, loading card) |
| `Assets/Lava/GiveHero.lava` | HTML block include for the Give page's Feature zone: its video hero (media 733, the Merlin Give now button) |
| `Assets/Lava/RenewHero.lava` | HTML block include for the Renew page's Feature zone: its video hero (media 1147, "Find your next step") |
| `Assets/Lava/Location.lava` | HTML block include for the Location page (`about/location`): Barker campus card with map, a "Can't make it?" aside with where-to-watch row links, What to expect, Kids and Students (the MSM and HSM events from Rock; block needs RockEntity) |
| `Assets/Lava/Outreach.lava` | HTML block include for the Outreach page (`ministries/outreach`, Main zone), laid out like Renew, all on one page: Acts 1:8 feature + vision statement; Global outreach (partners, Uganda and Philippines open a photo + bio modal); Short-term opportunities (bento photos, upcoming and past trips); Local outreach (pray for our people; partners by focus). PLACEHOLDER/TODO markers where the Outreach team's content or a feature is still to come |
| `Assets/Lava/OutreachHero.lava` | Outreach page hero (Feature zone): VideoHero with a placeholder until there's a video (`heroPlaceholder`), no button |
| `Assets/Lava/Care.lava` | HTML block include for the Care page (`ministries/care`, Main zone), laid out like Renew: Matthew 11:28 feature, prayer requests (opens the care dialog at the prayer form), a photo bento (placeholders), VRL Care (The Care Center + VRL Compassion combined: what we help with, Request care, the Care Center's address) beside an aside for counseling with The Couch |
| `Assets/Lava/CareHero.lava` | Care page hero (Feature zone): VideoHero with a placeholder until there's a video; its Request care button opens the utility bar's care dialog (`data-care-trigger`) |
| `Assets/Lava/Lifegroups.lava` | HTML block include for the Life Groups page (`ministries/life-groups`, Main zone; needs RockEntity): Hebrews 10 feature, a sticky in-page nav, photo bento (placeholders), New to Life Groups? (Rooted from its event occurrence, `rootedOccurrenceId`, as a `content-promo` card while it's scheduled), Join a group (on site, drop in, off site → the group finder, filtered; FINDER settings), Group resources (this week's group questions from the latest message, past questions, RightNow Media) beside a leaders' aside linking to My Account's My groups (`#my-groups`) |
| `Assets/Lava/FindGroup.lava` | HTML block include for the group finder's start page (`next-steps/find-a-group`, Main zone; needs **RockEntity**, Cache Duration 0): Start here (for everyone except someone signed in who's already in an active Life Group, type 25: Rooted via `Partials/EventPromo.lava` beside a drop-in tile), Group finder (photos beside Launch the group finder; `finderUrl` = the search page, `next-steps/find-a-group/search`), and a crosslink to the Life Groups page |
| `Assets/Lava/LifeGroupSearch.lava` | HTML block include for the group finder (`next-steps/find-a-group/search`, Main zone; needs **RockEntity**): every public, active Life Group (type 25) as a card carrying its answers as data (GroupComp, DaysOfWeek, Topic = Sermon Series, HasChildcare incl. Ask for Details, IsDropInGroup, at VRL = the campus location or 1831 S Barker, town; coordinates rounded to ~1 km). A quiz (kind of group, days, message, childcare, at VRL, area) with live counts and Skip to all groups; on the results, a sticky filter bar to change any answer, Clear all and Start over; answers live in the address (`who`, `days`, `content`, `childcare`, `where`, `area`, `dropin`, `all`), so links with answers skip the quiz. No match: answers are left out until groups show. Soonest / Closest to me. Cards: a band in the kind of group's colour (`colorByGroupType`), Drop in sticker, childcare icon; a card opens the group (LifeGroupDetails.lava) in a pop-up (`?group=ID` in the address), or goes to the group's `AlternateSignup` address when it has one. Full groups (capacity set and reached) hidden (`showFullGroups`). Behaviour: theme.js "Group finder"; styles: `Styles/_group-finder.scss` |
| `Assets/Lava/LifeGroupDetails.lava` | HTML block include for one Life Group (`next-steps/find-a-group/details?GroupId=`, **Blank** layout, Main zone; needs **RockEntity**), shown in the finder's pop-up or on its own: a card with a band in the group's colour (kind, name, when), description, facts (when, where, who, content, childcare, drop in, leaders), a Google static map (ApproxGeo: town only, rounded point, shaded circle, no pin) and Sign up / Back to groups / a share button (the design system's share menu, linking to this page). Rock's **Group Registration** block goes below it (found by Rock's `group-registration` class, or CSS Class `group-signup`): theme.js moves it into the card's back and Sign up flips the card. `AlternateSignup` (an address) replaces the flip; full groups show a note. Only active, public groups (`requirePublic`). Styles: `Styles/_group-detail.scss` |
| `Assets/Lava/Kids.lava` | HTML block include for the VRL Kids page (`ministries/kids`, Main zone), laid out like Renew: Matthew 19:14 feature, a sticky in-page nav, photo bento (placeholders), Your first visit (pre-register, New Family kiosk, pick-up), Kids classes (Early childhood, Elementary), Indoor playground beside its hours, Milestones (child dedication, kids baptism), Serve with VRL Kids. The staff photo is left out for now; `Resources/PageContent/Kids-notes.md` has the copy for approval |
| `Assets/Lava/KidsHero.lava` | Feature-zone include for the Kids page's video hero (`heroTheme 'kids'`: the homepage VRL Kids section's green field and scribbles; the VRL Kids wordmark as the title; Pre-register button). Page: PageHeaderStyle Hidden, DarkHeader checked |
| `Assets/Lava/Students.lava` | HTML block include for the VRL Students page (`ministries/students`, Main zone; needs **RockEntity, Sql**), laid out like the other ministry pages: 1 Timothy 4:12 feature, a sticky in-page nav, photo bento, Middle school and High school (each beside its weekly night's card: MSM 618, HSM 617, `Partials/EventPromo.lava`), Student events (Students audience 1555, featured first, in a rail; See all → `/next-steps/events?audience=1555`), Next steps (student baptism, serve). `Resources/PageContent/Students-notes.md` has the copy for approval |
| `Assets/Lava/StudentsHero.lava` | Feature-zone include for the Students page's video hero (`heroTheme 'students'`: the homepage VRL Students section's charcoal and grain). Page: PageHeaderStyle Hidden, DarkHeader checked |
| `Assets/Lava/Baptism.lava` | HTML block include for the Baptism page (`next-steps/baptism`, Main zone, SideImage page header): the opening line, then a verse banner (`content-banner`, two-thirds) beside "Ready to be baptized?" (opens the baptism interest workflow in the form dialog; `interestFormUrl` is a placeholder until the page exists), the current page's FAQs, and next steps (The Journey, a Life Group, the Baptism & Prayer Team) |
| `Assets/Lava/LifegroupsHero.lava` | Life Groups page hero (Feature zone): VideoHero with a placeholder until there's a video; Find a group jumps to Join a group |
| `Assets/Lava/Partials/VideoHero.lava` | The video hero's markup, for ministry pages: title (page title), lead (page Description), actions, Rock media element, embed or a labelled placeholder (`heroPlaceholder`); `heroTheme` (`'kids'` / `'students'`: the homepage Kids or Students colours) and `heroTitleHtml` (a wordmark in the h1); `?hero=split` / `?hero=stacked` to compare |
| `Assets/Lava/Partials/EventPromo.lava` | One event as a card (`content-promo`): its photo (a logo, never cropped), next date and a button, linking to `/events/{id}`; renders nothing unless the event is scheduled. Set `promoOccurrenceId` (and optionally `promoButtonText`); the calling block needs RockEntity. Used for Rooted (Life Groups) and MSM/HSM (Students) |
| `Styles/_popular-pages.scss` | Popular pages cards (horizontal event-card style) |
| `Styles/_search.scss` | Site search: the design system's search pill and the grouped live results |
| `Styles/_login.scss` | Rock's stock Login block (unchanged in Rock) restyled as a centred card; `theme.js` adds the Phone or email / Username & password tabs |
| `Styles/_live.scss` | The watch-live page's bands (stage, What's next, featured events) |
| `Styles/_sermons.scss` | The messages page: live bar, latest message, divider, series cards (grid and detail views) |
| `Styles/_account.scss` | The My Account bento grid: tiles, family people, rows and badges |
| `Styles/_giving.scss` | The manage-giving page: pill tabs (any number of tabs), panel cards, summary stats (swipe rail on phones), statement year list |
| `Archive/` | Retired versions kept for reference, by date (not loaded by the theme): `2026-10-28-live-offair/` is the live page before the off-air redesign |
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
| Main (events page on InnerDefault) | HTML Content | content: `{% include '~~/Assets/Lava/Events.lava' %}` · Enabled Lava Commands: **Sql** · Cache Duration: 0 while iterating |
| Main (event detail page on InnerDefault, route `events/{EventOccurrenceId}`) | Calendar Event Item Occurrence Lava | Lava Template: `{% include '~~/Assets/Lava/EventDetail.lava' %}` · Set Page Title: Yes · Registration Page: the registration page |
| Main (event detail page, after the occurrence block) | HTML Content | content: `{% include '~~/Assets/Lava/EventRelated.lava' %}` · Enabled Lava Commands: **Sql** · Cache Duration: 0 while iterating |
| Feature (watch-live page on InnerDefault, PageHeaderStyle Hidden, Page Cacheability No-Store) | HTML Content | content: `{% include '~~/Assets/Lava/LiveService.lava' %}` · Enabled Lava Commands: **RockEntity, Calendar Events** |
| Main (messages page on InnerDefault), first block | HTML Content | content: `{% include '~~/Assets/Lava/MessagesLatest.lava' %}` · Enabled Lava Commands: **RockEntity** · Cache Duration 0 |
| Main (messages page), second block | HTML Content | content: `{% include '~~/Assets/Lava/SeriesBrowse.lava' %}` · Enabled Lava Commands: **RockEntity, Sql** · Cache Duration 600 |
| Main (series page on InnerDefault, PageHeaderStyle SimpleGrayStripe; routes `watch/previous-messages/{slug}` and `watch/previous-messages/{slug}/{message}`) | HTML Content | content: `{% include '~~/Assets/Lava/SeriesDetail.lava' %}` · Enabled Lava Commands: **RockEntity, Sql, Cache** · Cache Duration 0 |
| Main (My Account page on InnerDefault, route `my-account`; page security: authenticated users) | HTML Content | content: `{% include '~~/Assets/Lava/MyAccount.lava' %}` · Enabled Lava Commands: **Sql** · Cache Duration **0** (personal) |
| Main (manage-giving page on InnerDefault, route `my-account/manage-giving`; page security: authenticated users), in this order | 1. HTML Content: `{% include '~~/Assets/Lava/ManageGiving.lava' %}` · **Sql** · Cache 0. 2. HTML Content: `{[ simpleeditpaymentmethods bgcolor:'ffffff' ]}` · CSS Class `giving-panel giving-methods`. 3. Scheduled Transaction List · CSS Class `giving-panel giving-recurring`. 4. HTML Content: `{% include '~~/Assets/Lava/GivingRecurringEmpty.lava' %}` · **Sql** · Cache 0 · CSS Class `giving-panel giving-recurring`. 5. Contribution Statement List Lava · Lava Template `{% include '~~/Assets/Lava/GivingStatements.lava' %}` · CSS Class `giving-panel giving-history`. 6. Transaction Report (optional; currently hidden) · CSS Class `giving-panel giving-history giving-report` (hidden on phones) |
| Main (login page, Page level, same zone as the Login block; other blocks there hide while the photo shows) | HTML Content | content: `{% include '~~/Assets/Lava/LoginMedia.lava' %}` · Enabled Lava Commands: **RockEntity** · Cache Duration: 0 |
| Main (404 page, or any page that offers search, Page level) | HTML Content | content: `{% include '~~/Assets/Lava/SiteSearch.lava' %}` · Enabled Lava Commands: **RockEntity, Sql** |
| Section A (404 page, Page level) | HTML Content | content: `{% include '~~/Assets/Lava/PopularPages.lava' %}` · Enabled Lava Commands: **Cache, RockEntity, Sql** |
| Main (content pages on InnerDefault, e.g. Our Beliefs) | HTML Content | content: paste `Resources/PageContent/<Page>.html` in the code editor (no Lava). Photos point at `Assets/Images/Theme_Images/` on the server |
| Feature (ministry pages with a video hero, e.g. Give: InnerDefault, PageHeaderStyle **Hidden**, DarkHeader checked) | HTML Content | content: a few assigns + `{% include '~~/Assets/Lava/Partials/VideoHero.lava' %}` (Give: `{% include '~~/Assets/Lava/GiveHero.lava' %}`) · Cache Duration 0. Give also needs Page Cacheability **No-Store** (the Merlin widget) and the same Lava commands as the current give block; the hero's lead is the page Description |
| Main (Give page, under the hero) | HTML Content | content: paste `Resources/PageContent/Give.html` in the code editor. Its Online tile's Give now button relies on the Merlin script the hero block loads |
| Feature + Main (Renew page, `ministries/renew`: InnerDefault, PageHeaderStyle **Hidden**, DarkHeader checked, Page Cacheability **No-Store**: the hero swaps to the Resi live stream on Monday nights) | HTML Content ×2 | Feature: `{% include '~~/Assets/Lava/RenewHero.lava' %}` · Cache 0. Main: paste `Resources/PageContent/Renew.html` in the code editor (photo placeholders: swap each `<span>` for an `<img>` and drop `content-photo--placeholder`) |

**Live search endpoint:** under Admin Tools → Lava Applications, add a GET endpoint (slug `site/search` in application 1, giving `/api/v2/lava-app/1/site/search`; change `searchEndpoint` in `SiteSearch.lava` if yours differs), open to all users (it only returns public content), Enabled Lava Commands **RockEntity, Sql**, with this code:

```
{% assign searchQuery = QueryString.q %}
{% include '~/Themes/2027 VRL External/Assets/Lava/SiteSearchResults.lava' %}
```

**Page header style:** create a Page attribute `PageHeaderStyle` (Single-Select, values `SideImage`, `Banner`, `SimpleGrayStripe`, `SimpleGreenStripe`, `SimpleGradStripe`, `Hidden`; **no default value**) under Admin Tools → Entity Attributes (entity type: Page). SideImage is a card with the title, the page Description and the `PageImage` overlapping a gray stripe; Banner shows the `PageImage` as an ultrawide photo (3:1 on desktop, taller on phones) with the title and Description over it at the bottom left; the three Simple stripes are a full-width band (plain gray, solid brand green, or gray with a soft slanted green wash at the right); Hidden hides the page header (Rock's own "None" option on a non-required Single-Select clears the value, which means the layout default, not "no header"; the page's content then needs its own heading). Left empty, each layout uses its own default: InnerDefault → SideImage, Landing → SimpleGradStripe. A default on the attribute would override both. The old value `SimpleStripe` still works and shows as SimpleGradStripe.

**Excluding the alert from a page:** create a Page attribute `ExcludeGlobalAlert` (Boolean, shown as a checkbox, default unchecked) under Admin Tools → Entity Attributes (entity type: Page). Check it on pages that shouldn't show the alert, such as the login page; `Site.Master` then doesn't render the banner there. Visitors who dismiss the alert won't see it again for the rest of their browser session, but a different message shows again.

**Dark header bar:** create a Page attribute `DarkHeader` (Boolean, shown as a checkbox, default unchecked) under Admin Tools → Entity Attributes (entity type: Page). Checked, the header bar renders dark (ink, white links and wordmark) for that page, the look it has with the mega menu open. For pages that open on a dark band, such as the live page. Set server-side in `Layouts/Site.Master` (`data-tone="dark"`), styled in `Styles/_header.scss`.

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
