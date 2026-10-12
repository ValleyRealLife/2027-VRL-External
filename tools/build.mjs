// Theme build: Styles/theme.scss -> Styles/theme.css, preserving Rock's
// icon-set imports. Run with `npm run build` (or `npm run watch`).
//
// WHY THIS EXISTS INSTEAD OF A BARE `sass` CALL
//
// Rock's ThemeOverrideBuilder owns the two marker regions of theme.css. Into
// the TOP region it writes one @import per icon set listed in theme.json's
// `availableIconSets` (Font Awesome, Tabler). Rock's own admin UI depends on
// those icon fonts. A plain sass compile regenerates theme.css from
// theme.scss, where that region is empty, so every build silently deleted the
// icons until someone re-saved the theme in Rock's admin.
//
// This script compiles to a temp file, then writes theme.css with the TOP
// region carried over from the existing theme.css (Rock's fingerprinted
// version, if present) or, when that is empty, seeded from theme.json.
//
// The BOTTOM region (theme.json variable values + admin custom CSS) is
// deliberately NOT carried over: during development the SCSS tokens are the
// source of truth, and a stale admin value there would silently override a
// token changed in _tokens.scss. Rock rewrites it on the next theme save.
//
// sass is invoked as a CLI: `npm run` puts node_modules/.bin on PATH. Set
// SASS_BIN to use a different binary.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const at = p => ROOT + p;

const SRC = 'Styles/theme.scss';
const OUT = 'Styles/theme.css';
const TMP = 'Styles/.theme.build.css';
const TOP_START = '/* CSS Overrides Top Start */';
const TOP_END = '/* CSS Overrides Top End */';

// The files Rock imports for each icon set (from a Rock-written theme.css).
// Seeded without Rock's ?v= fingerprint; Rock adds it on its next rewrite.
const ICON_SET_FILES = {
  fontawesome: ['fontawesome-icon.css', 'fontawesome-regular.css', 'fontawesome-solid.css'],
  tabler: ['tabler-icon.css'],
};

function topRegion(css) {
  const a = css.indexOf(TOP_START);
  const b = css.indexOf(TOP_END);
  if (a === -1 || b === -1 || b < a) return null;
  return css.slice(a + TOP_START.length, b).trim();
}

function seedFromThemeJson() {
  const { availableIconSets = [] } = JSON.parse(readFileSync(at('theme.json'), 'utf8'));
  return availableIconSets
    .flatMap(set => {
      const files = ICON_SET_FILES[set];
      if (!files) console.log(`WARN unknown icon set "${set}" in theme.json; not seeded`);
      return files ?? [];
    })
    .map(f => `@import url('/Styles/styles-v2/icons/${f}');`)
    .join('\n');
}

function build() {
  const previous = existsSync(at(OUT)) ? topRegion(readFileSync(at(OUT), 'utf8')) : null;
  const keep = previous && previous.includes('@import') ? previous : seedFromThemeJson();
  const source = previous && previous.includes('@import') ? 'kept from existing theme.css' : 'seeded from theme.json';

  const sass = process.env.SASS_BIN || 'sass';
  const r = spawnSync(sass, ['--no-source-map', '--style=expanded', SRC, TMP], {
    cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32',
  });
  if (r.error || r.status !== 0) {
    if (r.error?.code === 'ENOENT') console.log('FAIL sass not found: run `npm install` first (or set SASS_BIN)');
    rmSync(at(TMP), { force: true });
    return false;
  }

  let css = readFileSync(at(TMP), 'utf8');
  rmSync(at(TMP), { force: true });
  if (topRegion(css) === null) {
    console.log(`FAIL compiled CSS has no "${TOP_START}" … "${TOP_END}" region; check the markers in ${SRC}`);
    return false;
  }
  css = css.replace(`${TOP_START}\n${TOP_END}`, `${TOP_START}\n${keep}\n${TOP_END}`);
  if (!css.includes(keep)) {
    console.log('FAIL could not write the icon imports into the Top region (markers not adjacent in compiled output)');
    return false;
  }
  writeFileSync(at(OUT), css);
  console.log(`built ${OUT} (icon imports ${source})`);
  return true;
}

const ok = build();

if (process.argv.includes('--watch')) {
  console.log('watching Styles/*.scss …');
  let timer;
  watch(at('Styles'), (event, file) => {
    if (!file || !file.endsWith('.scss')) return;
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });
} else {
  process.exit(ok ? 0 : 1);
}
