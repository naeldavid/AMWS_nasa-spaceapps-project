/* =========================================================================
   assess.js — Status classification, Mission Readiness score, Emergency
   Risk Engine and alert generation. Decision-support CONCEPT only.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state, L = A.LIMITS;

  /* Severity: 0 nominal · 1 warning · 2 critical */
  function sev(key, val) {
    var l = L[key]; if (!l) return 0;
    if ((l.critLo !== undefined && val < l.critLo) || (l.critHi !== undefined && val > l.critHi)) return 2;
    if ((l.warnLo !== undefined && val < l.warnLo) || (l.warnHi !== undefined && val > l.warnHi)) return 1;
    return 0;
  }

  /* Map a value to a 0..100 sub-score: 100 inside normal band, 0 at critical bound. */
  function band(key, val) {
    var l = L[key], n = l.normal;
    /* "lower is better" indices (fatigue, stress): graded across the whole range */
    if (key === 'fatigue' || key === 'stress') {
      var c = l.critHi;
      return val <= n[1] ? 100 - val * 0.5 : Math.max(0, (100 - n[1] * 0.5) * (c - val) / (c - n[1]));
    }
    /* inside normal band: 100 at centre, 92 at the edges */
    if (val >= n[0] && val <= n[1]) {
      var mid = (n[0] + n[1]) / 2, half = (n[1] - n[0]) / 2 || 1;
      if (key === 'spo2' || key === 'hydration') return 92 + 8 * (val - n[0]) / (n[1] - n[0]);
      return 100 - 8 * Math.abs(val - mid) / half;
    }
    if (val < n[0]) {
      var lo = l.critLo !== undefined ? l.critLo : n[0] - 1;
      return Math.max(0, 100 * (val - lo) / (n[0] - lo));
    }
    var hi = l.critHi !== undefined ? l.critHi : n[1] + 1;
    return Math.max(0, 100 * (hi - val) / (hi - n[1]));
  }

  /* -------- Mission Readiness (weighted, capped by any critical) ----------- */
  var WEIGHTS = [
    ['Heart rate stability', 'hr', 0.15], ['Oxygen saturation', 'spo2', 0.2], ['Body temperature', 'temp', 0.1],
    ['Respiration', 'resp', 0.1], ['Fatigue', 'fatigue', 0.12], ['Stress', 'stress', 0.1],
    ['Sleep / recovery', 'sleep', 0.11], ['Hydration', 'hydration', 0.12]
  ];

  function readiness() {
    var v = S.v, crit = false;
    var factors = WEIGHTS.map(function (w) {
      var val = w[1] === 'sleep' ? S.sleepH : v[w[1]];
      var sc = w[1] === 'sleep' ? Math.max(0, Math.min(100, (S.sleepH - 4) / 4 * 100)) : band(w[1], val);
      if (w[1] !== 'sleep' && sev(w[1], val) === 2) crit = true;
      return { name: w[0], score: sc, weight: w[2] };
    });
    var score = factors.reduce(function (s, f) { return s + f.score * f.weight; }, 0);
    if (crit) score = Math.min(score, 40);
    score = Math.round(score);
    var label = score >= 80 ? 'READY' : score >= 60 ? 'LIMITED' : 'NOT READY';
    return { score: score, label: label, sev: score >= 80 ? 0 : score >= 60 ? 1 : 2, factors: factors };
  }

  /* -------- Rules: each yields an issue with local recommended action ------ */
  function rules() {
    var v = S.v, out = [];
    function add(key, s, title, action, group) { if (s > 0) out.push({ key: key, sev: s, title: title, action: action, group: group }); }
    var hrS = sev('hr', v.hr);
    add('hr', hrS, v.hr > 100 ? (hrS === 2 ? 'HEART RATE CRITICAL' : 'ELEVATED HEART RATE') : 'LOW HEART RATE',
        'Reduce workload · rest in shade · re-check in 2 min', 'HEALTH');
    add('spo2', sev('spo2', v.spo2), sev('spo2', v.spo2) === 2 ? 'SpO₂ CRITICAL' : 'LOW SpO₂',
        'Stop activity · verify O₂ flow · open secondary O₂', 'HEALTH');
    add('temp', sev('temp', v.temp), v.temp > 37.5 ? 'BODY TEMP HIGH' : 'BODY TEMP LOW',
        'Adjust LCVG cooling · reduce workload', 'HEALTH');
    add('resp', sev('resp', v.resp), 'RESPIRATION ABNORMAL', 'Slow breathing · check CO₂ level', 'HEALTH');
    add('fatigue', sev('fatigue', v.fatigue), 'HIGH FATIGUE (DERIVED)', 'Plan rest · defer non-critical tasks', 'HEALTH');
    add('hydration', sev('hydration', v.hydration), 'LOW HYDRATION', 'Drink from suit bag · 250 ml', 'HEALTH');
    add('co2', sev('co2', v.co2), sev('co2', v.co2) === 2 ? 'CO₂ CRITICAL' : 'CO₂ RISING',
        'Switch to secondary CO₂ scrubber · reduce workload', 'LIFE SUPPORT');
    var pS = sev('suitP', v.suitP);
    add('suitP', pS, v.suitP < 4.1 ? (pS === 2 ? 'SUIT PRESSURE CRITICAL' : 'SUIT PRESSURE LOW') : 'SUIT PRESSURE HIGH',
        'Leak check · secondary O₂ open · return to habitat', 'LIFE SUPPORT');
    add('o2', sev('o2', S.o2), 'O₂ SUPPLY LOW', 'Terminate EVA · return to habitat', 'LIFE SUPPORT');
    add('suitBatt', sev('suitBatt', S.suitBatt), 'SUIT BATTERY LOW', 'Shed non-essential loads · plan return', 'LIFE SUPPORT');
    add('watchBatt', sev('watchBatt', S.watchBatt), 'WRIST UNIT BATTERY LOW', 'Enable low-power display', 'SYSTEM');
    add('suitT', sev('suitT', v.suitT), 'SUIT TEMPERATURE OFF-NOMINAL', 'Adjust cooling loop', 'LIFE SUPPORT');
    var sigS = sev('signal', v.signal);
    add('signal', sigS, sigS === 2 ? 'EARTH LINK LOST (LOS)' : 'EARTH LINK DEGRADED',
        'Use habitat/crew link · follow local procedures', 'COMMS');

    /* Return-margin rule: consumables left vs. time to walk back to habitat */
    if (S.phase === 'SURFACE') {
      var margin = Math.min(A.sim.o2Seconds(), A.sim.battSeconds()) - A.sim.walkbackSeconds();
      var mS = margin < 15 * 60 ? 2 : margin < 45 * 60 ? 1 : 0;
      add('margin', mS, 'RETURN MARGIN ' + (mS === 2 ? 'CRITICAL' : 'LOW'), 'Begin return to habitat now', 'MISSION');
    }
    if (S.radLevel !== 'NORMAL') {
      add('rad', S.radLevel === 'SPE' ? 2 : 1, S.radLevel === 'SPE' ? 'SOLAR PARTICLE EVENT' : 'RADIATION ELEVATED',
          S.radLevel === 'SPE' ? 'Seek storm shelter immediately' : 'Minimise EVA time · monitor dose', 'ENVIRONMENT');
    }
    return out.sort(function (a, b) { return b.sev - a.sev; });
  }

  /* -------- Emergency Risk Engine: combines issues into one level ---------- */
  var RISK = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
  function risk(issues) {
    var crit = issues.filter(function (i) { return i.sev === 2; }).length;
    var warn = issues.filter(function (i) { return i.sev === 1; }).length;
    var lifeCrit = issues.some(function (i) { return i.sev === 2 && (i.group === 'LIFE SUPPORT' || i.key === 'spo2' || i.key === 'margin' || i.key === 'rad'); });
    var lvl = 0;
    if (warn === 1) lvl = 1;
    if (warn >= 2 || crit === 1) lvl = 2;
    if (crit >= 2 || lifeCrit || (crit >= 1 && warn >= 2)) lvl = 3;
    return { level: lvl, label: RISK[lvl], crit: crit, warn: warn };
  }

  /* -------- Alert log (persistent, with acknowledge) ----------------------- */
  var active = {};      // key -> alert
  A.alertLog = [];      // history
  A.alerts = {
    active: function () { return Object.keys(active).map(function (k) { return active[k]; }).sort(function (a, b) { return b.sev - a.sev || b.t - a.t; }); },
    ackAll: function () { Object.keys(active).forEach(function (k) { active[k].acked = true; }); },
    unacked: function () { return this.active().filter(function (a) { return !a.acked; }); },
    clear: function () { active = {}; A.alertLog.length = 0; }
  };
  function syncAlerts(issues) {
    var now = {}, newCrit = false;
    issues.forEach(function (i) {
      now[i.key] = true;
      var a = active[i.key];
      if (!a || a.sev < i.sev) {
        if (i.sev === 2) newCrit = true;
        A.alertLog.unshift({ t: S.met, sev: i.sev, title: i.title });
        active[i.key] = { key: i.key, sev: i.sev, title: i.title, action: i.action, group: i.group, t: S.met, acked: false };
      } else { a.sev = i.sev; a.title = i.title; }
    });
    Object.keys(active).forEach(function (k) {
      if (!now[k]) { A.alertLog.unshift({ t: S.met, sev: 0, title: active[k].title + ' — CLEARED' }); delete active[k]; }
    });
    if (A.alertLog.length > 60) A.alertLog.length = 60;
    return newCrit;
  }

  A.assess = {
    sev: sev,
    run: function () {
      var r = readiness(), issues = rules(), rk = risk(issues);
      var newCrit = syncAlerts(issues);
      /* Automatic emergency: critical risk, unless crew cancelled it for this episode */
      if (rk.level < 3) S.emergency.suppressed = false;
      if (rk.level === 3 && S.autoEmergency && !S.emergency.active && !S.emergency.suppressed) {
        A.emergency.activate('AUTO · ' + (issues[0] ? issues[0].title : 'MULTIPLE CRITICAL'), true);
      }
      A.last = { readiness: r, issues: issues, risk: rk, newCrit: newCrit };
      return A.last;
    }
  };

  /* -------- Emergency controller ------------------------------------------- */
  A.emergency = {
    activate: function (reason, auto) {
      S.emergency.active = true; S.emergency.auto = !!auto; S.emergency.reason = reason || 'CREW-INITIATED'; S.emergency.since = S.met;
      if (A.watch) A.watch.go('emergency', true);
      if (A.audio) A.audio.alarm();
      document.body.classList.add('is-emergency');
    },
    cancel: function () {
      S.emergency.active = false; S.emergency.suppressed = true;
      document.body.classList.remove('is-emergency');
      if (A.watch) A.watch.home();
    }
  };
})(window.AMWS);
