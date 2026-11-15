#!/usr/bin/env node
/* =========================================================================
   tests/boot-smoke.js — plain Node vm, no dependencies.
   Loads config → sim → assess → snapshot → charts → dashboard → presenter → main
   against a minimal stub DOM. Boots and runs 200 ticks (10 Hz physics,
   4 Hz UI, 1 Hz history). Asserts:
     1. No exceptions thrown.
     2. No NaN or Infinity in snapshot() output (recursively).
     3. dashboard.tick() and presenter.sync() complete without throwing.
   ========================================================================= */
'use strict';
const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

/* ---- Minimal stub DOM ---- */
function makeEl(tag) {
  var el = {
    tagName: (tag || 'div').toUpperCase(),
    className: '', id: '', textContent: '', innerHTML: '',
    style: {}, dataset: {}, _chip: null, _sig: null, _paces: null,
    children: [], childNodes: [],
    classList: {
      _c: {},
      add:    function (c) { this._c[c] = true; },
      remove: function (c) { delete this._c[c]; },
      toggle: function (c, v) { if (v === undefined) v = !this._c[c]; if (v) this._c[c] = true; else delete this._c[c]; },
      contains: function (c) { return !!this._c[c]; }
    },
    getAttribute:    function () { return null; },
    setAttribute:    function () {},
    removeAttribute: function () {},
    addEventListener: function () {},
    querySelector:   function () { return null; },
    querySelectorAll: function () { return []; },
    appendChild:     function (c) { this.childNodes.push(c); return c; },
    removeChild:     function () {},
    firstChild:      null,
    offsetParent:    true,
    getBoundingClientRect: function () { return { width: 200, height: 40 }; }
  };
  return el;
}

var body = makeEl('body');
body.dataset = { view: 'desktop' };

var ctx = {
  window: {},
  document: {
    body: body,
    readyState: 'complete',
    querySelector:    function (sel) {
      if (sel === '.watch') return makeEl('div');
      return makeEl('div');
    },
    querySelectorAll: function () { return []; },
    getElementById:   function () { return makeEl('div'); },
    addEventListener: function () {},
    createElement:    function (tag) { return makeEl(tag); },
    createTextNode:  function (t) { var n = makeEl('#text'); n.textContent = t; return n; }
  },
  location: { search: '' },
  localStorage: { getItem: function () { return null; }, setItem: function () {} },
  performance: { now: function () { return Date.now(); } },
  requestAnimationFrame: function () {},
  cancelAnimationFrame:  function () {},
  devicePixelRatio: 1,
  innerWidth: 1440, innerHeight: 900,
  scrollTo: function () {},
  console: console
};
ctx.window = ctx;
vm.createContext(ctx);

function load(rel) {
  var code = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  vm.runInContext(code, ctx);
}

/* ---- Load scripts in dependency order ---- */
ctx.window.AMWS = {};
load('js/config.js');
load('js/sim.js');
load('js/assess.js');
load('js/snapshot.js');
load('js/charts.js');

var A = ctx.window.AMWS;

/* Stub out watch (Kiro-owned, not loaded) before dashboard/presenter/main */
A.watch = {
  init: function () {}, seedMessages: function () {}, rerender: function () {},
  home: function () {}, back: function () {}, go: function () {}, tick: function () {}, frame: function () {}
};
/* Stub bind (ui.js not loaded) */
A.bind = function () {};

/* Set readyState to 'loading' so main.js defers boot() to DOMContentLoaded */
ctx.document.readyState = 'loading';

load('js/dashboard.js');
load('js/presenter.js');
load('js/main.js');

/* ---- Assertions ---- */
var passed = 0, failed = 0;
function assertTrue(label, cond) {
  if (cond) { console.log('  PASS  ' + label); passed++; }
  else { console.error('  FAIL  ' + label); failed++; }
}

function checkNaN(obj, path) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'number') {
    if (!isFinite(obj) || isNaN(obj)) return path + '=' + obj;
    return null;
  }
  if (typeof obj === 'object') {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var r = checkNaN(obj[keys[i]], path + '.' + keys[i]);
      if (r) return r;
    }
  }
  return null;
}

console.log('\ntests/boot-smoke.js — AMWS boot + 200 tick smoke test\n');

/* ---- Boot ---- */
var bootErr = null;
try {
  /* Manually call boot sequence (main.js already ran, but requestAnimationFrame is stubbed) */
  A.watch.init(makeEl('div'));
  A.watch.seedMessages();
  A.dashboard.init();
  A.presenter.init();
  /* Settle */
  for (var i = 0; i < 30; i++) A.sim.step(0.1);
  A.assess.run();
  for (var j = 0; j < 30; j++) { A.sim.step(0.1); A.sim.sample(); }
} catch (e) { bootErr = e; }

console.log('--- Boot ---');
assertTrue('boot completes without exception', !bootErr);
if (bootErr) console.error('    ' + bootErr.message);

/* ---- 200 ticks ---- */
var tickErr = null, nanHit = null;
try {
  for (var t = 0; t < 200; t++) {
    A.sim.step(0.1);
    A.demo.tick(0.1);
    if (t % 3 === 0) {   /* ~4 Hz UI */
      A.assess.run();
      var snap = A.snapshot();
      var bad = checkNaN(snap, 'snap');
      if (bad && !nanHit) nanHit = bad;
      A.dashboard.tick();
      A.presenter.sync();
    }
    if (t % 10 === 0) {  /* 1 Hz history */
      A.sim.sample();
      A.dashboard.sample();
    }
  }
} catch (e) { tickErr = e; }

console.log('\n--- 200 ticks ---');
assertTrue('200 ticks complete without exception', !tickErr);
if (tickErr) console.error('    ' + tickErr.message + '\n' + tickErr.stack);
assertTrue('no NaN/Infinity in snapshot() output', !nanHit);
if (nanHit) console.error('    first bad field: ' + nanHit);

/* ---- CUSTOM environment render ---- */
var customErr = null;
try {
  if (A.sim.setEnvironment) A.sim.setEnvironment('CUSTOM');
  for (var c = 0; c < 5; c++) A.sim.step(0.1);
  A.assess.run();
  var csnap = A.snapshot();
  A.dashboard.tick();
  A.presenter.sync && A.presenter.sync();
} catch (e) { customErr = e; }
console.log('\n--- CUSTOM environment ---');
assertTrue('ground view renders with CUSTOM selected', !customErr);
if (customErr) console.error('    ' + customErr.message);

/* ---- Summary ---- */
console.log('\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { console.error('\nFAIL'); process.exit(1); }
else { console.log('\nPASS'); process.exit(0); }
