#!/usr/bin/env node
/* =========================================================================
   tests/demo-check.js — plain Node, no dependencies.
   Loads config.js, sim.js, assess.js in a Node vm (no browser globals),
   steps through the ~62 s demo at fixed dt=0.1 s, and asserts:

   1. No exceptions thrown during the full run.
   2. Limiting resource changes at least once.
   3. Auto-emergency fires ONLY when suitP < 3.5 OR co2 > 15 OR o2 < 10%.
   4. No NaN or Infinity in key snapshot fields at any step.
   5. Demo completes in 60–62 s (DEMO_LENGTH constant).
   ========================================================================= */
'use strict';
const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

/* ---- Build a minimal browser-like context ---- */
const ctx = { window: {}, document: { body: { classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{} }, dataset: {} }, querySelectorAll: ()=>[] }, console };
ctx.window = ctx;
vm.createContext(ctx);

function loadFile(rel) {
  const code = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  vm.runInContext(code, ctx);
}

/* ---- Suppress audio / DOM side-effects in assess.js / sim.js ---- */
ctx.window.AMWS = {};

loadFile('js/config.js');
loadFile('js/sim.js');
loadFile('js/assess.js');

const A = ctx.window.AMWS;
const S = A.state;
const C = A;  // config constants

/* ---- Patch assess.js to skip browser-only DOM calls ---- */
// A.watch and A.audio are undefined — emergency.activate will fail on them.
// Stub them out.
A.watch = { go: ()=>{}, home: ()=>{} };
A.audio = { alarm: ()=>{}, click: ()=>{} };

/* ---- Apply demo initial state (Mars surface, 1.4 km from hab) ---- */
A.sim.reset();
S.location = 'MARS';
S.phase    = 'SURFACE';
A.sim.setLocation('MARS');
// Set initial consumables matching demo expectations
S.o2       = 87;
S.suitBatt = 82;
S.coolant  = 85;
S.scrubber = 55;   // initial limiting resource per config.js demo comment

/* ---- Wire up demo ---- */
const DEMO  = C.DEMO;
const DT    = 0.1;   // seconds per step
const STEPS = Math.ceil(C.DEMO_LENGTH / DT) + 20; // a few steps beyond DEMO_LENGTH

let demoT    = 0;
let applied  = 0;
const KEYMAP = { metabolic: 'metabolic', spo2Base: 'spo2', co2Base: 'co2',
                 suitPBase: 'suitP', tempBase: 'temp', suitBattDrain: 'suitBattDrain' };

function tickDemo(dt) {
  demoT += dt;
  while (applied < DEMO.length && DEMO[applied].at <= demoT) {
    const step = DEMO[applied];
    Object.keys(step.set).forEach(function (k) {
      const val = step.set[k];
      if (k === 'suitBattTarget') {
        S.suitBattTarget = val;
      } else if (k === 'suitBattDrain') {
        S.suitBattDrain = val;
      } else if (k === 'metabolic') {
        A.sim.ramp('metabolic', val, step.dur);
      } else if (KEYMAP[k]) {
        A.sim.ramp(KEYMAP[k], val, step.dur);
      }
    });
    applied++;
  }
}

/* ---- Assertion helpers ---- */
let passed = 0, failed = 0;
function assertTrue(label, cond) {
  if (cond) { console.log('  PASS  ' + label); passed++; }
  else { console.error('  FAIL  ' + label); failed++; }
}
function assertFalse(label, cond) { assertTrue(label, !cond); }

/* ---- Run ---- */
console.log('\ntests/demo-check.js — AMWS demo scenario assertions\n');

let exceptions = [];
let nanFields   = [];
let limitingHistory = [];
let emergencyEvents = [];

const KEY_FIELDS = ['hr', 'spo2', 'temp', 'resp', 'co2', 'suitP'];

for (let i = 0; i < STEPS; i++) {
  const t = i * DT;
  if (t > C.DEMO_LENGTH + 1) break;

  try {
    tickDemo(DT);
    A.sim.step(DT);
    A.assess.run();
  } catch (e) {
    exceptions.push({ t: t.toFixed(1), msg: e.message });
    continue;
  }

  // Check for NaN / Infinity in key vitals
  KEY_FIELDS.forEach(function (k) {
    const v = S.v[k];
    if (!isFinite(v) || isNaN(v)) nanFields.push({ t: t.toFixed(1), field: k, val: v });
  });
  ['o2', 'suitBatt', 'coolant', 'scrubber', 'metabolic'].forEach(function (k) {
    const v = k === 'metabolic' ? S.metabolic : S[k];
    if (!isFinite(v) || isNaN(v)) nanFields.push({ t: t.toFixed(1), field: k, val: v });
  });

  // Track limiting resource
  if (S.phase === 'SURFACE') {
    const rm = A.returnMargin();
    if (limitingHistory.length === 0 || limitingHistory[limitingHistory.length - 1] !== rm.limiting) {
      limitingHistory.push(rm.limiting);
    }
  }

  // Track emergency activations and check the trigger is valid
  if (S.emergency.active && emergencyEvents.length === 0) {
    // Record first emergency
    const v   = S.v;
    const o2  = S.o2;
    const validTrigger = v.suitP < 3.5 || v.co2 > 15 || o2 < 10;
    emergencyEvents.push({ t: t.toFixed(1), reason: S.emergency.reason, validTrigger, suitP: v.suitP.toFixed(2), co2: v.co2.toFixed(1), o2: o2.toFixed(1) });
  }
}

/* ---- Assertions ---- */
console.log('--- No exceptions ---');
assertTrue('zero exceptions during full run', exceptions.length === 0);
if (exceptions.length) exceptions.forEach(e => console.error('    t=' + e.t + ': ' + e.msg));

console.log('\n--- No NaN/Infinity ---');
assertTrue('zero NaN/Infinity fields at any step', nanFields.length === 0);
if (nanFields.length) nanFields.slice(0,5).forEach(f => console.error('    t=' + f.t + ' ' + f.field + '=' + f.val));

console.log('\n--- Limiting resource changes ---');
console.log('  Limiting resource history: ' + limitingHistory.join(' → '));
assertTrue('limiting resource changes at least once', limitingHistory.length >= 2);

console.log('\n--- Emergency fires via valid trigger only ---');
assertTrue('auto-emergency fires at least once during demo', emergencyEvents.length > 0);
if (emergencyEvents.length) {
  const ev = emergencyEvents[0];
  console.log('  First emergency at t=' + ev.t + 's: ' + ev.reason);
  console.log('  State: suitP=' + ev.suitP + ' co2=' + ev.co2 + ' o2=' + ev.o2);
  assertTrue('emergency triggered by a valid condition (pressure/CO2/O2)', ev.validTrigger);
}

console.log('\n--- Demo length ---');
assertTrue('DEMO_LENGTH is 60–62 s', C.DEMO_LENGTH >= 60 && C.DEMO_LENGTH <= 62);

/* ---- Summary ---- */
console.log('\n─────────────────────────────────────────────');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { console.error('\nFAIL'); process.exit(1); }
else { console.log('\nPASS'); process.exit(0); }
