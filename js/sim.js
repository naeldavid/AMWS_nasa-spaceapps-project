/* =========================================================================
   AMWS — sim.js — Simulation engine.
   Produces SIMULATED astronaut + suit telemetry. NOT real data.

   MODEL OVERVIEW AND SIMPLIFICATIONS:
   ─ Metabolic rate (BTU/hr) is the PRIMARY state variable. All physiological
     and consumable rates derive from it.
   ─ HR is DERIVED: HR = HR_BASELINE + (metabolic − METABOLIC_BASE) × HR_SCALE
     (ASSUMPTION mapping; no sourced EVA HR range from Gernhardt 2013)
   ─ Consumables are based on the unified 7-hour / 1000 BTU/hr EMU baseline
     (secondary source: CCTV 2008 EMU specs). Each consumable scales linearly
     with metabolic rate relative to baseline.
   ─ Walkback return margin uses a SEPARATE scenario at walkback metabolic
     rates and pace — NOT the current EVA state.
   ─ GCR dose rates are sourced per-location (see config.js). SPE multiplier
     is ASSUMPTION (illustrative — see docs/DATA_SOURCES.md).
   ─ Noise / variability is added via first-order-lag + random walk to avoid
     frozen readings. Respiratory sinus arrhythmia is modelled for realism.
   ─ Navigation: astronaut drifts in a random heading walk; habitat is at
     the origin.
   ========================================================================= */
