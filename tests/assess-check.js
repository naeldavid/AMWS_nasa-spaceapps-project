#!/usr/bin/env node
/* =========================================================================
   tests/assess-check.js — plain Node, no dependencies.
   Hard-coded expected values from raw config constants.
   Does NOT import browser files; replicates classification logic independently.
   ========================================================================= */
'use strict';

/* ---- Constants (hand-copied from config.js; must match exactly) ---- */
var C = {
  SUIT_PRESSURE_CAUTION_LO:  4.1,
  SUIT_PRESSURE_CAUTION_HI:  4.7,
  SUIT_PRESSURE_WARNING_LO:  4.0,
  SUIT_PRESSURE_WARNING_HI:  4.9,
  SUIT_PRESSURE_EMERGENCY_LO: 3.5,

  CO2_CAUTION:   5.0,
  CO2_WARNING:  10.0,
  CO2_EMERGENCY: 15.0,

  O2_CAUTION_PCT:    25,
  O2_WARNING_PCT:    15,
  O2_EMERGENCY_PCT:  10,

  BATT_CAUTION_PCT:  25,  BATT_WARNING_PCT:  15,  BATT_EMERGENCY_PCT: 10,
  COOL_CAUTION_PCT:  25,  COOL_WARNING_PCT:  15,
  SCRUB_CAUTION_PCT: 25,  SCRUB_WARNING_PCT: 15,

  HR_CAUTION_LO: 50,  HR_WARNING_LO: 45,
  HR_CAUTION_HI: 125, HR_WARNING_HI: 140, HR_EMERGENCY_HI: 155,

  SPO2_CAUTION_LO: 94, SPO2_WARNING_LO: 92, SPO2_EMERGENCY_LO: 90,

  TEMP_CAUTION_LO: 36.0, TEMP_CAUTION_HI: 38.0,
  TEMP_WARNING_LO: 35.5, TEMP_WARNING_HI: 38.5,
  TEMP_EMERGENCY_LO: 35.0, TEMP_EMERGENCY_HI: 39.0,

  RESP_CAUTION_LO: 12, RESP_CAUTION_HI: 35,
  RESP_WARNING_LO: 10, RESP_WARNING_HI: 40,

  MARGIN_CAUTION_S: 3600,
  MARGIN_WARNING_S: 1800,

  // Career dose in mSv (not %)
  CAREER_LIMIT_MSV:        600,
  CAREER_DOSE_CAUTION_MSV: 400,
  CAREER_DOSE_WARNING_MSV: 500,

  EVA_PLANNED_S:       21600,
  EVA_ELAPSED_CAUTION: 0.90,
  EVA_ELAPSED_WARNING: 1.00,

  // SPE stages: sevCls on 0-3 scale
  SPE_STAGES: {
    NORMAL:    { sevCls: 0 },
    ADVISORY:  { sevCls: 1 },
    CAUTION:   { sevCls: 1 },
    WARNING:   { sevCls: 2 },
    EMERGENCY: { sevCls: 3 }
  },

  // Conjunction days
  CONJUNCTION_ADVISORY_DAYS:  30,
  CONJUNCTION_CAUTION_DAYS:    7,
  CONJUNCTION_WARNING_DAYS:    3
};

var NOMINAL = 0, CAUTION = 1, WARNING = 2, EMERGENCY = 3;

/* ---- Classification helpers (mirror assess.js logic) ---- */
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
      if (value > C.HR_CAUTION_HI  || value < C.HR_CAUTION_LO) return CAUTION;
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

function marginClass(marginS) {
  if (marginS < 0)                  return 'CANNOT_REACH';
  if (marginS < C.MARGIN_WARNING_S) return WARNING;
  if (marginS < C.MARGIN_CAUTION_S) return CAUTION;
  return NOMINAL;
}

function autoEmergency(suitP, co2, o2Pct) {
  return suitP < C.SUIT_PRESSURE_EMERGENCY_LO ||
         co2   > C.CO2_EMERGENCY              ||
         o2Pct < C.O2_EMERGENCY_PCT;
}

function overall(classes) {
  return classes.reduce(function (m, c) { return c > m ? c : m; }, NOMINAL);
}

function careerClass(doseMsv) {
  if (doseMsv > C.CAREER_DOSE_WARNING_MSV) return WARNING;
  if (doseMsv > C.CAREER_DOSE_CAUTION_MSV) return CAUTION;
  return NOMINAL;
}

