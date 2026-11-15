#!/usr/bin/env node
/* =========================================================================
tools/check-dom-safety.js — Fail if any UI file uses innerHTML/outerHTML/insertAdjacentHTML
from a non-literal string. Dynamic text goes through textContent; static markup may
use a literal template.
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
  if (/\b(innerHTML|outerHTML|insertAdjacentHTML)\b/i.test(content)) {
    console.log(`  FAIL  ${f}: found innerHTML/outerHTML/insertAdjacentHTML usage`);
    found++;
  }
}

if (found > 0) {
  console.log(`\nFAIL: ${found} issue(s) found`);
  process.exit(1);
} else {
  console.log('\nPASS: no unsafe DOM construction detected');
  process.exit(0);
}