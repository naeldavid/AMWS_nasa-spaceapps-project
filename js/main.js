/* =========================================================================
   main.js — Boot, main loop, view switching (DESKTOP / WRIST).
   Loop rates: physics 10 Hz · assess + UI 4 Hz · history 1 Hz · canvas 60 fps.

   Also provides:
     A.buildVM()   — flat view-model consumed by watch.js (data-t / data-sev / data-chip)
     A.bind(root)  — applies data-t / data-sev / data-chip to a DOM subtree
     A.ICON        — severity icon strings [0,1,2]
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state;
  var fmt = A.fmt;

  /* ---- severity icons (0=nominal,1=caution,2=warning/emergency) ---- */
  A.ICON = ['\u2713', '\u26a0', '\u2715'];

  /* ---- helpers ---- */
  var pad = function (n) { return String(Math.floor(Math.abs(n))).padStart(2, '0'); };

  function trendArrow(t) { return t > 0 ? '\u2191' : t < 0 ? '\u2193' : '\u2192'; }

  /* Map 0-3 severity to legacy 0-2 for watch.js chips */
  function sev2(key, val) { var s = A.assess.sev(key, val); return s >= 3 ? 2 : s >= 1 ? 1 : 0; }

  /* ---- buildVM: flat view-model for watch.js ---- */
  A.buildVM = function () {
    var v = S.v, sim = A.sim, sc = sim.scenario(), loc = A.LOCATIONS[S.location];
    var T = {}, C = {}, W = {}, SV = {};
    var NOM = ['NOMINAL', 'CAUTION', 'EMERGENCY'];
    var VIT = ['NORMAL', 'ELEVATED', 'EMERGENCY'];
    var LOWW = ['NORMAL', 'BELOW NOMINAL', 'EMERGENCY'];

    function chip(key, s, words) { C[key] = { sev: s, text: (words || NOM)[Math.min(2, s)] }; SV[key] = s; }

    /* Vitals */
    T.hr = Math.round(v.hr);       chip('hr',   sev2('hr',   v.hr),   v.hr < 50 ? LOWW : VIT);
    T.spo2 = Math.round(v.spo2);   chip('spo2', sev2('spo2', v.spo2), LOWW);
    T.temp = v.temp.toFixed(1);    chip('temp', sev2('temp', v.temp), v.temp < 36 ? LOWW : VIT);
    T.resp = Math.round(v.resp);   chip('resp', sev2('resp', v.resp), v.resp < 12 ? LOWW : VIT);
    T.hrTrend   = trendArrow(sim.trend('hr',   2));
    T.spo2Trend = trendArrow(sim.trend('spo2', 0.4));
    T.tempTrend = trendArrow(sim.trend('temp', 0.05));
    T.respTrend = trendArrow(sim.trend('resp', 0.6));
    T.co2Trend  = trendArrow(sim.trend('co2',  0.15));

    /* Alerts */
    var act = A.alerts.active();
    T.alertCount = act.length;
    SV.alerts = act.length ? Math.min(2, Math.max.apply(null, act.map(function (a) { return a.sev >= 3 ? 2 : a.sev >= 1 ? 1 : 0; }))) : 0;
    C.alerts = { sev: SV.alerts, text: act.length ? act.length + ' ACTIVE' : 'NONE' };
    var worst = 0;
    act.forEach(function (a) { if (a.sev > worst) worst = a.sev; });
    var overallSev = worst >= 3 ? 2 : worst >= 1 ? 1 : 0;
    var overallLabel = worst >= 3 ? 'EMERGENCY' : worst === 2 ? 'WARNING' : worst === 1 ? 'CAUTION' : 'NOMINAL';
    SV.overallAlert = overallSev;
    C.overallAlert = { sev: overallSev, text: overallLabel };

    /* Suit */
    T.suitP = v.suitP.toFixed(2);  chip('suitP',   sev2('suitP',   v.suitP),   NOM);
    T.suitT = v.suitT.toFixed(1);  chip('suitT',   sev2('suitT',   v.suitT),   NOM);
    T.co2   = v.co2.toFixed(1);    chip('co2',     sev2('co2',     v.co2),     NOM);
    T.o2    = Math.round(S.o2);    chip('o2',      sev2('o2',      S.o2),      NOM);
    T.suitBatt = Math.round(S.suitBatt); chip('suitBatt', sev2('suitBatt', S.suitBatt), NOM);
    T.watchBatt = Math.round(S.watchBatt); chip('watchBatt', sev2('watchBatt', S.watchBatt), NOM);
    T.o2Time   = fmt.dur(sim.o2SecondsAtCurrent());
    T.battTime = fmt.dur(sim.battSecondsAtCurrent());
    W.o2 = S.o2; W.suitBatt = S.suitBatt; W.watchBatt = S.watchBatt;
    var suitWorst = Math.max(SV.suitP, SV.co2, SV.o2, SV.suitBatt, SV.suitT);
    C.suit = { sev: suitWorst, text: NOM[Math.min(2, suitWorst)] }; SV.suit = suitWorst;
    T.suitMode = S.phase === 'SURFACE' ? 'EVA MODE' : S.phase === 'LANDING' ? 'LAUNCH/ENTRY MODE' : 'IVA STANDBY';
    /* Comms */
    var delay = sim.oneWayDelay(), sig = v.signal;
    T.delay = fmt.dur(delay); T.rtt = fmt.dur(delay * 2);
    T.signal = Math.round(sig);
    var sigS = sev2('signal', sig);
    T.link = sigS === 2 ? 'LOS' : sigS === 1 ? 'DEGRADED' : 'ONLINE';
    C.link = { sev: sigS, text: T.link }; SV.link = sigS;
    T.signalLabel = sig >= 70 ? 'STRONG' : sig >= 40 ? 'FAIR' : sig >= 5 ? 'WEAK' : 'NO SIGNAL';
    W.signal = sig; T.bars = Math.max(0, Math.min(4, Math.ceil(sig / 25)));
    T.relay = S.location === 'EARTH' ? 'VIA RELAY SATELLITE' : S.location === 'MOON' ? 'VIA LANDER \u2192 LUNAR RELAY' : 'VIA HAB \u2192 MARS ORBITER RELAY';

    /* Mission / location */
    T.location = loc.name + ' \u2014 ' + (S.phase === 'SURFACE' ? 'SURFACE' : S.phase === 'LANDING' ? 'DESCENT' : 'IN TRANSIT');
    T.phase = sc.label; T.destination = loc.destination; T.site = loc.site;
    T.gravity = sc.gravity.toFixed(sc.gravity < 1 ? 2 : 1) + ' G'; T.altitude = sc.altitude;
    T.distEarth = fmt.km(sc.dist); T.distDest = sc.toGo === null ? 'ARRIVED' : fmt.km(sc.toGo);
    T.env = sc.env;
    T.met = pad(S.met / 3600) + ':' + pad((S.met % 3600) / 60) + ':' + pad(S.met % 60);
    T.metDay = 'DAY ' + Math.floor(S.met / 86400); T.metClock = fmt.hms(S.met % 86400);
    T.utc = fmt.utc();
    var el = S.met - (S.metStartRef || 0);
    var next = A.EVENTS.filter(function (e) { return e.t > el; })[0] || A.EVENTS[A.EVENTS.length - 1];
    T.nextEvent = fmt.hms(Math.max(0, next.t - el)); T.nextEventName = next.name;
    T.marsSol = '';
    T.doseToday = S.doseToday.toFixed(2); T.doseDaily = sim.doseRate().toFixed(2);
    T.doseMission = S.doseMission.toFixed(1);
    var pct = S.doseMission / A.CAREER_LIMIT_MSV * 100;
    T.careerPct = pct.toFixed(1); W.career = pct;
    C.rad = { sev: 0, text: 'NORMAL' }; SV.rad = 0;

    /* Navigation */
    var dist = sim.habDistance(), brg = sim.habBearing();
    T.habDist = (dist / 1000).toFixed(2) + ' km';
    T.habBearing = Math.round(brg) + '\u00b0 ' + fmt.compass(brg);
    T.heading = Math.round(S.nav.heading) + '\u00b0 ' + fmt.compass(S.nav.heading);
    /* walkback time using test pace from returnMargin */
    var rm = A.returnMargin();
    T.walkback = rm.walkTestS ? fmt.dur(rm.walkTestS) : '\u2014';
    var marginS = rm.test !== null && isFinite(rm.test) ? rm.test : null;
    var coolS = rm.cool !== null && isFinite(rm.cool) ? rm.cool : null;
    function fmtMin(s) { return String(Math.round(Math.abs(s) / 60)); }
    T.marginMin = marginS === null ? '\u2014' : fmtMin(marginS);
    T.marginSign = marginS !== null && marginS < 0 ? '\u2212' : '';
    T.marginLimiting = (rm && rm.limiting) ? rm.limiting : '\u2014';
    if (marginS !== null && marginS < 0) {
      T.marginHero = 'CANNOT REACH HAB';
    } else if (marginS === null) {
      T.marginHero = '\u2014';
    } else {
      T.marginHero = fmtMin(marginS) + ' min';
    }
    var rangeText = '';
    if (S.location === 'MARS') {
      if (marginS !== null && marginS >= 0) rangeText = fmtMin(marginS) + ' min (ASSUMED)';
    } else if (marginS !== null && coolS !== null && marginS >= 0 && coolS >= 0) {
      var hi = fmtMin(Math.max(marginS, coolS));
      var lo = fmtMin(Math.min(marginS, coolS));
      rangeText = hi === lo ? (hi + ' min') : (hi + ' / ' + lo + ' min');
    }
    T.marginRange = rangeText;
    T.margin = marginS === null ? '\u2014' : (marginS < 0 ? 'CANNOT REACH HAB' : fmtMin(marginS) + ' min');
    var mS = marginS === null ? 0 : marginS < 0 ? 2 : marginS < A.MARGIN_WARNING_S ? 2 : marginS < A.MARGIN_CAUTION_S ? 1 : 0;
    C.margin = { sev: mS, text: marginS !== null && marginS < 0 ? 'CANNOT REACH HAB' : ['ADEQUATE', 'LOW', 'CRITICAL'][mS] }; SV.margin = mS;
    T.turnArrow = ((brg - S.nav.heading + 540) % 360) - 180;

    /* Emergency */
    T.emReason = S.emergency.reason || '';
    T.emSince = fmt.dur(Math.max(0, S.met - S.emergency.since));

    return (A.vm = { T: T, C: C, W: W, SV: SV });
  };

  /* ---- bind: applies data-t / data-sev / data-chip to a DOM subtree ---- */
  A.bind = function (root, snap) {
    var vm = A.vm; if (!root) return;
    /* data-t → textContent from vm.T */
    root.querySelectorAll('[data-t]').forEach(function (el) {
      var val = vm && vm.T[el.dataset.t];
      if (val === undefined || val === null) return;
      val = String(val); if (el.textContent !== val) el.textContent = val;
    });
    /* data-sev → sev-N class from vm.SV */
    root.querySelectorAll('[data-sev]').forEach(function (el) {
      var s = vm && vm.SV[el.dataset.sev]; if (s === undefined) return;
      var c = 'sev-' + s;
      if (!el.classList.contains(c)) { el.classList.remove('sev-0','sev-1','sev-2','sev-3'); el.classList.add(c); }
    });
    /* data-chip → icon + text from vm.C */
    root.querySelectorAll('[data-chip]').forEach(function (el) {
      var c = vm && vm.C[el.dataset.chip]; if (!c) return;
      var html = '<i aria-hidden="true">' + A.ICON[Math.min(2, c.sev)] + '</i>' + c.text;
      if (el._h !== html) { el.innerHTML = html; el._h = html; el.classList.remove('sev-0','sev-1','sev-2'); el.classList.add('chip','sev-' + Math.min(2, c.sev)); }
    });
    /* data-bind → textContent from snapshot (for dashboard tiles in index.html) */
    if (snap) {
      root.querySelectorAll('[data-bind]').forEach(function (el) {
        var val = snap; el.dataset.bind.split('.').forEach(function (k) { val = val && val[k]; });
        if (val === undefined || val === null) return;
        var s = String(val); if (el.textContent !== s) el.textContent = s;
      });
      root.querySelectorAll('[data-cls]').forEach(function (el) {
        var node = snap; el.dataset.cls.split('.').forEach(function (k) { node = node && node[k]; });
        if (!node) return;
        var cls = typeof node === 'string' ? node : node.cls; if (!cls) return;
        var c = 'sev-' + cls;
        if (!el.classList.contains(c)) { el.classList.remove('sev-nominal','sev-caution','sev-warning','sev-emergency'); el.classList.add(c); }
      });
    }
    /* data-bars */
    root.querySelectorAll('[data-bars]').forEach(function (b) { if (vm) b.dataset.bars = vm.T.bars; });
  };

  /* ---- view switching ---- */
  function setView(v) {
    document.body.dataset.view = v;
    document.querySelectorAll('[data-view-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.viewBtn === v);
    });
    try { localStorage.setItem('amws-view', v); } catch (e) {}
    fitWrist(); window.scrollTo(0, 0);
  }

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

  /* ---- boot ---- */
  function boot() {
    A.watch.init(document.querySelector('.watch'));
    A.watch.seedMessages();
    A.dashboard.init();
    A.presenter.init();

    document.querySelectorAll('[data-view-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.viewBtn); });
    });
    var drawer = document.querySelector('#presenterDrawer');
    document.querySelectorAll('[data-drawer]').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.dataset.drawer === 'toggle'
          ? !document.body.classList.contains('drawer-open')
          : b.dataset.drawer === 'open';
        document.body.classList.toggle('drawer-open', open);
        if (drawer) drawer.setAttribute('aria-hidden', String(!open));
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
    try { saved = localStorage.getItem('amws-view') || 'desktop'; } catch (e) {}
    if (/[?&]view=wrist/.test(location.search)) saved = 'wrist';
    setView(saved);

    /* ---- main loop ---- */
    var last = performance.now(), accSim = 0, accUI = 0, accSample = 0;

    function evaluate() {
      var r = A.assess.run();
      A.buildVM();
      var snap = A.snapshot();
      A.bind(document.body, snap);
      A.dashboard.tick();
      A.watch.tick();
      A.presenter.sync();
      if (r.newHigh && A.audio) A.audio.alarm();
      document.body.classList.toggle('has-crit', snap.overallCls === 'emergency');
    }

    for (var i = 0; i < 30; i++) A.sim.step(0.1);
    evaluate();
    for (var j = 0; j < 30; j++) { A.sim.step(0.1); A.sim.sample(); }

    function loop(now) {
      var dt = Math.min(0.25, (now - last) / 1000); last = now;
      accSim += dt; accUI += dt; accSample += dt;
      while (accSim >= 0.1) { A.sim.step(0.1); A.demo.tick(0.1 * S.timeScale); accSim -= 0.1; }
      if (accUI >= 0.25) { accUI = 0; evaluate(); }
      if (accSample >= 1) { accSample = 0; A.sim.sample(); A.dashboard.sample(); }
      A.dashboard.frame(dt);
      A.watch.frame(dt);
      requestAnimationFrame(loop);
    }
    A.dashboard.sample();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.AMWS);