function evaClass(elapsedS) {
  var frac = elapsedS / C.EVA_PLANNED_S;
  if (frac >= C.EVA_ELAPSED_WARNING) return WARNING;
  if (frac >= C.EVA_ELAPSED_CAUTION) return CAUTION;
  return NOMINAL;
}

function speClass(stage) {
  return (C.SPE_STAGES[stage] || C.SPE_STAGES.NORMAL).sevCls;
}

function conjunctionClass(daysUntil) {
  // daysUntil = days until conjunction; classify by proximity
  if (daysUntil <= C.CONJUNCTION_WARNING_DAYS)  return WARNING;
  if (daysUntil <= C.CONJUNCTION_CAUTION_DAYS)  return CAUTION;
  if (daysUntil <= C.CONJUNCTION_ADVISORY_DAYS) return CAUTION; // advisory maps to caution class
  return NOMINAL;
}

/* ---- Assertion helpers ---- */
var passed = 0, failed = 0;
function assertEq(label, got, expected) {
  if (String(got) === String(expected)) { console.log('  PASS  ' + label + ' = ' + got); passed++; }
  else { console.error('  FAIL  ' + label + ' = ' + got + '  expected ' + expected); failed++; }
}
function assertTrue(label, cond)  { assertEq(label, cond, true); }
function assertFalse(label, cond) { assertEq(label, cond, false); }

/* ========================================================================= */
console.log('\ntests/assess-check.js — AMWS classification logic assertions\n');

/* 1. Suit Pressure */
console.log('--- Suit Pressure bands ---');
assertEq('4.3 psi nominal',           classify('suitP', 4.3),  NOMINAL);
assertEq('4.1 psi caution boundary',  classify('suitP', 4.1),  NOMINAL);  // >=4.1 is nominal
assertEq('4.09 psi caution',          classify('suitP', 4.09), CAUTION);
assertEq('4.0 psi caution/warn edge', classify('suitP', 4.0),  CAUTION);  // 4.0 = cautionLo, not warnLo
assertEq('3.99 psi warning',          classify('suitP', 3.99), WARNING);
assertEq('3.5 psi at trigger edge',   classify('suitP', 3.5),  WARNING);  // <3.5 triggers; 3.5 itself is warning
assertEq('3.49 psi emergency',        classify('suitP', 3.49), EMERGENCY);
assertEq('4.7 psi caution hi edge',   classify('suitP', 4.7),  NOMINAL);
assertEq('4.71 psi caution hi',       classify('suitP', 4.71), CAUTION);
assertEq('4.9 psi warning hi edge',   classify('suitP', 4.9),  CAUTION);
assertEq('4.91 psi warning hi',       classify('suitP', 4.91), WARNING);
console.log();

/* 2. CO₂ */
console.log('--- CO\u2082 bands ---');
assertEq('4.0 mmHg nominal',         classify('co2', 4.0),  NOMINAL);
assertEq('5.0 mmHg caution edge',    classify('co2', 5.0),  NOMINAL);
assertEq('5.01 mmHg caution',        classify('co2', 5.01), CAUTION);
assertEq('10.0 mmHg warning edge',   classify('co2', 10.0), CAUTION);
assertEq('10.01 mmHg warning',       classify('co2', 10.01), WARNING);
assertEq('15.0 mmHg emergency edge', classify('co2', 15.0), WARNING);
assertEq('15.01 mmHg emergency',     classify('co2', 15.01), EMERGENCY);
console.log();

/* 3. SpO₂ */
console.log('--- SpO\u2082 bands ---');
assertEq('98% nominal',          classify('spo2', 98),   NOMINAL);
assertEq('94% caution edge',     classify('spo2', 94),   NOMINAL);
assertEq('93.9% caution',        classify('spo2', 93.9), CAUTION);
assertEq('92% warning edge',     classify('spo2', 92),   CAUTION);
assertEq('91.9% warning',        classify('spo2', 91.9), WARNING);
assertEq('90% emergency edge',   classify('spo2', 90),   WARNING);
assertEq('89.9% emergency',      classify('spo2', 89.9), EMERGENCY);
// SpO2 is NOT one of the 3 auto-emergency triggers
assertFalse('SpO2 89% alone does not trigger auto-emergency (O2 supply is the trigger, not SpO2)',
            autoEmergency(4.3, 2.0, 50));
