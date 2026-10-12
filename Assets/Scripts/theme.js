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
    var zoneHovered = function () {
      return zones.some(function (z) { return z.matches(':hover'); });
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
      if (!header.contains(e.relatedTarget) && !zoneHovered()) setMenu('idle');
    });

    /* Column highlight: hovering or focusing a top-level link lifts its column
       of children. Link and column share a page id (data-page / data-col). */
    var setHotColumn = function (id) {
      header.querySelectorAll('.mega__col[data-col]').forEach(function (col) {
        col.classList.toggle('is-hot', id !== null && col.getAttribute('data-col') === id);
      });
    };
    var hotFrom = function (e) {
      var link = e.target.closest('.nav__link[data-page]');
      if (link) setHotColumn(link.getAttribute('data-page'));
    };
    header.addEventListener('mouseover', hotFrom);
    header.addEventListener('focusin', hotFrom);
    var navList = header.querySelector('.nav__list');
    if (navList) navList.addEventListener('mouseleave', function () { setHotColumn(null); });
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
