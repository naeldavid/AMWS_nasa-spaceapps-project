#!/usr/bin/env node
/* =========================================================================
   tests/sim-check.js — plain Node, no dependencies.
   Exercises the return-margin calculation from sim.js / config.js for
   the cases specified in the Phase 4 brief.

   Columns: scenario | limiting resource | test-pace margin | cool-pace margin
            | walkback time (test) | walkback time (cool) | hand-check note

   Cases:
     1. Mars, 2 km from hab, nominal O2/batt (87%/82%), metabolic 1000 BTU/hr
     2. Mars, 8 km from hab, nominal consumables
     3. Moon, 2 km from hab, nominal consumables
     4. Moon, 8 km from hab, nominal consumables
     5. Mars, 2 km, O2 at 50%, nominal batt
     6. Mars, 8 km, O2 at 50%, nominal batt
   ========================================================================= */
'use strict';

/* ---- Minimal in-process re-implementation of the config and sim logic ---- */
/* Load config constants inline (copied from config.js; no browser globals needed) */
var C = {};

// source: Gernhardt 2013
C.METABOLIC_BASE = 1000;    // BTU/hr
C.METABOLIC_PEAK = 2200;    // BTU/hr

// source: CCTV 2008 EMU specs
C.CONSUMABLES_DURATION_NOMINAL = 7;   // hours
C.EMERGENCY_RESERVE_H = 0.5;          // hours

// ASSUMPTION: % thresholds
C.O2_CAUTION_PCT = 25; C.O2_WARNING_PCT = 15; C.O2_EMERGENCY_PCT = 10;
C.BATT_CAUTION_PCT = 25; C.BATT_WARNING_PCT = 15; C.BATT_EMERGENCY_PCT = 10;
C.COOL_CAUTION_PCT = 25; C.COOL_WARNING_PCT = 15;
C.SCRUB_CAUTION_PCT = 25; C.SCRUB_WARNING_PCT = 15;

// source: NTRS 20070016007
C.WALKBACK_LUNAR_TEST_SPEED      = 6.3;   // km/h
C.WALKBACK_LUNAR_TEST_METABOLIC  = 2374;  // BTU/hr
// ASSUMPTION
C.WALKBACK_LUNAR_COOL_SPEED     = 4.0;   // km/h
C.WALKBACK_LUNAR_COOL_METABOLIC = 1800;  // BTU/hr
// ASSUMPTION: Mars
C.WALKBACK_MARS_SPEED     = 3.5;   // km/h
C.WALKBACK_MARS_METABOLIC = 2000;  // BTU/hr
// ASSUMPTION: Earth
C.WALKBACK_EARTH_SPEED     = 5.0;
C.WALKBACK_EARTH_METABOLIC = 1500;

C.MARGIN_CAUTION_S = 60 * 60; // 60 min
C.MARGIN_WARNING_S = 30 * 60; // 30 min

/* ---- Drain rate helpers (mirrors sim.js logic) ---- */
var BASE_RATE_PER_S = 100 / (C.CONSUMABLES_DURATION_NOMINAL * 3600); // %/s at baseline

function o2Rate(met)      { return BASE_RATE_PER_S * (met / C.METABOLIC_BASE); }
function battRate(met)    { return BASE_RATE_PER_S * (1 + (met - C.METABOLIC_BASE) / C.METABOLIC_BASE * 0.4); }
function coolRate(met)    { return BASE_RATE_PER_S * (met / C.METABOLIC_BASE); }
function scrubRate(met)   { return BASE_RATE_PER_S * (met / C.METABOLIC_BASE); }

/* ---- Return margin for one scenario ---- */
function computeMargin(scenario) {
  var distKm = scenario.distKm;
  var o2 = scenario.o2;
  var batt = scenario.suitBatt;
  var cool = scenario.coolant || 85;
  var scrub = scenario.scrubber || 90;
  var loc = scenario.location;

  var testSpeed = (loc === 'MOON') ? C.WALKBACK_LUNAR_TEST_SPEED : C.WALKBACK_MARS_SPEED;
  var coolSpeed = (loc === 'MOON') ? C.WALKBACK_LUNAR_COOL_SPEED : C.WALKBACK_MARS_SPEED;
  var testMet   = (loc === 'MOON') ? C.WALKBACK_LUNAR_TEST_METABOLIC : C.WALKBACK_MARS_METABOLIC;
  var coolMet   = (loc === 'MOON') ? C.WALKBACK_LUNAR_COOL_METABOLIC : C.WALKBACK_MARS_METABOLIC;

  function consumableTime(met) {
    var o2T    = o2   / o2Rate(met);
    var battT  = batt / battRate(met);
    var coolT  = cool / coolRate(met);
    var scrubT = scrub / scrubRate(met);
    var times  = { 'O₂': o2T, 'BATTERY': battT, 'COOLANT': coolT, 'SCRUBBER': scrubT };
    var minT   = Infinity, limiting = 'O₂';
    Object.keys(times).forEach(function (k) { if (times[k] < minT) { minT = times[k]; limiting = k; } });
    return { time: minT, limiting: limiting };
  }

  var testWalkS = (distKm / testSpeed) * 3600;
  var coolWalkS = (distKm / coolSpeed) * 3600;
  var tc = consumableTime(testMet);
  var cc = consumableTime(coolMet);

  return {
    testMarginMin: (tc.time - testWalkS) / 60,
    coolMarginMin: (cc.time - coolWalkS) / 60,
    testWalkMin:   testWalkS / 60,
    coolWalkMin:   coolWalkS / 60,
    limiting: tc.limiting
  };
}