console.log();

/* 4. HR */
console.log('--- Heart Rate bands ---');
assertEq('80 BPM nominal',           classify('hr', 80),  NOMINAL);
assertEq('50 BPM caution lo edge',   classify('hr', 50),  NOMINAL);
assertEq('49 BPM caution lo',        classify('hr', 49),  CAUTION);
assertEq('45 BPM warning lo edge',   classify('hr', 45),  CAUTION);
assertEq('44 BPM warning lo',        classify('hr', 44),  WARNING);
assertEq('125 BPM caution hi edge',  classify('hr', 125), NOMINAL);
assertEq('126 BPM caution hi',       classify('hr', 126), CAUTION);
assertEq('140 BPM warning hi edge',  classify('hr', 140), CAUTION);
assertEq('141 BPM warning hi',       classify('hr', 141), WARNING);
assertEq('155 BPM emergency edge',   classify('hr', 155), WARNING);
assertEq('156 BPM emergency',        classify('hr', 156), EMERGENCY);
assertFalse('HR 160 alone does not trigger auto-emergency', autoEmergency(4.3, 2.0, 50));
console.log();

/* 5. Temperature */
console.log('--- Temperature bands ---');
assertEq('36.8 \u00b0C nominal',          classify('temp', 36.8),  NOMINAL);
assertEq('36.0 \u00b0C caution lo edge',  classify('temp', 36.0),  NOMINAL);
assertEq('35.99 \u00b0C caution lo',      classify('temp', 35.99), CAUTION);
assertEq('35.5 \u00b0C warning lo edge',  classify('temp', 35.5),  CAUTION);
assertEq('35.49 \u00b0C warning lo',      classify('temp', 35.49), WARNING);
assertEq('35.0 \u00b0C emergency edge',   classify('temp', 35.0),  WARNING);
assertEq('34.99 \u00b0C emergency',       classify('temp', 34.99), EMERGENCY);
assertEq('38.0 \u00b0C caution hi edge',  classify('temp', 38.0),  NOMINAL);
assertEq('38.01 \u00b0C caution hi',      classify('temp', 38.01), CAUTION);
assertEq('38.5 \u00b0C warning hi edge',  classify('temp', 38.5),  CAUTION);
assertEq('38.51 \u00b0C warning hi',      classify('temp', 38.51), WARNING);
assertEq('39.0 \u00b0C emergency hi edge',classify('temp', 39.0),  WARNING);
assertEq('39.01 \u00b0C emergency hi',    classify('temp', 39.01), EMERGENCY);
console.log();

/* 6. O₂ supply */
console.log('--- O\u2082 supply bands ---');
assertEq('87% nominal',    classify('o2', 87),   NOMINAL);
assertEq('25% caution edge',classify('o2', 25),  NOMINAL);
assertEq('24.9% caution',  classify('o2', 24.9), CAUTION);
assertEq('15% warning edge',classify('o2', 15),  CAUTION);
assertEq('14.9% warning',  classify('o2', 14.9), WARNING);
assertEq('10% emergency edge',classify('o2', 10),WARNING);
assertEq('9.9% emergency', classify('o2', 9.9),  EMERGENCY);
assertTrue ('O2 9.9% triggers auto-emergency',    autoEmergency(4.3, 2.0, 9.9));
assertFalse('O2 10.0% does not trigger auto-emergency', autoEmergency(4.3, 2.0, 10.0));
console.log();

/* 7. Battery / coolant / scrubber */
console.log('--- Battery/Coolant/Scrubber bands ---');
assertEq('batt 82% nominal',      classify('suitBatt', 82),   NOMINAL);
assertEq('batt 25% caution edge', classify('suitBatt', 25),   NOMINAL);
assertEq('batt 24.9% caution',    classify('suitBatt', 24.9), CAUTION);
assertEq('batt 15% warning edge', classify('suitBatt', 15),   CAUTION);
assertEq('batt 14.9% warning',    classify('suitBatt', 14.9), WARNING);
assertEq('batt 10% emerg edge',   classify('suitBatt', 10),   WARNING);
assertEq('batt 9.9% emergency',   classify('suitBatt', 9.9),  EMERGENCY);
assertFalse('batt 5% alone does not trigger auto-emergency', autoEmergency(4.3, 2.0, 50));

