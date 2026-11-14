/* =========================================================================
   ui.js — Formatting helpers, view-model builder and declarative bindings.
   Any element can bind to the shared view model:
     data-t="key"     → textContent
     data-sev="key"   → adds class sev-0 / sev-1 / sev-2
     data-chip="key"  → status chip: icon + text + colour (never colour alone)
     data-w="key"     → style.width = value %
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state;
  var pad = function (n) { return String(Math.floor(n)).padStart(2, '0'); };

  var fmt = A.fmt = {
    hms: function (s) { s = Math.max(0, s); return pad(s / 3600) + ':' + pad(s % 3600 / 60) + ':' + pad(s % 60); },
    met: function (s) { return Math.floor(s / 86400) + ' DAYS ' + fmt.hms(s % 86400); },
    dur: function (s) {
      s = Math.max(0, s);
      if (s < 1) return (s * 1000).toFixed(0) + ' ms';
      if (s < 60) return s.toFixed(1) + ' s';
      if (s < 3600) return Math.floor(s / 60) + 'm ' + pad(s % 60) + 's';
      return Math.floor(s / 3600) + 'h ' + pad(s % 3600 / 60) + 'm';
    },
    km: function (k) {
      if (k === null || k === undefined) return '—';
      if (k >= 1e6) return (k / 1e6).toFixed(1) + 'M km';
      if (k >= 1e4) return Math.round(k / 1000) + 'k km';
      return k.toLocaleString('en-US') + ' km';
    },
    utc: function () { var d = new Date(); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()); },
    trend: function (t) { return t > 0 ? '▲ RISING' : t < 0 ? '▼ FALLING' : '■ STABLE'; },
    arrow: function (t) { return t > 0 ? '▲' : t < 0 ? '▼' : '■'; },
    compass: function (deg) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8]; }
  };

  var ICON = ['✓', '⚠', '✕'];
  A.ICON = ICON;

  /* Builds the flat view model consumed by every bound element. */
  A.buildVM = function () {
    var v = S.v, sim = A.sim, sc = sim.scenario(), loc = A.LOCATIONS[S.location], ev = A.last;
    var sv = A.assess.sev;
    var T = {}, C = {}, W = {}, SV = {};
    function chip(key, s, words) { C[key] = { sev: s, text: words[s] }; SV[key] = s; }
    var VIT = ['NORMAL', 'ELEVATED', 'CRITICAL'], LOWW = ['NORMAL', 'LOW', 'CRITICAL'], NOM = ['NOMINAL', 'CAUTION', 'CRITICAL'];

    T.hr = Math.round(v.hr); chip('hr', sv('hr', v.hr), v.hr < 50 ? LOWW : VIT);
    T.hrTrend = fmt.trend(sim.trend('hr', 2)); T.hrRange = '50–100 BPM';
    T.spo2 = Math.round(v.spo2); chip('spo2', sv('spo2', v.spo2), LOWW); T.spo2Trend = fmt.trend(sim.trend('spo2', 0.4));
    T.temp = v.temp.toFixed(1); chip('temp', sv('temp', v.temp), v.temp < 36 ? LOWW : VIT); T.tempTrend = fmt.trend(sim.trend('temp', 0.05));
    T.resp = Math.round(v.resp); chip('resp', sv('resp', v.resp), v.resp < 12 ? LOWW : VIT); T.respTrend = fmt.trend(sim.trend('resp', 0.6));
    T.stress = Math.round(v.stress); T.fatigue = Math.round(v.fatigue);
    var ml = v.stress < 35 ? 0 : v.stress < 65 ? 1 : 2;
    C.mental = { sev: ml, text: ['LOW', 'MODERATE', 'HIGH'][ml] }; SV.mental = ml;
    chip('fatigue', sv('fatigue', v.fatigue), ['LOW', 'MODERATE', 'HIGH']);
    W.stress = v.stress; W.fatigue = v.fatigue;

    /* Readiness + risk */
    T.readiness = ev.readiness.score; T.readinessLabel = ev.readiness.label; SV.readiness = ev.readiness.sev;
    C.readiness = { sev: ev.readiness.sev, text: ev.readiness.label }; W.readiness = ev.readiness.score;
    var rl = ev.risk.level; T.risk = ev.risk.label; SV.risk = rl === 0 ? 0 : rl === 3 ? 2 : 1;
    C.risk = { sev: SV.risk, text: ev.risk.label };
    T.riskDetail = ev.risk.crit + ' CRITICAL · ' + ev.risk.warn + ' WARNING';
    var act = A.alerts.active(); T.alertCount = act.length; SV.alerts = act.length ? Math.max.apply(null, act.map(function (a) { return a.sev; })) : 0;
    C.alerts = { sev: SV.alerts, text: act.length ? act.length + ' ACTIVE' : 'NONE' };

    /* Suit */
    T.suitP = v.suitP.toFixed(2); chip('suitP', sv('suitP', v.suitP), NOM);
    T.suitT = v.suitT.toFixed(1); chip('suitT', sv('suitT', v.suitT), NOM);
    T.co2 = v.co2.toFixed(1); chip('co2', sv('co2', v.co2), NOM); T.co2Trend = fmt.trend(sim.trend('co2', 0.15));
    T.o2 = Math.round(S.o2); chip('o2', sv('o2', S.o2), NOM); W.o2 = S.o2;
    T.o2Time = fmt.dur(sim.o2Seconds());
    T.suitBatt = Math.round(S.suitBatt); chip('suitBatt', sv('suitBatt', S.suitBatt), NOM); W.suitBatt = S.suitBatt;
    T.battTime = fmt.dur(sim.battSeconds());
    T.watchBatt = Math.round(S.watchBatt); chip('watchBatt', sv('watchBatt', S.watchBatt), NOM); W.watchBatt = S.watchBatt;
    T.helmet = S.helmet; C.helmet = { sev: S.helmet === 'SEALED' ? 0 : 2, text: S.helmet };
    var suitWorst = Math.max(SV.suitP, SV.co2, SV.o2, SV.suitBatt, SV.suitT);
    C.suit = { sev: suitWorst, text: NOM[suitWorst] }; SV.suit = suitWorst;
    T.integrity = SV.suitP === 2 ? 'BREACH SUSPECTED' : SV.suitP === 1 ? 'LEAK CHECK' : 'INTACT';
    C.integrity = { sev: SV.suitP, text: T.integrity };
    T.suitMode = S.phase === 'SURFACE' ? 'EVA MODE' : S.phase === 'LANDING' ? 'LAUNCH/ENTRY MODE' : 'IVA STANDBY';

    /* Comms */
    var delay = sim.oneWayDelay(), sig = v.signal;
    T.delay = fmt.dur(delay); T.rtt = fmt.dur(delay * 2);
    T.signal = Math.round(sig);
    var sigS = sv('signal', sig);
    T.link = sigS === 2 ? 'LOS' : sigS === 1 ? 'DEGRADED' : 'ONLINE';
    C.link = { sev: sigS, text: T.link }; SV.link = sigS;
    T.signalLabel = sig >= 70 ? 'STRONG' : sig >= 40 ? 'FAIR' : sig >= 5 ? 'WEAK' : 'NO SIGNAL';
    W.signal = sig; T.bars = Math.max(0, Math.min(4, Math.ceil(sig / 25)));
    T.relay = S.location === 'EARTH' ? 'VIA RELAY SATELLITE' : S.location === 'MOON' ? 'VIA LANDER → LUNAR RELAY' : 'VIA HAB → MARS ORBITER RELAY';

    /* Mission / location */
    T.location = loc.name + ' — ' + (S.phase === 'SURFACE' ? 'SURFACE' : S.phase === 'LANDING' ? 'DESCENT' : 'IN TRANSIT');
    T.phase = sc.label; T.destination = loc.destination; T.site = loc.site;
    T.gravity = sc.gravity.toFixed(sc.gravity < 1 ? 2 : 1) + ' G'; T.altitude = sc.altitude;
    T.distEarth = fmt.km(sc.dist); T.distDest = sc.toGo === null ? 'ARRIVED' : fmt.km(sc.toGo);
    T.env = sc.env; T.terrain = sc.terrain;
    T.met = fmt.met(S.met); T.metDay = 'DAY ' + Math.floor(S.met / 86400); T.metClock = fmt.hms(S.met % 86400);
    T.utc = fmt.utc();
    var el = S.met - S.metStartRef, next = A.EVENTS.filter(function (e) { return e.t > el; })[0] || A.EVENTS[A.EVENTS.length - 1], tnext = next.t - el;
    T.nextEvent = fmt.hms(Math.max(0, tnext)); T.nextEventName = next.name;
    T.marsSol = S.location === 'MARS' && S.phase === 'SURFACE' ? 'SOL ' + Math.floor((S.met - 205 * 86400) / 88775) : '';

    /* Radiation */
    var rate = sim.doseRate();
    T.doseRate = (rate / 24 * 1000).toFixed(1); T.doseToday = S.doseToday.toFixed(2); T.doseDaily = rate.toFixed(2);
    T.doseMission = S.doseMission.toFixed(1); var pct = S.doseMission / A.CAREER_LIMIT_MSV * 100;
    T.careerPct = pct.toFixed(1); W.career = pct;
    var radS = S.radLevel === 'SPE' ? 2 : S.radLevel === 'ELEVATED' ? 1 : 0;
    C.rad = { sev: radS, text: A.RAD_LEVELS[S.radLevel].label }; SV.rad = radS;

    /* Life support / hydration / sleep */
    T.hydration = Math.round(v.hydration); chip('hydration', sv('hydration', v.hydration), LOWW); W.hydration = v.hydration;
    T.lifeSupport = Math.round(S.lifeSupport); chip('lifeSupport', sv('lifeSupport', S.lifeSupport), NOM); W.lifeSupport = S.lifeSupport;
    T.food = Math.round(S.food); chip('food', sv('food', S.food), NOM); W.food = S.food;
    T.sleep = Math.floor(S.sleepH) + 'h ' + pad((S.sleepH % 1) * 60) + 'm';
    var rec = S.sleepH >= 7 ? 0 : S.sleepH >= 5.5 ? 1 : 2;
    C.recovery = { sev: rec, text: ['GOOD', 'FAIR', 'POOR'][rec] }; SV.recovery = rec;
    C.circadian = { sev: S.sleepH >= 6 ? 0 : 1, text: S.sleepH >= 6 ? 'STABLE' : 'SHIFTED' };
    T.dayLen = S.location === 'MARS' ? 'SOL = 24h 39m · SCHEDULE DRIFTS +39 min/day' : S.location === 'MOON' ? 'LUNAR DAY ≈ 29.5 EARTH DAYS · LIGHTING CUES NEEDED' : '16 SUNRISES/DAY IN LEO';

    /* Navigation (surface) */
    var dist = sim.habDistance(), brg = sim.habBearing();
    T.habDist = (dist / 1000).toFixed(2) + ' km'; T.habBearing = Math.round(brg) + '° ' + fmt.compass(brg);
    T.heading = Math.round(S.nav.heading) + '° ' + fmt.compass(S.nav.heading);
    T.walkback = fmt.dur(sim.walkbackSeconds());
    var margin = Math.min(sim.o2Seconds(), sim.battSeconds()) - sim.walkbackSeconds();
    T.margin = (margin < 0 ? '−' : '') + fmt.dur(Math.abs(margin));
    var mS = margin < 900 ? 2 : margin < 2700 ? 1 : 0;
    C.margin = { sev: mS, text: ['ADEQUATE', 'LOW', 'CRITICAL'][mS] }; SV.margin = mS;
    T.turnArrow = ((brg - S.nav.heading + 540) % 360) - 180; // relative bearing

    T.emReason = S.emergency.reason; T.emSince = fmt.dur(Math.max(0, S.met - S.emergency.since));
    return (A.vm = { T: T, C: C, W: W, SV: SV });
  };

  /* Apply bindings within a root element. Only touches the DOM when values change. */
  A.bind = function (root) {
    var vm = A.vm; if (!vm || !root) return;
    root.querySelectorAll('[data-t]').forEach(function (el) {
      var val = vm.T[el.dataset.t]; if (val === undefined) return; val = String(val);
      if (el.textContent !== val) el.textContent = val;
    });
    root.querySelectorAll('[data-sev]').forEach(function (el) {
      var s = vm.SV[el.dataset.sev]; if (s === undefined) return;
      var c = 'sev-' + s; if (!el.classList.contains(c)) { el.classList.remove('sev-0', 'sev-1', 'sev-2'); el.classList.add(c); }
    });
    root.querySelectorAll('[data-chip]').forEach(function (el) {
      var c = vm.C[el.dataset.chip]; if (!c) return;
      var html = '<i aria-hidden="true">' + ICON[c.sev] + '</i>' + c.text;
      if (el._h !== html) { el.innerHTML = html; el._h = html; el.classList.remove('sev-0', 'sev-1', 'sev-2'); el.classList.add('chip', 'sev-' + c.sev); }
    });
    root.querySelectorAll('[data-w]').forEach(function (el) {
      var w = vm.W[el.dataset.w]; if (w === undefined) return;
      el.style.width = Math.max(0, Math.min(100, w)).toFixed(1) + '%';
    });
  };

  /* Tiny Web Audio alert tones (off by default; toggle in Sim Controls). */
  A.audio = {
    ctx: null,
    tone: function (f, d, when) {
      if (!S.audio) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        var o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime + (when || 0);
        o.frequency.value = f; o.type = 'square'; g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + d + 0.02);
      } catch (e) { /* audio unavailable */ }
    },
    alarm: function () { this.tone(880, 0.18, 0); this.tone(660, 0.18, 0.22); this.tone(880, 0.18, 0.44); },
    click: function () { this.tone(1400, 0.03, 0); }
  };
})(window.AMWS);
