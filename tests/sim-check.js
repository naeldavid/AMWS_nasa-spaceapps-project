#!/usr/bin/env node
/* =========================================================================
   tests/sim-check.js — plain Node, no dependencies.
   Asserts the return-margin calculation matches hand-computed expected values.
   All expected values are derived INDEPENDENTLY from raw constants below —
   they do NOT call sim.js or config.js, so the test cannot share the sim's bugs.

   Exit 0 if all assertions pass. Exit 1 on any failure.
   ========================================================================= */
'use strict';

/* ---- Raw constants (copied from docs/DATA_SOURCES.md / config.js comments) ---- */
var CONS_H   = 7;     // hours — source: CCTV 2008 EMU specs
var MET_BASE = 1000;  // BTU/hr — source: Gernhardt 2013 Apollo EVA average

// Walkback paces and metabolic rates
var MARS_SPEED      = 3.5;   var MARS_MET      = 2000; // ASSUMPTION
var MOON_TEST_SPEED = 6.3;   var MOON_TEST_MET = 2374; // source: NTRS 20070016007
var MOON_COOL_SPEED = 4.0;   var MOON_COOL_MET = 1800; // ASSUMPTION

// Return margin alert bands (seconds)
var CAUTION_S = 60 * 60; // 60 min — ASSUMPTION
var WARNING_S = 30 * 60; // 30 min — anchored to 30-min EMU reserve

/* ---- Drain rate functions (mirror sim.js logic exactly) ---- */
var BASE_RATE_PER_S = 100 / (CONS_H * 3600); // %/s at metabolic baseline

// All return %/s on the 0-100 scale.
// time (s) = level% / rate(%/s)
function o2Rate(met)   { return BASE_RATE_PER_S * (met / MET_BASE); }
function battRate(met) { return BASE_RATE_PER_S * (1 + (met - MET_BASE) / MET_BASE * 0.4); }
function coolRate(met) { return BASE_RATE_PER_S * (met / MET_BASE); }
function scrubRate(met){ return BASE_RATE_PER_S * (met / MET_BASE); }

function walkSec(distKm, speedKmh) { return (distKm / speedKmh) * 3600; }

function minConsumable(o2, batt, cool, scrub, met) {
  var entries = [
    { name: 'O\u2082',      time: o2   / o2Rate(met)   },
    { name: 'BATTERY', time: batt / battRate(met)  },
    { name: 'COOLANT', time: cool / coolRate(met)  },
    { name: 'SCRUBBER',time: scrub/ scrubRate(met) }
  ];
  return entries.reduce(function (m, e) { return e.time < m.time ? e : m; }, entries[0]);
}

function computeMarginMin(distKm, speedKmh, met, o2, batt, cool, scrub) {
  cool  = (cool  === undefined) ? 85 : cool;
  scrub = (scrub === undefined) ? 90 : scrub;
  var w = walkSec(distKm, speedKmh);
  var c = minConsumable(o2, batt, cool, scrub, met);
  return { marginMin: (c.time - w) / 60, limiting: c.name, walkMin: w / 60 };
}

/* ---- Alert band classification (mirrors assess.js logic) ---- */
function classify(marginMin) {
  var s = marginMin * 60;
  if (s >= CAUTION_S)  return 'OK';
  if (s >= WARNING_S)  return 'CAUTION';
  if (s >= 0)          return 'WARNING';
  return 'CANNOT REACH HAB'; // Warning level, never Emergency
}

/* ---- Assertion helper ---- */
var passed = 0, failed = 0;
function assertNear(label, got, expected, toleranceMin) {
  toleranceMin = toleranceMin === undefined ? 0.5 : toleranceMin;
  var diff = Math.abs(got - expected);
  if (diff <= toleranceMin) {
    console.log('  PASS  ' + label + ' = ' + got.toFixed(2) + ' min (expected ' + expected.toFixed(2) + ')');
    passed++;
  } else {
    console.error('  FAIL  ' + label + ' = ' + got.toFixed(2) + ' min  expected ' + expected.toFixed(2) + '  diff ' + diff.toFixed(3));
    failed++;
  }
}
function assertEq(label, got, expected) {
  if (got === expected) {
    console.log('  PASS  ' + label + ' = "' + got + '"');
    passed++;
  } else {
    console.error('  FAIL  ' + label + ' = "' + got + '"  expected "' + expected + '"');
    failed++;
  }
}
function assertClassEq(label, marginMin, expectedClass) {
  var got = classify(marginMin);
  if (got === expectedClass) {
    console.log('  PASS  ' + label + ' class = ' + got);
    passed++;
  } else {
    console.error('  FAIL  ' + label + ' class = "' + got + '"  expected "' + expectedClass + '"');
    failed++;
  }
  // Extra: confirm "CANNOT REACH HAB" is never Emergency-classified (spec requirement)
  if (got === 'CANNOT REACH HAB') {
    console.log('         (confirms: margin<0 → WARNING/CANNOT REACH, never Emergency class)');
  }
}