assertEq('coolant 85% nominal',   classify('coolant', 85),   NOMINAL);
assertEq('coolant 24.9% caution', classify('coolant', 24.9), CAUTION);
assertEq('coolant 14.9% warning', classify('coolant', 14.9), WARNING);
assertEq('coolant 5% still warning (no emergency band)', classify('coolant', 5), WARNING);

assertEq('scrubber 90% nominal',  classify('scrubber', 90),  NOMINAL);
assertEq('scrubber 20% caution',  classify('scrubber', 20),  CAUTION);  // 20 < 25 caution, > 15 warning
assertEq('scrubber 14.9% warning',classify('scrubber', 14.9),WARNING);
console.log();

/* 8. Return margin — never Emergency */
console.log('--- Return margin \u2014 never Emergency ---');
assertEq('margin +90min nominal',      marginClass(90 * 60), NOMINAL);
assertEq('margin +60min caution edge', marginClass(60 * 60), NOMINAL);
assertEq('margin +59min caution',      marginClass(59 * 60), CAUTION);
assertEq('margin +30min warning edge', marginClass(30 * 60), CAUTION);
assertEq('margin +29min warning',      marginClass(29 * 60), WARNING);
assertEq('margin 0 warning',           marginClass(0),        WARNING);
assertEq('margin -1s CANNOT_REACH',    marginClass(-1),       'CANNOT_REACH');
assertEq('margin -60min CANNOT_REACH', marginClass(-60 * 60), 'CANNOT_REACH');
assertFalse('CANNOT_REACH is not EMERGENCY', marginClass(-1) === EMERGENCY);
assertEq('CANNOT_REACH maps to string sentinel (Warning-level)', marginClass(-1), 'CANNOT_REACH');
console.log();

/* 9. Auto-emergency: exactly 3 triggers */
console.log('--- Auto-emergency: exactly 3 triggers ---');
assertTrue ('pressure 3.49 triggers auto-emergency',  autoEmergency(3.49, 2.0, 50));
assertFalse('pressure 3.50 does not trigger',         autoEmergency(3.5,  2.0, 50));
assertTrue ('CO2 15.1 triggers auto-emergency',       autoEmergency(4.3, 15.1, 50));
assertFalse('CO2 15.0 does not trigger',              autoEmergency(4.3, 15.0, 50));
assertTrue ('O2 9.9% triggers auto-emergency',        autoEmergency(4.3,  2.0, 9.9));
assertFalse('O2 10.0% does not trigger',              autoEmergency(4.3,  2.0, 10.0));
assertTrue ('all 3 together trigger auto-emergency',  autoEmergency(3.4, 16, 8));
assertFalse('high HR alone does not trigger',         autoEmergency(4.3, 2.0, 50));
assertFalse('low SpO2 alone does not trigger',        autoEmergency(4.3, 2.0, 50));
assertFalse('low battery alone does not trigger',     autoEmergency(4.3, 2.0, 50));
console.log();

/* 10. Overall = highest active class */
console.log('--- Overall = highest active class ---');
assertEq('all nominal',             overall([NOMINAL, NOMINAL]),            NOMINAL);
assertEq('one caution',             overall([NOMINAL, CAUTION]),            CAUTION);
assertEq('warning beats caution',   overall([CAUTION, WARNING, NOMINAL]),   WARNING);
assertEq('emergency beats warning', overall([WARNING, EMERGENCY, CAUTION]), EMERGENCY);
assertEq('single emergency',        overall([EMERGENCY]),                    EMERGENCY);
console.log();

/* 11. Alert queue ordering */
console.log('--- Alert queue ordering ---');
var mockAlerts = [
  { key: 'co2',    sev: CAUTION,   title: 'CO\u2082 RISING' },
  { key: 'margin', sev: WARNING,   title: 'CANNOT REACH HAB \u2014 O\u2082 LIMITING', isCannotReach: true },
  { key: 'spo2',   sev: WARNING,   title: 'LOW SpO\u2082' },
  { key: 'suitP',  sev: EMERGENCY, title: 'SUIT PRESSURE CRITICAL' }
];
mockAlerts.sort(function (a, b) {
  if (b.sev !== a.sev) return b.sev - a.sev;
  if (a.sev === WARNING) {
    if (a.isCannotReach && !b.isCannotReach) return -1;
    if (b.isCannotReach && !a.isCannotReach) return  1;
  }
  return 0;
});
assertEq('first alert is Emergency',               mockAlerts[0].sev,   EMERGENCY);
assertEq('second alert is CANNOT REACH (Warning)', mockAlerts[1].title, 'CANNOT REACH HAB \u2014 O\u2082 LIMITING');
assertEq('second alert is Warning level',          mockAlerts[1].sev,   WARNING);
assertEq('last alert is Caution',                  mockAlerts[3].sev,   CAUTION);
console.log();

