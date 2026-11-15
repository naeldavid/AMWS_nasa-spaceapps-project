#!/usr/bin/env node
/* =========================================================================
tools/check-cuts.js — Fail if any of these feature names appear (case-insensitive)
in js/, css/, index.html, README.md:
readiness, stress, fatigue, mental, hydration, integrity, helmet, sleep, ecg, lightstrip, "light-time strip", rover, terrain, "deep-space benefits".

Allow-list: docs/ and the check script itself.
*/

const fs = require('fs');
const path = require('path');

const files = [
  'js/ui.js', 'js/watch.js', 'js/dashboard.js', 'js/charts.js', 'js/controls.js',
  'js/main.js', 'index.html', 'README.md', 'css/*.css'
];

let found = 0;
for (const f of files) {
  const content = fs.readFileSync(path.join('/Users/nael/Documents/AMWS_nasa-spaceapps-project', f), 'utf8').toString();
  const re = /\b(readiness|stress|fatigue|mental|hydration|integrity|helmet|sleep|ecg|lightstrip|light-time strip|rover|terrain|deep-space benefits)\b/i;
  if (re.test(content)) {
    console.log(`  FAIL  ${f}: found "${re.exec(content)}"`);
    found++;
  }
}

if (found > 0) {
  console.log(`\nFAIL: ${found} feature(s) still present`);
  process.exit(1);
} else {
  console.log('\nPASS: no cut features found');
  process.exit(0);
}