(function (A) {
  'use strict';

  var C = A; // shorthand for config constants
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var rnd   = function (a) { return (Math.random() * 2 - 1) * a; };

  /* -----------------------------------------------------------------------
     CONSUMABLE DRAIN HELPERS
     All based on: 100% lasts 7 hours at METABOLIC_BASE (1000 BTU/hr).
     source: CCTV 2008 EMU specs (MEDIUM confidence)
     Linear scaling with metabolic rate is ASSUMPTION.
     ----------------------------------------------------------------------- */
  var BASE_RATE_PER_S = 100 / (C.CONSUMABLES_DURATION_NOMINAL * 3600); // %/s at baseline

  function o2DrainRatePerS(metabolic) {
    // ASSUMPTION: O2 consumption scales linearly with metabolic rate
    // Additional leak correction for low pressure (simplification)
    return BASE_RATE_PER_S * (metabolic / C.METABOLIC_BASE);
  }
  function battDrainRatePerS(metabolic, extraDrain) {
    // ASSUMPTION: battery base load proportional to metabolic rate (LCVG fan / heater)
    return BASE_RATE_PER_S * (1 + (metabolic - C.METABOLIC_BASE) / C.METABOLIC_BASE * 0.4) * (extraDrain || 1);
  }
  function coolantDrainRatePerS(metabolic) {
    // ASSUMPTION: cooling water scales with metabolic rate (thermal rejection)
    return BASE_RATE_PER_S * (metabolic / C.METABOLIC_BASE);
  }
  function scrubberDrainRatePerS(metabolic) {
    // ASSUMPTION: LiOH scrubber consumption scales with CO2 production = metabolic rate proxy
    return BASE_RATE_PER_S * (metabolic / C.METABOLIC_BASE);
  }

  /* -----------------------------------------------------------------------
     WALKBACK RETURN MARGIN (called by assess.js and ui.js)

     Returns margin in seconds for each pace option:
       { test: <seconds>, cool: <seconds>, limiting: <string> }

     margin > 0: crew can return and has this many seconds of buffer
     margin < 0: crew CANNOT reach habitat with current consumables
     margin = Infinity: not on surface / hab distance negligible

     Uses walkback metabolic rates, NOT the current EVA metabolic rate.
     source for pace/metabolic values: see config.js WALKBACK_* constants
     ----------------------------------------------------------------------- */
  A.returnMargin = function () {
    var S = A.state;
    if (S.phase !== 'SURFACE') return { test: Infinity, cool: Infinity, limiting: 'N/A' };

    var distKm = Math.hypot(S.nav.x, S.nav.y) / 1000; // metres → km
    if (distKm < 0.03) return { test: Infinity, cool: Infinity, limiting: 'N/A' };

    var loc = S.location;
    var testSpeed = (loc === 'MOON') ? C.WALKBACK_LUNAR_TEST_SPEED
                  : (loc === 'MARS') ? C.WALKBACK_MARS_SPEED
                  :                    C.WALKBACK_EARTH_SPEED; // km/h

    var coolSpeed = (loc === 'MOON') ? C.WALKBACK_LUNAR_COOL_SPEED
                  : (loc === 'MARS') ? C.WALKBACK_MARS_SPEED  // same (Mars has only one ASSUMPTION pace)
                  :                    C.WALKBACK_EARTH_SPEED;

    var testMet  = (loc === 'MOON') ? C.WALKBACK_LUNAR_TEST_METABOLIC
                 : (loc === 'MARS') ? C.WALKBACK_MARS_METABOLIC
                 :                    C.WALKBACK_EARTH_METABOLIC;

    var coolMet  = (loc === 'MOON') ? C.WALKBACK_LUNAR_COOL_METABOLIC
                 : (loc === 'MARS') ? C.WALKBACK_MARS_METABOLIC
                 :                    C.WALKBACK_EARTH_METABOLIC;

    function consumableTime(met) {
      // Time remaining (seconds). Drain rates are %/s (0-100 scale); levels are %.
      // time = level% / rate(%/s)
      var o2T    = S.o2       / o2DrainRatePerS(met);
      var battT  = S.suitBatt / battDrainRatePerS(met, 1);
      var coolT  = S.coolant  / coolantDrainRatePerS(met);
      var scrubT = S.scrubber / scrubberDrainRatePerS(met);

      var times = { 'O₂': o2T, 'BATTERY': battT, 'COOLANT': coolT, 'SCRUBBER': scrubT };
      var minTime = Infinity, limiting = 'O₂';
      Object.keys(times).forEach(function (k) {
        if (times[k] < minTime) { minTime = times[k]; limiting = k; }
      });
      return { time: minTime, limiting: limiting };
    }

    var testWalkS = (distKm / testSpeed) * 3600;
    var coolWalkS = (distKm / coolSpeed) * 3600;

    var testConsumables = consumableTime(testMet);
    var coolConsumables = consumableTime(coolMet);

    return {
      test:     testConsumables.time - testWalkS,
      cool:     coolConsumables.time - coolWalkS,
      limiting: testConsumables.limiting,
      walkTestS: testWalkS,
      walkCoolS: coolWalkS,
      distKm:   distKm
    };
  };

  /* -----------------------------------------------------------------------
     STATE DEFAULTS
     ----------------------------------------------------------------------- */
  function defaults() {
    return {
      location: 'MARS', phase: 'SURFACE', speStage: 'NORMAL', commMode: 'NOMINAL',
      timeScale: 1, autoEmergency: true, audio: false,

      /* Metabolic rate — the PRIMARY state variable (BTU/hr)
         ASSUMPTION: starts at Apollo EVA average baseline */
      metabolic: C.METABOLIC_BASE,  // BTU/hr

      /* Drift targets for suit/physio values (set by controls / demo) */
      base: {
        metabolic: C.METABOLIC_BASE, // BTU/hr
        spo2: 98, temp: 36.8, resp: 14,
        co2: 2.1, suitP: 4.3, suitT: 21.5, signal: 88
      },

      suitBattDrain: 1,    // extra battery drain multiplier (demo override)
      suitBattTarget: null, // demo override: ramp battery to level

      /* Live physiological / suit values */
      v: {
        hr: 90,       // BPM — DERIVED from metabolic rate
        spo2: 98,     // %
        temp: 36.8,   // °C
        resp: 14,     // breaths/min
        co2: 2.1,     // mmHg ppCO₂
        suitP: 4.3,   // psi
        suitT: 21.5,  // °C
        signal: 88    // %
      },

      /* Consumables: all as % of full capacity */
      o2: 87,       // %
      suitBatt: 82, // %
      coolant: 85,  // % — ASSUMPTION: starts at same level as O2
      scrubber: 55, // % — ASSUMPTION: partially used (makes SCRUBBER the initial limiting resource in demo)
      watchBatt: 87,// %

      /* Mission time */
      met: 0,            // seconds — mission elapsed time
      metStartRef: 0,    // MET at scenario start (for event countdown)
      doseToday: 0.42,   // mSv — running daily dose
      doseMission: 0,    // mSv — cumulative mission dose

      /* Navigation (surface) — habitat at origin, astronaut position in metres */
      nav: { x: -980, y: 1000, heading: 214 },

      /* Random-walk noise offsets (keep state across steps) */
      walk: { spo2: 0, temp: 0, resp: 0, co2: 0, sig: 0 },

      /* History ring buffers (120 samples = 120 s at 1 Hz) */
      hist: { hr: [], spo2: [], temp: [], resp: [], co2: [], suitP: [], o2: [], suitBatt: [] },

      /* Emergency state */
      emergency: { active: false, auto: false, reason: '', since: 0, suppressed: false },

      /* Linear ramps (demo / control smooth transitions) */
      ramps: [],
      t: 0  // sim clock (seconds)
    };
  }

  var S = A.state = defaults();

  /* -----------------------------------------------------------------------
     SCENARIO SETUP
     ----------------------------------------------------------------------- */
  function applyScenario() {
    var key = S.location + ':' + S.phase;
    var st  = C.SCENARIO_START[key];
    // ASSUMPTION: MET offset within the day
    var MET_OFFSET = 7 * 3600 + 23 * 60 + 18;
    S.met        = st.met * 86400 + MET_OFFSET;
    S.metStartRef = S.met;
    S.doseMission = st.dose;

    // Signal strength target depends on location
    S.base.signal = S.location === 'EARTH' ? 95 : S.location === 'MOON' ? 90 : 84;
    if (S.commMode === 'DEGRADED') S.base.signal = 24;
    if (S.commMode === 'LOS')      S.base.signal = 0;
  }

  /* -----------------------------------------------------------------------
     PUBLIC SIM API
     ----------------------------------------------------------------------- */
  A.sim = {
    scenario: function () { return C.LOCATIONS[S.location].phases[S.phase]; },

    setLocation: function (loc) { S.location = loc; applyScenario(); },
    setPhase:    function (ph)  { S.phase = ph;     applyScenario(); },
    setComm:     function (m)   { S.commMode = m;   applyScenario(); },

    /* Ramp a base or top-level key linearly over dur seconds. */
    ramp: function (key, to, dur) {
      var obj = (key in S.base) ? S.base : S;
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

    /* ---- Computed properties used by assess.js and ui.js ---- */

    habDistance: function () { return Math.hypot(S.nav.x, S.nav.y); },  // metres

    habBearing: function () {
      return (Math.atan2(-S.nav.x, -S.nav.y) * 180 / Math.PI + 360) % 360;
    },

    /* Current GCR dose rate in mSv/day — baseline only, no SPE multiplier.
       SPE is a separate alert state; see A.SPE_STAGES in config.js.
       source: location-specific dose rates in config.js LOCATIONS table */
    doseRate: function () {
      return this.scenario().dose; // mSv/day, GCR baseline
    },

    /* One-way communication delay (seconds): light-time + relay overhead */
    oneWayDelay: function () {
      var sc = this.scenario();
      return sc.dist / C.C_KMS + sc.relay;
    },

    /* ---- O2 / battery time remaining at CURRENT EVA metabolic rate ----
       Used for the suit screen "time remaining" display only.
       Return margin uses walkback rates (see A.returnMargin above). */
    o2SecondsAtCurrent: function () {
      var rate = o2DrainRatePerS(S.metabolic);
      return rate > 0 ? S.o2 / rate : Infinity;
    },
    battSecondsAtCurrent: function () {
      var rate = battDrainRatePerS(S.metabolic, S.suitBattDrain);
      return rate > 0 ? S.suitBatt / rate : Infinity;
    },

    /* ---- Main physics step ---- */
    step: function (dt) {
      S.t += dt;
      var b = S.base, v = S.v, w = S.walk;

      /* 1. Advance linear ramps (demo / control transitions) */
      S.ramps = S.ramps.filter(function (r) {
        if (!S.rampsPaused) r.el += dt;
        var k = clamp(r.el / r.dur, 0, 1);
        r.obj[r.key] = r.from + (r.to - r.from) * k;
        return k < 1;
      });

      /* Clamp metabolic base to valid range */
      b.metabolic = clamp(b.metabolic, 500, C.METABOLIC_PEAK);
      /* Live metabolic rate lags target */
      var km = 1 - Math.exp(-dt / 3.0);
      S.metabolic = S.metabolic + (b.metabolic - S.metabolic) * km;
      S.metabolic = clamp(S.metabolic, 500, C.METABOLIC_PEAK);

      /* 2. HR DERIVED from metabolic rate
         ASSUMPTION: linear mapping HR = HR_BASELINE + (metabolic − BASE) × HR_SCALE */
      var hrTarget = C.HR_BASELINE + (S.metabolic - C.METABOLIC_BASE) * C.HR_SCALE;
      /* Add respiratory sinus arrhythmia for realism */
      var sinusArr = Math.sin(S.t * 2 * Math.PI / 4.2) * 1.4;
      var k = 1 - Math.exp(-dt / 2.2);
      v.hr += (hrTarget + sinusArr - v.hr) * k;

      /* 3. Slow random walks for natural variability */
      w.spo2 = clamp(w.spo2 + rnd(0.15) * dt * 2, -0.7,  0.7);
      w.temp = clamp(w.temp + rnd(0.01) * dt * 2, -0.12, 0.12);
      w.resp = clamp(w.resp + rnd(0.3)  * dt * 2, -1.5,  1.5);
      w.co2  = clamp(w.co2  + rnd(0.05) * dt * 2, -0.25, 0.25);
      w.sig  = clamp(w.sig  + rnd(1.2)  * dt * 2, -6.0,  6.0);

      /* SpO₂ drifts toward base; also responds to high CO₂ and low metabolic efficiency */
      v.spo2 += (Math.min(100, b.spo2 + w.spo2) - v.spo2) * k;
      /* Respiration responds to metabolic demand */
      var respTarget = b.resp + Math.max(0, S.metabolic - C.METABOLIC_BASE) * 0.008 + w.resp;
      v.resp += (respTarget - v.resp) * k;
      v.temp += (b.temp + w.temp - v.temp) * k * 0.5;
      v.co2  += (b.co2  + w.co2  - v.co2)  * k;
      v.suitP += (b.suitP + rnd(0.004) - v.suitP) * k;
      /* Suit temperature rises with metabolic load (ASSUMPTION: coupling) */
      v.suitT += (b.suitT + (S.metabolic - C.METABOLIC_BASE) * 0.003 - v.suitT) * k * 0.3;
      v.signal += (clamp(b.signal + (b.signal > 0 ? w.sig : 0), 0, 100) - v.signal) * k;

      /* 4. Consumables (scaled by time acceleration, EVA phases only) */
      var sdt = dt * S.timeScale;
      var eva = (S.phase === 'SURFACE' || S.phase === 'LANDING');
      if (eva) {
        S.o2 = clamp(S.o2 - o2DrainRatePerS(S.metabolic) * sdt * 100, 0, 100);
        // Extra O₂ leak at low pressure (ASSUMPTION: leak proportional to pressure drop)
        if (v.suitP < 4.0) {
          S.o2 = clamp(S.o2 - (4.0 - v.suitP) * 0.5 * sdt, 0, 100);
        }
        // Battery: manual ramp target (demo) or normal drain
        if (S.suitBattTarget !== null) {
          S.suitBatt += (S.suitBattTarget - S.suitBatt) * (1 - Math.exp(-dt / 3));
          if (Math.abs(S.suitBatt - S.suitBattTarget) < 0.3) S.suitBattTarget = null;
        } else {
          S.suitBatt = clamp(S.suitBatt - battDrainRatePerS(S.metabolic, S.suitBattDrain) * sdt * 100, 0, 100);
        }
        S.coolant  = clamp(S.coolant  - coolantDrainRatePerS(S.metabolic)  * sdt * 100, 0, 100);
        S.scrubber = clamp(S.scrubber - scrubberDrainRatePerS(S.metabolic) * sdt * 100, 0, 100);
      }
      S.watchBatt = clamp(S.watchBatt - (100 / (36 * 3600)) * sdt, 0, 100);

      /* 5. MET and radiation dose */
      S.met += sdt;
      var perSec = this.doseRate() / 86400;
      S.doseToday  += perSec * sdt;
      S.doseMission += perSec * sdt;

      /* 6. Surface navigation: astronaut wanders in a random heading walk */
      if (S.phase === 'SURFACE') {
        S.nav.heading = (S.nav.heading + rnd(0.6) * dt * 4 + 360) % 360;
        var hr = S.nav.heading * Math.PI / 180;
        // Walk speed ~0.25 m/s random drift (ASSUMPTION: sim wandering, not real nav)
        S.nav.x += Math.sin(hr) * 0.25 * sdt;
        S.nav.y += Math.cos(hr) * 0.25 * sdt;
      }
    },

    /* Push samples to history ring buffers (called at 1 Hz). */
    sample: function () {
      var H = S.hist, max = 120;
      var entries = [
        ['hr',     S.v.hr],     ['spo2',    S.v.spo2],
        ['temp',   S.v.temp],   ['resp',    S.v.resp],
        ['co2',    S.v.co2],    ['suitP',   S.v.suitP],
        ['o2',     S.o2],       ['suitBatt', S.suitBatt]
      ];
      entries.forEach(function (p) {
        H[p[0]].push(p[1]);
        if (H[p[0]].length > max) H[p[0]].shift();
      });
    },

    /* Trend from history: compares recent mean vs older mean. Returns -1/0/+1. */
    trend: function (key, eps) {
      var h = S.hist[key]; if (!h || h.length < 12) return 0;
      var mean = function (a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; };
      var d = mean(h.slice(-6)) - mean(h.slice(-24, -6));
      return Math.abs(d) < eps ? 0 : d > 0 ? 1 : -1;
    }
  };

  applyScenario();
})(window.AMWS);
