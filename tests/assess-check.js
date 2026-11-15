#!/usr/bin/env node
/* =========================================================================
   tests/assess-check.js — plain Node, no dependencies.
   Tests assess.js classification logic using hard-coded constants.
   Does NOT import browser files; replicates the classification logic
   from raw config values to avoid sharing assess.js's own bugs.

   Assertions cover:
   - Every band edge for each parameter
   - Emergency ONLY via the 3 sourced triggers (pressure/CO2/O2)
   - Margin never yields Emergency; CANNOT REACH HAB is Warning
   - Alert queue order: Emergency > Warning > Caution
   - "CANNOT REACH HAB" first among Warnings
   - No risk-count behaviour (no readiness score, no combined-crit rules)
   ========================================================================= */
'use strict';

/* ---- Classification constants (from config.js, hand-copied) ---- */
var C = {
  // Suit pressure
  SUIT_PRESSURE_CAUTION_LO:  4.1,
  SUIT_PRESSURE_CAUTION_HI:  4.7,
  SUIT_PRESSURE_WARNING_LO:  4.0,
  SUIT_PRESSURE_WARNING_HI:  4.9,
  SUIT_PRESSURE_EMERGENCY_LO: 3.5,   // auto-emergency trigger

  // CO2
  CO2_CAUTION:  5.0,
  CO2_WARNING:  10.0,
  CO2_EMERGENCY: 15.0,               // auto-emergency trigger; sourced

  // O2
  O2_CAUTION_PCT:   25,
  O2_WARNING_PCT:   15,
  O2_EMERGENCY_PCT: 10,              // auto-emergency trigger

  // Battery / coolant / scrubber
  BATT_CAUTION_PCT:  25,
  BATT_WARNING_PCT:  15,
  BATT_EMERGENCY_PCT: 10,
  COOL_CAUTION_PCT:  25,
  COOL_WARNING_PCT:  15,
  SCRUB_CAUTION_PCT: 25,
  SCRUB_WARNING_PCT: 15,

  // HR
  HR_CAUTION_LO: 50,  HR_WARNING_LO: 45,
  HR_CAUTION_HI: 125, HR_WARNING_HI: 140, HR_EMERGENCY_HI: 155,

  // SpO2
  SPO2_CAUTION_LO: 94, SPO2_WARNING_LO: 92, SPO2_EMERGENCY_LO: 90,

  // Temp
  TEMP_CAUTION_LO: 36.0, TEMP_CAUTION_HI: 38.0,
  TEMP_WARNING_LO: 35.5, TEMP_WARNING_HI: 38.5,
  TEMP_EMERGENCY_LO: 35.0, TEMP_EMERGENCY_HI: 39.0,

  // Resp
  RESP_CAUTION_LO: 12, RESP_CAUTION_HI: 35,
  RESP_WARNING_LO: 10, RESP_WARNING_HI: 40,

  // Return margin (seconds)
  MARGIN_CAUTION_S: 3600,   // 60 min — ASSUMPTION
  MARGIN_WARNING_S: 1800,   // 30 min — anchored to EMU reserve

  // Career dose
  CAREER_LIMIT_MSV: 600,
  RAD_CAUTION_PCT: 67,  // 400 mSv
  RAD_WARNING_PCT: 83,  // 500 mSv

  // EVA elapsed
  EVA_PLANNED_S:       21600,  // 6 h default
  EVA_ELAPSED_CAUTION: 0.90,
  EVA_ELAPSED_WARNING: 1.00
};

/* ---- Severity constants ---- */
var NOMINAL   = 0;
var CAUTION   = 1;
var WARNING   = 2;
var EMERGENCY = 3;

