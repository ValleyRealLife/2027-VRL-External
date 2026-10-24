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
  }
  /* Reset to the options view whenever the dialog closes (Esc, backdrop, X),
     so the form doesn't keep loading behind a closed dialog. */
  var careEl = careDialog();
  if (careEl) {
    careEl.addEventListener('close', showCareOptions);
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

  // --- Delegated clicks (drawer, care dialog, share) ---------------------------------

  document.addEventListener('click', function (e) {
    var t = e.target;

    if (t.closest('[data-mobilenav-open]')) { openMobile(); return; }
    if (t.closest('[data-mobilenav-close]')) { closeMobile(); return; }

    if (t.closest('[data-care-trigger]') && careSupported()) { e.preventDefault(); openCare(); return; }
    if (t.closest('[data-care-close]')) { closeCare(); return; }
    if (t.closest('[data-care-back]')) { showCareOptions(); return; }
    var option = t.closest('[data-care-frame]');
    if (option && careSupported() && careDialog().contains(option)) {
      if (showCareFrame(option)) e.preventDefault();
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
    if (!card || e.target.closest('a, button, input, select, textarea, label, summary')) return;
    var selection = window.getSelection ? String(window.getSelection()) : '';
    if (selection) return;
    var link = card.querySelector('[data-card-link]');
    if (!link) return;
    if (e.metaKey || e.ctrlKey) { window.open(link.href, '_blank', 'noopener'); return; }
    link.click();
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

  // --- Esc closes whatever is open ------------------------------------------------

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var drawer = document.getElementById('mobilenav');
    if (drawer && drawer.getAttribute('data-open') === 'true') { closeMobile(); return; }
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
