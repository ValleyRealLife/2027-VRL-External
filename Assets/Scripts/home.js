/**
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
    /* ---------- events rail ---------- */
    var rail = document.getElementById('events-rail');
    var prev = document.querySelector('[data-rail-prev]');
    var next = document.querySelector('[data-rail-next]');
    function railStep() {
      var card = rail.querySelector('.event-card');
      return card ? card.offsetWidth + 24 : 300;
    }
    function syncRail() {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
    }
    prev.addEventListener('click', function () { rail.scrollBy({ left: -railStep(), behavior: reduced.matches ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { rail.scrollBy({ left: railStep(), behavior: reduced.matches ? 'auto' : 'smooth' }); });
    rail.addEventListener('scroll', syncRail, { passive: true });
    window.addEventListener('resize', syncRail);
    syncRail();
  }

  /* ---------- messages: play in place ----------
     Latest-message state only (markup: Assets/Lava/HomeMessages.lava). The
     Rock media player is rendered up front, hidden; playing fades the UI
     out, shows the player and starts it; closing pauses it. Rock's player
     wraps either a Vimeo iframe or a <video>, so both are handled. */
  var messages = document.getElementById('messages');
  var player = messages && messages.querySelector('.messages__player');
  if (player) {
    var lastTrigger = null;

    var command = function (method) {
      var video = player.querySelector('video');
      if (video) {
        var r = video[method]();
        if (r && r.catch) r.catch(function () {});   /* autoplay refused: the player's own play button remains */
        return;
      }
      var frame = player.querySelector('iframe');
      if (frame && frame.contentWindow) frame.contentWindow.postMessage(JSON.stringify({ method: method }), '*');
    };
    var open = function (trigger) {
      lastTrigger = trigger;
      messages.setAttribute('data-playing', 'true');
      player.setAttribute('aria-hidden', 'false');
      var closeBtn = messages.querySelector('[data-watch-close]');
      if (closeBtn) closeBtn.focus();
      setTimeout(function () { command('play'); }, reduced.matches ? 0 : 300);   /* after the fade */
    };
    var close = function () {
      if (messages.getAttribute('data-playing') !== 'true') return;
      command('pause');
      messages.setAttribute('data-playing', 'false');
      player.setAttribute('aria-hidden', 'true');
      if (lastTrigger) lastTrigger.focus();
    };

    messages.querySelectorAll('[data-watch]').forEach(function (btn) {
      btn.addEventListener('click', function () { open(btn); });
    });
    var closeBtn = messages.querySelector('[data-watch-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }
})();

/* ============================================================
   SCROLL CHOREOGRAPHY — GSAP + ScrollTrigger only
   1. Hero → Next Steps card shuffle (scrubbed, so it reverses)
   2. Kids wheels rotate on scroll
   3. Helium-balloon drift on the Kids photos
   4. Students photo pile spreads from a stack as it scrolls in
   Skipped entirely under 900px and for prefers-reduced-motion.

   Starts as soon as the DOM is ready (this file is deferred, after the
   GSAP scripts), not on window load: load waits for every image on the
   page, and until the choreography places the Next Steps cards they would
   sit stacked mid-hero. ScrollTrigger re-measures on load by itself. The
   cards stay hidden until html.stage-ready is set below (_home.scss).
   ============================================================ */
(function (start) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(function () {
  if (!window.gsap || !window.ScrollTrigger) {
    /* CDN unavailable — hand the stage back to the static layout. */
    document.documentElement.classList.add('stage-static');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  /* Mobile toolbars resize the viewport while scrolling; don't re-measure for that. */
  ScrollTrigger.config({ ignoreMobileResize: true });

  var mm = gsap.matchMedia();
  var hero = document.querySelector('.hero');
  var stepsHead = document.querySelector('.steps-head');
  var deck = document.getElementById('deck');

  /* ---------- Phones: hero fades out, heading + card rail rise in ---------- */
  mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', function () {
    /* Heading + rail are centred as one block in the space under the
       header; measured so type or card-size changes can't collide. */
    var placeDeck = function () {
      var headerH = document.querySelector('.site-header').getBoundingClientRect().bottom;
      var block = stepsHead.offsetHeight + 8 + deck.offsetHeight;
      var top = Math.max(headerH + 12, headerH + (window.innerHeight - headerH - block) / 2);
      stepsHead.style.top = top + 'px';
      deck.style.setProperty('--deck-top', (top + stepsHead.offsetHeight + 8) + 'px');
    };
    placeDeck();
    ScrollTrigger.addEventListener('refreshInit', placeDeck);

    gsap.set(stepsHead, { y: 32 });
    /* Starts fully below the viewport — nothing peeks under the hero. */
    gsap.set(deck, { y: function () { return window.innerHeight - deck.offsetTop + 24; } });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#stage',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.25,
        invalidateOnRefresh: true
      }
    });
    /* autoAlpha: hidden at 0 too, so the faded CTA can't catch clicks */
    tl.to(hero, { autoAlpha: 0, y: -80, duration: 0.2, ease: 'none' }, 0)
      .to(stepsHead, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' }, 0.18)
      .to(deck, { y: 0, duration: 0.42, ease: 'power2.out' }, 0.12)
      .to({}, { duration: 0.06 });   /* short hold once landed (was 0.14) */

    return function cleanup() {
      ScrollTrigger.removeEventListener('refreshInit', placeDeck);
      deck.style.removeProperty('--deck-top');
      stepsHead.style.top = '';
      gsap.set([hero, stepsHead, deck], { clearProps: 'all' });
    };
  });

  /* ---------- Desktop: the fan spreads into the row ---------- */
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var cards = gsap.utils.toArray('#deck .nextstep-card');
    var mid = (cards.length - 1) / 2;   /* centre slot, whatever the card count */

    /* Heading + landed row are centred as one block in the space under
       the header, so the heading never crowds the bar. Measured on every
       refresh, like the phone layout. */
    var HEAD_GAP = 40;
    var rowCentre = 0;
    var placeRow = function () {
      var headerH = document.querySelector('.site-header').getBoundingClientRect().bottom;
      var block = stepsHead.offsetHeight + HEAD_GAP + cards[0].offsetHeight;
      var top = Math.max(headerH + 24, headerH + (window.innerHeight - headerH - block) / 2);
      stepsHead.style.top = top + 'px';
      rowCentre = top + stepsHead.offsetHeight + HEAD_GAP + cards[0].offsetHeight / 2;
    };
    placeRow();
    ScrollTrigger.addEventListener('refreshInit', placeRow);

    /* Geometry is measured, not assumed: the fan rests so its top
       edge sits at 80% of the viewport, whatever the card height. */
    var metrics = function () {
      var w = cards[0].offsetWidth;
      var h = cards[0].offsetHeight;
      var vh = window.innerHeight;
      var gap = Math.max(16, Math.min(28, w * 0.1));
      return {
        w: w, gap: gap, vh: vh,
        fanY: vh * 0.80 - vh * 0.5 + h / 2,     /* card top at 80vh */
        rowY: rowCentre - vh * 0.5               /* row lands under the heading */
      };
    };

    /* Resting (hero) state: a loose fan peeking up from the bottom */
    gsap.set(cards, {
      xPercent: -50,
      yPercent: -50,
      x: function (i) { var m = metrics(); return (i - mid) * m.w * 0.5; },
      y: function () { return metrics().fanY; },
      rotate: function (i) { return (i - mid) * 6; },
      zIndex: function (i) { return i + 1; }
    });
    gsap.set(stepsHead, { y: 24 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#stage',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.25,                 /* just enough smoothing to hide wheel steps, no felt lag */
        invalidateOnRefresh: true
      }
    });

    /* Hero leaves quickly and linearly — it tracks the wheel, so any
       ease here reads as lag. */
    tl.to(hero, { autoAlpha: 0, y: -90, duration: 0.12, ease: 'none' }, 0)
      .to(stepsHead, { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' }, 0.1);

    /* Each card simply spreads from the fan into its slot — one motion,
       staggered, later cards passing over earlier ones. The fan breaks
       during the hero fade and every card is moving before the fade
       completes (hero fade runs 0 → 0.12). */
    cards.forEach(function (card, i) {
      var t = 0.03 + i * 0.022;
      tl.set(card, { zIndex: 10 + i }, t)
        .to(card, {
          x: function () { var m = metrics(); return (i - mid) * (m.w + m.gap); },
          y: function () { return metrics().rowY; },
          rotate: 0,
          duration: 0.3,
          ease: 'power2.out'   /* fast off the fan, soft into the slot */
        }, t);
    });

    /* Tail: the row is fully landed before the pin releases. */
    tl.to({}, { duration: 0.08 });

    return function cleanup() {
      ScrollTrigger.removeEventListener('refreshInit', placeRow);
      stepsHead.style.top = '';
      gsap.set(cards, { clearProps: 'all' });
      gsap.set([hero, stepsHead], { clearProps: 'all' });
    };
  });

  /* ---------- Kids: wheels rotate as the section passes ---------- */
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    gsap.utils.toArray('[data-wheel]').forEach(function (wheel, i) {
      gsap.to(wheel, {
        rotate: i % 2 === 0 ? 210 : -210,
        ease: 'none',
        scrollTrigger: {
          trigger: wheel.closest('.kids'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    });

    /* ---------- Students: the pile spreads as the page scrolls ----------
       Each frame starts pulled most of the way to the pile's centre,
       nearly squared up and slightly smaller, then drifts out to its
       CSS resting spot and angle. The spread runs from the pile entering
       until Messages is a quarter of the way over it, so it keeps
       moving through the pinned dwell instead of finishing early.
       Linear and scrubbed: a slow, steady unstacking that reverses
       on scroll-up. offsetLeft/Top ignore transforms, so the centring
       maths is stable. */
    var pile = document.querySelector('.scraps');
    if (pile) {
      var STACK_TILT = [-3, 2, 5, -1];   /* scrap--1..4, DOM order */
      gsap.from(gsap.utils.toArray('.scrap', pile), {
        x: function (i, el) { return (pile.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2)) * 0.85; },
        y: function (i, el) { return (pile.offsetHeight / 2 - (el.offsetTop + el.offsetHeight / 2)) * 0.85; },
        rotation: function (i) { return STACK_TILT[i]; },
        scale: 0.92,
        ease: 'none',
        scrollTrigger: {
          trigger: pile,
          start: 'top 95%',
          endTrigger: '#messages',
          end: 'top 75%',
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
    }

    /* ---------- Helium-balloon drift on the Kids photos ----------
       Bob, drift and sway run as three separate yoyos on unrelated
       periods, so the combined path wanders and never retraces a line.
       Neighbours drift in opposite directions. */
    gsap.utils.toArray('[data-float]').forEach(function (el, i) {
      var dir = i % 2 ? -1 : 1;
      var loop = { ease: 'sine.inOut', repeat: -1, yoyo: true };
      gsap.fromTo(el, { y: 0 }, Object.assign({ y: i % 2 ? -18 : -12, duration: 3.4 + i * 0.7, delay: i * 0.35 }, loop));
      gsap.fromTo(el, { x: -7 * dir }, Object.assign({ x: 9 * dir, duration: 5.3 + i * 1.1, delay: i * 0.6 }, loop));
      gsap.fromTo(el, { rotation: -1.6 * dir }, Object.assign({ rotation: 2 * dir, duration: 4.4 + i * 0.9 }, loop));
    });
  });

  /* Cards are now placed (or the static layout applies): show them. */
  document.documentElement.classList.add('stage-ready');
});