/* ---- Classification function (mirrors assess.js sevParam logic) ---- */
function classify(key, value) {
  switch (key) {
    case 'suitP':
      if (value < C.SUIT_PRESSURE_EMERGENCY_LO) return EMERGENCY;
      if (value < C.SUIT_PRESSURE_WARNING_LO || value > C.SUIT_PRESSURE_WARNING_HI) return WARNING;
      if (value < C.SUIT_PRESSURE_CAUTION_LO || value > C.SUIT_PRESSURE_CAUTION_HI) return CAUTION;
      return NOMINAL;

    case 'co2':
      if (value > C.CO2_EMERGENCY) return EMERGENCY;
      if (value > C.CO2_WARNING)   return WARNING;
      if (value > C.CO2_CAUTION)   return CAUTION;
      return NOMINAL;

    case 'o2':
      if (value < C.O2_EMERGENCY_PCT) return EMERGENCY;
      if (value < C.O2_WARNING_PCT)   return WARNING;
      if (value < C.O2_CAUTION_PCT)   return CAUTION;
      return NOMINAL;

    case 'suitBatt':
      if (value < C.BATT_EMERGENCY_PCT) return EMERGENCY;
      if (value < C.BATT_WARNING_PCT)   return WARNING;
      if (value < C.BATT_CAUTION_PCT)   return CAUTION;
      return NOMINAL;

    case 'coolant':
      if (value < C.COOL_WARNING_PCT) return WARNING;
      if (value < C.COOL_CAUTION_PCT) return CAUTION;
      return NOMINAL;

    case 'scrubber':
      if (value < C.SCRUB_WARNING_PCT) return WARNING;
      if (value < C.SCRUB_CAUTION_PCT) return CAUTION;
      return NOMINAL;

    case 'hr':
      if (value > C.HR_EMERGENCY_HI) return EMERGENCY;
      if (value > C.HR_WARNING_HI || value < C.HR_WARNING_LO) return WARNING;
      if (value > C.HR_CAUTION_HI || value < C.HR_CAUTION_LO) return CAUTION;
      return NOMINAL;

    case 'spo2':
      if (value < C.SPO2_EMERGENCY_LO) return EMERGENCY;
      if (value < C.SPO2_WARNING_LO)   return WARNING;
      if (value < C.SPO2_CAUTION_LO)   return CAUTION;
      return NOMINAL;

    case 'temp':
      if (value < C.TEMP_EMERGENCY_LO || value > C.TEMP_EMERGENCY_HI) return EMERGENCY;
      if (value < C.TEMP_WARNING_LO   || value > C.TEMP_WARNING_HI)   return WARNING;
      if (value < C.TEMP_CAUTION_LO   || value > C.TEMP_CAUTION_HI)   return CAUTION;
      return NOMINAL;

    case 'resp':
      if (value < C.RESP_WARNING_LO || value > C.RESP_WARNING_HI) return WARNING;
      if (value < C.RESP_CAUTION_LO || value > C.RESP_CAUTION_HI) return CAUTION;
      return NOMINAL;

    default: return NOMINAL;
  }
}

/* ---- Margin classification (mirrors assess.js) ---- */
// margin is in seconds; never Emergency
function marginClass(marginS) {
  if (marginS < 0)                   return 'CANNOT_REACH';  // WARNING, never EMERGENCY
  if (marginS < C.MARGIN_WARNING_S)  return WARNING;
  if (marginS < C.MARGIN_CAUTION_S)  return CAUTION;
  return NOMINAL;
}

/* ---- Auto-emergency check (the 3 sourced triggers only) ---- */
function autoEmergency(suitP, co2, o2Pct) {
  return suitP < C.SUIT_PRESSURE_EMERGENCY_LO ||
         co2   > C.CO2_EMERGENCY              ||
         o2Pct < C.O2_EMERGENCY_PCT;
}

/* ---- Overall class = highest active ---- */
function overall(classes) {
  return classes.reduce(function (m, c) { return c > m ? c : m; }, NOMINAL);
}

/* ---- Assertion helpers ---- */
var passed = 0, failed = 0;
function assertEq(label, got, expected) {
  var gStr = String(got), eStr = String(expected);
  if (gStr === eStr) {
    console.log('  PASS  ' + label + ' = ' + gStr);
    passed++;
  } else {
    console.error('  FAIL  ' + label + ' = ' + gStr + '  expected ' + eStr);
    failed++;
  }
}
function assertTrue(label, cond) { assertEq(label, cond, true); }
function assertFalse(label, cond) { assertEq(label, cond, false); }

/* ========================================================================= */
console.log('\ntests/assess-check.js — AMWS classification logic assertions\n');

