/* =========================================================================
   main.js — Boot, main loop, view switching (DESKTOP / WRIST), drawer.
   Loop rates: physics 10 Hz · assessment + UI 4 Hz · history 1 Hz · canvas 60 fps.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state;

  function setView(v) {
    document.body.dataset.view = v;
    document.querySelectorAll('[data-view-btn]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.viewBtn === v); });
    try { localStorage.setItem('amws-view', v); } catch (e) { /* storage unavailable */ }
    fitWrist(); window.scrollTo(0, 0);
  }

  /* Scale the watch to fill the viewport in WRIST mode. */
  function fitWrist() {
    var unit = document.querySelector('.watch'); if (!unit) return;
    var s = 1;
    if (document.body.dataset.view === 'wrist') {
      var availH = window.innerHeight - 110, availW = window.innerWidth - (window.innerWidth > 900 ? 420 : 24);
      s = Math.max(0.6, Math.min(1.7, availH / 560, availW / 470));
    } else if (window.innerWidth < 520) {
      s = Math.min(1, (window.innerWidth - 16) / 470);
    }
    document.documentElement.style.setProperty('--wscale', s.toFixed(3));
  }

  function boot() {
    A.watch.init(document.querySelector('.watch'));
    A.watch.seedMessages();
    A.dashboard.init(document.querySelector('#status'));
    A.controls.init();

    document.querySelectorAll('[data-view-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.viewBtn); });
    });
    var drawer = document.querySelector('#simDrawer');
    document.querySelectorAll('[data-drawer]').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.dataset.drawer === 'toggle' ? !document.body.classList.contains('drawer-open') : b.dataset.drawer === 'open';
        document.body.classList.toggle('drawer-open', open);
        drawer.setAttribute('aria-hidden', !open);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'Escape') document.body.classList.remove('drawer-open');
      if (e.key === 'h' || e.key === 'H') A.watch.home();
      if (e.key === 'Backspace') { e.preventDefault(); A.watch.back(); }
    });
    window.addEventListener('resize', fitWrist);

    var saved = 'desktop';
    try { saved = localStorage.getItem('amws-view') || 'desktop'; } catch (e) { /* ignore */ }
    if (/[?&]view=wrist/.test(location.search)) saved = 'wrist';
    setView(saved);

    /* ---- main loop ---- */
    var last = performance.now(), accSim = 0, accUI = 0, accSample = 0;
    function evaluate() {
      var r = A.assess.run();
      A.buildVM();
      A.bind(document.body);
      A.dashboard.tick(); A.watch.tick(); A.controls.sync();
      if (r.newCrit && A.audio) A.audio.alarm();
      document.body.classList.toggle('has-crit', A.alerts.active().some(function (a) { return a.sev === 2; }));
    }
    for (var i = 0; i < 30; i++) A.sim.step(0.1);   // settle filters
    evaluate();
    for (var j = 0; j < 30; j++) { A.sim.step(0.1); A.sim.sample(A.last.readiness.score); }

    function loop(now) {
      var dt = Math.min(0.25, (now - last) / 1000); last = now;
      accSim += dt; accUI += dt; accSample += dt;
      while (accSim >= 0.1) { A.sim.step(0.1); A.demo.tick(0.1); accSim -= 0.1; }
      if (accUI >= 0.25) { accUI = 0; evaluate(); }
      if (accSample >= 1) { accSample = 0; A.sim.sample(A.last.readiness.score); A.dashboard.sample(); }
      A.dashboard.frame(dt); A.watch.frame(dt);
      requestAnimationFrame(loop);
    }
    A.dashboard.sample();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.AMWS);
