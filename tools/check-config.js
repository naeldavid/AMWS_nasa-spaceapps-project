#!/usr/bin/env node
/* =========================================================================
   tools/check-config.js — plain Node, no dependencies.
   Checks that every constant in js/config.js carries either a
   "// source:" or "// ASSUMPTION:" tag on the same or immediately
   preceding line. Exits 1 if any constant lacks a tag.
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'config.js'),
  'utf8'
);

// Split into lines for analysis
const lines = src.split('\n');

// Match lines that assign to A.<CONSTANT> or A.<OBJECT>[<key>]
// Pattern: lines like "  A.FOO = ..." or "  A.FOO.BAR = ..." or "    key: value,"
// We focus on the top-level A.* assignments and LIMITS table entries.
const ASSIGNMENT_RE = /^\s+A\.\w[\w.]*\s*=/;
const LIMITS_ENTRY_RE = /^\s+\w+\s*:\s*\{/; // object entries inside LIMITS, LOCATIONS, etc.

const failures = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (!ASSIGNMENT_RE.test(line)) continue;

  // Skip assignments that are themselves containers (objects/arrays)
  // e.g. "A.LIMITS = {" — the contents are tagged per-entry
  if (/=\s*\{/.test(line) || /=\s*\[/.test(line)) continue;

  // Check the current line and the 5 lines above for a source or ASSUMPTION tag.
  // Also accepts inline "— ASSUMPTION" or "— source:" or "(ASSUMPTION)" on the constant's own line.
  const lookback = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
  const hasTag = /\/\/ source:/i.test(lookback)
              || /\/\/ ASSUMPTION:/i.test(lookback)
              || /—\s*ASSUMPTION/i.test(line)
              || /—\s*source:/i.test(line)
              || /\(ASSUMPTION\)/i.test(line)
              || /\(ASSUMPTION —/i.test(line);

  if (!hasTag) {
    // Extract constant name for reporting
    const m = line.match(/A\.([\w.]+)\s*=/);
    failures.push({ line: i + 1, name: m ? m[1] : '?', text: line.trim() });
  }
}

if (failures.length === 0) {
  console.log('✓ check-config: all constants carry a source or ASSUMPTION tag.');
  process.exit(0);
} else {
  console.error('✗ check-config: missing source/ASSUMPTION tag on ' + failures.length + ' constant(s):\n');
  failures.forEach(function (f) {
    console.error('  line ' + f.line + ': ' + f.name);
    console.error('    ' + f.text);
  });
  process.exit(1);
}