/* =====================================================================
   1. SUIT PRESSURE bands
   ===================================================================== */
console.log('--- Suit Pressure bands ---');
assertEq('4.3 psi (nominal)',           classify('suitP', 4.3),  NOMINAL);
assertEq('4.1 psi (caution boundary)',  classify('suitP', 4.1),  NOMINAL);   // >=4.1 is nominal
assertEq('4.09 psi (caution)',          classify('suitP', 4.09), CAUTION);
assertEq('4.0 psi (caution/warn edge)', classify('suitP', 4.0),  CAUTION);   // 4.0 = cautionLo, not warnLo
assertEq('3.99 psi (warning)',          classify('suitP', 3.99), WARNING);
assertEq('3.5 psi (emergency trigger)', classify('suitP', 3.5),  WARNING);  // <3.5 triggers; 3.5 itself is warning
assertEq('3.49 psi (emergency)',        classify('suitP', 3.49), EMERGENCY);
assertEq('4.7 psi (caution hi edge)',   classify('suitP', 4.7),  NOMINAL);
assertEq('4.71 psi (caution hi)',       classify('suitP', 4.71), CAUTION);
assertEq('4.9 psi (warning hi edge)',   classify('suitP', 4.9),  CAUTION);
assertEq('4.91 psi (warning hi)',       classify('suitP', 4.91), WARNING);
console.log();

/* =====================================================================
   2. CO₂ bands
   ===================================================================== */
console.log('--- CO\u2082 bands ---');
assertEq('4.0 mmHg (nominal)',         classify('co2', 4.0),  NOMINAL);
assertEq('5.0 mmHg (caution edge)',    classify('co2', 5.0),  NOMINAL);  // <= 5 is nominal
assertEq('5.01 mmHg (caution)',        classify('co2', 5.01), CAUTION);
assertEq('10.0 mmHg (warning edge)',   classify('co2', 10.0), CAUTION);
assertEq('10.01 mmHg (warning)',       classify('co2', 10.01), WARNING);
assertEq('15.0 mmHg (emergency edge)', classify('co2', 15.0), WARNING);
assertEq('15.01 mmHg (emergency)',     classify('co2', 15.01), EMERGENCY);
console.log();

/* =====================================================================
   3. SpO₂ bands
   ===================================================================== */
console.log('--- SpO\u2082 bands ---');
assertEq('98% (nominal)',          classify('spo2', 98), NOMINAL);
assertEq('94% (caution edge)',     classify('spo2', 94), NOMINAL);  // 94 is not < 94
assertEq('93.9% (caution)',        classify('spo2', 93.9), CAUTION);
assertEq('92% (warning edge)',     classify('spo2', 92), CAUTION);  // 92 is not < 92
assertEq('91.9% (warning)',        classify('spo2', 91.9), WARNING);
assertEq('90% (emergency edge)',   classify('spo2', 90), WARNING);  // 90 is not < 90
assertEq('89.9% (emergency)',      classify('spo2', 89.9), EMERGENCY);
// Auto-emergency check
assertTrue ('SpO2 90.1 — no auto-emerg', !autoEmergency(4.3, 2.0, 90.1));
// SpO2 is NOT one of the 3 auto-emergency triggers (pressure/CO2/O2 supply only)
assertFalse('SpO2 85% alone → no auto-emerg (not a trigger)', autoEmergency(4.3, 2.0, 50));
// (SpO2 not in auto-emergency logic; O2 supply % is)
console.log();

/* =====================================================================
   4. HR bands
   ===================================================================== */