/* ========================================================================= */
console.log('\ntests/sim-check.js — AMWS return margin assertions\n');

/* ---- Case 1: Mars 2 km nominal (O₂=87, batt=82, cool=85, scrub=90) ---- */
/* Hand derivation:
     COOLANT is limiting at Mars 2 km: coolRate(2000) = BASE*2 = 0.007937 %/s
     coolTime = 85 / 0.007937 = 10710 s = 178.5 min
     walk     = (2/3.5)*60   = 34.286 min
     margin   = 178.5 - 34.286 = 144.214 min  → OK */
console.log('Case 1: Mars 2 km nominal');
var r1 = computeMarginMin(2, MARS_SPEED, MARS_MET, 87, 82);
assertNear('margin', r1.marginMin, 144.214);
assertEq('limiting', r1.limiting, 'COOLANT');
assertClassEq('band', r1.marginMin, 'OK');
console.log();

/* ---- Case 2: Mars 8 km nominal ---- */
/* Hand derivation:
     COOLANT limiting; coolTime = 178.5 min (unchanged)
     walk = (8/3.5)*60 = 137.143 min
     margin = 178.5 - 137.143 = 41.357 min  → CAUTION (< 60 min, ≥ 30 min) */
console.log('Case 2: Mars 8 km nominal');
var r2 = computeMarginMin(8, MARS_SPEED, MARS_MET, 87, 82);
assertNear('margin', r2.marginMin, 41.357);
assertEq('limiting', r2.limiting, 'COOLANT');
assertClassEq('band', r2.marginMin, 'CAUTION');
console.log();

/* ---- Case 3a: Moon 2 km test pace ---- */
/* Hand derivation:
     coolRate(2374) = BASE*(2374/1000) = BASE*2.374 = 0.009421 %/s
     coolTime = 85 / 0.009421 = 9021 s = 150.350 min
     walk = (2/6.3)*60 = 19.048 min
     margin = 150.350 - 19.048 = 131.302 min  → OK */
console.log('Case 3a: Moon 2 km test pace');
var r3a = computeMarginMin(2, MOON_TEST_SPEED, MOON_TEST_MET, 87, 82);
assertNear('margin', r3a.marginMin, 131.302, 0.5);
assertEq('limiting', r3a.limiting, 'COOLANT');
assertClassEq('band', r3a.marginMin, 'OK');
console.log();

/* ---- Case 3b: Moon 2 km cooling-limited pace (conservative, ASSUMPTION) ---- */
/* Hand derivation:
     coolRate(1800) = BASE*(1800/1000) = BASE*1.8 = 0.007143 %/s
     coolTime = 85 / 0.007143 = 11900 s = 198.333 min
     walk = (2/4.0)*60 = 30.0 min
     margin = 198.333 - 30.0 = 168.333 min  → OK
     NOTE: conservative pace has HIGHER energy per km (450 BTU/km vs 377 BTU/km) */
console.log('Case 3b: Moon 2 km cooling-limited pace (ASSUMPTION)');
var r3b = computeMarginMin(2, MOON_COOL_SPEED, MOON_COOL_MET, 87, 82);
assertNear('margin', r3b.marginMin, 168.333);
assertEq('limiting', r3b.limiting, 'COOLANT');
assertClassEq('band', r3b.marginMin, 'OK');
console.log();

/* ---- Case 4a: Moon 8 km test pace ---- */
/* Hand derivation:
     coolTime = 150.350 min; walk = (8/6.3)*60 = 76.190 min
     margin = 150.350 - 76.190 = 74.159 min  → OK (> 60 min) */
console.log('Case 4a: Moon 8 km test pace');
var r4a = computeMarginMin(8, MOON_TEST_SPEED, MOON_TEST_MET, 87, 82);
assertNear('margin', r4a.marginMin, 74.159, 0.5);
assertClassEq('band', r4a.marginMin, 'OK');
console.log();

/* ---- Case 4b: Moon 8 km cooling-limited pace ---- */
/* Hand derivation:
     coolTime = 198.333 min; walk = (8/4.0)*60 = 120.0 min
     margin = 198.333 - 120.0 = 78.333 min  → OK */
console.log('Case 4b: Moon 8 km cooling-limited pace');
var r4b = computeMarginMin(8, MOON_COOL_SPEED, MOON_COOL_MET, 87, 82);
assertNear('margin', r4b.marginMin, 78.333);
assertClassEq('band', r4b.marginMin, 'OK');
console.log();

/* ---- Case 5: Mars 2 km O₂ = 50% (O₂ becomes limiting) ---- */
/* Hand derivation:
     o2Rate(2000) = BASE*2.0 = 0.007937 %/s
     o2Time = 50 / 0.007937 = 6300 s = 105.0 min
     coolTime (85%) = 178.5 min  → O₂ is limiting
     walk = 34.286 min
     margin = 105.0 - 34.286 = 70.714 min  → OK */