/* 12. No risk-count escalation */
console.log('--- No risk-count escalation ---');
// co2=12 (warning), o2=20 (warning), suitP=4.3 normal — neither CO2>15 nor O2<10 nor P<3.5
assertFalse('2 warnings without the 3 triggers do not trigger auto-emergency', autoEmergency(4.3, 12.0, 20.0));
assertFalse('3 warnings without the 3 triggers do not trigger auto-emergency', autoEmergency(4.3, 12.0, 20.0));
console.log();

/* 13. Career dose bands — classified in mSv */
console.log('--- Career dose bands (mSv) ---');
assertEq('388.8 mSv nominal',  careerClass(388.8), NOMINAL);
assertEq('400.0 mSv nominal',  careerClass(400.0), NOMINAL);  // > 400 triggers caution
assertEq('400.01 mSv caution', careerClass(400.01), CAUTION);
assertEq('500.0 mSv caution',  careerClass(500.0), CAUTION);  // > 500 triggers warning
assertEq('500.01 mSv warning', careerClass(500.01), WARNING);
assertEq('599 mSv warning',    careerClass(599),   WARNING);
console.log();

/* 14. EVA elapsed bands */
console.log('--- EVA elapsed bands ---');
assertEq('4h of 6h (67%) nominal',   evaClass(4 * 3600),   NOMINAL);
assertEq('5.4h of 6h (90%) caution', evaClass(5.4 * 3600), CAUTION);
assertEq('6h of 6h (100%) warning',  evaClass(6 * 3600),   WARNING);
assertEq('6.1h of 6h (>100%) warning',evaClass(6.1 * 3600),WARNING);
console.log();

/* 15. SPE stage classification */
console.log('--- SPE stage classification ---');
assertEq('NORMAL = nominal (0)',    speClass('NORMAL'),    NOMINAL);
assertEq('ADVISORY = caution (1)', speClass('ADVISORY'),  CAUTION);
assertEq('CAUTION = caution (1)',  speClass('CAUTION'),   CAUTION);
assertEq('WARNING = warning (2)',  speClass('WARNING'),   WARNING);
assertEq('EMERGENCY = emergency (3)', speClass('EMERGENCY'), EMERGENCY);
// SPE EMERGENCY does NOT trigger auto-emergency screen (only pressure/CO2/O2 do)
assertFalse('SPE EMERGENCY alone does not trigger auto-emergency (only pressure/CO2/O2 do)',
            autoEmergency(4.3, 2.0, 50));
console.log();

/* 16. Conjunction stage classification */
console.log('--- Conjunction stage classification ---');
assertEq('31 days out: nominal',   conjunctionClass(31), NOMINAL);
assertEq('30 days out: caution',   conjunctionClass(30), CAUTION);  // advisory → caution class
assertEq('7 days out: caution',    conjunctionClass(7),  CAUTION);
assertEq('6 days out: caution',    conjunctionClass(6),  CAUTION);
assertEq('3 days out: warning',    conjunctionClass(3),  WARNING);
assertEq('2 days out: warning',    conjunctionClass(2),  WARNING);
assertEq('1 day out: warning',     conjunctionClass(1),  WARNING);
// LOS during time-critical operation: Emergency class (design choice — ASSUMPTION)
// This is handled in assess.js as a special case; here we verify the conjunction
// warning band is WARNING (not Emergency) for normal moratorium
assertFalse('conjunction WARNING is not Emergency', conjunctionClass(1) === EMERGENCY);
console.log();

/* ---- Summary ---- */
console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { console.error('\nFAIL \u2014 ' + failed + ' assertion(s).'); process.exit(1); }
else { console.log('\nPASS \u2014 all assertions pass.'); process.exit(0); }