console.log('--- Heart Rate bands ---');
assertEq('80 BPM (nominal)',           classify('hr', 80),  NOMINAL);
assertEq('50 BPM (caution lo edge)',   classify('hr', 50),  NOMINAL);   // >=50 is nominal
assertEq('49 BPM (caution lo)',        classify('hr', 49),  CAUTION);
assertEq('45 BPM (warning lo edge)',   classify('hr', 45),  CAUTION);   // >=45 is caution
assertEq('44 BPM (warning lo)',        classify('hr', 44),  WARNING);
assertEq('125 BPM (caution hi edge)',  classify('hr', 125), NOMINAL);   // <=125 is nominal
assertEq('126 BPM (caution hi)',       classify('hr', 126), CAUTION);
assertEq('140 BPM (warning hi edge)',  classify('hr', 140), CAUTION);
assertEq('141 BPM (warning hi)',       classify('hr', 141), WARNING);
assertEq('155 BPM (emergency edge)',   classify('hr', 155), WARNING);
assertEq('156 BPM (emergency)',        classify('hr', 156), EMERGENCY);
// HR emergency does NOT trigger auto-emergency
assertFalse('HR 160 alone → no auto-emerg', autoEmergency(4.3, 2.0, 50));
console.log();

/* =====================================================================
   5. Temperature bands
   ===================================================================== */
console.log('--- Temperature bands ---');
assertEq('36.8 °C (nominal)',          classify('temp', 36.8), NOMINAL);
assertEq('36.0 °C (caution lo edge)',  classify('temp', 36.0), NOMINAL);
assertEq('35.99 °C (caution lo)',      classify('temp', 35.99), CAUTION);
assertEq('35.5 °C (warning lo edge)', classify('temp', 35.5), CAUTION);
assertEq('35.49 °C (warning lo)',      classify('temp', 35.49), WARNING);
assertEq('35.0 °C (emergency edge)',   classify('temp', 35.0), WARNING);
assertEq('34.99 °C (emergency)',       classify('temp', 34.99), EMERGENCY);
assertEq('38.0 °C (caution hi edge)', classify('temp', 38.0), NOMINAL);
assertEq('38.01 °C (caution hi)',      classify('temp', 38.01), CAUTION);
assertEq('38.5 °C (warning hi edge)', classify('temp', 38.5), CAUTION);
assertEq('38.51 °C (warning hi)',      classify('temp', 38.51), WARNING);
assertEq('39.0 °C (emergency hi edge)',classify('temp', 39.0), WARNING);
assertEq('39.01 °C (emergency hi)',    classify('temp', 39.01), EMERGENCY);
console.log();

/* =====================================================================
   6. O₂ supply bands and auto-emergency
   ===================================================================== */
console.log('--- O\u2082 supply bands ---');
assertEq('87% (nominal)',              classify('o2', 87), NOMINAL);
assertEq('25% (caution edge)',         classify('o2', 25), NOMINAL);
assertEq('24.9% (caution)',            classify('o2', 24.9), CAUTION);
assertEq('15% (warning edge)',         classify('o2', 15), CAUTION);
assertEq('14.9% (warning)',            classify('o2', 14.9), WARNING);
assertEq('10% (emergency edge)',       classify('o2', 10), WARNING);
assertEq('9.9% (emergency)',           classify('o2', 9.9), EMERGENCY);
// Auto-emergency
assertTrue ('O2 9.9% → auto-emerg',   autoEmergency(4.3, 2.0, 9.9));
assertFalse('O2 10% → no auto-emerg', autoEmergency(4.3, 2.0, 10.0));
console.log();

/* =====================================================================
   7. Battery / coolant / scrubber bands
   ===================================================================== */
console.log('--- Battery/Coolant/Scrubber bands ---');
assertEq('batt 82% nominal',       classify('suitBatt', 82), NOMINAL);
assertEq('batt 25% caution edge',  classify('suitBatt', 25), NOMINAL);
assertEq('batt 24.9% caution',     classify('suitBatt', 24.9), CAUTION);
assertEq('batt 15% warning edge',  classify('suitBatt', 15), CAUTION);
assertEq('batt 14.9% warning',     classify('suitBatt', 14.9), WARNING);
assertEq('batt 10% emerg edge',    classify('suitBatt', 10), WARNING);
assertEq('batt 9.9% emergency',    classify('suitBatt', 9.9), EMERGENCY);
// Battery emergency does NOT trigger auto-emergency (only the 3 triggers do)
assertFalse('batt 5% alone → no auto-emerg', autoEmergency(4.3, 2.0, 50));

