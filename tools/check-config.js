#!/usr/bin/env node
/* =========================================================================
   tools/check-config.js — plain Node, no dependencies.
   Rules:
   1. Every A.<CONSTANT> = <value> line must carry a source or ASSUMPTION tag
      on the SAME line, or on the SINGLE line immediately above it.
   2. Block comments more than 1 line above do NOT satisfy the requirement.
   3. Exceptions: container assignments (= { or = [) are skipped — their
      individual properties must carry tags elsewhere.
   Exits 1 on any violation.
   ========================================================================= */
'use strict';
const fs   = require('fs');
const path = require('path');

const src   = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
const lines = src.split('\n');

// Patterns that satisfy the tagging requirement
const TAG_RE = /\/\/ (?:source|ASSUMPTION)[:]/i;  // "// source:" or "// ASSUMPTION:"
const INLINE_TAG_RE = /(?:—\s*ASSUMPTION|—\s*source:|ASSUMPTION —|\(ASSUMPTION\)|\(ASSUMPTION —)/i;

// Lines to check: A.<name> = <non-object/array>
const ASSIGN_RE      = /^\s+A\.\w[\w.]*\s*=/;
const CONTAINER_RE   = /=\s*\{|=\s*\[/;  // skip object/array containers

const failures = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!ASSIGN_RE.test(line)) continue;
  if (CONTAINER_RE.test(line)) continue;      // container: skip

  const prevLine = i > 0 ? lines[i - 1] : '';

  const hasTag = TAG_RE.test(line)        || INLINE_TAG_RE.test(line)   // same line
              || TAG_RE.test(prevLine)    || INLINE_TAG_RE.test(prevLine); // line above

  if (!hasTag) {
    const m = line.match(/A\.([\w.]+)\s*=/);
    failures.push({ line: i + 1, name: m ? m[1] : '?', text: line.trim() });
  }
}

if (failures.length === 0) {
  console.log('✓ check-config: all constants tagged on their own line or the line above.');
  process.exit(0);
} else {
  console.error('✗ check-config: ' + failures.length + ' constant(s) missing a tag:\n');
  failures.forEach(f => {
    console.error('  line ' + f.line + ': ' + f.name);
    console.error('    ' + f.text);
  });
  process.exit(1);
}
