#!/usr/bin/env node
/* =========================================================================
   tools/check-cuts.js — Fail if any cut feature names appear (case-insensitive)
   in files owned by this developer.
   Scanned: js/main.js, js/snapshot.js, js/dashboard.js, js/charts.js,
            js/presenter.js, README.md, tests/*, tools/* (except this file).
   NOT scanned: shared files (js/config.js, js/sim.js, js/assess.js),
                Kiro files (index.html, css/*, js/ui.js, js/watch.js),
                docs/ (allow-listed by spec).
   ========================================================================= */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

var OUR_FILES = [
  'js/main.js', 'js/snapshot.js', 'js/dashboard.js',
  'js/charts.js', 'js/presenter.js', 'README.md'
];

/* Also scan tests/ and tools/ (except this script) */
['tests', 'tools'].forEach(function (dir) {
  var d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) return;
  fs.readdirSync(d).forEach(function (f) {
    var full = path.join(d, f);
    if (full !== __filename) OUR_FILES.push(path.join(dir, f));
  });
});

/* Terms that must not appear */
var BANNED = [
  'readiness', 'stress', 'fatigue', 'mental', 'hydration',
  'integrity', 'helmet', 'sleep', 'ecg', 'lightstrip',
  'light-time strip', 'rover', 'terrain', 'deep-space benefits', 'risk'
];

var RE = new RegExp('\\b(' + BANNED.map(function (t) {
  return t.replace(/[-\s]/g, '[\\s\\-]');
}).join('|') + ')\\b', 'i');

function isAllowedRiskInReadme(content, matchIndex) {
  // Allow only README sentences that explicitly state the risk engine was removed.
  // (docs/ are not scanned.)
  var before = content.lastIndexOf('.', matchIndex);
  var start = before === -1 ? 0 : before + 1;
  var after = content.indexOf('.', matchIndex);
  var end = after === -1 ? content.length : after + 1;
  var sentence = content.slice(start, end).toLowerCase();
  return sentence.indexOf('risk engine') !== -1 && sentence.indexOf('removed') !== -1;
}

var found = 0;
OUR_FILES.forEach(function (rel) {
  var f = path.join(ROOT, rel);
  var content;
  try { content = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
  var re = new RegExp(RE.source, 'gi');
  var m;
  while ((m = re.exec(content)) !== null) {
    var term = m[0].toLowerCase();
    if (term === 'risk' && path.basename(rel) === 'README.md' && isAllowedRiskInReadme(content, m.index)) {
      continue;
    }
    console.log('  FAIL  ' + rel + ':' + (content.slice(0, m.index).split('\n').length) + ': found "' + m[0] + '"');
    found++;
    break;
  }
});

if (found > 0) {
  console.log('\nFAIL: ' + found + ' file(s) still contain cut features');
  process.exit(1);
} else {
  console.log('\nPASS: no cut features found in owned files');
  process.exit(0);
}
