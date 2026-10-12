"""Port the large, mechanical chunks of the v1.5 concept into the Rock theme.

Usage: python3 -I port-concept.py <concept.html> <theme root>

Generates (overwriting):
  Styles/_home.scss                    homepage section CSS, verbatim
  Assets/Lava/Home.lava                homepage content (HTML block in the Main zone)
  Assets/Lava/Partials/IconSprite.lava the inline SVG sprite (+ logo ink filter)
  Assets/Scripts/home.js               events rail, messages player, GSAP choreography
"""
import pathlib
import re
import sys

concept = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
root = pathlib.Path(sys.argv[2])
lines = concept.split("\n")


def find(needle, start=0):
    for i in range(start, len(lines)):
        if needle in lines[i]:
            return i
    raise SystemExit("marker not found: " + needle)


def write(rel, text):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.rstrip("\n") + "\n", encoding="utf-8")
    print("wrote", rel, f"({text.count(chr(10))} lines)")


# --------------------------------------------------------------------------
# Styles/_home.scss
# --------------------------------------------------------------------------
a = find("SECTION: HERO + NEXT STEPS") - 1
b = find("SECTION: FOOTER") - 1
css1 = [l for l in lines[a:b] if l.strip() not in ("<style>", "</style>")]
c = find("/* Stage falls back to a static hero")
d = find("</style>", c)
css2 = lines[c:d]

home_scss = """// HOMEPAGE SECTIONS  (markup: Assets/Lava/Home.lava)
//
// Ported verbatim from Concepts/Home2027-v1.5.html by tools/port-concept.py —
// the concept remains the design source for these one-off sections until each
// is converted into Rock blocks. Edit here (not the concept) once the theme is
// the source of truth.
//
// Sections, top to bottom:
//   .stage      hero → Next Steps card hand-off (GSAP, scrubbed)
//   .nextgen    Kids + Students (side by side ≥ 900px, stacked covers below)
//   .messages   latest message + series rail
//   .events     upcoming events rail (container-query cards, share dropdown)
//
// The "cover" motif: sections pin (position: sticky) and the next one slides
// over them. --stick-top and --footer-h are set by Assets/Scripts/theme.js;
// the GSAP choreography lives in Assets/Scripts/home.js.
//
// Breakpoints are written as literals here (899px / 900px), matching the
// concept; $bp-md in _config.scss is the same value.

@use "config" as *;

""" + "\n".join(css1).rstrip() + "\n\n" + "\n".join(css2).rstrip() + "\n"
write("Styles/_home.scss", home_scss)

# --------------------------------------------------------------------------
# Assets/Lava/Home.lava
# --------------------------------------------------------------------------
# The homepage content, rendered by an HTML block in the homepage's Main zone.
# Layouts/Homepage.aspx is hand-written and NOT generated: it holds only the
# zone and the homepage scripts.
m0 = find('<main id="main">')
m1 = find("</main>", m0)
# Inner content only: <main> belongs to the layout, not the block.
body = "\n".join(lines[m0 + 1 : m1]).strip("\n")
body = re.sub(
    r'src="\.\./Assets/Images/([^"]+)"',
    lambda m: "src=\"{{ '~~/Assets/Images/" + m.group(1) + "' | ResolveRockUrl }}\"",
    body,
)
body = body.replace("#ti-", "#i-")
body = re.sub(r'class="(nextgen|kids|students|messages|events)"', r'class="\1" data-cover', body)
assert body.count("data-cover") == 5, body.count("data-cover")

# The concept's runway comment describes <main> in a single-file page; in the
# theme the runway's parent is the HTML block wrapper, so restate it.
CONCEPT_RUNWAY = re.compile(r"<!-- Footer runway:.*?-->", re.S)
assert len(CONCEPT_RUNWAY.findall(body)) == 1
body = CONCEPT_RUNWAY.sub(
    "<!-- Footer runway: position: sticky can't hold a section past the end of\n"
    "     its parent (this block's wrapper), so the runway extends that wrapper by\n"
    "     the footer's height + a dwell and the footer slides back up over Events.\n"
    "     Empty and hidden without JS. KEEP THIS THE LAST ELEMENT OF THIS FILE. -->",
    body,
)
assert "../Assets/" not in body
# Lava would try to parse these; the concept markup has none today.
stray = [t for t in ("{%", "%}") if t in body]
assert not stray, "Lava-like tokens in concept markup: " + repr(stray)

# The footer runway MUST be the last element of this file. Sticky sections only
# stay pinned within their parent, which is now Rock's block wrapper; the runway
# has to be inside that same wrapper so Events stays pinned while the footer
# slides up over it.
assert body.rstrip().endswith('<div class="footer-runway" aria-hidden="true"></div>'), body[-200:]

