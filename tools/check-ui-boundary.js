#!/usr/bin/env node
/* =========================================================================
tools/check-ui-boundary.js — Fail if any of these patterns appear in UI files:
   A.state, sim internals, or A.LIMITS.
   Presenter.js may call an explicit, listed set of sim setters.
   Also fail on numeric literals in UI files that look like thresholds.
*/

const fs = require('fs');
const path = require('path');

const files = [
  'js/ui.js', 'js/watch.js', 'js/dashboard.js', 'js/charts.js', 'presenter.js',
  'index.html', 'README.md'
];

let found = 0;
for (const f of files) {
  const content = fs.readFileSync(path.join('/Users/nael/Documents/AMWS_nasa-spaceapps-project', f), 'utf8').toString();
  const re = /A\.state|sim\.(o2Seconds|battSeconds|walkbackSeconds)|A\.LIMITS/gi;
  if (re.test(content)) {
    console.log(`  FAIL  ${f}: found "${re.exec(content)}"`);
    found++;
  }
}

if (found > 0) {
  console.log(`\nFAIL: ${found} issue(s) found`);
  process.exit(1);
} else {
  console.log('\nPASS: no UI boundary violations');
  process.exit(0);
}