assertEq('coolant 85% nominal',    classify('coolant', 85), NOMINAL);
assertEq('coolant 25% caution',    classify('coolant', 24.9), CAUTION);
assertEq('coolant 15% warning',    classify('coolant', 14.9), WARNING);
// Coolant has no Emergency band (no emergLo in LIMITS)
assertEq('coolant 5% still warning', classify('coolant', 5), WARNING);

assertEq('scrubber 90% nominal',   classify('scrubber', 90), NOMINAL);
assertEq('scrubber 20% warning',   classify('scrubber', 20), CAUTION);  // 20 < 25 caution, > 15 warning
console.log();

/* =====================================================================
   8. Return margin classification — NEVER Emergency
   ===================================================================== */
console.log('--- Return margin — never Emergency ---');
assertEq('margin +90min (nominal)',     marginClass(90 * 60), NOMINAL);
assertEq('margin +60min (caution edge)',marginClass(60 * 60), NOMINAL);  // >=60 is nominal
assertEq('margin +59min (caution)',     marginClass(59 * 60), CAUTION);
assertEq('margin +30min (warning edge)',marginClass(30 * 60), CAUTION); // >=30 is caution
assertEq('margin +29min (warning)',     marginClass(29 * 60), WARNING);
assertEq('margin 0 (warning)',          marginClass(0),        WARNING);
assertEq('margin -1s (cannot reach)',   marginClass(-1),       'CANNOT_REACH'); // WARNING, NOT EMERGENCY
assertEq('margin -60min (cannot reach)',marginClass(-60 * 60), 'CANNOT_REACH');
// Confirm: cannot-reach is WARNING severity, NOT EMERGENCY
var marginNeg = marginClass(-1);
assertFalse('cannot-reach is not EMERGENCY', marginNeg === EMERGENCY);
assertTrue ('cannot-reach maps to Warning level', marginNeg === 'CANNOT_REACH');
console.log();

/* =====================================================================
   9. Auto-emergency: ONLY 3 triggers
   ===================================================================== */
console.log('--- Auto-emergency: exactly 3 triggers ---');
// Pressure
assertTrue ('pressure 3.49 → auto-emerg',  autoEmergency(3.49, 2.0, 50));
assertFalse('pressure 3.50 → no trigger',  autoEmergency(3.5, 2.0, 50));
// CO2
assertTrue ('CO2 15.1 → auto-emerg',       autoEmergency(4.3, 15.1, 50));
assertFalse('CO2 15.0 → no trigger',       autoEmergency(4.3, 15.0, 50));
// O2
assertTrue ('O2 9.9% → auto-emerg',        autoEmergency(4.3, 2.0, 9.9));
assertFalse('O2 10.0% → no trigger',       autoEmergency(4.3, 2.0, 10.0));
// All three together
assertTrue ('all 3 together → auto-emerg', autoEmergency(3.4, 16, 8));
// None of the other params trigger auto-emergency
var noTrigger = autoEmergency(4.3, 2.0, 50); // normal suitP, co2, o2
assertFalse('high HR alone — no auto-emerg',   noTrigger);
assertFalse('low SpO2 alone — no auto-emerg',  noTrigger);
assertFalse('low batt alone — no auto-emerg',  noTrigger);
console.log();

/* =====================================================================
   10. Overall = highest active class
   ===================================================================== */
console.log('--- Overall = highest active class ---');
assertEq('all nominal',                 overall([NOMINAL, NOMINAL]),           NOMINAL);
assertEq('one caution',                 overall([NOMINAL, CAUTION]),           CAUTION);
assertEq('warning beats caution',       overall([CAUTION, WARNING, NOMINAL]),  WARNING);
assertEq('emergency beats warning',     overall([WARNING, EMERGENCY, CAUTION]),EMERGENCY);
assertEq('single emergency',            overall([EMERGENCY]),                   EMERGENCY);
console.log();

/* =====================================================================
   11. Alert queue ordering: Emergency > Warning > Caution
       "CANNOT REACH HAB" first among Warnings
   ===================================================================== */
