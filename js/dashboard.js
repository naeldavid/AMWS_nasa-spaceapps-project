// Developed with AI coding assistance; see README, Use of AI
/* =========================================================================
   dashboard.js — Ground / Flight Controller view.
   Reads ONLY A.snapshot(). No thresholds, no magic numbers.
   Updates DOM only where text changed.
   ========================================================================= */
(function (A) {
  'use strict';

  /* Severity → icon + word (4 levels, 0-3) */
  var SEV_ICON  = { nominal: '\u2713', caution: '\u26a0', warning: '\u26a0', emergency: '\u2715' };
  var SEV_WORD  = { nominal: 'NOMINAL', caution: 'CAUTION', warning: 'WARNING', emergency: 'EMERGENCY' };
  var SEV_SET   = { nominal: true, caution: true, warning: true, emergency: true };
  function safeCls(cls) { return SEV_SET[cls] ? cls : 'nominal'; }

  /* Spark canvas registry: key → { cv, min, max, band } */
  var sparks = {};
  var logSig = null, alertSig = null;

  /* ---- helpers ---- */
  function setText(el, val) {
    if (el && el.textContent !== val) el.textContent = val;
  }
  function setCls(el, cls) {
    if (!el) return;
    var c = 'sev-' + cls;
    if (!el.classList.contains(c)) {
      el.classList.remove('sev-nominal', 'sev-caution', 'sev-warning', 'sev-emergency');
      el.classList.add(c);
    }
  }
  function chipHTML(cls, label) {
    return (SEV_ICON[cls] || '\u2713') + '\u00a0' + (label || SEV_WORD[cls] || cls.toUpperCase());
  }
  function setChip(el, cls, label) {
    if (!el) return;
    var html = chipHTML(cls, label);
    if (el._chip !== html) { el.textContent = ''; el.appendChild(document.createTextNode(html)); el._chip = html; }
    setCls(el, cls);
  }

  /* ---- consumables bar row ---- */
  function consRow(key, label, item, isLimiting) {
    var row = document.createElement('div');
    row.className = 'cons-row' + (isLimiting ? ' limiting' : '');

    var hd = document.createElement('div');
    hd.className = 'cons-hd';
    var lbl = document.createElement('span');
    lbl.textContent = String(label).replace(/[^A-Za-z0-9 _\-]/g, '') + (isLimiting ? ' \u2014 LIMITING' : '');
    var safePct = Math.min(100, Math.max(0, parseInt(item.pct, 10) || 0));
    var val = document.createElement('b');
    val.className = 'sev-' + safeCls(item.cls);
    val.textContent = safePct + '%';
    var safeSeconds = parseInt(item.secondsRemaining, 10);
    if (Number.isFinite(safeSeconds) && safeSeconds >= 0) {
      var t = document.createElement('small');
      t.textContent = ' (' + A.fmt.dur(safeSeconds) + ' remaining)';
      val.appendChild(t);
    }
    hd.appendChild(lbl); hd.appendChild(val);

    var track = document.createElement('div');
    track.className = 'cons-track';
    var fill = document.createElement('div');
    fill.className = 'cons-fill sev-' + safeCls(item.cls);
    fill.style.width = safePct + '%';
    track.appendChild(fill);

    if (item.assumed) {
      var badge = document.createElement('span');
      badge.className = 'badge-assumed';
      badge.textContent = 'ASSUMED';
      hd.appendChild(badge);
    }

    row.appendChild(hd); row.appendChild(track);
    return row;
  }

  /* ---- alert row ---- */
  function alertRow(a) {
    var div = document.createElement('div');
    div.className = 'alert-row sev-' + a.cls + (a.acked ? ' acked' : '');

    var icon = document.createElement('span');
    icon.className = 'alert-icon';
    icon.textContent = SEV_ICON[a.cls] || '\u2713';

    var body = document.createElement('div');
    body.className = 'alert-body';
    var title = document.createElement('b');
    title.textContent = a.title;
    var sub = document.createElement('small');
    sub.textContent = a.group + ' \u00b7 ' + a.action;
    if (a.assumed) {
      var ab = document.createElement('span');
      ab.className = 'badge-assumed';
      ab.textContent = 'ASSUMED';
      sub.appendChild(ab);
    }
    body.appendChild(title); body.appendChild(sub);

    var time = document.createElement('time');
    time.textContent = 'MET ' + A.fmt.hms(a.t % 86400);

    div.appendChild(icon); div.appendChild(body); div.appendChild(time);
    return div;
  }

  /* ---- margin paces block ---- */
  function renderMarginPaces(el, snap) {
    if (!el) return;
    var m = snap.margin;
    var lines = [];
    if (!m.isMars && m.testPaceS !== null && isFinite(m.testPaceS)) {
      lines.push('Test pace (6.3 km/h, sourced): ' + _fmtM(m.testPaceS));
    }
    if (!m.isMars && m.coolPaceS !== null && isFinite(m.coolPaceS)) {
      lines.push('Conservative pace (4.0 km/h, ASSUMED): ' + _fmtM(m.coolPaceS));
    }
    if (m.isMars) {
      lines.push('Mars pace (3.5 km/h, ASSUMED): ' + _fmtM(m.testPaceS));
    }
    var text = lines.join('\n');
    if (el._paces !== text) {
      el.textContent = text;
      el._paces = text;
    }
  }
  function _fmtM(s) {
    if (s === null || !isFinite(s)) return '\u2014';
    var sign = s < 0 ? '\u2212' : '+';
    return sign + Math.round(Math.abs(s) / 60) + ' min';
  }

  A.dashboard = {
    init: function () {
      /* Register sparkline canvases */
      document.querySelectorAll('canvas[data-spark-key]').forEach(function (cv) {
        var key = cv.dataset.sparkKey;
        sparks[key] = {
          cv: cv,
          min: cv.dataset.min !== undefined ? +cv.dataset.min : undefined,
          max: cv.dataset.max !== undefined ? +cv.dataset.max : undefined,
          band: cv.dataset.band ? cv.dataset.band.split(',').map(Number) : undefined
        };
      });
    },

    tick: function () {
      var snap = A.snapshot();

      /* ---- Return Margin (hero) ---- */
      var marginVal = document.getElementById('margin-val');
      setText(marginVal, snap.margin.text);
      setCls(marginVal, snap.margin.cls);

      var marginPaces = document.getElementById('margin-paces');
      renderMarginPaces(marginPaces, snap);

      var marginDist = document.getElementById('margin-dist');
      setText(marginDist, snap.margin.distKm ? snap.margin.distKm.toFixed(2) + ' km' : '\u2014');

      var marginWalk = document.getElementById('margin-walk');
      var walkText = snap.margin.testWalkS ? A.fmt.dur(snap.margin.testWalkS) : '\u2014';
      if (!snap.margin.isMars && snap.margin.coolWalkS) {
        walkText += ' \u2013 ' + A.fmt.dur(snap.margin.coolWalkS);
      }
      setText(marginWalk, walkText);

      var marginChip = document.querySelector('#tile-margin header [data-chip]');
      if (marginChip) setChip(marginChip, snap.margin.cls, snap.margin.limiting);

      /* ---- Consumables ---- */
      var consBody = document.getElementById('cons-body');
      if (consBody) {
        var lim = snap.consumables.limiting;
        var CONS = [
          ['o2',       'O\u2082'],
          ['battery',  'Battery'],
          ['coolant',  'Coolant'],
          ['scrubber', 'Scrubber']
        ];
        var sig = CONS.map(function (p) {
          var item = snap.consumables[p[0]];
          return p[0] + item.pct + item.cls;
        }).join() + lim;
        if (consBody._sig !== sig) {
          consBody._sig = sig;
          while (consBody.firstChild) consBody.removeChild(consBody.firstChild);
          CONS.forEach(function (p) {
            consBody.appendChild(consRow(p[0], p[1], snap.consumables[p[0]], lim === p[1].toUpperCase() || lim === p[0].toUpperCase() || lim === p[1]));
          });
        }
        var consChip = document.getElementById('cons-limiting-chip');
        if (consChip) setChip(consChip, snap.consumables[snap.consumables.limiting.toLowerCase()] ? snap.consumables[snap.consumables.limiting.toLowerCase()].cls : 'nominal', snap.consumables.limiting);
      }

      /* ---- Vitals sparklines (values updated via data-bind in ui.js) ---- */
      /* severity classes on vital cells */
      var vKeys = ['hr', 'spo2', 'resp', 'temp'];
      vKeys.forEach(function (k) {
        var cell = document.querySelector('[data-cls-cell="vitals.' + k + '"]');
        if (cell) setCls(cell, snap.vitals[k].cls);
        var val = document.querySelector('[data-cls="vitals.' + k + '"]');
        if (val) setCls(val, snap.vitals[k].cls);
      });

      /* ---- Radiation ---- */
      var radFill = document.getElementById('rad-fill');
      if (radFill) {
        radFill.style.width = Math.min(100, +snap.radiation.careerPct) + '%';
        setCls(radFill, snap.radiation.careerCls);
      }
      var speState = document.getElementById('spe-state');
      if (speState) setCls(speState, snap.radiation.speCls);
      var speChip = document.getElementById('spe-chip');
      if (speChip) setChip(speChip, snap.radiation.speCls, snap.radiation.speLabel);

      /* ---- Environment ---- */
      var env = snap.environment || {};
      function envText(id, val) { var el=document.getElementById(id); if(el) setText(el, val); }
      function badgeText(id, show) { var el=document.getElementById(id); if(!el) return; el.textContent = show ? 'ASSUMED' : ''; el.className = show ? 'badge-assumed' : ''; }
      var assumed = env.assumed || {};
      envText('env-name', env.name || '—');
      envText('env-gravity', (env.gravity!=null?Number(env.gravity).toFixed(2):'—') + ' m/s²' + (assumed.gravityMS2?' *':''));
      envText('env-temp', (env.ambientTempC!=null?Number(env.ambientTempC).toFixed(1):'—') + ' °C' + (assumed.ambientTempC?' *':''));
      envText('env-delay', (A.fmt && A.fmt.dur ? A.fmt.dur(env.oneWayDelayS||0) : (env.oneWayDelayS||0)+' s') + (assumed.distanceKm?' *':''));
      envText('env-dose', (env.doseRate!=null?Number(env.doseRate).toFixed(2):'—') + ' mSv/day' + (assumed.doseRateMSvDay?' *':''));
      envText('env-pace', (env.paceKmh!=null?Number(env.paceKmh).toFixed(1):'—') + ' km/h' + (assumed.paceKmh?' *':''));
      envText('env-met', (env.walkMetabolic!=null?Math.round(env.walkMetabolic):'—') + ' BTU/hr' + (assumed.walkMetabolicBtuHr?' *':''));
      badgeText('env-custom-badge', !!env.custom);
      var th = env.thermal || {coupled:false,coolantFactor:1,batteryFactor:1};
      var thText = th.coupled ? ('Thermal coupling (CUSTOM): coolant ×' + Number(th.coolantFactor).toFixed(2) + ', battery ×' + Number(th.batteryFactor).toFixed(2) + ' (ASSUMED)') : 'Thermal load: not modelled (preset)';
      envText('env-thermal', thText);

      /* ---- Alerts ---- */
      var dashAlerts = document.getElementById('dash-alerts');
      if (dashAlerts) {
        var aSig = snap.alerts.map(function (a) { return a.key + a.cls + a.acked; }).join();
        if (aSig !== alertSig) {
          alertSig = aSig;
          while (dashAlerts.firstChild) dashAlerts.removeChild(dashAlerts.firstChild);
          if (snap.alerts.length === 0) {
            var nom = document.createElement('div');
            nom.className = 'alert-row sev-nominal';
            nom.textContent = '\u2713 ALL SYSTEMS NOMINAL';
            dashAlerts.appendChild(nom);
          } else {
            snap.alerts.forEach(function (a) { dashAlerts.appendChild(alertRow(a)); });
          }
        }
        var countChip = document.getElementById('alert-count-chip');
        if (countChip) {
          var worst = snap.alerts.length ? snap.alerts[0].cls : 'nominal';
          setChip(countChip, worst, snap.alerts.length ? String(snap.alerts.length) : 'NONE');
        }
      }

      /* ---- Event log ---- */
      var logEl = document.getElementById('alertLog');
      if (logEl) {
        var ls = A.alertLog.length + (A.alertLog[0] ? A.alertLog[0].title : '');
        if (ls !== logSig) {
          logSig = ls;
          while (logEl.firstChild) logEl.removeChild(logEl.firstChild);
          var entries = A.alertLog.slice(0, 14);
          if (entries.length === 0) {
            var li = document.createElement('li');
            li.className = 'sev-nominal';
            li.textContent = '\u2713 Log empty \u2014 nominal since session start';
            logEl.appendChild(li);
          } else {
            entries.forEach(function (l) {
              var li = document.createElement('li');
              li.className = 'sev-' + (['nominal','caution','warning','emergency'][Math.min(3, l.sev)] || 'nominal');
              li.textContent = A.fmt.hms(l.t % 86400) + '  ' + (SEV_ICON[li.className.replace('sev-','')] || '') + '  ' + l.title;
              logEl.appendChild(li);
            });
          }
        }
      }
    },

    sample: function () {
      var snap = A.snapshot();
      var hist = A.state.hist;
      var vitalKeys = { hr: snap.vitals.hr, spo2: snap.vitals.spo2, resp: snap.vitals.resp, temp: snap.vitals.temp };
      Object.keys(sparks).forEach(function (key) {
        var sp = sparks[key];
        var data = hist[key];
        if (!data) return;
        var vNode = vitalKeys[key];
        var col = vNode ? A.COL[vNode.cls] || A.COL.nominal : A.COL.nominal;
        A.spark(sp.cv, data, { min: sp.min, max: sp.max, band: sp.band, color: col });
      });
    },

    frame: function () {
      /* no per-frame canvas work — sparklines update at 1 Hz via sample() */
    }
  };

})(window.AMWS);
