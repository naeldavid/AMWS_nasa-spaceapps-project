/* =========================================================================
   presenter.js — Presenter Tool drawer: demo engine + scenario controls.
   PRESENTER-ONLY: this panel would not exist on a flight unit.

   Sim setters used:
     A.sim.ramp(key, value, dur)   — smooth transition of base.* or top-level key
     A.sim.setLocation(loc)        — change location + re-apply scenario
     A.sim.setPhase(phase)         — change phase + re-apply scenario
     A.sim.setComm(mode)           — change comm mode + re-apply scenario
     A.sim.reset()                 — full state reset
     A.emergency.activate(reason)  — trigger emergency screen
     A.watch.seedMessages()        — re-seed comms messages after location change
     A.watch.rerender()            — force watch screen refresh
     A.watch.home()                — navigate watch to home screen
     A.alerts.clear()              — clear alert log on reset
   State written directly:
     S.radLevel, S.speStage, S.timeScale, S.autoEmergency, S.audio
     S.suitBattTarget, S.suitBattDrain, S.rampsPaused
     S.msgs, S.pending, S.checklist, S.returning, S.emSent
     S.emergency.active, S.emergency.suppressed
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state;

  /* ---- Slider bindings: key → [getter, setter, decimals, unit] ---- */
  var CTL = {
    metabolic: [function () { return S.base.metabolic || S.metabolic; }, function (v) { A.sim.ramp('metabolic', v, 1.5); }, 0, ' BTU/hr'],
    spo2:      [function () { return S.base.spo2; },      function (v) { A.sim.ramp('spo2', v, 1.5); }, 0, ' %'],
    temp:      [function () { return S.base.temp; },      function (v) { A.sim.ramp('temp', v, 1.5); }, 1, ' \u00b0C'],
    resp:      [function () { return S.base.resp; },      function (v) { A.sim.ramp('resp', v, 1.5); }, 0, ' /min'],
    co2:       [function () { return S.base.co2; },       function (v) { A.sim.ramp('co2', v, 1.5); }, 1, ' mmHg'],
    suitP:     [function () { return S.base.suitP; },     function (v) { A.sim.ramp('suitP', v, 1.5); }, 2, ' psi'],
    o2:        [function () { return S.o2; },             function (v) { S.o2 = v; }, 0, ' %'],
    suitBatt:  [function () { return S.suitBatt; },       function (v) { S.suitBatt = v; S.suitBattTarget = null; }, 0, ' %']
  };

  /* ---- Segmented controls: key → [getter, setter] ---- */
  var SEG = {
    location:  [function () { return S.location; },  function (v) { A.sim.setLocation(v); A.watch.seedMessages(); A.watch.rerender(); }],
    phase:     [function () { return S.phase; },     function (v) { A.sim.setPhase(v); A.watch.rerender(); }],
    spe:       [function () { return S.speStage || 'NORMAL'; }, function (v) { S.speStage = v; }],
    comm:      [function () { return S.commMode; },  function (v) { A.sim.setComm(v); }],
    timeScale: [function () { return String(S.timeScale); }, function (v) { S.timeScale = +v; }]
  };

  /* ---- Demo engine ---- */
  var KEYMAP = { metabolic: 'metabolic', spo2Base: 'spo2', co2Base: 'co2',
                 suitPBase: 'suitP', tempBase: 'temp' };

  var demo = A.demo = {
    running: false, t: 0, applied: 0, done: false,
    start: function () {
      if (this.done || this.t === 0) { this.reset(true); }
      this.running = true; S.rampsPaused = false; _status();
    },
    pause: function () { this.running = false; S.rampsPaused = true; _status(); },
    reset: function (keepQuiet) {
      this.running = false; this.t = 0; this.applied = 0; this.done = false;
      A.sim.reset(); S.location = 'MARS'; S.phase = 'SURFACE'; A.sim.setLocation('MARS');
      S.rampsPaused = false; S.msgs = []; S.pending = []; S.checklist = {}; S.returning = false; S.emSent = false;
      A.alerts.clear(); S.emergency.active = false; S.emergency.suppressed = false;
      document.body.classList.remove('is-emergency');
      A.watch.seedMessages(); A.watch.home();
      if (!keepQuiet) _status();
    },
    tick: function (dt) {
      if (!this.running) return;
      this.t += dt;
      while (this.applied < A.DEMO.length && A.DEMO[this.applied].at <= this.t) {
        var step = A.DEMO[this.applied];
        Object.keys(step.set).forEach(function (k) {
          var val = step.set[k];
          if (k === 'suitBattTarget') { S.suitBattTarget = val; }
          else if (k === 'suitBattDrain') { S.suitBattDrain = val; }
          else { A.sim.ramp(KEYMAP[k] || k, val, step.dur); }
        });
        this.applied++;
      }
      if (this.applied === A.DEMO.length && this.t > A.DEMO[A.DEMO.length - 1].at + 4 &&
          !S.emergency.active && !S.emergency.suppressed) {
        A.emergency.activate('AUTO \u00b7 MULTIPLE TIME-EMERGENCY', true);
      }
      if (this.t >= A.DEMO_LENGTH) { this.running = false; this.done = true; }
      _status();
    }
  };

  function _status() {
    var idx = Math.max(0, demo.applied - 1), step = A.DEMO[idx];
    var text = demo.t === 0
      ? 'Mars surface EVA \u00b7 ASTRONAUT-01 \u00b7 starts healthy, then a suit fault develops.'
      : demo.done
        ? 'Demo complete. Emergency mode active \u2014 try the emergency buttons on the wrist unit, then RESET.'
        : step.text;
    var lbl = demo.t === 0 ? 'READY'
      : demo.done ? 'COMPLETE'
      : (demo.running ? 'RUNNING' : 'PAUSED') + ' \u00b7 STEP ' + (idx + 1) + '/' + A.DEMO.length;
    document.querySelectorAll('.demo-text').forEach(function (e) { e.textContent = text; });
    document.querySelectorAll('.demo-step').forEach(function (e) { e.textContent = lbl; });
    document.querySelectorAll('.demo-prog').forEach(function (e) {
      e.style.width = Math.min(100, demo.t / A.DEMO_LENGTH * 100) + '%';
    });
    document.querySelectorAll('[data-demo="start"]').forEach(function (b) { b.classList.toggle('on', demo.running); });
    document.querySelectorAll('[data-demo="pause"]').forEach(function (b) {
      b.classList.toggle('on', !demo.running && demo.t > 0 && !demo.done);
    });
  }

  function _out(inp) {
    var c = CTL[inp.dataset.ctl], o = inp.parentElement.querySelector('output');
    if (o && c) o.textContent = (+inp.value).toFixed(c[2]) + c[3];
  }

  /* ---- Wire up DOM ---- */
  A.presenter = {
    init: function () {
      document.querySelectorAll('input[data-ctl]').forEach(function (inp) {
        var c = CTL[inp.dataset.ctl]; if (!c) return;
        inp.addEventListener('input', function () { c[1](+inp.value); _out(inp); });
      });
      document.querySelectorAll('[data-seg]').forEach(function (grp) {
        var s = SEG[grp.dataset.seg]; if (!s) return;
        grp.addEventListener('click', function (e) {
          var b = e.target.closest('button[data-v]'); if (!b) return;
          s[1](b.dataset.v); A.presenter.sync();
        });
      });
      document.querySelectorAll('input[data-toggle]').forEach(function (t) {
        t.addEventListener('change', function () {
          S[t.dataset.toggle] = t.checked;
          if (t.dataset.toggle === 'audio' && t.checked && A.audio) A.audio.click();
        });
      });
      document.querySelectorAll('[data-demo]').forEach(function (b) {
        b.addEventListener('click', function () { demo[b.dataset.demo](); });
      });
      document.querySelectorAll('[data-action="trigger-emergency"]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!S.emergency.active) A.emergency.activate('SIMULATED \u00b7 PRESENTER TRIGGER');
          else A.watch.go('emergency', true);
        });
      });
      document.querySelectorAll('[data-action="reset-all"]').forEach(function (b) {
        b.addEventListener('click', function () { demo.reset(); A.presenter.sync(); });
      });
      _status(); this.sync();
    },
    sync: function () {
      document.querySelectorAll('input[data-ctl]').forEach(function (inp) {
        if (document.activeElement === inp) return;
        var c = CTL[inp.dataset.ctl]; if (!c) return;
        var v = c[0](); if (Math.abs(+inp.value - v) > 1e-3) inp.value = v; _out(inp);
      });
      document.querySelectorAll('[data-seg]').forEach(function (grp) {
        var s = SEG[grp.dataset.seg]; if (!s) return;
        var cur = s[0]();
        grp.querySelectorAll('button').forEach(function (b) {
          b.setAttribute('aria-pressed', b.dataset.v === cur);
        });
      });
      document.querySelectorAll('input[data-toggle]').forEach(function (t) {
        t.checked = !!S[t.dataset.toggle];
      });
    }
  };

  /* Backward-compat alias so main.js can call A.controls.init() during transition */
  A.controls = A.presenter;

})(window.AMWS);
