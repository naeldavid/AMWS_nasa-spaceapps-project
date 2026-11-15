// Developed with AI coding assistance; see README, Use of AI
/* =========================================================================
   ui.js — Pure renderer of the snapshot object.
   Reads ONLY A.snapshot() — never accesses A.state directly.
   Provides declarative binding, severity chips, hold-to-confirm, and audio.
   ========================================================================= */
(function (A) {
  'use strict';

  /* -----------------------------------------------------------------------
     PATH RESOLVER — walks dot-separated path into snapshot object
     ----------------------------------------------------------------------- */
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o && o[k]; }, obj);
  }

  /* -----------------------------------------------------------------------
     SEVERITY CHIP HTML — inline SVG icons per severity level
     Icon viewBox="0 0 12 12", shapes match NASA C&W hierarchy
     ----------------------------------------------------------------------- */
  var CHIP_SVG = {
    nominal:   '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6l3 3 5-5" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    caution:   '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l5 10H1z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    warning:   '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l5 10H1z" fill="currentColor" stroke-linejoin="round"/></svg>',
    emergency: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 1h4l3 3v4l-3 3H4L1 8V4z" fill="currentColor"/></svg>',
    advisory:  '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'
  };

  /* Labels shown inside a chip when no explicit text is supplied */
  var CLS_LABEL = { nominal: 'NOMINAL', caution: 'CAUTION', warning: 'WARNING', emergency: 'EMERGENCY' };

  function chipHTML(cls, text) {
    var svg = CHIP_SVG[cls] || CHIP_SVG.nominal;
    var label = text !== undefined ? text : CLS_LABEL[cls] || cls.toUpperCase();
    return svg + label;
  }

  /* -----------------------------------------------------------------------
     BIND — apply data-bind / data-cls / data-chip / data-bar / data-assumed
     to any DOM subtree. Only touches the DOM when values change.
     ----------------------------------------------------------------------- */
  A.bind = function (root, snap) {
    if (!root) return;
    // snapshot is passed in by the caller; fall back to a fresh one if not
    snap = snap || (A.snapshot ? A.snapshot() : null);
    if (!snap) return;

    /* data-bind="met.label"  → textContent */
    root.querySelectorAll('[data-bind]').forEach(function (el) {
      var val = getPath(snap, el.dataset.bind);
      if (val === undefined || val === null) return;
      var s = String(val);
      if (el.textContent !== s) el.textContent = s;
    });

    /* data-cls="vitals.hr"   → adds class sev-{cls} */
    root.querySelectorAll('[data-cls]').forEach(function (el) {
      var node = getPath(snap, el.dataset.cls);
      if (!node) return;
      var cls = typeof node === 'string' ? node : node.cls;
      if (!cls) return;
      var c = 'sev-' + cls;
      if (!el.classList.contains(c)) {
        el.classList.remove('sev-nominal', 'sev-caution', 'sev-warning', 'sev-emergency');
        el.classList.add(c);
      }
    });

    /* data-chip="vitals.hr"  → renders chip with icon + label */
    root.querySelectorAll('[data-chip]').forEach(function (el) {
      var node = getPath(snap, el.dataset.chip);
      if (!node) return;
      var cls = typeof node === 'string' ? node : node.cls;
      var text = node.unit || node.text || undefined;
      if (!cls) return;
      var html = chipHTML(cls, text);
      if (el._chipHtml !== html) {
        el.innerHTML = html;
        el._chipHtml = html;
        el.className = 'chip sev-' + cls;
      }
    });

    /* data-bar="consumables.o2.pct"  → sets width % */
    root.querySelectorAll('[data-bar]').forEach(function (el) {
      var val = getPath(snap, el.dataset.bar);
      if (val === undefined || val === null) return;
      var pct = Math.max(0, Math.min(100, +val)).toFixed(1) + '%';
      if (el.style.width !== pct) el.style.width = pct;
    });

    /* data-assumed="vitals.hr"  → shows/hides .badge-assumed child */
    root.querySelectorAll('[data-assumed]').forEach(function (el) {
      var node = getPath(snap, el.dataset.assumed);
      if (!node) return;
      var badge = el.querySelector('.badge-assumed');
      if (badge) badge.hidden = !node.assumed;
    });
  };

  /* -----------------------------------------------------------------------
     AUDIO — tiny Web Audio alarm/click (off by default)
     ----------------------------------------------------------------------- */
  A.audio = {
    ctx: null,
    _tone: function (f, d, when) {
      var S = A.state;
      if (!S || !S.audio) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        var o = this.ctx.createOscillator(), g = this.ctx.createGain();
        var t = this.ctx.currentTime + (when || 0);
        o.frequency.value = f; o.type = 'square';
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(this.ctx.destination);
        o.start(t); o.stop(t + d + 0.02);
      } catch (e) { /* audio unavailable */ }
    },
    alarm: function () {
      this._tone(880, 0.18, 0); this._tone(660, 0.18, 0.22); this._tone(880, 0.18, 0.44);
    },
    click: function () { this._tone(1400, 0.03, 0); }
  };

  /* -----------------------------------------------------------------------
     HOLD-TO-CONFIRM binder — shared by watch.js and any other consumer
     Finds all [data-hold] inside root and attaches pointer events.
     ----------------------------------------------------------------------- */
  A.bindHold = function (root, actionMap) {
    root.querySelectorAll('[data-hold]:not([data-bound])').forEach(function (el) {
      el.dataset.bound = '1';
      var ms   = +el.dataset.ms || 1200;
      var fill = el.querySelector('.fill');
      var t0 = 0, raf = 0;

      function stop() {
        cancelAnimationFrame(raf);
        el.classList.remove('holding');
        if (fill) fill.style.width = '0%';
        t0 = 0;
      }
      function tick() {
        var p = Math.min(1, (performance.now() - t0) / ms);
        if (fill) fill.style.width = (p * 100) + '%';
        if (p >= 1) {
          stop();
          var key = el.dataset.hold;
          if (actionMap && actionMap[key]) actionMap[key](el);
          return;
        }
        raf = requestAnimationFrame(tick);
      }
      function start(e) {
        e.preventDefault();
        t0 = performance.now();
        el.classList.add('holding');
        raf = requestAnimationFrame(tick);
      }
      el.addEventListener('pointerdown', start);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
        el.addEventListener(ev, stop);
      });
      el.addEventListener('keydown', function (e) {
        if ((e.key === ' ' || e.key === 'Enter') && !t0) { e.preventDefault(); start(e); }
      });
      el.addEventListener('keyup', stop);
    });
  };

})(window.AMWS);