/* ---- Test cases ---- */
var CASES = [
  { label: 'Mars 2 km nominal',   location: 'MARS', distKm: 2, o2: 87, suitBatt: 82 },
  { label: 'Mars 8 km nominal',   location: 'MARS', distKm: 8, o2: 87, suitBatt: 82 },
  { label: 'Moon 2 km nominal',   location: 'MOON', distKm: 2, o2: 87, suitBatt: 82 },
  { label: 'Moon 8 km nominal',   location: 'MOON', distKm: 8, o2: 87, suitBatt: 82 },
  { label: 'Mars 2 km O₂ 50%',   location: 'MARS', distKm: 2, o2: 50, suitBatt: 82 },
  { label: 'Mars 8 km O₂ 50%',   location: 'MARS', distKm: 8, o2: 50, suitBatt: 82 }
];

/* ---- Hand-check derivation notes ---- */
var NOTES = [
  'Walk=34.3min@3.5km/h; O₂ avail=87%/(100%/25200s*2000/1000)=87/0.00794%/s=10955s=182.6min',
  'Walk=137.1min@3.5km/h; same O₂; expect margin≈45min',
  'Walk=19.0min@6.3km/h; same O₂ but met=2374: O₂drain=2374/1000*base; avail≈7275s=121.3min',
  'Walk=76.2min@6.3km/h; expect margin≈45min',
  'Walk=34.3min; O₂ avail=50%: 50/(0.00794)=6295s=104.9min; margin≈70.6min',
  'Walk=137.1min; O₂ avail 50%: 104.9min; margin CANNOT REACH (-32min)'
];

/* ---- Formatting ---- */
function fmMin(m) {
  if (!isFinite(m)) return '—';
  var sign = m < 0 ? '−' : '+';
  return sign + Math.abs(m).toFixed(1) + 'min';
}
function status(m) {
  if (m < 0)             return 'CANNOT REACH';
  if (m < 30)            return 'WARNING';
  if (m < 60)            return 'CAUTION';
  return 'OK';
}

/* ---- Print table ---- */
var W = [22, 11, 14, 14, 11, 11];
function pad(s, w) { s = String(s); return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length); }
function row(cols) { return cols.map(function (c, i) { return pad(c, W[i]); }).join(' | '); }

console.log('\ntests/sim-check.js — AMWS return margin table\n');
console.log(row(['SCENARIO', 'LIMITING', 'TEST-PACE', 'COOL-PACE', 'WALK(TEST)', 'WALK(COOL)']));
console.log(row(W.map(function (w) { return '-'.repeat(w); })));

CASES.forEach(function (sc, i) {
  var r = computeMargin(sc);
  console.log(row([
    sc.label,
    r.limiting,
    fmMin(r.testMarginMin) + ' (' + status(r.testMarginMin) + ')',
    fmMin(r.coolMarginMin) + ' (' + status(r.coolMarginMin) + ')',
    r.testWalkMin.toFixed(1) + 'min',
    r.coolWalkMin.toFixed(1) + 'min'
  ]));
  if (NOTES[i]) console.log('  hand-check: ' + NOTES[i]);
  console.log();
});

console.log('Walkback metabolic rates used:');
console.log('  Mars  test/cool: ' + C.WALKBACK_MARS_METABOLIC + '/' + C.WALKBACK_MARS_METABOLIC + ' BTU/hr @ ' + C.WALKBACK_MARS_SPEED + '/' + C.WALKBACK_MARS_SPEED + ' km/h (ASSUMPTION — same pace)');
console.log('  Moon  test:      ' + C.WALKBACK_LUNAR_TEST_METABOLIC + ' BTU/hr @ ' + C.WALKBACK_LUNAR_TEST_SPEED + ' km/h (source: NTRS 20070016007)');
console.log('  Moon  cool:      ' + C.WALKBACK_LUNAR_COOL_METABOLIC + ' BTU/hr @ ' + C.WALKBACK_LUNAR_COOL_SPEED + ' km/h (ASSUMPTION)');
console.log('\nO₂ drain rate at Mars walkback metabolic (' + C.WALKBACK_MARS_METABOLIC + ' BTU/hr):');
var testO2Rate = o2Rate(C.WALKBACK_MARS_METABOLIC);
console.log('  ' + testO2Rate.toFixed(5) + ' %/s = ' + (testO2Rate * 3600).toFixed(2) + ' %/hr');
console.log('  At 87% O₂: ' + (87 / testO2Rate / 60).toFixed(1) + ' min');
console.log('\nBattery drain rate at Mars walkback metabolic:');
var testBattRate = battRate(C.WALKBACK_MARS_METABOLIC);
console.log('  ' + testBattRate.toFixed(5) + ' %/s = ' + (testBattRate * 3600).toFixed(2) + ' %/hr');
console.log('  At 82% batt: ' + (82 / testBattRate / 60).toFixed(1) + ' min');
