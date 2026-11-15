/* =========================================================================
   AMWS — assess.js — Alert classification and emergency controller.

   DESIGN:
   ─ Each parameter classified independently against its own thresholds
     (Emergency / Warning / Caution / Nominal). Overall = highest active class.
   ─ Return margin generates CAUTION or WARNING only — never Emergency.
     "CANNOT REACH HAB" is a top-priority Warning.
   ─ Auto-emergency triggers for EXACTLY THREE conditions (sourced):
       • Suit pressure < 3.5 psi  (rapid decompression — source: config.js)
       • CO₂ > 15 mmHg            (toxic inspired CO₂ — source: config.js)
       • O₂ supply < 10%          (critical supply — source: config.js)
   ─ No readiness score. No risk-count rules. No stress/fatigue/hydration.
   ─ ASSUMPTION badges: any alert driven by an ASSUMPTION threshold carries
     a flag A.alerts.isAssumed(key) that the UI can display.
   ========================================================================= */
(function (A) {
  'use strict';

  var S = A.state;
  var C = A; // config constants

  /* -----------------------------------------------------------------------
     SEV: 0 = nominal, 1 = caution, 2 = warning, 3 = emergency
     Maps to NASA C&W: Advisory/Nominal → Caution → Warning → Emergency
     (source: NTRS 20240003565)
     ----------------------------------------------------------------------- */
  var SEV_NOMINAL   = 0;
  var SEV_CAUTION   = 1;
  var SEV_WARNING   = 2;
  var SEV_EMERGENCY = 3;

  /* Classify a single parameter value. Returns 0-3. */
  function sevParam(key, val) {
    var l = C.LIMITS[key];
    if (!l) return SEV_NOMINAL;

    // Emergency tier
    if ((l.emergLo !== undefined && val < l.emergLo) ||
        (l.emergHi !== undefined && val > l.emergHi)) return SEV_EMERGENCY;

    // Warning tier
    if ((l.warnLo !== undefined && val < l.warnLo) ||
        (l.warnHi !== undefined && val > l.warnHi)) return SEV_WARNING;

    // Caution tier
    if ((l.cautionLo !== undefined && val < l.cautionLo) ||
        (l.cautionHi !== undefined && val > l.cautionHi)) return SEV_CAUTION;

    return SEV_NOMINAL;
  }

  /* Legacy two-level (0/1/2) helper for UI bindings expecting sev-0/1/2 CSS classes.
     Maps: nominal→0, caution→1, warning→1, emergency→2 */
  function sevLegacy(key, val) {
    var s = sevParam(key, val);
    return s === SEV_EMERGENCY ? 2 : s >= SEV_CAUTION ? 1 : 0;
  }

  /* Which thresholds are ASSUMPTION vs sourced — for UI badge display.
     ASSUMPTION: all vital thresholds (see config.js comments); CO₂ caution/warning
     are ASSUMPTION (15 mmHg limit is sourced, intermediate bands are not).
     source: config.js inline comments */
  var ASSUMED_THRESHOLDS = {
    hr: true, spo2: true, temp: true, resp: true,
    suitT: true, watchBatt: true, signal: true,
    // CO₂ caution/warning bands are ASSUMPTION; emergency (15 mmHg) is sourced
    co2_caution: true, co2_warning: true,
    // O₂/batt/coolant/scrubber % bands are ASSUMPTION
    o2: true, suitBatt: true, coolant: true, scrubber: true,
    // Margin bands: WARNING anchored to 30-min reserve (sourced); CAUTION is ASSUMPTION
    margin_caution: true
  };

  /* -----------------------------------------------------------------------
     RULES — each active rule produces one alert entry.
     Ordered by severity (most severe first within group).
     ----------------------------------------------------------------------- */
  function rules() {
    var v = S.v, out = [];

    function add(key, sev, title, action, group, assumed) {
      if (sev > SEV_NOMINAL) {
        out.push({ key: key, sev: sev, title: title, action: action,
                   group: group, assumed: !!assumed });
      }
    }

    /* ---- HEALTH ---- */
    var hrS = sevParam('hr', v.hr);
    if (hrS > SEV_NOMINAL) {
      add('hr', hrS,
          v.hr > C.LIMITS.hr.normal[1] ? 'ELEVATED HEART RATE' : 'LOW HEART RATE',
          'Reduce workload · rest · re-check in 2 min', 'HEALTH', true); // ASSUMPTION threshold
    }

    var spo2S = sevParam('spo2', v.spo2);
    if (spo2S > SEV_NOMINAL) {
      add('spo2', spo2S,
          spo2S === SEV_EMERGENCY ? 'SpO₂ CRITICAL — HYPOXIA RISK' : 'LOW SpO₂',
          'Stop activity · verify O₂ flow · open secondary O₂', 'HEALTH', true);
    }

    var tempS = sevParam('temp', v.temp);
    if (tempS > SEV_NOMINAL) {
      add('temp', tempS,
          v.temp > C.LIMITS.temp.normal[1] ? 'BODY TEMP HIGH' : 'BODY TEMP LOW',
          'Adjust LCVG cooling · reduce workload', 'HEALTH', true);
    }

    var respS = sevParam('resp', v.resp);
    if (respS > SEV_NOMINAL) {
      add('resp', respS, 'RESPIRATION ABNORMAL',
          'Slow breathing · check CO₂ level', 'HEALTH', true);
    }

    /* ---- LIFE SUPPORT ---- */
    var co2S = sevParam('co2', v.co2);
    if (co2S > SEV_NOMINAL) {
      // Emergency level (15 mmHg) is sourced; caution/warning bands are ASSUMPTION
      var co2Assumed = (co2S < SEV_EMERGENCY);
      add('co2', co2S,
          co2S === SEV_EMERGENCY ? 'CO₂ CRITICAL — TOXIC LEVEL' : 'CO₂ RISING',
          'Switch to secondary CO₂ scrubber · reduce workload · return to hab', 'LIFE SUPPORT', co2Assumed);
    }

    var suitPS = sevParam('suitP', v.suitP);
    if (suitPS > SEV_NOMINAL) {
      add('suitP', suitPS,
          v.suitP < C.LIMITS.suitP.normal[0] ? 'SUIT PRESSURE LOW' : 'SUIT PRESSURE HIGH',
          'Leak check · secondary O₂ open · return to habitat', 'LIFE SUPPORT', true);
    }

    var o2S = sevParam('o2', S.o2);
    if (o2S > SEV_NOMINAL) {
      add('o2', o2S, 'O₂ SUPPLY LOW',
          'Terminate EVA · return to habitat', 'LIFE SUPPORT', true);
    }

    var battS = sevParam('suitBatt', S.suitBatt);
    if (battS > SEV_NOMINAL) {
      add('suitBatt', battS, 'SUIT BATTERY LOW',
          'Shed non-essential loads · plan return', 'LIFE SUPPORT', true);
    }

    var coolS = sevParam('coolant', S.coolant);
    if (coolS > SEV_NOMINAL) {
      add('coolant', coolS, 'COOLING WATER LOW',
          'Reduce workload · plan return', 'LIFE SUPPORT', true);
    }

    var scrubS = sevParam('scrubber', S.scrubber);
    if (scrubS > SEV_NOMINAL) {
      add('scrubber', scrubS, 'CO₂ SCRUBBER LOW',
          'Switch to secondary scrubber · plan return', 'LIFE SUPPORT', true);
    }

    var suitTS = sevParam('suitT', v.suitT);
    if (suitTS > SEV_NOMINAL) {
      add('suitT', suitTS, 'SUIT TEMPERATURE OFF-NOMINAL',
          'Adjust cooling loop', 'LIFE SUPPORT', true);
    }

    /* ---- SYSTEM ---- */
    var wbS = sevParam('watchBatt', S.watchBatt);
    if (wbS > SEV_NOMINAL) {
      add('watchBatt', wbS, 'WRIST UNIT BATTERY LOW',
          'Enable low-power display', 'SYSTEM', true);
    }

    /* ---- COMMS ---- */
    var sigS = sevParam('signal', v.signal);
    if (sigS > SEV_NOMINAL) {
      add('signal', sigS,
          sigS === SEV_EMERGENCY ? 'EARTH LINK LOST (LOS)' : 'EARTH LINK DEGRADED',
          'Use habitat / crew link · follow local procedures', 'COMMS', true);
    }

    /* ---- ENVIRONMENT: SPE alert (stage-based, no dose multiplier) ---- */
    // ASSUMPTION: 4-stage progression is a design choice (SPEC.md Part 4)
    var speStage = S.speStage || 'NORMAL';
    if (speStage !== 'NORMAL') {
      var speDef = C.SPE_STAGES[speStage];
      var speSevMap = { ADVISORY: SEV_CAUTION, CAUTION: SEV_CAUTION, WARNING: SEV_WARNING, EMERGENCY: SEV_EMERGENCY };
      var speSev = speSevMap[speStage] || SEV_CAUTION;
      add('spe', speSev,
          'SPE: ' + speDef.label,
          speStage === 'EMERGENCY' ? 'Enter storm shelter immediately · abandon EVA' :
          speStage === 'WARNING'   ? 'Minimise EVA time · prepare for shelter' :
                                     'Monitor solar weather · be ready to shelter',
          'ENVIRONMENT', true); // stage thresholds are ASSUMPTION
    }

    // Career dose alert
    var dosePct = S.doseMission / C.CAREER_LIMIT_MSV * 100;
    if (dosePct >= C.RAD_WARNING_PCT) {
      add('careerDose', SEV_WARNING, 'CAREER DOSE WARNING — ' + dosePct.toFixed(0) + '%',
          'Consult flight surgeon · limit further exposure', 'ENVIRONMENT', true);
    } else if (dosePct >= C.RAD_CAUTION_PCT) {
      add('careerDose', SEV_CAUTION, 'CAREER DOSE CAUTION — ' + dosePct.toFixed(0) + '%',
          'Monitor cumulative dose', 'ENVIRONMENT', true);
    }

    /* ---- MISSION: return margin ---- */
    if (S.phase === 'SURFACE') {
      var rm = A.returnMargin();
      if (isFinite(rm.test)) {
        // Use the more conservative margin (minimum of test and cool)
        var worstMarginS = Math.min(rm.test, rm.cool);

        if (worstMarginS < 0) {
          // CANNOT REACH: Warning, NOT Emergency (spec requirement)
          out.push({
            key: 'margin', sev: SEV_WARNING,
            title: 'CANNOT REACH HAB — ' + rm.limiting + ' LIMITING',
            action: 'Return immediately via shortest route · conserve all consumables',
            group: 'MISSION', assumed: false, // 30-min reserve is sourced
            marginRange: { test: rm.test, cool: rm.cool, limitingResource: rm.limiting }
          });
        } else if (worstMarginS < C.MARGIN_WARNING_S) {
          out.push({
            key: 'margin', sev: SEV_WARNING,
            title: 'RETURN MARGIN LOW — ' + rm.limiting + ' LIMITING',
            action: 'Begin return to habitat · 30-min EMU reserve reached',
            group: 'MISSION', assumed: false,
            marginRange: { test: rm.test, cool: rm.cool, limitingResource: rm.limiting }
          });
        } else if (worstMarginS < C.MARGIN_CAUTION_S) {
          out.push({
            key: 'margin', sev: SEV_CAUTION,
            title: 'RETURN MARGIN REDUCING — ' + rm.limiting + ' LIMITING',
            action: 'Plan return · monitor consumables',
            group: 'MISSION', assumed: true, // 60-min band is ASSUMPTION
            marginRange: { test: rm.test, cool: rm.cool, limitingResource: rm.limiting }
          });
        }
      }
    }

    /* ---- MISSION: EVA elapsed vs planned ---- */
    // ASSUMPTION: EVA_PLANNED_S default and alert bands (see config.js)
    var evaPlanned = S.evaPlannedS || C.EVA_PLANNED_S;
    var evaElapsed = S.evaElapsedS || 0;
    if (S.phase === 'SURFACE' && evaElapsed > 0) {
      var evaFrac = evaElapsed / evaPlanned;
      if (evaFrac >= C.EVA_ELAPSED_WARNING) {
        add('evaElapsed', SEV_WARNING, 'EVA DURATION EXCEEDED PLAN',
            'Initiate return · coordinate with hab crew', 'MISSION', true);
      } else if (evaFrac >= C.EVA_ELAPSED_CAUTION) {
        add('evaElapsed', SEV_CAUTION, 'EVA APPROACHING PLANNED LIMIT',
            'Monitor consumables · plan return', 'MISSION', true);
      }
    }


    var GROUP_ORDER = { 'LIFE SUPPORT': 0, 'HEALTH': 1, 'MISSION': 2, 'ENVIRONMENT': 3, 'COMMS': 4, 'SYSTEM': 5 };
    out.sort(function (a, b) {
      if (b.sev !== a.sev) return b.sev - a.sev;
      return (GROUP_ORDER[a.group] || 9) - (GROUP_ORDER[b.group] || 9);
    });
    return out;
  }

  /* -----------------------------------------------------------------------
     ALERT LOG — persistent, with acknowledge
     ----------------------------------------------------------------------- */
  var active = {};    // key → alert object
  A.alertLog = [];    // time-ordered history

  A.alerts = {
    active: function () {
      return Object.keys(active).map(function (k) { return active[k]; })
                   .sort(function (a, b) { return b.sev - a.sev || b.t - a.t; });
    },
    ackAll:  function () { Object.keys(active).forEach(function (k) { active[k].acked = true; }); },
    unacked: function () { return this.active().filter(function (a) { return !a.acked; }); },
    clear:   function () { active = {}; A.alertLog.length = 0; },
    isAssumed: function (key) { return !!ASSUMED_THRESHOLDS[key]; }
  };

  function syncAlerts(issues) {
    var nowKeys = {}, newHighSev = false;
    issues.forEach(function (i) {
      nowKeys[i.key] = true;
      var existing = active[i.key];
      if (!existing || existing.sev < i.sev) {
        if (i.sev >= SEV_WARNING) newHighSev = true;
        A.alertLog.unshift({ t: S.met, sev: i.sev, title: i.title });
        active[i.key] = { key: i.key, sev: i.sev, title: i.title,
                          action: i.action, group: i.group,
                          assumed: i.assumed, marginRange: i.marginRange,
                          t: S.met, acked: false };
      } else {
        // Update title/action/marginRange in place (value may have changed)
        existing.sev = i.sev; existing.title = i.title;
        existing.action = i.action; existing.marginRange = i.marginRange;
      }
    });
    // Clear alerts whose condition has resolved
    Object.keys(active).forEach(function (k) {
      if (!nowKeys[k]) {
        A.alertLog.unshift({ t: S.met, sev: SEV_NOMINAL, title: active[k].title + ' — CLEARED' });
        delete active[k];
      }
    });
    if (A.alertLog.length > 60) A.alertLog.length = 60;
    return newHighSev;
  }

  /* -----------------------------------------------------------------------
     AUTO-EMERGENCY: ONLY the three sourced conditions (Part 1 of SPEC)
     ----------------------------------------------------------------------- */
  function checkAutoEmergency(issues) {
    // source: config.js SUIT_PRESSURE_EMERGENCY_LO, CO2_EMERGENCY, O2_EMERGENCY_PCT
    var v = S.v;
    var pressureBreach = v.suitP < C.SUIT_PRESSURE_EMERGENCY_LO;
    var co2Critical    = v.co2   > C.CO2_EMERGENCY;
    var o2Critical     = S.o2    < C.O2_EMERGENCY_PCT;

    if (!pressureBreach && !co2Critical && !o2Critical) return null;

    var reasons = [];
    if (pressureBreach) reasons.push('PRESSURE <3.5 PSI');
    if (co2Critical)    reasons.push('CO\u2082 >' + C.CO2_EMERGENCY + ' mmHg');
    if (o2Critical)     reasons.push('O\u2082 <' + C.O2_EMERGENCY_PCT + '%');
    return 'AUTO: ' + reasons.join(' + ');
  }

  /* -----------------------------------------------------------------------
     PUBLIC ASSESS API
     ----------------------------------------------------------------------- */
  A.assess = {
    sev: sevParam,       // used by ui.js
    sevLegacy: sevLegacy, // 0/1/2 CSS class helper

    run: function () {
      var issues = rules();
      var newHigh = syncAlerts(issues);

      // Reset suppression when no auto-emergency conditions are active
      var autoReason = checkAutoEmergency(issues);
      if (!autoReason) S.emergency.suppressed = false;

      if (autoReason && S.autoEmergency && !S.emergency.active && !S.emergency.suppressed) {
        A.emergency.activate(autoReason, true);
      }

      A.last = { issues: issues, newHigh: newHigh };
      return A.last;
    }
  };

  /* -----------------------------------------------------------------------
     EMERGENCY CONTROLLER
     ----------------------------------------------------------------------- */
  A.emergency = {
    activate: function (reason, auto) {
      S.emergency.active  = true;
      S.emergency.auto    = !!auto;
      S.emergency.reason  = reason || 'CREW-INITIATED';
      S.emergency.since   = S.met;
      if (A.watch) A.watch.go('emergency', true);
      if (A.audio) A.audio.alarm();
      document.body.classList.add('is-emergency');
    },
    cancel: function () {
      S.emergency.active     = false;
      S.emergency.suppressed = true;
      document.body.classList.remove('is-emergency');
      if (A.watch) A.watch.home();
    }
  };

})(window.AMWS);
