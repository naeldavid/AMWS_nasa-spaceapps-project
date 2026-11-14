/* =========================================================================
   dashboard.js — Desktop "mission control" presentation of the same live
   simulated state the wrist unit shows.
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state, ecg, root, sparks = [], ring, factorsEl, logEl, activeEl, logSig = null, actSig = null;

  A.dashboard = {
    init: function (el) {
      root = el;
      var heart = root.querySelector('.heart');
      ecg = new A.ECG(root.querySelector('#ecgMain'), {
        seconds: 5, line: 2,
        onBeat: function () { if (heart) { heart.classList.remove('beat'); void heart.offsetWidth; heart.classList.add('beat'); } }
      });
      sparks = Array.prototype.map.call(root.querySelectorAll('canvas[data-spark]'), function (cv) {
        var o = { cv: cv, key: cv.dataset.spark };
        if (cv.dataset.min) o.min = +cv.dataset.min; if (cv.dataset.max) o.max = +cv.dataset.max;
        if (cv.dataset.band) o.band = cv.dataset.band.split(',').map(Number);
        return o;
      });
      ring = root.querySelector('.ring-fg');
      factorsEl = root.querySelector('#factors');
      logEl = root.querySelector('#alertLog');
      activeEl = root.querySelector('#activeAlerts');
    },

    tick: function () {
      var vm = A.vm, ev = A.last;
      var rc = root.querySelector('.risk-card');
      if (rc) { rc.classList.remove('lvl-0', 'lvl-1', 'lvl-2', 'lvl-3'); rc.classList.add('lvl-' + ev.risk.level); }
      /* readiness ring */
      if (ring) {
        var C = 2 * Math.PI * 52; ring.style.strokeDasharray = C;
        ring.style.strokeDashoffset = C * (1 - ev.readiness.score / 100);
      }
      /* readiness factor bars */
      if (factorsEl) {
        factorsEl.innerHTML = ev.readiness.factors.map(function (f) {
          var s = f.score >= 80 ? 0 : f.score >= 50 ? 1 : 2;
          return '<li class="sev-' + s + '"><span>' + f.name + '</span><i><em style="width:' + f.score.toFixed(0) + '%"></em></i><b>' + f.score.toFixed(0) + '</b></li>';
        }).join('');
      }
      /* active alerts — critical first, visually dominant */
      var act = A.alerts.active(), s = act.map(function (a) { return a.key + a.sev + a.acked; }).join();
      if (activeEl && s !== actSig) {
        actSig = s;
        activeEl.innerHTML = act.length ? act.map(function (a) {
          return '<div class="alert sev-' + a.sev + (a.acked ? ' acked' : '') + '"><i>' + A.ICON[a.sev] + '</i><div><b>' + a.title + '</b><small>' +
            a.group + ' · ' + a.action + '</small></div><time>MET ' + A.fmt.hms(a.t % 86400) + '</time></div>';
        }).join('') : '<div class="alert sev-0"><i>✓</i><div><b>ALL SYSTEMS NOMINAL</b><small>No active cautions or warnings</small></div></div>';
      }
      var ls = A.alertLog.length + (A.alertLog[0] ? A.alertLog[0].title : '');
      if (logEl && ls !== logSig) {
        logSig = ls;
        logEl.innerHTML = A.alertLog.slice(0, 14).map(function (l) {
          return '<li class="sev-' + l.sev + '"><time>' + A.fmt.hms(l.t % 86400) + '</time><i>' + A.ICON[l.sev] + '</i>' + l.title + '</li>';
        }).join('') || '<li class="sev-0"><i>✓</i>Log empty — nominal since session start</li>';
      }
      /* signal bars + current delay marker on comparison scale */
      root.querySelectorAll('[data-bars]').forEach(function (b) { b.dataset.bars = vm.T.bars; });
      var mk = root.querySelector('#delayMarker');
      if (mk) {
        var d = A.sim.oneWayDelay(), p = Math.log10(1 + d) / Math.log10(1 + 1500);
        mk.style.left = (Math.min(1, p) * 100) + '%';
      }
      var crd = root.querySelector('#careerMarker'); if (crd) crd.style.left = Math.min(100, vm.W.career) + '%';
    },

    sample: function () {
      sparks.forEach(function (sp) {
        var sevKey = sp.key === 'readiness' ? 'readiness' : sp.key;
        var col = A.COL[(A.vm && A.vm.SV[sevKey]) || 0];
        A.spark(sp.cv, S.hist[sp.key], { min: sp.min, max: sp.max, band: sp.band, color: col });
      });
    },

    frame: function (dt) {
      ecg.frame(dt);
      A.lightStrip(root.querySelector('#lightMain'), performance.now() / 1000);
    }
  };
})(window.AMWS);
