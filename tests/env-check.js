#!/usr/bin/env node
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

function makeSeededRandom(seed) {
  var s = seed >>> 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const ctx = { window: {}, document: { body: { classList:{add(){},remove(){},toggle(){}}, dataset:{} }, querySelectorAll:()=>[] }, console };
ctx.window = ctx;
const patchedMath = Object.create(Math);
patchedMath.random = makeSeededRandom(0x12345678);
ctx.Math = patchedMath;
vm.createContext(ctx);
function loadFile(rel){ vm.runInContext(fs.readFileSync(path.join(__dirname,'..',rel),'utf8'), ctx); }
ctx.window.AMWS = {};
loadFile('js/config.js');
loadFile('js/sim.js');
loadFile('js/assess.js');
loadFile('js/snapshot.js');
const A = ctx.window.AMWS;
const S = A.state;

let passed=0, failed=0;
function ok(cond, msg){ if(cond){console.log('  PASS  '+msg); passed++;} else {console.error('  FAIL  '+msg); failed++;} }
function near(a,b,eps,msg){ eps = eps==null?1e-6:eps; ok(Math.abs(a-b)<=eps, msg + ' (got '+a+', expected '+b+')'); }

console.log('\ntests/env-check.js — environment profiles\n');

/* Light time */
console.log('--- Light time ---');
near(149597870.7 / A.C_KMS, 499.004783836, 1e-6, '1 AU light time ~499.004784 s');
near(384400 / A.C_KMS, 1.2822204, 1e-4, '384400 km light time ~1.28222 s');

/* Thermal factors */
console.log('\n--- Thermal coupling ---');
var t1 = A.thermalFactors(20, true);
ok(t1.coolantFactor===1 && t1.batteryFactor===1, 'inside comfort band -> factors 1.0/1.0');
var t2 = A.thermalFactors(70, true);
near(t2.coolantFactor, 1.2, 1e-12, '70C -> coolantFactor 1.2');
near(t2.batteryFactor, 1.0, 1e-12, '70C -> batteryFactor 1.0');
var t3 = A.thermalFactors(-30, true);
near(t3.batteryFactor, 1.12, 1e-12, '-30C -> batteryFactor 1.12');
near(t3.coolantFactor, 1.0, 1e-12, '-30C -> coolantFactor 1.0');
var t4 = A.thermalFactors(1000, true);
ok(t4.coolantFactor===A.THERMAL_FACTOR_MAX && t4.batteryFactor===1, 'hot extreme capped at 2.0');
var t5 = A.thermalFactors(-1000, true);
ok(t5.batteryFactor===A.THERMAL_FACTOR_MAX && t5.coolantFactor===1, 'cold extreme capped at 2.0');
var t6 = A.thermalFactors(70, false);
ok(t6.coolantFactor===1 && t6.batteryFactor===1 && t6.coupled===false, 'presets unaffected even if outside band (coupled false)');

/* Equivalence: CUSTOM == MARS preset */
console.log('\n--- Equivalence: CUSTOM == MARS preset ---');
A.sim.reset(); A.sim.setLocation('MARS'); S.phase='SURFACE';
S.nav.x = -1414.213562; S.nav.y = 1414.213562; // ~2 km
S.o2=87; S.suitBatt=82; S.coolant=85; S.scrubber=90;
var marsRM = A.returnMargin();
var marsDelay = A.sim.oneWayDelay();
var marsDose = A.sim.doseRate();
A.sim.setEnvironment('CUSTOM');
S.customEnv = A.defaultCustomEnv();
// ensure Mars values
var sc = A.LOCATIONS.MARS.phases.SURFACE;
S.customEnv.gravityMS2 = sc.gravityMS2;
S.customEnv.distanceKm = sc.dist;
S.customEnv.ambientTempC = sc.ambientTempC;
S.customEnv.doseRateMSvDay = sc.dose;
S.customEnv.paceKmh = sc.paceKmh;
S.customEnv.walkMetabolicBtuHr = sc.walkMetabolicBtuHr;
S.nav.x = -1414.213562; S.nav.y = 1414.213562;
S.o2=87; S.suitBatt=82; S.coolant=85; S.scrubber=90;
var cusRM = A.returnMargin();
var cusDelay = A.sim.oneWayDelay();
var cusDose = A.sim.doseRate();
near(cusRM.test, marsRM.test, 1e-9, 'CUSTOM(Mars) test margin == Mars preset');
near(cusRM.cool, marsRM.cool, 1e-9, 'CUSTOM(Mars) cool margin == Mars preset');
ok(cusRM.limiting === marsRM.limiting, 'CUSTOM(Mars) limiting == Mars preset');
near(cusDelay, marsDelay, 1e-9, 'CUSTOM(Mars) one-way delay == Mars preset');
near(cusDose, marsDose, 1e-9, 'CUSTOM(Mars) dose rate == Mars preset');

/* Margin sensitivity */
console.log('\n--- Margin sensitivity ---');
function setMarsCustom(tempC){
  A.sim.setEnvironment('CUSTOM'); S.phase='SURFACE';
  var sc=A.LOCATIONS.MARS.phases.SURFACE;
  S.customEnv.gravityMS2=sc.gravityMS2; S.customEnv.distanceKm=sc.dist; S.customEnv.doseRateMSvDay=sc.dose;
  S.customEnv.paceKmh=sc.paceKmh; S.customEnv.walkMetabolicBtuHr=sc.walkMetabolicBtuHr; S.customEnv.ambientTempC=tempC;
  S.nav.x=-1414.213562; S.nav.y=1414.213562; S.o2=87; S.suitBatt=82; S.coolant=85; S.scrubber=90;
}
setMarsCustom(20);
var m20 = A.returnMargin();
setMarsCustom(70);
var m70 = A.returnMargin();
ok(m70.test < m20.test, 'margin at 70C lower than at 20C');
near(m20.test, 8652.857142857143, 1e-6, 'margin at 20C exact (s)');
near(m70.test, 6867.857142857143, 1e-6, 'margin at 70C exact (s)');

/* Validation: NaN/Infinity/out-of-range never reach snapshot */
console.log('\n--- Validation ---');
A.sim.setEnvironment('CUSTOM'); S.phase='SURFACE';
var bads = [
  ['gravityMS2', NaN], ['gravityMS2', Infinity], ['gravityMS2', -1], ['gravityMS2', 31],
  ['distanceKm', -1], ['distanceKm', 7e9], ['ambientTempC', -500], ['ambientTempC', 1000],
  ['doseRateMSvDay', -1], ['doseRateMSvDay', 11], ['paceKmh', 0.1], ['paceKmh', 9],
  ['walkMetabolicBtuHr', 100], ['walkMetabolicBtuHr', 5000]
];
bads.forEach(function(b){
  var before = S.customEnv[b[0]];
  var okSet = A.sim.setCustomEnvField(b[0], b[1]);
  ok(okSet===false, 'reject invalid '+b[0]+'='+b[1]);
  ok(S.customEnv[b[0]]===before, 'kept last valid for '+b[0]);
});
var snap = A.snapshot();
function allFinite(x){ if(typeof x==='number') return isFinite(x); if(Array.isArray(x)) return x.every(allFinite); if(x&&typeof x==='object') return Object.keys(x).every(function(k){return allFinite(x[k]);}); return true; }
ok(allFinite(snap), 'snapshot numeric fields finite');

console.log('\n─────────────────────────────────────────────');
console.log('Results: '+passed+' passed, '+failed+' failed');
if (failed>0) { console.log('\nFAIL'); process.exit(1); } else { console.log('\nPASS'); process.exit(0); }
