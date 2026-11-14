/* =========================================================================
   sim.js — Simulation engine. Produces SIMULATED astronaut + suit data.
   Nothing here is real telemetry. Values drift toward "base" targets with
   physiologically-shaped noise so readings never sit at a fixed number.
   ========================================================================= */
(function (A) {
  'use strict';

  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var rnd = function (a) { return (Math.random() * 2 - 1) * a; };

  /* Scenario start points: MET (days) and cumulative mission dose (mSv). */
  var START = {
    'EARTH:TRANSIT': { met: 142, dose: 71.0 },  'EARTH:LANDING': { met: 182, dose: 91.0 }, 'EARTH:SURFACE': { met: 3,  dose: 0.03 },
    'MOON:TRANSIT':  { met: 2,   dose: 3.1 },   'MOON:LANDING':  { met: 4,   dose: 6.4 },  'MOON:SURFACE':  { met: 6,  dose: 9.1 },
    'MARS:TRANSIT':  { met: 142, dose: 255.6 }, 'MARS:LANDING':  { met: 205, dose: 369.0 }, 'MARS:SURFACE': { met: 236, dose: 388.8 }
  };
  var MET_OFFSET = 7 * 3600 + 23 * 60 + 18; // 07:23:18 into the day

  function defaults() {
    return {
      location: 'MARS', phase: 'SURFACE', radLevel: 'NORMAL', commMode: 'NOMINAL',
      timeScale: 1, autoEmergency: true, audio: false,
      /* Targets the live values drift toward (set by controls / demo). */
      base: { hr: 72, spo2: 98, temp: 36.8, resp: 14, fatigue: 18, stressBase: 20, hydration: 76,
              co2: 2.1, suitP: 4.3, suitT: 21.5, signal: 88 },
      suitBattDrain: 1,          // consumption multiplier
      suitBattTarget: null,      // demo override: ramp battery to a level
      /* Live values */
      v: { hr: 72, spo2: 98, temp: 36.8, resp: 14, fatigue: 18, stress: 20, hydration: 76,
           co2: 2.1, suitP: 4.3, suitT: 21.5, signal: 88 },
      o2: 87, suitBatt: 82, watchBatt: 87, lifeSupport: 92, food: 81,
      sleepH: 7.7, met: 0, doseToday: 0.42, doseMission: 0,
      helmet: 'SEALED', /* nav (surface) — habitat-relative, metres */
      nav: { x: -980, y: 1000, heading: 214, rover: { x: -420, y: 610 } },
      walk: { hr: 0, spo2: 0, temp: 0, resp: 0, co2: 0, sig: 0 },
      hist: { hr: [], spo2: [], temp: [], resp: [], co2: [], suitP: [], o2: [], stress: [], readiness: [] },
      emergency: { active: false, auto: false, reason: '', since: 0, suppressed: false },
      ramps: [], t: 0
    };
  }

  var S = A.state = defaults();

  /* Reset MET and mission dose when the scenario changes. */
  function applyScenario() {
    var st = START[S.location + ':' + S.phase];
    S.met = st.met * 86400 + MET_OFFSET;
    S.doseMission = st.dose;
    S.metStartRef = S.met;
    S.base.signal = S.location === 'EARTH' ? 95 : S.location === 'MOON' ? 90 : 84;
    if (S.commMode === 'DEGRADED') S.base.signal = 24;
    if (S.commMode === 'LOS') S.base.signal = 0;
  }

  A.sim = {
    scenario: function () { return A.LOCATIONS[S.location].phases[S.phase]; },
    setLocation: function (loc) { S.location = loc; applyScenario(); },
    setPhase: function (ph) { S.phase = ph; applyScenario(); },
    setComm: function (m) { S.commMode = m; applyScenario(); },

    /* Ramp a base value (or top-level key) linearly over dur seconds. */
    ramp: function (key, to, dur) {
      var obj = key in S.base ? S.base : S;
      S.ramps = S.ramps.filter(function (r) { return r.key !== key; });
      S.ramps.push({ obj: obj, key: key, from: obj[key], to: to, el: 0, dur: Math.max(dur, 0.01) });
    },

    reset: function () {
      var keep = { audio: S.audio, autoEmergency: S.autoEmergency };
      var fresh = defaults();
      Object.keys(fresh).forEach(function (k) { S[k] = fresh[k]; });
      S.audio = keep.audio; S.autoEmergency = keep.autoEmergency;
      applyScenario();
    },

    /* Remaining O2 time (s) at current metabolic rate. 100% ≈ 8 h at rest-level EVA workload. */
    o2Seconds: function () {
      var rate = (100 / (8 * 3600)) * (S.v.hr / 75) * (S.v.suitP < 4.0 ? 1 + (4.0 - S.v.suitP) * 3 : 1);
      return S.o2 / rate;
    },
    battSeconds: function () { return S.suitBatt / ((100 / (8 * 3600)) * S.suitBattDrain); },
    habDistance: function () { return Math.hypot(S.nav.x, S.nav.y); },
    /* Bearing from astronaut to habitat (0 = north, clockwise). */
    habBearing: function () { return (Math.atan2(-S.nav.x, -S.nav.y) * 180 / Math.PI + 360) % 360; },
    /* Walk-back time (s): suited walking ≈ 2.5 km/h, slower if heart rate is high (fatigue). */
    walkbackSeconds: function () {
      var speed = 2.5 * (S.v.hr > 130 ? 0.75 : 1) * 1000 / 3600;
      return this.habDistance() / speed;
    },
    doseRate: function () {   // mSv/day
      return this.scenario().dose * A.RAD_LEVELS[S.radLevel].mult;
    },
    oneWayDelay: function () { // seconds, light-time + relay overhead
      var sc = this.scenario();
      return sc.dist / A.C_KMS + sc.relay;
    },

    step: function (dt) {
      S.t += dt;
      var b = S.base, v = S.v, w = S.walk, sim = this;

      /* 1. Advance ramps (demo / smooth control changes) */
      S.ramps = S.ramps.filter(function (r) {
        if (!S.rampsPaused) r.el += dt;
        var k = clamp(r.el / r.dur, 0, 1);
        r.obj[r.key] = r.from + (r.to - r.from) * k;
        return k < 1;
      });

      /* 2. Slow random walks give natural variability */
      w.hr = clamp(w.hr + rnd(0.9) * dt * 2, -4, 4);
      w.spo2 = clamp(w.spo2 + rnd(0.15) * dt * 2, -0.7, 0.7);
      w.temp = clamp(w.temp + rnd(0.01) * dt * 2, -0.12, 0.12);
      w.resp = clamp(w.resp + rnd(0.3) * dt * 2, -1.5, 1.5);
      w.co2 = clamp(w.co2 + rnd(0.05) * dt * 2, -0.25, 0.25);
      w.sig = clamp(w.sig + rnd(1.2) * dt * 2, -6, 6);

      var k = 1 - Math.exp(-dt / 2.2); // first-order lag toward target
      var sinusArr = Math.sin(S.t * 2 * Math.PI / 4.2) * 1.4; // respiratory sinus arrhythmia
      v.hr += (b.hr + w.hr + sinusArr - v.hr) * k;
      v.spo2 += (Math.min(100, b.spo2 + w.spo2) - v.spo2) * k;
      v.temp += (b.temp + w.temp - v.temp) * k * 0.5;
      v.resp += (b.resp + Math.max(0, v.hr - 80) * 0.09 + Math.max(0, 95 - v.spo2) * 0.5 + w.resp - v.resp) * k;
      v.co2 += (b.co2 + w.co2 - v.co2) * k;
      v.suitP += (b.suitP + rnd(0.004) - v.suitP) * k;
      v.suitT += (b.suitT + (v.hr - 72) * 0.02 - v.suitT) * k * 0.3;
      v.signal += (clamp(b.signal + (b.signal > 0 ? w.sig : 0), 0, 100) - v.signal) * k;
      v.hydration += (b.hydration - v.hydration) * k;

      /* Derived (SIMULATED) stress & fatigue indices — not diagnoses */
      var strain = Math.max(0, v.hr - 90) * 0.45 + Math.max(0, v.co2 - 4) * 6 + Math.max(0, 95 - v.spo2) * 3;
      v.stress += (clamp(b.stressBase + strain, 0, 100) - v.stress) * k;
      var fatigueT = b.fatigue + Math.max(0, v.hr - 100) * 0.25 + Math.max(0, 7 - S.sleepH) * 6 + Math.max(0, 60 - v.hydration) * 0.5;
      v.fatigue += (clamp(fatigueT, 0, 100) - v.fatigue) * k * 0.4;

      /* 3. Consumables (scaled by time acceleration) */
      var sdt = dt * S.timeScale;
      var eva = S.phase === 'SURFACE' || S.phase === 'LANDING';
      if (eva) S.o2 = clamp(S.o2 - (100 / (8 * 3600)) * (v.hr / 75) * sdt * (v.suitP < 4.0 ? 1 + (4.0 - v.suitP) * 3 : 1), 0, 100);
      if (S.suitBattTarget !== null) {
        S.suitBatt += (S.suitBattTarget - S.suitBatt) * (1 - Math.exp(-dt / 3));
        if (Math.abs(S.suitBatt - S.suitBattTarget) < 0.3) S.suitBattTarget = null;
      } else if (eva) {
        S.suitBatt = clamp(S.suitBatt - (100 / (8 * 3600)) * S.suitBattDrain * sdt, 0, 100);
      }
      S.watchBatt = clamp(S.watchBatt - (100 / (36 * 3600)) * sdt, 0, 100);
      S.met += sdt;
      var perSec = sim.doseRate() / 86400;
      S.doseToday += perSec * sdt;
      S.doseMission += perSec * sdt;

      /* 4. Surface navigation: astronaut slowly wanders, heading drifts */
      if (S.phase === 'SURFACE') {
        S.nav.heading = (S.nav.heading + rnd(0.6) * dt * 4 + 360) % 360;
        var hr = S.nav.heading * Math.PI / 180;
        S.nav.x += Math.sin(hr) * 0.25 * sdt;
        S.nav.y += Math.cos(hr) * 0.25 * sdt;
      }
      S.helmet = v.suitP < 3.5 ? 'CHECK SEAL' : 'SEALED';
    },

    /* Push samples to history ring buffers (called at 1 Hz). */
    sample: function (readiness) {
      var H = S.hist, max = 120;
      [['hr', S.v.hr], ['spo2', S.v.spo2], ['temp', S.v.temp], ['resp', S.v.resp], ['co2', S.v.co2],
       ['suitP', S.v.suitP], ['o2', S.o2], ['stress', S.v.stress], ['readiness', readiness]].forEach(function (p) {
        H[p[0]].push(p[1]); if (H[p[0]].length > max) H[p[0]].shift();
      });
    },

    /* Trend from history: compares recent mean vs older mean. */
    trend: function (key, eps) {
      var h = S.hist[key]; if (h.length < 12) return 0;
      var mean = function (a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; };
      var d = mean(h.slice(-6)) - mean(h.slice(-24, -6));
      return Math.abs(d) < eps ? 0 : d > 0 ? 1 : -1;
    }
  };

  applyScenario();
})(window.AMWS);
