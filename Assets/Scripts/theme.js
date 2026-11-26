/**
 * Site-wide behaviour — Valley Real Life 2027.
 *
 * Loaded from Site.Master's <head> with `defer`, so it executes after HTML
 * parsing and before DOMContentLoaded. No jQuery required.
 *
 * Everything here is an enhancement: the site reads, navigates and converts
 * with this file removed (the mega menu opens on hover/focus with CSS alone,
 * the drawer sections are <details>, the care trigger is a real link).
 *
 * Click handling for anything rendered by a Rock block (drawer buttons, care
 * dialog, share menus) is delegated on `document`, so it keeps working if a
 * block's markup is replaced by a partial postback.
 *
 * Sections:
 *   0. Global alert (show / dismiss for the session, --alert-h)
 *   1. Header: stuck / solid state
 *   2. Mega menu: hover intent (utility bar + header are one hover zone),
 *      keyboard focus, column highlight, Esc
 *   3. Mobile drawer
 *   4. Care dialog (options → iframe)
 *   5. Share dropdowns + copy link
 *   6. Cover sections: pin position + footer runway (homepage)
 *   7. Footer reveal
 *
 * Homepage-only choreography (GSAP) is in home.js.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var header = document.querySelector('.site-header');
  var utilbar = document.querySelector('.utilbar');
  var stage = document.getElementById('stage');   // homepage hero stage; absent elsewhere

  // --- 0. Global alert ----------------------------------------------------------
  // The banner (Site.Master) starts hidden. Show it when the Alert zone holds
  // text (an inactive / expired HTML block renders nothing) and this message
  // hasn't been dismissed in this browser session. A different message shows
  // again even after a dismissal, because the session remembers the message
  // text, not just "dismissed". Its height feeds --alert-h → --header-h, so
  // every offset makes room for it. Runs first: the header and cover-section
  // code below measure the header's position.
  var siteAlert = document.getElementById('siteAlert');
  var setAlertHeight = function () {
    var h = siteAlert && !siteAlert.hidden ? siteAlert.offsetHeight : 0;
    root.style.setProperty('--alert-h', h + 'px');
  };
  if (siteAlert) {
    var alertMsg = siteAlert.querySelector('.site-alert__msg');
    /* The message's own text only. For signed-in editors Rock puts its zone /
       block config bars (with labels like "Alert Message") inside the zone too,
       so measure a copy with those removed — otherwise an expired block still
       "has text" and the banner shows empty. */
    var alertText = '';
    if (alertMsg) {
      var msgCopy = alertMsg.cloneNode(true);
      msgCopy.querySelectorAll('.config-bar, .zone-configuration, .block-configuration').forEach(function (bar) { bar.remove(); });
      alertText = msgCopy.textContent.replace(/\s+/g, ' ').trim();
    }
    var alertKey = 'vrl-alert-dismissed';
    var alertHash = (function (str) {   /* small stable hash of the message */
      var h = 5381;
      for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
      return String(h);
    })(alertText);
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(alertKey) === alertHash; } catch (e) {}

    if (alertText && !dismissed) {
      siteAlert.hidden = false;
      setAlertHeight();
      if ('ResizeObserver' in window) new ResizeObserver(setAlertHeight).observe(siteAlert);
      else window.addEventListener('resize', setAlertHeight);

      var alertClose = siteAlert.querySelector('[data-site-alert-close]');
      if (alertClose) alertClose.addEventListener('click', function () {
        siteAlert.hidden = true;
        try { sessionStorage.setItem(alertKey, alertHash); } catch (e) {}
        setAlertHeight();
        /* Everything measured from the header (pinned sections, ScrollTrigger) re-measures on resize */
        window.dispatchEvent(new Event('resize'));
      });
    }
  }

  // --- 1. Header: stuck state + solid flag ------------------------------------

  if (header) {
    var onScroll = function () {
      header.setAttribute('data-stuck', window.scrollY > 8 ? 'true' : 'false');
      if (stage) {
        /* Transparent while the hero is under the bar; solid once it's gone.
           Interior pages have no stage and keep the markup default (solid). */
        var heroGone = stage.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom;
        header.setAttribute('data-solid', heroGone ? 'true' : 'false');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  // --- 2. Mega menu ------------------------------------------------------------

  var closedAt = 0;
  var menuTimer;
  var MENU_OPEN_DELAY = 180;
  var MENU_CLOSE_DELAY = 150;

  var setMenu = function (state) {
    if (!header) return;
    if (state !== 'open' && header.getAttribute('data-menu') === 'open') closedAt = Date.now();
    header.setAttribute('data-menu', state);
    document.body.setAttribute('data-menu', state);
    if (state !== 'open') {
      header.querySelectorAll('.is-hot').forEach(function (el) { el.classList.remove('is-hot'); });
    }
  };

  if (header) {
    /* Hover intent: the menu opens only once the pointer settles on the bar,
       so a quick pass over it doesn't flash the panel. The utility bar and the
       header are ONE hover zone ("shared zone", chosen in the v1.5 review):
       hovering either opens the menu, moving between them never closes it. */
    var zones = [header, utilbar].filter(Boolean);
    var inZone = function (el) {
      return zones.some(function (z) { return el && z.contains(el); });
    };
    var onZoneEnter = function () {
      clearTimeout(menuTimer);
      if (header.getAttribute('data-menu') === 'open') return;
      /* Back within the bar's fade-out: reopen at once, so it doesn't go
         half-light then snap dark again (a visible flash). */
      if (Date.now() - closedAt < 400) { setMenu('open'); return; }
      menuTimer = setTimeout(function () { setMenu('open'); }, MENU_OPEN_DELAY);
    };
    var onZoneLeave = function (e) {
      /* Crossing from one zone into the other isn't leaving. */
      if (inZone(e.relatedTarget)) return;
      clearTimeout(menuTimer);
      /* Keyboard focus still inside keeps it open, as :focus-within would. */
      var f = document.activeElement;
      if (header.contains(f) && f.matches(':focus-visible')) return;
      menuTimer = setTimeout(function () { setMenu('idle'); }, MENU_CLOSE_DELAY);
    };
    zones.forEach(function (z) {
      z.addEventListener('mouseenter', onZoneEnter);
      z.addEventListener('mouseleave', onZoneLeave);
    });
    header.addEventListener('focusin', function () { clearTimeout(menuTimer); setMenu('open'); });
    header.addEventListener('focusout', function (e) {
      /* Esc latches 'closed'; leaving focus must not quietly reopen it. */
      if (header.getAttribute('data-menu') === 'closed') return;
      /* Focus moving out of the bars (Tab into the page content) always
         closes the menu, even if the mouse happens to rest over the header —
         otherwise the panel and its scrim stay over the content the keyboard
         user just reached. Moving into the utility bar (Shift+Tab) is still
         inside the shared zone, so the menu stays open. */
      if (!inZone(e.relatedTarget)) {
        clearTimeout(menuTimer);
        setMenu('idle');
      }
    });

    /* Link ↔ column pairing. Hovering or focusing a top-level link lifts its
       column of children; hovering or focusing inside a column keeps its parent
       link underlined. Link and column share a page id (data-page / data-col),
       and both get .is-hot. The pairing holds until another link or column is
       hovered, or the menu closes (setMenu clears it). */
    var setHot = function (id) {
      header.querySelectorAll('.nav__link[data-page], .mega__col[data-col]').forEach(function (el) {
        var elId = el.getAttribute('data-page') || el.getAttribute('data-col');
        el.classList.toggle('is-hot', id !== null && elId === id);
      });
    };
    var hotFrom = function (e) {
      var el = e.target.closest('.nav__link[data-page], .mega__col[data-col]');
      if (el) setHot(el.getAttribute('data-page') || el.getAttribute('data-col'));
    };
    header.addEventListener('mouseover', hotFrom);
    header.addEventListener('focusin', hotFrom);

    /* Keyboard order (desktop menu). The markup has the top-level links in
       the nav row and their sub-pages in the panel's columns further down, so
       plain Tab ran through every top-level link before reaching any
       sub-page. Tab / Shift+Tab inside the header follow: logo → each
       top-level link followed by its own column → everything else (Discover,
       address, hours, office, social) in source order. The first and last
       items match the source order, so leaving the header is the browser's
       own Tab. Phones use the drawer, which is already in order. */
    var desktopNav = window.matchMedia('(min-width: 1000px)');
    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var isShown = function (el) {
      return el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    };
    var navTabOrder = function () {
      var all = Array.prototype.slice.call(header.querySelectorAll(FOCUSABLE)).filter(isShown);
      var order = [];
      var push = function (el) {
        if (el && order.indexOf(el) === -1 && all.indexOf(el) !== -1) order.push(el);
      };
      push(header.querySelector('.nav__logo'));
      header.querySelectorAll('.nav__link[data-page]').forEach(function (link) {
        push(link);
        var col = header.querySelector('.mega__col[data-col="' + link.getAttribute('data-page') + '"]');
        if (col) col.querySelectorAll(FOCUSABLE).forEach(push);
      });
      all.forEach(push);
      return order;
    };
    header.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !desktopNav.matches) return;
      var order = navTabOrder();
      var i = order.indexOf(document.activeElement);
      if (i === -1) return;
      var next = order[i + (e.shiftKey ? -1 : 1)];
      if (!next) return;   /* leaving the header: let the browser move on */
      e.preventDefault();
      next.focus();
    });

    /* Exits that don't need a mouse or a keyboard. On a touch screen (e.g. a
       landscape iPad, which gets the desktop menu) a tap fires the hover that
       opens the menu, but nothing ever fires the matching mouseleave, and
       there's no Esc key — the menu stayed open until a refresh. So:
         • a tap or click anywhere outside the bars closes it;
         • the panel has a "Close menu" button, shown on devices without
           hover (CSS: @media (hover: none)). */
    var closeMenu = function () {
      clearTimeout(menuTimer);
      if (document.activeElement && header.contains(document.activeElement)) document.activeElement.blur();
      setMenu('idle');
    };
    document.addEventListener('pointerdown', function (e) {
      if (header.getAttribute('data-menu') !== 'open') return;
      if (inZone(e.target)) return;
      closeMenu();
    }, true);
    header.addEventListener('click', function (e) {
      if (e.target.closest('[data-mega-close]')) closeMenu();
    });
  }

  // --- 3. Mobile drawer --------------------------------------------------------

  function openMobile() {
    var drawer = document.getElementById('mobilenav');
    var burger = document.querySelector('[data-mobilenav-open]');
    if (!drawer) return;
    drawer.setAttribute('data-open', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    var closeBtn = drawer.querySelector('[data-mobilenav-close]');
    if (closeBtn) closeBtn.focus();
  }
  function closeMobile() {
    var drawer = document.getElementById('mobilenav');
    var burger = document.querySelector('[data-mobilenav-open]');
    if (!drawer || drawer.getAttribute('data-open') !== 'true') return;
    drawer.setAttribute('data-open', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
    document.body.classList.remove('is-locked');
  }

  // --- 4. Care dialog ------------------------------------------------------------

  function careDialog() { return document.getElementById('care-modal'); }
  function careSupported() {
    var d = careDialog();
    return !!(d && typeof d.showModal === 'function');
  }
  function openCare() {
    var d = careDialog();
    d.setAttribute('data-view', 'options');
    d.showModal();
  }
  function closeCare() {
    var d = careDialog();
    if (d && d.open) d.close();
  }
  function showCareFrame(option) {
    var d = careDialog();
    var iframe = d.querySelector('[data-care-iframe]');
    var title = d.querySelector('[data-care-frame-title]');
    if (!iframe) return false;
    var label = option.getAttribute('data-care-title') || option.textContent.trim();
    if (title) title.textContent = label;
    iframe.setAttribute('title', label);
    iframe.src = option.getAttribute('data-care-frame');
    d.setAttribute('data-view', 'frame');
    var back = d.querySelector('[data-care-back]');
    if (back) back.focus();
    return true;
  }
  function showCareOptions() {
    var d = careDialog();
    var iframe = d.querySelector('[data-care-iframe]');
    if (iframe) iframe.removeAttribute('src');
    d.setAttribute('data-view', 'options');
    d.removeAttribute('data-direct');
  }
  /* Any [data-care-frame] link OUTSIDE the dialog (e.g. the live page's
     Connect and Prayer links) opens the dialog straight to that form.
     data-direct hides the back-to-options button, since the visitor never
     saw the options. data-care-reload on the link reloads the page when the
     dialog closes, so what the form changed shows (My Account's
     communication lists). */
  function openCareFrame(link) {
    var d = careDialog();
    d.setAttribute('data-direct', '');
    d.toggleAttribute('data-reload', link.hasAttribute('data-care-reload'));
    if (!showCareFrame(link)) { d.removeAttribute('data-direct'); return false; }
    d.showModal();
    var close = d.querySelector('[data-care-close]');
    if (close) close.focus();
    return true;
  }
  /* Reset to the options view whenever the dialog closes (Esc, backdrop, X),
     so the form doesn't keep loading behind a closed dialog. */
  var careEl = careDialog();
  if (careEl) {
    careEl.addEventListener('close', function () {
      if (careEl.hasAttribute('data-reload')) { window.location.reload(); return; }
      showCareOptions();
    });
    careEl.addEventListener('click', function (e) {
      /* A click outside the panel (on the backdrop) closes it. */
      var r = careEl.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) closeCare();
    });
  }

  // --- 5. Share dropdowns + copy link ---------------------------------------------

  function closeAllShares(except) {
    document.querySelectorAll('[data-share-toggle]').forEach(function (btn) {
      if (btn === except) return;
      btn.setAttribute('aria-expanded', 'false');
      var menu = document.getElementById(btn.getAttribute('aria-controls'));
      if (menu) menu.setAttribute('data-open', 'false');
    });
  }

  // --- Account menu (UtilityBar.lava, signed in) -------------------------------------
  // [data-account] holds the toggle and the menu. Closes on a click outside,
  // Esc, or focus leaving it (so Tab moves on cleanly).

  function setAccount(open) {
    var box = document.querySelector('[data-account]');
    if (!box) return;
    var btn = box.querySelector('[data-account-toggle]');
    var menu = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    if (menu) menu.setAttribute('data-open', String(open));
  }
  document.addEventListener('focusout', function (e) {
    var box = e.target.closest && e.target.closest('[data-account]');
    if (box && !box.contains(e.relatedTarget)) setAccount(false);
  });

  // --- Delegated clicks (drawer, care dialog, share, account) ----------------------

  document.addEventListener('click', function (e) {
    var t = e.target;

    var accountBtn = t.closest('[data-account-toggle]');
    if (accountBtn) { setAccount(accountBtn.getAttribute('aria-expanded') !== 'true'); return; }
    if (!t.closest('[data-account]')) setAccount(false);

    if (t.closest('[data-mobilenav-open]')) { openMobile(); return; }
    if (t.closest('[data-mobilenav-close]')) { closeMobile(); return; }

    if (t.closest('[data-care-trigger]') && careSupported()) { e.preventDefault(); openCare(); return; }
    if (t.closest('[data-care-close]')) { closeCare(); return; }
    if (t.closest('[data-care-back]')) { showCareOptions(); return; }
    var option = t.closest('[data-care-frame]');
    if (option && careSupported()) {
      if (careDialog().contains(option) ? showCareFrame(option) : openCareFrame(option)) e.preventDefault();
      return;
    }

    var shareBtn = t.closest('[data-share-toggle]');
    if (shareBtn) {
      e.stopPropagation();
      var menu = document.getElementById(shareBtn.getAttribute('aria-controls'));
      var open = shareBtn.getAttribute('aria-expanded') === 'true';
      closeAllShares(shareBtn);
      shareBtn.setAttribute('aria-expanded', String(!open));
      if (menu) menu.setAttribute('data-open', String(!open));
      return;
    }
    var copyBtn = t.closest('[data-copy]');
    if (copyBtn) {
      e.stopPropagation();
      var label = copyBtn.querySelector('span');
      var original = label ? label.textContent : '';
      navigator.clipboard.writeText(copyBtn.getAttribute('data-copy')).then(function () {
        if (!label) return;
        label.textContent = 'Link copied';
        setTimeout(function () { label.textContent = original; }, 1800);
      });
      return;
    }
    if (!t.closest('.share')) closeAllShares();
  });

  // --- Clickable cards -------------------------------------------------------------
  // [data-card] with one [data-card-link] inside (the title link). A click on
  // the card follows that link, unless it landed on another control or the
  // visitor has just selected text (so card text stays copyable). Ctrl/⌘-click
  // opens a new tab, like a real link.
  document.addEventListener('click', function (e) {
    var card = e.target.closest('[data-card]');
    if (!card || e.target.closest('a, button, input, select, textarea, label, summary, .share')) return;
    var selection = window.getSelection ? String(window.getSelection()) : '';
    if (selection) return;
    var link = card.querySelector('[data-card-link]');
    if (!link) return;
    if (e.metaKey || e.ctrlKey) { window.open(link.href, '_blank', 'noopener'); return; }
    link.click();
  });

  // --- Events rail arrows (.events__rail-wrap: HomeEvents.lava, Events.lava) -----
  // The prev/next buttons scroll the rail one card; each disables at its end.
  document.querySelectorAll('.events__rail-wrap').forEach(function (wrap) {
    var rail = wrap.querySelector('.events__rail');
    var prev = wrap.querySelector('[data-rail-prev]');
    var next = wrap.querySelector('[data-rail-next]');
    if (!rail || !prev || !next) return;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var step = function () {
      var card = rail.querySelector('.event-card');
      return card ? card.offsetWidth + 24 : 300;
    };
    var sync = function () {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
    };
    prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: motion.matches ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: motion.matches ? 'auto' : 'smooth' }); });
    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  // --- Events filter ([data-event-filter]: Events.lava) ----------------------------
  // Audience chips over the All events grid. A chip shows the cards whose
  // data-audiences include its id (All: every card), shows the empty note
  // when none match, and puts ?audience=<id> in the address so the view can be shared. Today
  // is the same mechanism: Events.lava adds the token "today" to the cards on today's date
  // (?audience=today). The chips
  // are hidden in the markup, so without JavaScript every event just shows.
  document.querySelectorAll('[data-event-filter]').forEach(function (section) {
    var chipRow = section.querySelector('[data-event-filter-chips]');
    var list = section.querySelector('[data-event-list]');
    if (!chipRow || !list) return;
    var chips = Array.prototype.slice.call(chipRow.querySelectorAll('[data-audience]'));
    var cards = Array.prototype.slice.call(list.querySelectorAll('.event-card'));
    var empty = section.querySelector('[data-event-empty]');
    var apply = function (id, remember) {
      var shown = 0;
      cards.forEach(function (card) {
        var on = !id || (' ' + (card.getAttribute('data-audiences') || '') + ' ').indexOf(' ' + id + ' ') !== -1;
        card.hidden = !on;
        if (on) shown++;
      });
      chips.forEach(function (chip) { chip.setAttribute('aria-pressed', String(chip.getAttribute('data-audience') === id)); });
      if (empty) empty.hidden = shown > 0;
      if (remember && history.replaceState) {
        var url = new URL(location.href);
        if (id) url.searchParams.set('audience', id); else url.searchParams.delete('audience');
        history.replaceState(null, '', url);
      }
    };
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () { apply(chip.getAttribute('data-audience'), true); });
    });
    chipRow.hidden = false;
    var wanted = new URLSearchParams(location.search).get('audience') || '';
    var known = chips.some(function (chip) { return chip.getAttribute('data-audience') === wanted; });
    apply(known ? wanted : '', false);
  });

  // --- Group finder ([data-group-finder]: LifeGroupSearch.lava) ---------------------
  // Every public Life Group is a card whose data-* attributes hold its answers
  // (data-who, -days, -content, -childcare, -dropin, -where, -area; space-
  // separated keys). The quiz walks one question per screen, each option
  // showing how many groups it would leave (none: disabled, so there's always
  // a group); answers live in the address (?who=men&days=monday,tuesday…), so
  // a link that carries answers, or ?all, opens straight on the results. A card
  // shows when, for every answered question, it has one of the picked keys. If
  // nothing matches (an old or hand-made link), answers are left out in RELAX
  // order until something does, and the note says which. Sort: soonest (the
  // next day it meets, from today, then its time) or closest to the visitor
  // (browser location; the cards' coordinates are rounded to ~1 km).
  // On the results, the filter bar (sticky under the header) has a button per
  // question showing its answer; a button opens that question's options (cloned
  // from the quiz) in a panel inside the bar, so it pushes the cards down
  // instead of covering them. Changes apply at once; a single-answer question
  // closes its panel when picked. Without JavaScript the quiz and bar stay
  // hidden and every card shows.
  document.querySelectorAll('[data-group-finder]').forEach(function (finder) {
    var quiz = finder.querySelector('[data-gf-quiz]');
    var list = finder.querySelector('[data-gf-list]');
    if (!quiz || !list) return;
    var slice = function (n) { return Array.prototype.slice.call(n); };
    var cards = slice(list.querySelectorAll('.group-card'));
    var steps = slice(quiz.querySelectorAll('[data-gf-step]'));
    var head = finder.querySelector('[data-gf-results-head]');
    var total = finder.querySelector('[data-gf-total]');
    var note = finder.querySelector('[data-gf-note]');
    var bar = finder.querySelector('[data-gf-filters]');
    var barButtons = finder.querySelector('[data-gf-filter-buttons]');
    var panel = finder.querySelector('[data-gf-panel]');
    var clearBtn = finder.querySelector('[data-gf-clear]');
    var progress = quiz.querySelector('[data-gf-progress]');
    var progressBar = quiz.querySelector('[data-gf-bar]');
    var backBtn = quiz.querySelector('[data-gf-back]');
    var nextBtn = quiz.querySelector('[data-gf-next]');
    var sortBtns = slice(finder.querySelectorAll('[data-gf-sort]'));
    var KEYS = ['who', 'days', 'content', 'childcare', 'where', 'area', 'dropin'];
    var RELAX = ['area', 'days', 'content', 'where', 'childcare', 'dropin', 'who'];
    var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var LABELS = {
      who: { men: "Men's", women: "Women's", mixed: 'Mixed', 'young-adult': 'Young adults' },
      days: {},
      content: { sermon: 'Follows the message', other: 'Other studies' },
      childcare: { yes: 'Childcare' },
      where: { campus: 'At VRL', offsite: 'Off campus' },
      dropin: { yes: 'Drop in' },
      area: {}
    };
    // A question's name: the filter button when it's unanswered, and the left-out note
    var QUESTION = { who: 'Group type', days: 'Days', content: 'Content', childcare: 'Childcare', where: 'Location', area: 'Area', dropin: 'Drop in' };
    DAYS.forEach(function (d) { LABELS.days[d] = d.charAt(0).toUpperCase() + d.slice(1, 3); });

    // Areas: the towns off-campus groups meet in, as options on the area step
    var areaBox = quiz.querySelector('[data-gf-areas]');
    var areas = {};
    cards.forEach(function (c) {
      var key = c.getAttribute('data-area');
      if (key) areas[key] = c.getAttribute('data-area-name') || key;
    });
    LABELS.area = areas;
    if (areaBox) {
      var anyArea = areaBox.querySelector('.gf-option--any');
      Object.keys(areas).sort(function (a, b) { return areas[a].localeCompare(areas[b]); }).forEach(function (key) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'gf-option'; b.setAttribute('data-value', key);
        b.textContent = areas[key];
        var n = document.createElement('span'); n.className = 'gf-option__count'; n.setAttribute('data-gf-count', '');
        b.appendChild(n);
        areaBox.insertBefore(b, anyArea);
      });
    }

    var state = {};
    var sortMode = 'soon';
    var me = null;
    var current = 0;
    var openKey = null;

    var has = function (card, key, values) {
      var mine = ' ' + (card.getAttribute('data-' + key) || '') + ' ';
      return values.some(function (v) { return mine.indexOf(' ' + v + ' ') !== -1; });
    };
    var matches = function (card, st) {
      return KEYS.every(function (k) { return !st[k] || !st[k].length || has(card, k, st[k]); });
    };
    var copy = function (st) { var o = {}; KEYS.forEach(function (k) { if (st[k] && st[k].length) o[k] = st[k].slice(); }); return o; };
    var countFor = function (st) { return cards.filter(function (c) { return matches(c, st); }).length; };
    var groupsText = function (n) { return n + (n === 1 ? ' group' : ' groups'); };
    var anyDropIn = cards.some(function (c) { return c.getAttribute('data-dropin') === 'yes'; });
    var stepFor = function (key) { return quiz.querySelector('[data-gf-step="' + key + '"]'); };

    // The area question follows "off campus" (or an unanswered place)
    var areaInPlay = function () {
      var where = state.where || [];
      return Object.keys(areas).length > 1 && (!where.length || where.indexOf('offsite') !== -1);
    };

    // One answer picked (quiz or filter panel). Returns true for a single-answer question.
    var pick = function (key, v, multi) {
      if (multi) {
        var picked = state[key] || [];
        if (!v) picked = [];
        else if (picked.indexOf(v) !== -1) picked = picked.filter(function (x) { return x !== v; });
        else picked = picked.concat(v);
        if (picked.length) state[key] = picked; else delete state[key];
      } else if (v) state[key] = [v];
      else delete state[key];
      if (key === 'where' && !areaInPlay()) delete state.area;
      return !multi;
    };

    // --- Address ---
    var fromUrl = function () {
      var p = new URLSearchParams(location.search);
      var st = {};
      KEYS.forEach(function (k) {
        var v = (p.get(k) || '').split(',').filter(Boolean);
        if (v.length) st[k] = v;
      });
      return { state: st, results: p.has('all') || Object.keys(st).length > 0 };
    };
    var toUrl = function (showingResults) {
      if (!history.replaceState) return;
      var url = new URL(location.href);
      KEYS.forEach(function (k) {
        if (state[k] && state[k].length) url.searchParams.set(k, state[k].join(','));
        else url.searchParams.delete(k);
      });
      url.searchParams.delete('all');
      if (showingResults && !Object.keys(copy(state)).length) url.searchParams.set('all', '');
      history.replaceState(null, '', url.toString().replace(/all=(&|$)/, 'all$1'));
    };

    // --- Sorting ---
    var today = new Date().getDay();
    var soonKey = function (card) {
      var days = (card.getAttribute('data-days') || '').split(' ').filter(Boolean);
      var ahead = days.length ? Math.min.apply(null, days.map(function (d) { return (DAYS.indexOf(d) - today + 7) % 7; })) : 7;
      var t = (card.getAttribute('data-time') || '99:99').split(':');
      return ahead * 2000 + (parseInt(t[0], 10) || 99) * 60 + (parseInt(t[1], 10) || 0);
    };
    var miles = function (card) {
      var lat = parseFloat(card.getAttribute('data-lat')), lng = parseFloat(card.getAttribute('data-lng'));
      if (!me || isNaN(lat) || isNaN(lng)) return Infinity;
      var rad = Math.PI / 180, dLat = (lat - me.lat) * rad, dLng = (lng - me.lng) * rad;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(me.lat * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return 3959 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    if (!cards.some(function (c) { return c.hasAttribute('data-lat'); })) {
      sortBtns.concat(slice(finder.querySelectorAll('[data-gf-near]'))).forEach(function (b) { if (b.getAttribute('data-gf-sort') !== 'soon') b.hidden = true; });
    }

    // --- Options: counts, pressed, disabled (a quiz step or the filter panel) ---
    // In the panel the "any" answer shows pressed when the question is unanswered.
    var refreshOptions = function (box, key, multi, inPanel) {
      slice(box.querySelectorAll('[data-value]')).forEach(function (opt) {
        var v = opt.getAttribute('data-value');
        var trial = copy(state);
        if (v) trial[key] = [v]; else delete trial[key];
        var n = countFor(trial);
        var count = opt.querySelector('[data-gf-count]');
        if (count) count.textContent = n;
        var picked = v ? (state[key] || []).indexOf(v) !== -1 : !(state[key] && state[key].length);
        opt.disabled = !!v && n === 0 && !picked;
        opt.setAttribute('aria-pressed', String(multi || inPanel ? picked : picked && !!v));
      });
    };

    // --- Filter bar ---
    var filterKeys = function () {
      return ['who', 'days', 'content', 'childcare', 'where', 'area', 'dropin'].filter(function (k) {
        if (k === 'area') return areaInPlay() || !!state.area;
        if (k === 'dropin') return anyDropIn || !!state.dropin;
        return !!stepFor(k);
      });
    };
    var summary = function (k) {
      var v = state[k] || [];
      if (!v.length) return QUESTION[k];
      var first = (LABELS[k] || {})[v[0]] || v[0];
      if (k === 'days') return v.length > 3 ? v.slice(0, 2).map(function (d) { return LABELS.days[d]; }).join(', ') + ' +' + (v.length - 2) : v.map(function (d) { return LABELS.days[d]; }).join(', ');
      return v.length > 1 ? first + ' +' + (v.length - 1) : first;
    };
    var buildBar = function () {
      if (!bar || !barButtons) return;
      barButtons.textContent = '';
      filterKeys().forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'gf-filter';
        var on = !!(state[k] && state[k].length);
        if (on) b.classList.add('is-active');
        if (k === 'dropin') {
          b.setAttribute('data-gf-toggle', k);
          b.setAttribute('aria-pressed', String(on));
          b.textContent = LABELS.dropin.yes;
        } else {
          b.setAttribute('data-gf-filter', k);
          b.setAttribute('aria-expanded', String(openKey === k));
          b.setAttribute('aria-controls', 'gf-filter-panel');
          b.innerHTML = '<span></span><svg width="14" height="14" aria-hidden="true"><use href="#i-chevron-down"/></svg>';
          b.firstChild.textContent = summary(k);
          if (on) b.setAttribute('aria-label', QUESTION[k] + ': ' + summary(k));
        }
        barButtons.appendChild(b);
      });
      if (clearBtn) clearBtn.hidden = !Object.keys(copy(state)).length;
    };
    var fillPanel = function () {
      if (!panel) return;
      if (!openKey || filterKeys().indexOf(openKey) === -1) { openKey = null; panel.hidden = true; panel.textContent = ''; panel.removeAttribute('data-gf-step'); return; }
      var step = stepFor(openKey);
      var multi = step.hasAttribute('data-gf-multi');
      if (panel.getAttribute('data-gf-step') !== openKey) {
        panel.textContent = '';
        panel.setAttribute('data-gf-step', openKey);
        panel.setAttribute('aria-label', QUESTION[openKey]);
        var opts = step.querySelector('.gf-options').cloneNode(true);
        slice(opts.querySelectorAll('[data-gf-filter-label]')).forEach(function (o) {
          var count = o.querySelector('[data-gf-count]');
          o.textContent = o.getAttribute('data-gf-filter-label');
          if (count) o.appendChild(count);
        });
        panel.appendChild(opts);
        if (multi) {
          var foot = document.createElement('div');
          foot.className = 'gf-filters__done';
          foot.innerHTML = '<button type="button" class="btn btn--primary btn--sm" data-gf-done></button>';
          panel.appendChild(foot);
        }
      }
      refreshOptions(panel, openKey, multi, true);
      var done = panel.querySelector('[data-gf-done]');
      if (done) done.textContent = 'Show ' + groupsText(countFor(state));
      panel.hidden = false;
    };
    // After a change, if the bar is stuck under the header, bring the first cards up to it
    var settle = function () {
      if (!bar || !head) return;
      var gap = parseFloat(getComputedStyle(bar.parentNode).rowGap) || 0;
      var natural = head.getBoundingClientRect().bottom + gap;
      var stuck = bar.getBoundingClientRect().top;
      if (natural < stuck - 1) window.scrollBy({ top: natural - stuck, behavior: 'instant' });   // a jump, not the page's smooth scroll: the cards just changed
    };
    // Changes to the results animate (view transitions): cards that stay slide
    // to their new places, new ones fade in, dropped ones fade out. Only the
    // cards on or near the screen are captured (named for the moment), not the
    // page, which stays live underneath; the overlay is clipped below the
    // filter bar (--gf-clip) so a moving card never slides over it or the
    // header. Without support, or with reduced motion, the change just happens.
    var vtSeq = 0;
    var nameCards = function (on) {
      var h = window.innerHeight;
      cards.forEach(function (c, i) {
        var r = on && !c.hidden && c.getBoundingClientRect();
        c.style.viewTransitionName = r && r.bottom > -h / 2 && r.top < h * 1.5 ? 'gf-card-' + i : '';
      });
    };
    var animate = function (update) {
      if (!document.startViewTransition || reduced.matches || list.hidden) { update(); return; }
      var root = document.documentElement;
      var seq = ++vtSeq;
      nameCards(true);
      root.classList.add('gf-vt');
      var vt = document.startViewTransition(function () {
        update();
        nameCards(true);
        root.style.setProperty('--gf-clip', Math.max(0, bar && !bar.hidden ? bar.getBoundingClientRect().bottom : 0) + 'px');
      });
      vt.finished.finally(function () {
        if (seq !== vtSeq) return;   // a newer change took over
        root.classList.remove('gf-vt');
        root.style.removeProperty('--gf-clip');
        nameCards(false);
      });
    };
    var closePanel = function () {
      if (!openKey) return;
      var k = openKey;
      var focusInBar = bar.contains(document.activeElement);
      openKey = null;
      fillPanel();
      buildBar();
      var b = barButtons.querySelector('[data-gf-filter="' + k + '"]');
      if (b && focusInBar) b.focus({ preventScroll: true });
    };

    // --- Results ---
    var render = function () {
      var st = copy(state);
      var shown = cards.filter(function (c) { return matches(c, st); });
      var left = [];
      for (var i = 0; !shown.length && i < RELAX.length; i++) {
        if (!st[RELAX[i]]) continue;
        delete st[RELAX[i]];
        left.push(QUESTION[RELAX[i]]);
        shown = cards.filter(function (c) { return matches(c, st); });
      }
      var near = sortMode === 'near' && me;
      shown.sort(function (a, b) { return near ? miles(a) - miles(b) || soonKey(a) - soonKey(b) : soonKey(a) - soonKey(b); });
      cards.forEach(function (c) { c.hidden = shown.indexOf(c) === -1; });
      shown.forEach(function (c) {
        list.appendChild(c);
        var d = c.querySelector('[data-gf-distance]');
        if (d) { var m = near ? miles(c) : Infinity; d.textContent = isFinite(m) ? ' · about ' + (m < 1 ? 'a mile' : Math.round(m) + ' mi') + ' away' : ''; }
      });
      if (total) total.textContent = groupsText(shown.length);
      if (note) {
        note.hidden = !left.length;
        note.textContent = left.length ? 'No group matches every filter, so these are left out: ' + left.join(', ') + '.' : '';
      }
      buildBar();
      fillPanel();
      sortBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-gf-sort') === (near ? 'near' : 'soon'))); });
      toUrl(true);
    };
    var showResults = function () {
      quiz.hidden = true;
      if (head) head.hidden = false;
      if (bar) bar.hidden = false;
      list.hidden = false;
      render();
    };

    // --- Quiz ---
    var inPlay = function () {
      return steps.filter(function (s) { return s.getAttribute('data-gf-step') !== 'area' || areaInPlay(); });
    };
    var refresh = function (step) {
      var multi = step.hasAttribute('data-gf-multi');
      refreshOptions(step, step.getAttribute('data-gf-step'), multi, false);
      if (nextBtn) {
        nextBtn.hidden = !multi;
        var play = inPlay();
        nextBtn.textContent = play.indexOf(step) === play.length - 1 ? 'Show ' + groupsText(countFor(state)) : 'Next';
      }
    };
    var showStep = function (i) {
      var play = inPlay();
      if (i >= play.length) { showResults(); return; }
      current = Math.max(0, i);
      steps.forEach(function (s) { s.hidden = true; });
      var step = play[current];
      step.hidden = false;
      quiz.hidden = false;
      if (head) head.hidden = true;
      if (bar) bar.hidden = true;
      if (note) note.hidden = true;
      list.hidden = true;
      openKey = null;
      if (progress) progress.textContent = 'Question ' + (current + 1) + ' of ' + play.length;
      if (progressBar) progressBar.style.width = Math.round((current + 1) / play.length * 100) + '%';
      if (backBtn) backBtn.hidden = current === 0;
      refresh(step);
      toUrl(false);
      var q = step.querySelector('.gf-step__q');
      if (q && document.activeElement && quiz.contains(document.activeElement)) q.focus({ preventScroll: true });
    };

    var locate = function (done) {
      if (!navigator.geolocation) return;
      finder.classList.add('is-locating');
      navigator.geolocation.getCurrentPosition(function (pos) {
        finder.classList.remove('is-locating');
        me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sortMode = 'near';
        done();
      }, function () {
        finder.classList.remove('is-locating');
        done();
        if (note) { note.hidden = false; note.textContent = "We couldn't get your location, so groups are sorted by the next day they meet."; }
      }, { maximumAge: 600000, timeout: 10000 });
    };

    quiz.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-value]');
      if (opt && !opt.disabled) {
        var step = opt.closest('[data-gf-step]');
        if (pick(step.getAttribute('data-gf-step'), opt.getAttribute('data-value'), step.hasAttribute('data-gf-multi'))) showStep(current + 1);
        else refresh(step);
        return;
      }
      if (e.target.closest('[data-gf-next]')) { showStep(current + 1); return; }
      if (e.target.closest('[data-gf-back]')) { showStep(current - 1); return; }
      if (e.target.closest('[data-gf-skip]')) { state = {}; showResults(); return; }
      if (e.target.closest('[data-gf-near]')) { delete state.area; locate(showResults); }
    });

    if (bar) {
      bar.addEventListener('click', function (e) {
        var opt = e.target.closest('[data-value]');
        if (opt && panel.contains(opt)) {
          if (opt.disabled) return;
          var key = openKey;
          var single = pick(key, opt.getAttribute('data-value'), stepFor(key).hasAttribute('data-gf-multi'));
          if (single) openKey = null;
          animate(function () {
            render();
            settle();
            if (single) { var b = barButtons.querySelector('[data-gf-filter="' + key + '"]'); if (b) b.focus({ preventScroll: true }); }
          });
          return;
        }
        if (e.target.closest('[data-gf-done]')) { closePanel(); settle(); return; }
        var f = e.target.closest('[data-gf-filter]');
        if (f) {
          var k = f.getAttribute('data-gf-filter');
          openKey = openKey === k ? null : k;
          buildBar();
          fillPanel();
          var again = barButtons.querySelector('[data-gf-filter="' + k + '"]');
          if (again) { again.focus({ preventScroll: true }); again.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
          return;
        }
        var t = e.target.closest('[data-gf-toggle]');
        if (t) {
          var tk = t.getAttribute('data-gf-toggle');
          if (state[tk]) delete state[tk]; else state[tk] = ['yes'];
          animate(function () {
            render();
            settle();
            var t2 = barButtons.querySelector('[data-gf-toggle="' + tk + '"]');
            if (t2) t2.focus({ preventScroll: true });
          });
          return;
        }
        if (e.target.closest('[data-gf-clear]')) {
          state = {}; openKey = null;
          animate(function () { render(); settle(); });
        }
      });
      bar.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && openKey) { e.preventDefault(); closePanel(); }
      });
      document.addEventListener('click', function (e) {
        if (openKey && e.target.isConnected && !bar.contains(e.target)) closePanel();   // (a bar button the click just rebuilt is no longer in the page)
      });
    }

    finder.addEventListener('click', function (e) {
      if (e.target.closest('[data-gf-restart]')) {
        state = {};
        showStep(0);
        quiz.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
        return;
      }
      var sort = e.target.closest('[data-gf-sort]');
      if (sort) {
        var resort = function () { animate(render); };
        if (sort.getAttribute('data-gf-sort') === 'near') { if (me) { sortMode = 'near'; resort(); } else locate(resort); }
        else { sortMode = 'soon'; resort(); }
      }
    });

    var start = fromUrl();
    state = start.state;
    if (start.results) showResults(); else showStep(0);
  });

  // --- Frame pop-up ([data-group-modal] / [data-staff-modal] links) ------------------
  // A link with data-group-modal="<GroupId>" (the finder's cards) or
  // data-staff-modal="<key>" (the staff page's cards) opens its page
  // (LifeGroupDetails.lava / StaffDetail.lava, Blank layout) in an iframe inside
  // a <dialog>, instead of leaving the page. The iframe is same-origin, so it's
  // sized to its page (and re-sized as the card flips or the form posts back);
  // the dialog scrolls when that's taller than the screen. The address carries
  // ?group=<GroupId> / ?staff=<key> while it's open, so the page reopens on it
  // (shared links, reloads). Ctrl/⌘-click, and browsers without <dialog>,
  // follow the link to the page itself. Inside the pop-up, a [data-frame-close]
  // link closes it (below).
  (function () {
    var kinds = [
      { attr: 'data-group-modal', param: 'group', label: 'Group details', clean: /[^0-9]/g },
      { attr: 'data-staff-modal', param: 'staff', label: 'Staff details', clean: /[^a-z0-9-]/g }
    ];
    var dialog = null, frame = null, sizer = null, lastLink = null, kind = kinds[0];
    var setParam = function (id) {
      if (!history.replaceState) return;
      var url = new URL(location.href);
      if (id) url.searchParams.set(kind.param, id); else url.searchParams.delete(kind.param);
      history.replaceState(null, '', url.toString().replace(/all=(&|$)/, 'all$1'));
    };
    var build = function () {
      dialog = document.createElement('dialog');
      dialog.className = 'group-modal';
      dialog.innerHTML =
        '<button type="button" class="group-modal__close" data-group-modal-close aria-label="Close"><svg width="18" height="18" aria-hidden="true"><use href="#i-x"/></svg></button>' +
        '<div class="group-modal__loading" aria-hidden="true"><span></span></div>' +
        '<iframe class="group-modal__frame"></iframe>';
      document.body.appendChild(dialog);
      frame = dialog.querySelector('iframe');
      frame.addEventListener('load', function () {
        var doc;
        try { doc = frame.contentDocument; } catch (err) { doc = null; }
        if (sizer) { sizer.disconnect(); sizer = null; }
        if (!doc || !doc.body || frame.getAttribute('src') === 'about:blank') return;
        var fit = function () { frame.style.height = Math.ceil(doc.body.getBoundingClientRect().height) + 'px'; };
        fit();
        var RO = frame.contentWindow.ResizeObserver || window.ResizeObserver;
        if (RO) { sizer = new RO(fit); sizer.observe(doc.body); }
        dialog.classList.add('is-loaded');
        dialog.scrollTop = 0;
      });
      dialog.addEventListener('close', function () {
        if (sizer) { sizer.disconnect(); sizer = null; }
        frame.setAttribute('src', 'about:blank');
        frame.style.height = '';
        dialog.classList.remove('is-loaded');
        document.body.classList.remove('is-locked');
        setParam(null);
        if (lastLink && document.contains(lastLink)) lastLink.focus({ preventScroll: true });
      });
      dialog.addEventListener('click', function (e) {
        if (e.target.closest('[data-group-modal-close]')) { dialog.close(); return; }
        var r = dialog.getBoundingClientRect();   // a click on the backdrop
        if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) dialog.close();
      });
    };
    var open = function (link, k) {
      if (!dialog) build();
      lastLink = link;
      kind = k;
      dialog.classList.remove('is-loaded');
      dialog.setAttribute('aria-label', k.label);
      frame.setAttribute('title', k.label);
      var card = link.closest('[data-tone]');
      if (card) dialog.setAttribute('data-tone', card.getAttribute('data-tone')); else dialog.removeAttribute('data-tone');
      frame.setAttribute('src', link.href);
      document.body.classList.add('is-locked');
      dialog.showModal();
      dialog.querySelector('[data-group-modal-close]').focus();
      setParam(link.getAttribute(k.attr));
    };
    var supported = typeof HTMLDialogElement === 'function';
    document.addEventListener('click', function (e) {
      if (!supported || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      for (var i = 0; i < kinds.length; i += 1) {
        var link = e.target.closest('a[' + kinds[i].attr + ']');
        if (link) { e.preventDefault(); open(link, kinds[i]); return; }
      }
    });
    // Reopen from the address (?group=ID / ?staff=key), once the cards are laid out
    if (supported) {
      var params = new URLSearchParams(location.search);
      kinds.some(function (k) {
        var wanted = params.get(k.param);
        var link = wanted && document.querySelector('a[' + k.attr + '="' + wanted.replace(k.clean, '') + '"]');
        if (link) open(link, k);
        return !!link;
      });
    }
  })();

  // --- Inside a frame pop-up: [data-frame-close] closes it ---------------------------
  // (e.g. StaffDetail.lava's "Back to staff"). On its own page the link is
  // followed as usual.
  if (root.classList.contains('is-framed')) {
    document.addEventListener('click', function (e) {
      var closer = e.target.closest('[data-frame-close]');
      if (!closer) return;
      var host = null;
      try { host = window.frameElement ? window.frameElement.closest('dialog') : null; } catch (err) { host = null; }
      if (host) { e.preventDefault(); host.close(); }
    });
  }

  // --- Staff photo, tap to swap ([data-staff-photo]: StaffDetail.lava) ----------------
  // Devices that hover swap to the fun photo on hover (CSS); a tap toggles it.
  document.addEventListener('click', function (e) {
    var photo = e.target.closest('[data-staff-photo]');
    if (photo && !window.matchMedia('(hover: hover)').matches) photo.classList.toggle('is-alt');
  });

  // --- Group details ([data-group-detail]: LifeGroupDetails.lava) -------------------
  // The card's front is the group; its back holds Rock's Group Registration
  // block, which sits after the card on the page (found by Rock's own
  // .group-registration class, or a block given the CSS class "group-signup")
  // and is moved into the back here. "Sign up for this group" flips the card (a
  // quarter turn out, swap faces, a quarter turn in; a plain swap with reduced
  // motion). The open face is remembered for the browser session, so after the
  // form posts back the card opens on its back with the result. Inside the
  // finder's pop-up (html.is-framed), "Back to groups" closes the pop-up.
  document.querySelectorAll('[data-group-detail]').forEach(function (gd) {
    var card = gd.querySelector('[data-gd-card]');
    var front = gd.querySelector('[data-gd-front]');
    var back = gd.querySelector('[data-gd-back]');
    var slot = gd.querySelector('[data-gd-slot]');
    var flipBtn = gd.querySelector('[data-gd-flip]');
    var form = document.querySelector('.group-signup') || document.querySelector('.block-instance.group-registration');   // a block given that class, else Rock's own class for its Group Registration block
    var key = 'gd-face-' + gd.getAttribute('data-group-detail');
    var framed = root.classList.contains('is-framed');
    var host = null;
    try { host = framed && window.frameElement ? window.frameElement.closest('dialog') : null; } catch (err) { host = null; }

    if (form && slot && flipBtn && back) {
      slot.appendChild(form);
      flipBtn.hidden = false;
    }
    var store = function (v) { try { if (v) sessionStorage.setItem(key, v); else sessionStorage.removeItem(key); } catch (err) { /* private mode */ } };
    var stored = function () { try { return sessionStorage.getItem(key); } catch (err) { return null; } };
    var toTop = function () {
      if (host) host.scrollTop = 0;
      else if (gd.getBoundingClientRect().top < 0) window.scrollTo({ top: window.scrollY + gd.getBoundingClientRect().top - 16, behavior: 'instant' });
    };
    var swap = function (toBack) {
      front.hidden = toBack;
      back.hidden = !toBack;
      store(toBack ? 'back' : null);
    };
    var flip = function (toBack) {
      var focusTarget = function () {
        var t = toBack ? back.querySelector('#gd-signup') : flipBtn;
        if (t) t.focus({ preventScroll: true });
      };
      if (reduced.matches || !card.animate) { swap(toBack); toTop(); focusTarget(); return; }
      var dir = toBack ? 1 : -1;
      card.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(' + (90 * dir) + 'deg)' }], { duration: 170, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' }).finished.then(function () {
        swap(toBack);
        toTop();
        return card.animate([{ transform: 'rotateY(' + (-90 * dir) + 'deg)' }, { transform: 'rotateY(0deg)' }], { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }).finished;
      }).then(focusTarget);
    };

    if (form && back && stored() === 'back') swap(true);

    gd.addEventListener('click', function (e) {
      if (e.target.closest('[data-gd-flip]')) { flip(true); return; }
      if (e.target.closest('[data-gd-unflip]')) { flip(false); return; }
      if (host && e.target.closest('[data-gd-close]')) { e.preventDefault(); store(null); host.close(); }
    });
  });

  // --- Content modals (.content-modal <dialog>, e.g. Outreach's partners) -----------
  // A [data-modal-open="<dialog id>"] button opens that dialog; [data-modal-close]
  // inside it, Esc (the browser's own) or a click on the backdrop closes it. The
  // dialog fills its box, so a click whose target is the dialog itself is the backdrop.
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      var dlg = document.getElementById(opener.getAttribute('data-modal-open'));
      if (dlg && typeof dlg.showModal === 'function') { e.preventDefault(); dlg.showModal(); }
      return;
    }
    var closer = e.target.closest('[data-modal-close]');
    if (closer) { var open = closer.closest('dialog'); if (open) open.close(); return; }
    if (e.target.matches && e.target.matches('dialog.content-modal[open]')) e.target.close();
  });

  // --- Site search: live results (Assets/Lava/SiteSearch.lava) ----------------------
  // [data-site-search] holds the input; data-endpoint is the Lava Application
  // endpoint that returns the results fragment (SiteSearchResults.lava), and
  // data-results the id of the area it fills. Typing searches after a short
  // pause (2+ characters); Enter or the button searches at once. A newer
  // search cancels the one in flight. The address bar gets ?q=… so a reload
  // or a shared link shows the same results (the page renders them itself).
  // Rock wraps every page in one ASP.NET <form>, so Enter must not reach it:
  // it would post the page back.
  var searchTimer = null;
  var searchRequest = null;
  function runSiteSearch(box, immediate) {
    var input = box.querySelector('input[name="q"]');
    var out = document.getElementById(box.getAttribute('data-results'));
    if (!input || !out) return;
    var q = input.value.trim();
    clearTimeout(searchTimer);
    if (q.length < 2) {
      if (searchRequest) searchRequest.abort();
      out.innerHTML = '';
      history.replaceState(null, '', location.pathname);
      return;
    }
    searchTimer = setTimeout(function () {
      if (searchRequest) searchRequest.abort();
      searchRequest = new AbortController();
      out.setAttribute('aria-busy', 'true');
      fetch(box.getAttribute('data-endpoint') + '?q=' + encodeURIComponent(q), {
        credentials: 'same-origin',
        signal: searchRequest.signal
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (html) {
          out.innerHTML = html;
          out.removeAttribute('aria-busy');
          history.replaceState(null, '', location.pathname + '?q=' + encodeURIComponent(q));
        })
        .catch(function (err) {
          if (err.name === 'AbortError') return;
          out.removeAttribute('aria-busy');
          out.innerHTML = '<p class="site-search__empty">Search isn’t available right now. Please try again.</p>';
        });
    }, immediate ? 0 : 300);
  }
  document.addEventListener('input', function (e) {
    var box = e.target.closest && e.target.closest('[data-site-search]');
    if (box && e.target.name === 'q') runSiteSearch(box, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.closest) return;
    var box = e.target.closest('[data-site-search]');
    if (!box || e.target.name !== 'q') return;
    e.preventDefault();
    runSiteSearch(box, true);
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-site-search-go]');
    if (!btn) return;
    e.preventDefault();
    runSiteSearch(btn.closest('[data-site-search]'), true);
  });

  // --- Login block: method tabs (Rock's Obsidian Login block; Styles/_login.scss) ---
  // Rock offers the other sign-in method as ONE button ("Sign in with
  // Account" / "Sign in with Email or Phone"). When both methods are on, this
  // adds a two-tab switch above the form; picking the other tab clicks Rock's
  // button, so Rock still does all the work.
  // Vue owns everything inside the block's root element ([id^="obsidian-"])
  // and breaks if other code changes it, so nothing here touches it: the tabs
  // go BEFORE the root element and the state class goes on the block
  // instance. Rock renders the block in the browser and re-renders between
  // steps, so a MutationObserver keeps the tabs in sync. If the picker can't
  // be found (one method only, or a Rock update renamed it), the tabs hide
  // and Rock's own UI shows.
  var loginHost = document.querySelector('.block-instance.login');
  var loginRoot = loginHost && loginHost.querySelector('.block-content > [id^="obsidian-"]');
  if (loginRoot) {
    var LOGIN_TABS = [
      { key: 'credential', label: 'Username & password' },   // the block's default method
      { key: 'passwordless', label: 'Phone or email' }
    ];
    var loginTabs = document.createElement('div');
    loginTabs.className = 'login-tabs';
    loginTabs.setAttribute('role', 'tablist');
    loginTabs.setAttribute('aria-label', 'Sign-in method');
    loginTabs.hidden = true;
    LOGIN_TABS.forEach(function (def) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'login-tabs__tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', loginRoot.id);
      tab.setAttribute('data-login-method', def.key);
      tab.textContent = def.label;
      loginTabs.appendChild(tab);
    });
    loginRoot.parentNode.insertBefore(loginTabs, loginRoot);

    var findLoginPicker = function () {
      var btn = loginRoot.querySelector('.login-methods button');
      return btn && /sign in with/i.test(btn.textContent) ? btn : null;
    };
    var syncLoginTabs = function () {
      var picker = findLoginPicker();
      loginTabs.hidden = !picker;
      loginHost.classList.toggle('login--tabs', !!picker);
      if (!picker) return;
      /* The picker offers the method that is NOT showing */
      var active = /account/i.test(picker.textContent) ? 'passwordless' : 'credential';
      loginTabs.setAttribute('data-active', active);
      loginTabs.querySelectorAll('[role="tab"]').forEach(function (tab) {
        var on = tab.getAttribute('data-login-method') === active;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
    };
    var switchLoginMethod = function (tab) {
      if (tab.getAttribute('aria-selected') === 'true') return;
      var picker = findLoginPicker();
      if (!picker || picker.disabled) return;
      /* Slide the pill now; the observer confirms once Rock has swapped the form */
      loginTabs.setAttribute('data-active', tab.getAttribute('data-login-method'));
      picker.click();
    };
    loginTabs.addEventListener('click', function (e) {
      var tab = e.target.closest('.login-tabs__tab');
      if (tab) switchLoginMethod(tab);
    });
    /* Arrow keys move between the two tabs (and switch), per the tabs pattern */
    loginTabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var tab = e.target.closest('.login-tabs__tab');
      if (!tab) return;
      e.preventDefault();
      var other = tab.nextElementSibling || tab.previousElementSibling;
      other.focus();
      switchLoginMethod(other);
    });
    syncLoginTabs();
    new MutationObserver(syncLoginTabs).observe(loginRoot, { childList: true, subtree: true, characterData: true });
  }

  // --- Series browse: Grid/Detail + reveal in batches (Assets/Lava/SeriesBrowse.lava) ---
  // The server renders every series. Cards past the first batch get
  // .is-pending (display: none, so their images aren't fetched); the next
  // batch is revealed when the Show more button nears the viewport, or when
  // it's pressed. The view choice is remembered in localStorage.
  document.querySelectorAll('[data-series-browse]').forEach(function (browse) {
    var list = browse.querySelector('[data-series-list]');
    if (!list) return;
    var cards = Array.prototype.slice.call(list.children);
    var batch = parseInt(browse.getAttribute('data-batch'), 10) || 12;
    var more = browse.querySelector('[data-series-more]');
    var toggle = browse.querySelector('[data-view-toggle]');
    var shown = Math.min(batch, cards.length);

    cards.forEach(function (card, i) { if (i >= shown) card.classList.add('is-pending'); });

    function reveal() {
      var next = Math.min(shown + batch, cards.length);
      for (var i = shown; i < next; i++) {
        cards[i].classList.remove('is-pending');
        cards[i].classList.add('is-revealed');
      }
      shown = next;
      if (shown >= cards.length && more) {
        more.hidden = true;
        if (observer) observer.disconnect();
      }
    }

    var observer = null;
    if (more && shown < cards.length) {
      more.hidden = false;
      more.addEventListener('click', function () {
        var first = cards[shown];
        reveal();
        /* Keyboard and screen reader users land on the first new card */
        var link = first && first.querySelector('[data-card-link]');
        if (link) link.focus({ preventScroll: true });
      });
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          reveal();
          /* Still in range after the reveal (a tall screen): observing again
             reports it afresh, so the next batch follows */
          if (shown < cards.length) { observer.unobserve(more); observer.observe(more); }
        }, { rootMargin: '0px 0px 400px 0px' });
        observer.observe(more);
      }
    }

    if (!toggle) return;
    var buttons = toggle.querySelectorAll('[data-view]');
    function setView(view) {
      list.setAttribute('data-view', view);
      toggle.setAttribute('data-active', view);
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === view ? 'true' : 'false'); });
      try { localStorage.setItem('vrl-series-view', view); } catch (e) {}
    }
    var saved = null;
    try { saved = localStorage.getItem('vrl-series-view'); } catch (e) {}
    setView(saved === 'detail' ? 'detail' : 'grid');
    toggle.hidden = false;
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
    });
  });

  // --- Tabs ([data-tabs]: the series cards' About / Messages, SeriesBrowse.lava) ----
  // The markup ships with every panel showing and the tab row hidden, so it
  // reads fine without JavaScript. Here the row appears and only the selected
  // panel shows. Arrow keys move between tabs (the ARIA tabs pattern).
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs[0].parentNode.hidden = false;
    select(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
  });

  // --- Pill tabs ([data-pill-tabs]: ManageGiving.lava) -------------------------------
  // Tabs over whole Rock blocks: each tab's data-panel is a class, and every
  // element with it (usually a block whose CSS Class setting includes it)
  // shows only while that tab is selected. The white pill slides to the
  // selected tab (--pill-x / --pill-w). The choice goes in the URL hash and in
  // sessionStorage, so a Rock postback inside a panel (paging, filters)
  // reloads on the same tab. Links with data-pill-goto="panel" switch tabs.
  document.querySelectorAll('[data-pill-tabs]').forEach(function (bar) {
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    var storeKey = 'vrl-tab:' + location.pathname.toLowerCase();
    var current = null;
    var place = function (tab) {
      bar.style.setProperty('--pill-x', tab.offsetLeft + 'px');
      bar.style.setProperty('--pill-w', tab.offsetWidth + 'px');
    };
    var select = function (tab, focus, remember) {
      current = tab;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.querySelectorAll('.' + t.getAttribute('data-panel')).forEach(function (panel) { panel.hidden = !on; });
      });
      place(tab);
      // On a phone the strip scrolls sideways: bring the selected tab into view
      if (bar.scrollWidth > bar.clientWidth) {
        bar.scrollTo({ left: tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2, behavior: remember ? 'smooth' : 'auto' });
      }
      // An iframe that resizes itself (Simple Donation) re-measures on resize
      window.dispatchEvent(new Event('resize'));
      if (remember) {
        try { sessionStorage.setItem(storeKey, tab.getAttribute('data-hash')); } catch (err) {}
        if (history.replaceState) history.replaceState(null, '', '#' + tab.getAttribute('data-hash'));
      }
      if (focus) tab.focus();
    };
    var byHash = function (hash) {
      return tabs.filter(function (t) { return t.getAttribute('data-hash') === hash; })[0];
    };
    var stored = null;
    try { stored = sessionStorage.getItem(storeKey); } catch (err) {}
    bar.hidden = false;
    select(byHash(location.hash.slice(1)) || byHash(stored) || tabs[0]);
    bar.setAttribute('data-ready', '');
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false, true); });
      tab.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true, true);
      });
    });
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-pill-goto]');
      if (!link) return;
      var tab = tabs.filter(function (t) { return t.getAttribute('data-panel') === link.getAttribute('data-pill-goto'); })[0];
      if (!tab) return;
      e.preventDefault();
      select(tab, false, true);
      bar.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    window.addEventListener('hashchange', function () {
      var tab = byHash(location.hash.slice(1));
      if (tab && tab !== current) select(tab, false, true);
    });
    // Labels change width when the web font arrives or the bar wraps
    if (window.ResizeObserver) new ResizeObserver(function () { if (current) place(current); }).observe(bar);
  });

  // --- Series watch: theater (Assets/Lava/SeriesDetail.lava) --------------------------
  // Theater widens the player to the full width and drops the playlist below
  // it (data-theater; the layout is CSS). The change runs as a view
  // transition where supported, so the player and playlist glide to their
  // new places, and the choice is remembered for the next message.
  var watch = document.querySelector('[data-watch]');
  if (watch) {
    var theaterBtn = watch.querySelector('[data-watch-theater]');
    var setTheater = function (on) {
      watch.toggleAttribute('data-theater', on);
      if (theaterBtn) theaterBtn.setAttribute('aria-pressed', String(on));
    };
    var savedTheater = null;
    try { savedTheater = localStorage.getItem('vrl-theater'); } catch (e) {}
    setTheater(savedTheater === 'on');
    if (theaterBtn) {
      theaterBtn.hidden = false;
      theaterBtn.addEventListener('click', function () {
        var on = !watch.hasAttribute('data-theater');
        try { localStorage.setItem('vrl-theater', on ? 'on' : 'off'); } catch (e) {}
        if (document.startViewTransition && !reduced.matches) {
          document.startViewTransition(function () { setTheater(on); });
        } else {
          setTheater(on);
        }
      });
    }
  }

  // --- Show more: clamped text that slides open ([data-clamp]) ---------------------
  // A [data-clamp] box holds the text (.clamp: a few lines, CSS) and its
  // button (.clamp-more, hidden until the clamp actually hides something).
  // The height animates between the clamped and full text; the open / closed
  // end states belong to the CSS (.is-open on the box). Used by the message
  // widget (Partials/LatestMessage.lava) and the series page's description.
  document.querySelectorAll('[data-clamp]').forEach(function (box) {
    var text = box.querySelector('.clamp');
    var btn = box.querySelector('.clamp-more');
    if (!text || !btn || text.scrollHeight <= text.clientHeight + 1) return;
    var busy = false;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (busy) return;
      var open = !box.classList.contains('is-open');
      var label = function () {
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Show less' : 'Show more';
      };
      var from = text.offsetHeight;
      box.classList.toggle('is-open', open);
      var to = text.offsetHeight;
      if (reduced.matches || typeof text.animate !== 'function') { label(); return; }
      busy = true;
      if (!open) box.classList.add('is-open');   // stay unclamped while it closes
      text.style.overflow = 'hidden';
      label();
      text.animate([{ height: from + 'px' }, { height: to + 'px' }],
        { duration: 420, easing: 'cubic-bezier(.2, .7, .2, 1)' }).onfinish = function () {
        if (!open) box.classList.remove('is-open');
        text.style.overflow = '';
        busy = false;
      };
    });
  });

  // --- Content page: on this page ([data-toc]: Styles/_content.scss) -----------------
  // Marks the link of the section being read (aria-current) as you scroll: the
  // last section whose top has passed a line a third of the way down the
  // screen. On phones the list is a chip row; the current chip scrolls into view.
  // Also sets data-tone="ink" while the glass panel sits over an .on-ink band.
  // data-toc="scope" (the sticky subnav, .content-subnav): its links point at
  // section starts (dividers), so the last one stays current until the end of
  // the page body rather than the end of its target.

  document.querySelectorAll('[data-toc]').forEach(function (toc) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var targets = links.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
    if (!links.length) return;
    var current = null;
    var ticking = false;
    var panel = toc.querySelector('.content-toc__panel') || toc;
    var inks = Array.prototype.slice.call(toc.parentNode.querySelectorAll('.on-ink'));
    function update() {
      ticking = false;
      // Glass tone: dark while the panel sits over an ink band
      var p = panel.getBoundingClientRect(), mid = p.top + p.height / 2, onInk = false;
      inks.forEach(function (b) { var r = b.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) onInk = true; });
      if (onInk) toc.setAttribute('data-tone', 'ink'); else toc.removeAttribute('data-tone');
      var line = window.innerHeight / 3;
      var pick = -1;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) pick = i; });
      var last = toc.getAttribute('data-toc') === 'scope' ? toc.parentNode : targets[targets.length - 1];
      if (last && last.getBoundingClientRect().bottom < 0) pick = -1;   // read past the list
      var next = pick >= 0 ? links[pick] : null;
      if (next === current) return;
      if (current) current.removeAttribute('aria-current');
      current = next;
      if (current) {
        current.setAttribute('aria-current', 'true');
        var row = current.closest('ol');
        if (row && row.scrollWidth > row.clientWidth) {
          var r = row.getBoundingClientRect(), c = current.getBoundingClientRect();
          if (c.left < r.left || c.right > r.right) row.scrollTo({ left: row.scrollLeft + c.left - r.left - 16, behavior: reduced.matches ? 'auto' : 'smooth' });
        }
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  // --- Esc closes whatever is open ------------------------------------------------

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var drawer = document.getElementById('mobilenav');
    if (drawer && drawer.getAttribute('data-open') === 'true') { closeMobile(); return; }
    var accountOpen = document.querySelector('[data-account-toggle][aria-expanded="true"]');
    if (accountOpen) {
      setAccount(false);
      if (accountOpen.parentNode.contains(document.activeElement)) accountOpen.focus();
      return;
    }
    closeAllShares();
    if (!header) return;
    /* Blur first: focusout fires synchronously and would otherwise overwrite
       'closed' with 'idle' a moment later. */
    if (document.activeElement && header.contains(document.activeElement)) document.activeElement.blur();
    clearTimeout(menuTimer);
    setMenu('closed');
  });

  // --- 6. Cover sections: pin by bottom edge when taller than the viewport -----------
  //     + footer runway (homepage: the last child of <main>)

  var covers = document.querySelectorAll('[data-cover]');
  var footerEl = document.getElementById('site-footer');
  var runway = document.querySelector('.footer-runway');
  if (covers.length || runway) {
    var setStick = function () {
      /* Pin just below the fixed header when the section fits beneath it;
         otherwise pin by the bottom edge so all of it scrolls into view. */
      var headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      covers.forEach(function (el) {
        var top = Math.min(headerBottom, window.innerHeight - el.offsetHeight);
        el.style.setProperty('--stick-top', top + 'px');
      });
      /* Only pages with a runway pull the footer up over the last section. */
      if (runway && footerEl) root.style.setProperty('--footer-h', footerEl.offsetHeight + 'px');
    };
    setStick();
    window.addEventListener('resize', setStick);
    if ('ResizeObserver' in window) new ResizeObserver(setStick).observe(document.body);
  }

  // --- 7. Footer reveal ----------------------------------------------------------------

  if (footerEl) {
    if ('IntersectionObserver' in window && !reduced.matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { footerEl.classList.add('is-in'); io.disconnect(); }
        });
      }, { threshold: 0.12 });
      io.observe(footerEl);
    } else {
      footerEl.classList.add('is-in');
    }
  }

})();
