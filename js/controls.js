/* =========================================================================
   controls.js — Simulation Controls panel + built-in demonstration scenario.
   Presenter-only tooling: these controls would not exist on a flight unit.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state;

  /* Slider bindings: key → [get, set, decimals, unit] */
  var CTL = {
    hr:        [function () { return S.base.hr; },        function (v) { A.sim.ramp('hr', v, 1.5); }, 0, ' BPM'],
    spo2:      [function () { return S.base.spo2; },      function (v) { A.sim.ramp('spo2', v, 1.5); }, 0, ' %'],
    temp:      [function () { return S.base.temp; },      function (v) { A.sim.ramp('temp', v, 1.5); }, 1, ' °C'],
    resp:      [function () { return S.base.resp; },      function (v) { A.sim.ramp('resp', v, 1.5); }, 0, ' /min'],
    fatigue:   [function () { return S.base.fatigue; },   function (v) { S.base.fatigue = v; }, 0, ' %'],
    hydration: [function () { return S.base.hydration; }, function (v) { S.base.hydration = v; }, 0, ' %'],
    sleep:     [function () { return S.sleepH; },         function (v) { S.sleepH = v; }, 1, ' h'],
    co2:       [function () { return S.base.co2; },       function (v) { A.sim.ramp('co2', v, 1.5); }, 1, ' mmHg'],
    suitP:     [function () { return S.base.suitP; },     function (v) { A.sim.ramp('suitP', v, 1.5); }, 2, ' psi'],
    o2:        [function () { return S.o2; },             function (v) { S.o2 = v; }, 0, ' %'],
    suitBatt:  [function () { return S.suitBatt; },       function (v) { S.suitBatt = v; S.suitBattTarget = null; }, 0, ' %'],
    watchBatt: [function () { return S.watchBatt; },      function (v) { S.watchBatt = v; }, 0, ' %']
  };

  var SEG = {
    location:  [function () { return S.location; },  function (v) { A.sim.setLocation(v); A.watch.seedMessages(); A.watch.rerender(); }],
    phase:     [function () { return S.phase; },     function (v) { A.sim.setPhase(v); A.watch.rerender(); }],
    rad:       [function () { return S.radLevel; },  function (v) { S.radLevel = v; }],
    comm:      [function () { return S.commMode; },  function (v) { A.sim.setComm(v); }],
    timeScale: [function () { return String(S.timeScale); }, function (v) { S.timeScale = +v; }]
  };

  /* ---------------- Demo scenario engine ---------------- */
  var KEYMAP = { hrBase: 'hr', spo2Base: 'spo2', co2Base: 'co2', suitPBase: 'suitP', stressBase: 'stressBase', tempBase: 'temp' };
  var demo = A.demo = {
    running: false, t: 0, applied: 0, done: false,
    start: function () {
      if (this.done || this.t === 0) { this.reset(true); }
      this.running = true; S.rampsPaused = false; status();
    },
    pause: function () { this.running = false; S.rampsPaused = true; status(); },
    reset: function (keepQuiet) {
      this.running = false; this.t = 0; this.applied = 0; this.done = false;
      A.sim.reset(); S.location = 'MARS'; S.phase = 'SURFACE'; A.sim.setLocation('MARS');
      S.rampsPaused = false; S.msgs = []; S.pending = []; S.checklist = {}; S.returning = false; S.emSent = false;
      A.alerts.clear(); S.emergency.active = false; S.emergency.suppressed = false;
      document.body.classList.remove('is-emergency');
      A.watch.seedMessages(); A.watch.home();
      if (!keepQuiet) status();
    },
    tick: function (dt) {
      if (!this.running) return;
      this.t += dt;
      while (this.applied < A.DEMO.length && A.DEMO[this.applied].at <= this.t) {
        var step = A.DEMO[this.applied];
        Object.keys(step.set).forEach(function (k) {
          var val = step.set[k];
          if (k === 'suitBattTarget') S.suitBattTarget = val;
          else if (k === 'suitBattDrain') S.suitBattDrain = val;
          else A.sim.ramp(KEYMAP[k] || k, val, step.dur);
        });
        this.applied++;
      }
      if (this.applied === A.DEMO.length && this.t > A.DEMO[A.DEMO.length - 1].at + 4 && !S.emergency.active && !S.emergency.suppressed) {
        A.emergency.activate('AUTO · MULTIPLE CRITICAL', true);
      }
      if (this.t >= A.DEMO_LENGTH) { this.running = false; this.done = true; }
      status();
    }
  };

  function status() {
    var idx = Math.max(0, demo.applied - 1), step = A.DEMO[idx];
    var text = demo.t === 0 ? 'Mars surface EVA · ASTRONAUT-01 · starts healthy, then a suit fault develops.' :
      demo.done ? 'Demo complete. Emergency mode active — try the emergency buttons on the wrist unit, then RESET.' : step.text;
    var lbl = demo.t === 0 ? 'READY' : demo.done ? 'COMPLETE' : (demo.running ? 'RUNNING' : 'PAUSED') + ' · STEP ' + (idx + 1) + '/' + A.DEMO.length;
    document.querySelectorAll('.demo-text').forEach(function (e) { e.textContent = text; });
    document.querySelectorAll('.demo-step').forEach(function (e) { e.textContent = lbl; });
    document.querySelectorAll('.demo-prog').forEach(function (e) { e.style.width = Math.min(100, demo.t / A.DEMO_LENGTH * 100) + '%'; });
    document.querySelectorAll('[data-demo="start"]').forEach(function (b) { b.classList.toggle('on', demo.running); });
    document.querySelectorAll('[data-demo="pause"]').forEach(function (b) { b.classList.toggle('on', !demo.running && demo.t > 0 && !demo.done); });
  }

  /* ---------------- wire up DOM ---------------- */
  A.controls = {
    init: function () {
      document.querySelectorAll('input[data-ctl]').forEach(function (inp) {
        var c = CTL[inp.dataset.ctl]; if (!c) return;
        inp.addEventListener('input', function () { c[1](+inp.value); out(inp); });
      });
      document.querySelectorAll('[data-seg]').forEach(function (grp) {
        var s = SEG[grp.dataset.seg];
        grp.addEventListener('click', function (e) {
          var b = e.target.closest('button[data-v]'); if (!b) return;
          s[1](b.dataset.v); A.controls.sync();
        });
      });
      document.querySelectorAll('input[data-toggle]').forEach(function (t) {
        t.addEventListener('change', function () { S[t.dataset.toggle] = t.checked; if (t.dataset.toggle === 'audio' && t.checked) A.audio.click(); });
      });
      document.querySelectorAll('[data-demo]').forEach(function (b) {
        b.addEventListener('click', function () { demo[b.dataset.demo](); });
      });
      document.querySelectorAll('[data-action="trigger-emergency"]').forEach(function (b) {
        b.addEventListener('click', function () { if (!S.emergency.active) A.emergency.activate('SIMULATED · PRESENTER TRIGGER'); else A.watch.go('emergency', true); });
      });
      document.querySelectorAll('[data-action="reset-all"]').forEach(function (b) { b.addEventListener('click', function () { demo.reset(); A.controls.sync(); }); });
      status(); this.sync();
    },
    /* Reflect live state into controls (skip the one being dragged). */
    sync: function () {
      document.querySelectorAll('input[data-ctl]').forEach(function (inp) {
        if (document.activeElement === inp) return;
        var c = CTL[inp.dataset.ctl]; if (!c) return;
        var v = c[0](); if (Math.abs(+inp.value - v) > 1e-3) inp.value = v; out(inp);
      });
      document.querySelectorAll('[data-seg]').forEach(function (grp) {
        var cur = SEG[grp.dataset.seg][0]();
        grp.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === cur); });
      });
      document.querySelectorAll('input[data-toggle]').forEach(function (t) { t.checked = !!S[t.dataset.toggle]; });
    }
  };
  function out(inp) {
    var c = CTL[inp.dataset.ctl], o = inp.parentElement.querySelector('output');
    if (o) o.textContent = (+inp.value).toFixed(c[2]) + c[3];
  }
})(window.AMWS);