home_lava = """{% comment %}
    HOMEPAGE CONTENT — for an HTML block in the homepage's Main zone.

    Block content:   {% include '~~/Assets/Lava/Home.lava' %}
    Cache duration:  0 while iterating

    The v1.5 concept's homepage sections, hardcoded for now. Most of the
    animation and the cover-section choreography are one-offs for this page;
    the content will move into dynamic Lava / blocks section by section.
    Generated by tools/port-concept.py; the `ROCK:` comments mark what each
    section needs from Rock.

    Hooks the scripts rely on (theme.js + home.js, loaded by Homepage.aspx):
      #stage           header turns transparent while it is under the bar
      [data-cover]     pinned "cover" sections (theme.js sets --stick-top)
      .footer-runway   MUST stay the last element here: sticky sections only
                       pin within their parent (this block's wrapper), so the
                       runway has to share it for the footer to slide over
                       Events (theme.js sets --footer-h)
{% endcomment %}
""" + body + "\n"
write("Assets/Lava/Home.lava", home_lava)

# --------------------------------------------------------------------------
# Assets/Lava/Partials/IconSprite.lava
# --------------------------------------------------------------------------
s0 = find('<svg width="0" height="0"')
s1 = find("</svg>", s0)
sprite = "\n".join(lines[s0 : s1 + 1])
sprite = sprite.replace('id="ti-', 'id="i-')
sprite = sprite.replace(
    '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">',
    '<svg class="icon-sprite" width="0" height="0" aria-hidden="true" focusable="false">',
)
assert 'class="icon-sprite"' in sprite
icons = sorted(set(re.findall(r'id="(i-[a-z0-9-]+)"', sprite)))
sprite_lava = """{% comment %}
    SVG icon sprite, inlined once per page from Layouts/Site.Master.

    Use an icon anywhere (layouts, Lava, HTML blocks) with:
        <svg width="16" height="16" aria-hidden="true"><use href="#i-name"/></svg>
    Icons inherit `currentColor`. Available ids:
        """ + ", ".join(icons) + """

    These are Tabler Icons (MIT) as drawn in the concept, under a neutral `i-`
    prefix so they can be swapped for custom artwork one symbol at a time
    without touching the markup that uses them. Tabler's icon FONT (Rock's
    "tabler" icon set) is still available for Rock's own blocks; the site's
    designed surfaces use this sprite instead.

    Also home to #logo-ink, the filter that turns the logo's white wordmark
    ink on light grounds (see .nav__logo-ink in Styles/_header.scss).
{% endcomment %}
""" + sprite + "\n"
write("Assets/Lava/Partials/IconSprite.lava", sprite_lava)

# --------------------------------------------------------------------------
# Assets/Scripts/home.js
# --------------------------------------------------------------------------
j0 = find("/* ---------- events rail ---------- */")
jm = find("/* ---------- messages: watch now ---------- */", j0)
j1 = find("/* ---------- Esc closes whatever is open ---------- */", jm)
rail = "\n".join(lines[j0:jm]).rstrip()
messages = "\n".join(lines[jm:j1]).rstrip()
g0 = find("SCROLL CHOREOGRAPHY") - 1
g1 = find("</script>", g0)
gsap = "\n".join(lines[g0:g1]).rstrip()


def indent(block, n):
    pad = " " * n
    return "\n".join((pad + l) if l.strip() else l for l in block.split("\n"))


home_js = """/**
 * Homepage behaviour — Valley Real Life 2027.
 *
 * Loaded (deferred) from Layouts/Homepage.aspx after GSAP + ScrollTrigger.
 * Site-wide behaviour (header, menus, care dialog, cover sections, footer
 * reveal, share dropdowns) lives in theme.js; this file only holds what the
 * homepage sections need:
 *
 *   1. Events rail arrows
 *   2. Messages "Watch now" player hand-off
 *   3. Scroll choreography (GSAP): hero → Next Steps card shuffle, Kids wheels
 *      and balloon drift, Students photo pile
 *
 * Ported from Concepts/Home2027-v1.5.html by tools/port-concept.py. Every
 * piece is an enhancement: the page reads and navigates with this file absent
 * (Layouts/Homepage.aspx adds html.stage-static if it or GSAP fails to load).
 */
window.VRLHome = { version: '1.5' };

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (document.getElementById('events-rail')) {
""" + indent(rail, 2) + """
  }

  if (document.getElementById('messages')) {
""" + indent(messages, 2) + """

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || messages.getAttribute('data-playing') !== 'true') return;
      messages.setAttribute('data-playing', 'false');
      player.setAttribute('aria-hidden', 'true');
      messages.querySelector('[data-watch]').focus();
    });
  }
})();

""" + gsap + "\n"
write("Assets/Scripts/home.js", home_js)