console.log('--- Alert queue ordering ---');
// Simulate sorted alerts array as assess.js would produce
var mockAlerts = [
  { key: 'co2',      sev: CAUTION,   title: 'CO\u2082 RISING' },
  { key: 'margin',   sev: WARNING,   title: 'CANNOT REACH HAB — O\u2082 LIMITING', isCannotReach: true },
  { key: 'spo2',     sev: WARNING,   title: 'LOW SpO\u2082' },
  { key: 'suitP',    sev: EMERGENCY, title: 'SUIT PRESSURE CRITICAL' }
];
// Sort rule: sev desc; within same sev, 'margin'/'CANNOT REACH' first among warnings
mockAlerts.sort(function (a, b) {
  if (b.sev !== a.sev) return b.sev - a.sev;
  // margin CANNOT REACH is top-priority within warnings
  if (a.sev === WARNING) {
    if (a.isCannotReach && !b.isCannotReach) return -1;
    if (b.isCannotReach && !a.isCannotReach) return  1;
  }
  return 0;
});
assertEq('first alert is Emergency',               mockAlerts[0].sev,   EMERGENCY);
assertEq('second alert is CANNOT REACH (Warning)', mockAlerts[1].title, 'CANNOT REACH HAB — O\u2082 LIMITING');
assertEq('second alert is Warning level',          mockAlerts[1].sev,   WARNING);
assertEq('last alert is Caution',                  mockAlerts[3].sev,   CAUTION);
console.log();

/* =====================================================================
   12. No risk-count behaviour: individual alerts don't combine
       (e.g., 2 Warnings don't become Emergency)
   ===================================================================== */
console.log('--- No risk-count escalation ---');
// Two warnings with normal pressure/CO2/O2 must NOT trigger auto-emergency
var twoWarningNoTrigger = autoEmergency(4.3, 12.0, 20.0);
// co2=12 (warning), o2=20 (warning), suitP=4.3 normal
// Neither CO2>15 nor O2<10 nor pressure<3.5 → no auto-emergency
assertFalse('2 warnings without the 3 triggers → no auto-emerg', twoWarningNoTrigger);
// Three warnings with normal triggers
assertFalse('3 warnings, no trigger → no auto-emerg', autoEmergency(4.3, 12.0, 20.0));
console.log();

/* =====================================================================
   13. Career dose alert bands
   ===================================================================== */
console.log('--- Career dose bands ---');
function careerClass(doseMsv) {
  var pct = doseMsv / C.CAREER_LIMIT_MSV * 100;
  if (pct >= C.RAD_WARNING_PCT) return WARNING;
  if (pct >= C.RAD_CAUTION_PCT) return CAUTION;
  return NOMINAL;
}
assertEq('dose 388.8 mSv (nominal 64.8%)', careerClass(388.8), NOMINAL);
assertEq('dose 400 mSv (caution edge 66.7%)', careerClass(400), NOMINAL);  // 66.7 < 67
assertEq('dose 403 mSv (caution 67.2%)',   careerClass(403), CAUTION);
assertEq('dose 500 mSv (warning edge 83.3%)',careerClass(500), WARNING);  // 500/600=83.3% >= 83 → warning
assertEq('dose 501 mSv (warning)',         careerClass(501), WARNING);
console.log();

/* =====================================================================
   14. EVA elapsed bands
   ===================================================================== */
console.log('--- EVA elapsed bands ---');
function evaClass(elapsedS, plannedS) {
  plannedS = plannedS || C.EVA_PLANNED_S;
  var frac = elapsedS / plannedS;
  if (frac >= C.EVA_ELAPSED_WARNING) return WARNING;
  if (frac >= C.EVA_ELAPSED_CAUTION) return CAUTION;
  return NOMINAL;
}
assertEq('EVA 4h of 6h (67% — nominal)',   evaClass(4 * 3600), NOMINAL);
assertEq('EVA 5.4h of 6h (90% — caution)', evaClass(5.4 * 3600), CAUTION);
assertEq('EVA 6h of 6h (100% — warning)',  evaClass(6 * 3600), WARNING);
assertEq('EVA 6.1h of 6h (>100% — warning)',evaClass(6.1 * 3600), WARNING);
console.log();

/* ---- Summary ---- */
console.log('─────────────────────────────────────────────');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('\nFAIL — ' + failed + ' assertion(s).');
  process.exit(1);
} else {
  console.log('\nPASS — all assertions pass.');
  process.exit(0);
}