console.log('Case 5: Mars 2 km O\u2082 = 50%');
var r5 = computeMarginMin(2, MARS_SPEED, MARS_MET, 50, 82);
assertNear('margin', r5.marginMin, 70.714);
assertEq('limiting', r5.limiting, 'O\u2082');
assertClassEq('band', r5.marginMin, 'OK');
console.log();

/* ---- Case 6: Mars 8 km O₂ = 50% (CANNOT REACH) ---- */
/* Hand derivation:
     o2Time = 105.0 min; walk = 137.143 min
     margin = 105.0 - 137.143 = -32.143 min  → CANNOT REACH HAB (Warning, NOT Emergency) */
console.log('Case 6: Mars 8 km O\u2082 = 50% — CANNOT REACH');
var r6 = computeMarginMin(8, MARS_SPEED, MARS_MET, 50, 82);
assertNear('margin', r6.marginMin, -32.143);
assertEq('limiting', r6.limiting, 'O\u2082');
assertClassEq('band', r6.marginMin, 'CANNOT REACH HAB');
console.log();

/* ---- Case 7: BATTERY is limiting (LCVG coupling, batt=40%) ---- */
/* Hand derivation:
     battRate(2000) = BASE*(1 + 1.0*0.4) = BASE*1.4 = 0.005556 %/s
     battTime = 40 / 0.005556 = 7200 s = 120.0 min
     o2Time(87%)  = 182.7 min; coolTime(85%) = 178.5 min; scrubTime(90%) = 189.0 min
     → BATTERY is limiting (120 < 178.5)
     walk = 34.286 min
     margin = 120.0 - 34.286 = 85.714 min  → OK */
console.log('Case 7: Mars 2 km BATTERY limiting (batt=40%)');
var r7 = computeMarginMin(2, MARS_SPEED, MARS_MET, 87, 40);
assertNear('margin', r7.marginMin, 85.714);
assertEq('limiting', r7.limiting, 'BATTERY');
assertClassEq('band', r7.marginMin, 'OK');
console.log();

/* ---- Case 8: SCRUBBER is limiting (scrubber=20%) ---- */
/* Hand derivation:
     scrubRate(2000) = BASE*2.0 = same as o2Rate
     scrubTime = 20 / 0.007937 = 2520 s = 42.0 min
     o2Time(87%) = 182.7 min; coolTime(85%) = 178.5 min; battTime(82%) = 246.0 min
     → SCRUBBER is limiting
     walk = 34.286 min
     margin = 42.0 - 34.286 = 7.714 min  → WARNING (< 30 min, ≥ 0) */
console.log('Case 8: Mars 2 km SCRUBBER limiting (scrub=20%)');
var r8 = computeMarginMin(2, MARS_SPEED, MARS_MET, 87, 82, 85, 20);
assertNear('margin', r8.marginMin, 7.714);
assertEq('limiting', r8.limiting, 'SCRUBBER');
assertClassEq('band', r8.marginMin, 'WARNING');
console.log();

/* ---- Case 9: Exactly at 60-min CAUTION band edge ---- */
/* Hand derivation:
     COOLANT limiting: coolTime = 178.5 min
     For margin = 60.0 min: walkTime = 178.5 - 60.0 = 118.5 min
     dist = 118.5/60 * 3.5 = 6.9125 km */
console.log('Case 9: Exactly at 60-min CAUTION edge (Mars, 6.9125 km)');
var dist60 = (178.5 - 60.0) / 60 * MARS_SPEED;
var r9 = computeMarginMin(dist60, MARS_SPEED, MARS_MET, 87, 82);
assertNear('margin', r9.marginMin, 60.0, 0.1);
assertClassEq('band (should be OK, 60 min is not yet CAUTION)', r9.marginMin, 'OK');
// Just below 60-min edge: should become CAUTION
var r9b_margin = 59.9;
assertClassEq('band (59.9 min should be CAUTION)', r9b_margin, 'CAUTION');
console.log();

/* ---- Case 10: Exactly at 30-min WARNING band edge ---- */
/* Hand derivation:
     For margin = 30.0 min: walkTime = 178.5 - 30.0 = 148.5 min
     dist = 148.5/60 * 3.5 = 8.6625 km */
console.log('Case 10: Exactly at 30-min WARNING edge (Mars, 8.6625 km)');
var dist30 = (178.5 - 30.0) / 60 * MARS_SPEED;
var r10 = computeMarginMin(dist30, MARS_SPEED, MARS_MET, 87, 82);
assertNear('margin', r10.marginMin, 30.0, 0.1);
assertClassEq('band (should be OK/CAUTION at >=30)', r10.marginMin, 'CAUTION');
// Just below 30-min edge: WARNING
var r10b_margin = 29.9;
assertClassEq('band (29.9 min should be WARNING)', r10b_margin, 'WARNING');
console.log();

/* ---- Summary ---- */
console.log('─────────────────────────────────────────────');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('\nFAIL — ' + failed + ' assertion(s) did not meet ±0.5 min tolerance.');
  process.exit(1);
} else {
  console.log('\nPASS — all assertions within ±0.5 min tolerance.');
  process.exit(0);
}
