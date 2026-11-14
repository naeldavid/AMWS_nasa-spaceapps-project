/* =========================================================================
   charts.js — Lightweight canvas visualizations (no libraries):
   ECG sweep monitor, sparklines with normal band, signal light-time strip.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state;
  var COL = { 0: '#7fe3c4', 1: '#ffb547', 2: '#ff5a52' };
  A.COL = COL;

  function fit(cv) {
    var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
    return false;
  }
  var g = function (x, m, s) { return Math.exp(-((x - m) * (x - m)) / (2 * s * s)); };

  /* Synthetic PQRST complex; t = seconds since beat onset. Shape only — not diagnostic. */
  function pqrst(t) {
    return 0.11 * g(t, 0.10, 0.022) - 0.10 * g(t, 0.198, 0.007) + 1.0 * g(t, 0.215, 0.0085)
         - 0.24 * g(t, 0.233, 0.008) + 0.27 * g(t, 0.43, 0.042);
  }

  /* ---------------- ECG sweep (classic monitor erase-bar) ----------------- */
  function ECG(canvas, opts) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.opts = opts || {};
    this.secs = this.opts.seconds || 4; this.buf = null; this.x = 0;
    this.beatT = 0; this.period = 60 / 72; this.simT = 0; this.onBeat = this.opts.onBeat;
  }
  ECG.prototype.frame = function (dt) {
    var cv = this.cv, c = this.ctx;
    if (!cv.offsetParent) return;           // hidden: skip work
    if (fit(cv) || !this.buf) { this.buf = new Float32Array(cv.width).fill(NaN); this.x = 0; }
    var W = cv.width, H = cv.height, pxPerSec = W / this.secs;
    var steps = Math.min(W, Math.round(pxPerSec * Math.min(dt, 0.1)));
    for (var i = 0; i < steps; i++) {
      var sdt = 1 / pxPerSec; this.simT += sdt; this.beatT += sdt;
      if (this.beatT >= this.period) {
        this.beatT -= this.period;
        var hr = Math.max(30, S.v.hr); this.period = (60 / hr) * (1 + (Math.random() - 0.5) * 0.04);
        if (this.onBeat) this.onBeat();
      }
      var y = pqrst(this.beatT) + 0.025 * Math.sin(this.simT * 2 * Math.PI * 0.25) + (Math.random() - 0.5) * 0.018;
      this.buf[this.x] = y; this.x = (this.x + 1) % W;
    }
    /* draw */
    c.clearRect(0, 0, W, H);
    var d = window.devicePixelRatio || 1;
    if (this.opts.grid !== false) {
      c.strokeStyle = 'rgba(140,170,200,0.07)'; c.lineWidth = 1;
      var gs = pxPerSec * 0.2;
      for (var gx = 0; gx < W; gx += gs) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke(); }
      for (var gy = H % gs; gy < H; gy += gs) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }
    }
    var col = COL[A.vm ? A.vm.SV.hr : 0];
    c.strokeStyle = col; c.lineWidth = (this.opts.line || 2) * d; c.lineJoin = 'round';
    c.beginPath();
    var gap = Math.round(W * 0.04), started = false;
    var base = H * 0.68, amp = H * 0.55;
    for (var px = 0; px < W; px++) {
      var dist = (px - this.x + W) % W;
      var v = this.buf[px];
      if (dist < gap || isNaN(v)) { started = false; continue; }
      var yy = base - v * amp;
      if (!started) { c.moveTo(px, yy); started = true; } else c.lineTo(px, yy);
    }
    c.stroke();
    /* leading dot */
    var lx = (this.x - 1 + W) % W, lv = this.buf[lx];
    if (!isNaN(lv)) { c.fillStyle = col; c.beginPath(); c.arc(lx, base - lv * amp, 2.6 * d, 0, 7); c.fill(); }
  };
  A.ECG = ECG;

  /* ---------------- Sparkline with optional normal band ------------------- */
  A.spark = function (cv, data, opt) {
    if (!cv || !cv.offsetParent) return;
    fit(cv);
    var c = cv.getContext('2d'), W = cv.width, H = cv.height, d = window.devicePixelRatio || 1;
    c.clearRect(0, 0, W, H);
    if (!data || data.length < 2) return;
    opt = opt || {};
    var lo = opt.min !== undefined ? opt.min : Math.min.apply(null, data);
    var hi = opt.max !== undefined ? opt.max : Math.max.apply(null, data);
    if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
    var n = opt.n || 120, pad = 3 * d;
    var X = function (i) { return W - (data.length - 1 - i) * (W / (n - 1)); };
    var Y = function (v) { return H - pad - (v - lo) / (hi - lo) * (H - pad * 2); };
    if (opt.band) {
      c.fillStyle = 'rgba(127,227,196,0.07)';
      var y1 = Y(Math.min(hi, opt.band[1])), y2 = Y(Math.max(lo, opt.band[0]));
      c.fillRect(0, y1, W, y2 - y1);
    }
    c.strokeStyle = opt.color || '#8fb8de'; c.lineWidth = 1.5 * d; c.beginPath();
    data.forEach(function (v, i) { var x = X(i), y = Y(v); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
    var lx = X(data.length - 1), ly = Y(data[data.length - 1]);
    c.fillStyle = opt.color || '#8fb8de'; c.beginPath(); c.arc(lx - 2 * d, ly, 2.4 * d, 0, 7); c.fill();
  };

  /* ---------------- Light-time strip: signal packets travelling ----------- */
  A.lightStrip = function (cv, t) {
    if (!cv || !cv.offsetParent) return;
    fit(cv);
    var c = cv.getContext('2d'), W = cv.width, H = cv.height, d = window.devicePixelRatio || 1;
    c.clearRect(0, 0, W, H);
    var y = H / 2, x0 = 14 * d, x1 = W - 14 * d;
    c.strokeStyle = 'rgba(143,184,222,0.25)'; c.setLineDash([3 * d, 4 * d]); c.lineWidth = d;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#5fa8ff'; c.beginPath(); c.arc(x0, y, 5 * d, 0, 7); c.fill();       // Earth
    c.fillStyle = S.location === 'MARS' ? '#e07a52' : S.location === 'MOON' ? '#c9ccd2' : '#5fa8ff';
    c.beginPath(); c.arc(x1, y, 4 * d, 0, 7); c.fill();
    var link = A.vm ? A.vm.SV.link : 0;
    if (link === 2) return;
    /* packets move at a visual speed proportional to (log) delay — farther feels slower */
    var delay = A.sim.oneWayDelay(), cyc = 1.2 + Math.log10(1 + delay) * 1.6;
    for (var k = 0; k < 3; k++) {
      var p = ((t / cyc) + k / 3) % 1;
      var px = x0 + (x1 - x0) * p, py = y - 5 * d;
      c.fillStyle = link === 1 ? COL[1] : '#7fe3c4';
      c.fillRect(px - 2 * d, py - 2 * d, 4 * d, 4 * d);
      var qx = x1 - (x1 - x0) * p;
      c.fillStyle = 'rgba(143,184,222,0.8)';
      c.fillRect(qx - 2 * d, y + 3 * d, 4 * d, 4 * d);
    }
  };
})(window.AMWS);
