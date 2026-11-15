// Developed with AI coding assistance; see README, Use of AI
/* =========================================================================
   AMWS — snapshot.js
   Purpose: builds AMWS.snapshot() — the single plain-object the UI reads.
   Public API: AMWS.snapshot(), AMWS.fmt (hms, dur, km, utc, compass)

   UI files must NOT read A.state or config constants directly.
   Exception: dashboard.js reads A.state.hist for sparkline history arrays
   (documented at the call site).
   ========================================================================= */
(function (A) {
  'use strict';

  var pad = function (n) { return String(Math.floor(Math.abs(n))).padStart(2, '0'); };

  /* Severity integer → CSS class string */
  var SEV_CLS = ['nominal', 'caution', 'warning', 'emergency'];
  function clsSev(s) { return SEV_CLS[Math.max(0, Math.min(3, s | 0))]; }

  /* Shared formatters exposed for watch.js and dashboard.js */
  A.fmt = {
    hms: function (s) {
      s = Math.max(0, s);
      return pad(s / 3600) + ':' + pad((s % 3600) / 60) + ':' + pad(s % 60);
    },
    dur: function (s) {
      if (!isFinite(s) || s === null) return '\u2014';
      s = Math.max(0, s);
      if (s < 60)   return Math.round(s) + ' s';
      if (s < 3600) return Math.floor(s / 60) + 'm ' + pad(s % 60) + 's';
      return Math.floor(s / 3600) + 'h ' + pad((s % 3600) / 60) + 'm';
    },
    km: function (k) {
      if (k === null || k === undefined) return '\u2014';
      if (k >= 1e6) return (k / 1e6).toFixed(1) + 'M km';
      if (k >= 1e4) return Math.round(k / 1000) + 'k km';
      return k.toLocaleString('en-US') + ' km';
    },
    utc: function () {
      var d = new Date();
      return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
    },
    compass: function (deg) {
      return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
    }
  };

  /* -----------------------------------------------------------------------
     AMWS.snapshot() — called by the UI at ~4 Hz
     ----------------------------------------------------------------------- */
  A.snapshot = function () {
    var S   = A.state;
    var as  = A.assess;
    var sim = A.sim;
    var C   = A;
    var sc  = sim.scenario();
    var loc = C.LOCATIONS[S.location];
    var v   = S.v;
    var fmt = A.fmt;

    /* helper: classify a parameter */
    function sev(key, val) { return as.sev(key, val); }

    /* ---- MET ---- */
    var metS = S.met;
    var el   = metS - (S.metStartRef || 0);
    var evs  = C.EVENTS;
    var nextEv = evs.filter(function (e) { return e.t > el; })[0] || evs[evs.length - 1];
    var met = {
      days:              Math.floor(metS / 86400),
      hms:               fmt.hms(metS % 86400),
      label:             'DAY ' + Math.floor(metS / 86400) + ' \u00b7 ' + fmt.hms(metS % 86400),
      nextEvent:         nextEv.name,
      nextEventCountdown:fmt.hms(Math.max(0, nextEv.t - el))
    };

    /* ---- location ---- */
    var location = {
      name:      (S.environment==='CUSTOM' ? 'CUSTOM' : loc.name),
      phase:     S.phase,
      label:     (S.environment==='CUSTOM' ? 'CUSTOM — SURFACE' : sc.label),
      gravity:   sc.gravity.toFixed(sc.gravity < 1 ? 2 : 1) + ' G',
      altitude:  sc.altitude,
      env:       sc.env,
      distEarth: fmt.km(sc.dist),
      site:      loc.site
    };

    /* ---- vitals ---- */
    var vitals = {
      hr:   { value: Math.round(v.hr),   unit: 'BPM',    cls: clsSev(sev('hr',   v.hr)),   assumed: true },
      spo2: { value: Math.round(v.spo2), unit: '%',      cls: clsSev(sev('spo2', v.spo2)), assumed: true },
      temp: { value: v.temp.toFixed(1),  unit: '\u00b0C', cls: clsSev(sev('temp', v.temp)), assumed: true },
      resp: { value: Math.round(v.resp), unit: '/min',   cls: clsSev(sev('resp', v.resp)), assumed: true }
    };

    /* ---- suit ---- */
    var co2Sev = sev('co2', v.co2);
    var suit = {
      pressure: { value: v.suitP.toFixed(2), unit: 'PSI',   cls: clsSev(sev('suitP', v.suitP)), assumed: true },
      co2:      { value: v.co2.toFixed(1),   unit: 'mmHg',  cls: clsSev(co2Sev),
                  assumed: co2Sev < 3 }, // 15 mmHg limit is sourced; caution/warning bands are ASSUMPTION
      suitT:    { value: v.suitT.toFixed(1), unit: '\u00b0C', cls: clsSev(sev('suitT', v.suitT)), assumed: true }
    };

    /* ---- consumables ---- */
    var o2SecCurr   = sim.o2SecondsAtCurrent();
    var battSecCurr = sim.battSecondsAtCurrent();
    var rm = A.returnMargin();
    var consumables = {
      o2:      { pct: Math.round(S.o2),       secondsRemaining: o2SecCurr,   unit: '%', cls: clsSev(sev('o2',       S.o2)),       assumed: true },
      battery: { pct: Math.round(S.suitBatt), secondsRemaining: battSecCurr, unit: '%', cls: clsSev(sev('suitBatt', S.suitBatt)), assumed: true },
      coolant: { pct: Math.round(S.coolant),  secondsRemaining: null,         unit: '%', cls: clsSev(sev('coolant',  S.coolant)),  assumed: true },
      scrubber:{ pct: Math.round(S.scrubber), secondsRemaining: null,         unit: '%', cls: clsSev(sev('scrubber', S.scrubber)), assumed: true },
      watchBatt:{ pct: Math.round(S.watchBatt), secondsRemaining: null,       unit: '%', cls: clsSev(sev('watchBatt',S.watchBatt)),assumed: true },
      limiting: rm.limiting || 'O\u2082'
    };

    /* ---- return margin ---- */
    var isMars   = (S.location === 'MARS');
    var testM    = (rm.test !== null && isFinite(rm.test)) ? rm.test : null;
    var coolM    = (rm.cool !== null && isFinite(rm.cool)) ? rm.cool : null;
    var worstS   = (testM !== null && coolM !== null) ? Math.min(testM, coolM)
                 : (testM !== null ? testM : null);

    var marginCls;
    if (worstS === null) {
      marginCls = 'nominal';
    } else if (worstS < 0) {
      marginCls = 'cannot-reach';
    } else if (worstS < C.MARGIN_WARNING_S) {
      marginCls = 'warning';
    } else if (worstS < C.MARGIN_CAUTION_S) {
      marginCls = 'caution';
    } else {
      marginCls = 'nominal';
    }

    function fmtM(s) {
      if (s === null || !isFinite(s)) return '\u2014';
      var sign = s < 0 ? '\u2212' : '+';
      return sign + Math.round(Math.abs(s) / 60) + ' min';
    }

    var marginText;
    if (marginCls === 'cannot-reach') {
      marginText = 'CANNOT REACH HAB';
    } else if (testM === null) {
      marginText = '\u2014';
    } else if (isMars || testM === coolM) {
      marginText = fmtM(testM);
    } else {
      var lo = Math.min(testM, coolM), hi = Math.max(testM, coolM);
      marginText = fmtM(lo) + ' \u2013 ' + fmtM(hi);
    }

    var margin = {
      testPaceS:  testM,
      coolPaceS:  coolM,
      testWalkS:  rm.walkTestS || null,
      coolWalkS:  rm.walkCoolS || null,
      limiting:   rm.limiting  || '\u2014',
      cls:        marginCls,
      text:       marginText,
      distKm:     rm.distKm    || 0,
      isMars:     isMars
    };

    /* ---- comms ---- */
    var delay  = sim.oneWayDelay();
    var sigSev = sev('signal', v.signal);
    var linkCls = sigSev === 3 ? 'emergency' : sigSev === 2 ? 'warning' : sigSev === 1 ? 'caution' : 'nominal';
    var comms = {
      oneWayS:    delay,
      roundTripS: delay * 2,
      oneWayFmt:  fmt.dur(delay),
      roundTripFmt: fmt.dur(delay * 2),
      signalPct:  Math.round(v.signal),
      linkCls:    linkCls,
      relay: S.location === 'EARTH' ? 'VIA RELAY SATELLITE'
           : S.location === 'MOON'  ? 'VIA LANDER \u2192 LUNAR RELAY \u2192 DSN'
           :                          'VIA HAB \u2192 MARS ORBITER RELAY \u2192 DSN'
    };

    /* ---- radiation ---- */
    var dosePct    = S.doseMission / C.CAREER_LIMIT_MSV * 100;
    var careerSev  = S.doseMission > C.CAREER_DOSE_WARNING_MSV ? 2
                   : S.doseMission > C.CAREER_DOSE_CAUTION_MSV ? 1 : 0;
    var speSt      = S.speStage || 'NORMAL';
    var speData    = C.SPE_STAGES[speSt] || C.SPE_STAGES.NORMAL;
    var SPE_CLS    = { NORMAL:'nominal', ADVISORY:'advisory', CAUTION:'caution', WARNING:'warning', EMERGENCY:'emergency' };
    var radiation = {
      rateMsvDay:  sim.doseRate(),
      rateMsvH:    sim.doseRate() / 24,
      missionMsv:  S.doseMission.toFixed(1),
      careerPct:   dosePct.toFixed(1),
      careerCls:   clsSev(careerSev),
      careerLimit: C.CAREER_LIMIT_MSV,
      speStage:    speSt,
      speLabel:    speData.label,
      speCls:      SPE_CLS[speSt] || 'nominal'
    };

    /* ---- EVA elapsed ---- */
    var evaPlanned  = S.evaPlannedS || C.EVA_PLANNED_S;
    var evaElapsedS = S.evaElapsedS || 0;
    var evaFrac     = evaElapsedS / evaPlanned;
    var evaCls      = evaFrac >= C.EVA_ELAPSED_WARNING ? 'warning'
                    : evaFrac >= C.EVA_ELAPSED_CAUTION ? 'caution' : 'nominal';
    var evaElapsed  = {
      elapsedS: evaElapsedS,
      plannedS: evaPlanned,
      elapsedFmt: fmt.dur(evaElapsedS),
      plannedFmt: fmt.dur(evaPlanned),
      pct:      evaFrac * 100,
      cls:      evaCls
    };

    /* ---- alerts ---- */
    var CLS_MAP = ['nominal','caution','warning','emergency'];
    var alerts = A.alerts.active().map(function (a) {
      return {
        key:          a.key,
        cls:          CLS_MAP[Math.min(3, a.sev)],
        title:        a.title,
        action:       a.action,
        group:        a.group,
        assumed:      !!a.assumed,
        isCannotReach: !!(a.key === 'margin' && a.sev === 2 && a.title.indexOf('CANNOT') !== -1),
        t:            a.t,
        marginRange:  a.marginRange || null
      };
    });

    /* ---- environment profile ---- */
    var env = sim.environment ? sim.environment() : null;
    if (!env) {
      env = {
        id: S.location, name: S.location, custom: false,
        gravityMS2: sc.gravityMS2 || 0, distanceKm: sc.dist,
        oneWayDelayS: sc.dist / C.C_KMS + sc.relay,
        ambientTempC: sc.ambientTempC || 0, doseRateMSvDay: sc.dose,
        paceKmh: sc.paceKmh || 0, walkMetabolicBtuHr: sc.walkMetabolicBtuHr || 0,
        thermal: { coupled: false, coolantFactor: 1, batteryFactor: 1 },
        assumed: { gravityMS2:true, distanceKm:false, ambientTempC:true, doseRateMSvDay:true, paceKmh:true, walkMetabolicBtuHr:true }
      };
    }
    var environment = {
      id: env.id,
      name: env.name,
      custom: !!env.custom,
      gravity: env.gravityMS2,
      distanceKm: env.distanceKm,
      oneWayDelayS: env.oneWayDelayS,
      ambientTempC: env.ambientTempC,
      doseRate: env.doseRateMSvDay,
      paceKmh: env.paceKmh,
      walkMetabolic: env.walkMetabolicBtuHr,
      thermal: env.thermal || { coupled:false, coolantFactor:1, batteryFactor:1 },
      assumed: env.assumed || {}
    };

    /* ---- overall ---- */
    var worstAlert = A.alerts.active().reduce(function (m, a) { return a.sev > m ? a.sev : m; }, 0);

    var snap = {
      met:         met,
      location:    location,
      vitals:      vitals,
      suit:        suit,
      consumables: consumables,
      margin:      margin,
      comms:       comms,
      radiation:   radiation,
      evaElapsed:  evaElapsed,
      alerts:      alerts,
      environment: environment,
      overallCls:  CLS_MAP[Math.min(3, worstAlert)],
      emergency: {
        active:  S.emergency.active,
        reason:  S.emergency.reason || '',
        sinceS:  S.emergency.active ? Math.max(0, S.met - S.emergency.since) : 0,
        sinceFmt:S.emergency.active ? fmt.dur(Math.max(0, S.met - S.emergency.since)) : ''
      }
    };

    // ensure no NaN/Infinity leak in numeric fields
    function sanitize(x){
      if (Array.isArray(x)) { x.forEach(sanitize); return; }
      if (x && typeof x === 'object') { Object.keys(x).forEach(function(k){ var v=x[k]; if (typeof v==='number' && (!isFinite(v))) x[k]=0; else sanitize(v); }); }
    }
    sanitize(snap);
    return snap;
  };

})(window.AMWS);
