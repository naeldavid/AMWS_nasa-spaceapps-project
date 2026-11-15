/* =========================================================================
   charts.js — Sparkline canvas visualization (no libraries).
   ========================================================================= */
(function (A) {
  'use strict';

  var COL = { nominal: '#7fe3c4', caution: '#ffb547', warning: '#ff5a52', emergency: '#ff5a52' };
  A.COL = COL;

  function fit(cv) {
    var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
    return false;
  }

  /* Sparkline with optional normal band */
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
    var col = opt.color || COL.nominal;
    c.strokeStyle = col; c.lineWidth = 1.5 * d; c.beginPath();
    data.forEach(function (v, i) { var x = X(i), y = Y(v); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
    var lx = X(data.length - 1), ly = Y(data[data.length - 1]);
    c.fillStyle = col; c.beginPath(); c.arc(lx - 2 * d, ly, 2.4 * d, 0, 7); c.fill();
  };

})(window.AMWS);
