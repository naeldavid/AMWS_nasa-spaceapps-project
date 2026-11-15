/* =========================================================================
   watch.js — Wrist computer interface: screen router, templates, glove-
   friendly interactions (large targets, hold-to-confirm for dangerous
   actions, physical bezel buttons).
   ========================================================================= */
(function (A) {
  'use strict';
  var S = A.state, fmt = A.fmt;
  var root, screenEl, stack = ['home'], current = 'home', trace = null, sig = '';
  S.msgs = [];
  S.returning = false;
  S.checklist = {};

  /* ---------- small template helpers ---------- */
  function row(label, valKey, unit, chipKey, sub) {
    return '<div class="w-row" data-sev="' + chipKey + '"><div class="w-row-l"><span class="lbl">' + label + '</span>' +
      (sub ? '<small data-t="' + sub + '"></small>' : '') + '</div><div class="w-row-v"><b data-t="' + valKey + '"></b><u>' + unit + '</u></div>' +
      '<span data-chip="' + chipKey + '"></span></div>';
  }
  function head(title, sub) {
    return '<header class="w-head"><button class="w-back" data-act="back" aria-label="Back">‹</button><h2>' + title + '</h2>' +
      (sub ? '<span class="w-head-sub">' + sub + '</span>' : '') + '</header>';
  }
  function hold(act, label, cls, ms) {
    return '<button class="w-btn hold ' + (cls || '') + '" data-hold="' + act + '" data-ms="' + (ms || 1200) + '"><span class="fill"></span><span class="t">' + label + '</span><small>HOLD TO CONFIRM</small></button>';
  }
  var ICONS = {
    vitals: '<svg viewBox="0 0 24 24"><path d="M2 12h4l2-5 4 10 2-5h8"/></svg>',
    suit: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M5 22v-4a7 7 0 0 1 14 0v4"/><path d="M9.5 8h5"/></svg>',
    mission: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    nav: '<svg viewBox="0 0 24 24"><path d="M12 2l7 19-7-4-7 4z"/></svg>',
    comms: '<svg viewBox="0 0 24 24"><path d="M5 19a10 10 0 0 1 0-14M19 5a10 10 0 0 1 0 14M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7"/><circle cx="12" cy="12" r="1.5"/></svg>',
    alerts: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>'
  };
  function navBtn(id, label, sevKey) {
    return '<button class="w-appnav-btn" data-go="' + id + '" aria-label="' + label + '"' + (sevKey ? ' data-sev="' + sevKey + '"' : '') + '>' + ICONS[id] + '<span>' + label + '</span></button>';
  }
  function metricTile(go, label, valKey, unit, sevKey) {
    return '<button class="w-metric" data-go="' + go + '" data-sev="' + sevKey + '">' +
      '<span class="m-label">' + label + '</span>' +
      '<span class="m-value"><span data-t="' + valKey + '"></span>' + (unit ? '<small>' + unit + '</small>' : '') + '</span>' +
      '<span class="m-state" data-chip="' + sevKey + '"></span></button>';
  }

  /* ---------- screen templates ---------- */
  var T = {
    home: function () {
      return '<div class="w-crit" hidden><button class="w-crit-main" data-go="alerts" aria-label="Open alerts"><i class="w-crit-icon">!</i><span class="w-crit-t"></span></button><button class="w-crit-ack" data-act="ack" aria-label="Acknowledge alerts">ACK</button></div>' +
        '<div class="w-home-hero">' +
          '<div class="w-home-hero-main"><span class="lbl">RETURN MARGIN</span>' +
            '<div class="hero-value"><span data-t="marginHero"></span></div>' +
            '<div class="hero-limit">LIMIT: <span data-t="marginLimiting"></span> <span class="hero-limit-note">(lowest remaining)</span></div>' +
            '<div class="hero-range" data-t="marginRange"></div></div>' +
          '<div class="w-home-hero-side"><span class="alert-pill" data-sev="overallAlert"><span data-chip="overallAlert"></span></span></div>' +
        '</div>' +
        '<div class="w-metrics">' +
          metricTile('vitals', 'HR', 'hr', 'bpm', 'hr') +
          metricTile('vitals', 'SpO₂', 'spo2', '%', 'spo2') +
          metricTile('suit', 'SUIT PSI', 'suitP', '', 'suitP') +
          metricTile('comms', 'EARTH DELAY', 'delay', '', 'link') +
        '</div>' +
        '<nav class="w-appnav" aria-label="Watch apps">' +
          navBtn('vitals', 'VITALS', 'hr') + navBtn('suit', 'SUIT', 'suit') + navBtn('mission', 'MISSION', '') +
          navBtn('nav', 'NAV', 'margin') + navBtn('comms', 'COMMS', 'link') + navBtn('alerts', 'ALERTS', 'alerts') +
        '</nav>';
    },

    vitals: function () {
      return head('VITALS', 'SIMULATED') +
        '<div class="w-trace" data-sev="hr"><canvas class="cardio"></canvas><div class="w-trace-v"><b data-t="hr"></b><u>BPM</u></div></div>' +
        '<div class="w-scroll">' + row('HEART RATE', 'hr', 'BPM', 'hr', 'hrTrend') + row('SpO₂', 'spo2', '%', 'spo2', 'spo2Trend') +
        row('RESPIRATION', 'resp', '/MIN', 'resp', 'respTrend') + row('BODY TEMP', 'temp', '°C', 'temp', 'tempTrend') +
        '<p class="w-note">Readings are simulated. Vitals thresholds shown are labelled ASSUMED where not flight-certified.</p></div>';
    },

    suit: function () {
      return head('SUIT', '<span data-t="suitMode"></span>') + '<div class="w-scroll">' +
        row('PRESSURE <span class="badge-assumed">ASSUMED</span>', 'suitP', 'PSI', 'suitP', null) + row('O₂ SUPPLY', 'o2', '%', 'o2', 'o2Time') +
        row('CO₂ (ppCO₂)', 'co2', 'mmHg', 'co2', 'co2Trend') + row('SUIT TEMP', 'suitT', '°C', 'suitT', null) +
        row('SUIT BATTERY', 'suitBatt', '%', 'suitBatt', 'battTime') +
        '<p class="w-note">Time remaining figures assume the current metabolic rate. Pressure bands are ASSUMED.</p></div>';
    },

    mission: function () {
      return head('MISSION', 'ASTRONAUT-01') + '<div class="w-scroll">' +
        '<div class="w-block"><span class="lbl">MISSION ELAPSED</span><b class="xl" data-t="met"></b></div>' +
        '<div class="w-block hl"><span class="lbl">NEXT · <em data-t="nextEventName"></em></span><b class="xl" data-t="nextEvent"></b></div>' +
        '<div class="w-kv"><span>DESTINATION</span><b data-t="destination"></b></div>' +
        '<div class="w-kv"><span>PHASE</span><b data-t="phase"></b></div>' +
        '<div class="w-kv"><span>FROM EARTH</span><b data-t="distEarth"></b></div>' +
        '<div class="w-kv"><span>TO DESTINATION</span><b data-t="distDest"></b></div>' +
        '<div class="w-kv"><span>GRAVITY</span><b data-t="gravity"></b></div>' +
        '<div class="w-kv"><span>RADIATION TODAY</span><b><span data-t="doseToday"></span> mSv</b></div></div>';
    },

    nav: function () {
      if (S.phase !== 'SURFACE') {
        return head('NAV', 'SIMULATED') + '<div class="w-scroll"><div class="w-traj"><span class="lbl">TRAJECTORY</span>' +
          '<div class="traj-bar"><i class="traj-fill"></i><em class="traj-craft">◆</em></div><div class="traj-ends"><span>EARTH</span><span data-t="destination"></span></div></div>' +
          '<div class="w-kv"><span>FROM EARTH</span><b data-t="distEarth"></b></div><div class="w-kv"><span>TO GO</span><b data-t="distDest"></b></div>' +
          '<div class="w-kv"><span>PHASE</span><b data-t="phase"></b></div><div class="w-kv"><span>ENVIRONMENT</span><b data-t="env"></b></div>' +
          '<p class="w-note">Trajectory data would come from the spacecraft guidance computer. Simulated.</p></div>';
      }
      return head('NAV', 'RELATIVE · SIM') + '<div class="w-scroll">' +
        '<div class="w-radar"><svg viewBox="-100 -100 200 200" class="radar">' +
        '<circle r="92" class="rg"/><circle r="61" class="rg"/><circle r="30" class="rg"/>' +
        '<g class="rose"><text y="-80">N</text><text x="80" y="4">E</text><text y="88">S</text><text x="-80" y="4">W</text></g>' +
        '<g class="hab"><rect x="-7" y="-7" width="14" height="14"/><text y="22">HAB</text></g>' +
        '<g class="rover"><circle r="4"/><text y="14">ROVER</text></g>' +
        '<path class="me" d="M0 -11 L7 8 L0 4 L-7 8 Z"/></svg>' +
        '<div class="w-radar-scale">RINGS 0.5 km · HEADING-UP</div></div>' +
        '<div class="w-navgrid"><div><span class="lbl">HABITAT</span><b data-t="habDist"></b><small data-t="habBearing"></small></div>' +
        '<div><span class="lbl">WALK BACK</span><b data-t="walkback"></b><small>@ 2.5 km/h</small></div>' +
        '<div data-sev="margin"><span class="lbl">RETURN MARGIN</span><b data-t="margin"></b><small data-t="marginRange"></small><span data-chip="margin"></span></div>' +
        '<div><span class="lbl">HEADING</span><b data-t="heading"></b><small data-t="altitude"></small></div></div>' +
        '<p class="w-note tight">Beacon-based relative navigation concept — not GPS. Simulated.</p></div>';
    },

    comms: function () {
      return head('COMMS', 'DELAYED LINK') + '<div class="w-scroll">' +
        '<div class="w-link" data-sev="link"><div><span class="lbl">EARTH LINK</span><span data-chip="link"></span></div>' +
        '<div class="bars" data-bars=""><i></i><i></i><i></i><i></i></div><div><span class="lbl">SIGNAL</span><b data-t="signalLabel"></b></div></div>' +
        '<div class="w-delay"><div><span class="lbl">ONE-WAY DELAY</span><b data-t="delay"></b></div><div><span class="lbl">ROUND TRIP</span><b data-t="rtt"></b></div></div>' +
        '<canvas class="w-light"></canvas><p class="w-note tight" data-t="relay"></p>' +
        '<div class="w-grid2"><button class="w-btn" data-go="compose">SEND MSG</button><button class="w-btn amber" data-act="priority">PRIORITY</button>' +
        '<button class="w-btn cyan" data-act="crew">CREW LINK</button>' + hold('emcomm', 'EMERG COMM', 'red', 1200) + '</div>' +
        '<span class="lbl">MESSAGE LOG</span><div class="w-msgs"></div></div>';
    },

    compose: function () {
      return head('SEND', 'SELECT MESSAGE') + '<div class="w-scroll">' +
        A.CANNED_MESSAGES.map(function (m, i) { return '<button class="w-btn wide" data-act="send" data-i="' + i + '">' + m + '</button>'; }).join('') +
        '<p class="w-note">Pre-set messages avoid typing with gloves. Voice input would be a future option.</p></div>';
    },

    alerts: function () {
      return head('ALERTS', '<span data-t="alertCount"></span> ACTIVE') + '<div class="w-scroll"><div class="w-alerts"></div>' +
        '<button class="w-btn wide" data-act="ack">ACKNOWLEDGE ALL</button></div>';
    },

    emergency: function () {
      return '<header class="w-em-head"><b>EMERGENCY</b><span><span data-t="emReason"></span> · T+<span data-t="emSince"></span></span></header>' +
        '<div class="w-scroll">' +
        '<div class="w-em-tiles">' +
        '<div data-sev="hr"><span class="lbl">HR</span><b data-t="hr"></b></div>' +
        '<div data-sev="spo2"><span class="lbl">SpO₂ / O₂</span><b><span data-t="spo2"></span><em>/<span data-t="o2"></span></em></b></div>' +
        '<div data-sev="suitP"><span class="lbl">PRESS PSI</span><b data-t="suitP"></b></div>' +
        '<div data-sev="co2"><span class="lbl">CO₂ mmHg</span><b data-t="co2"></b></div>' +
        '<div data-sev="suitBatt"><span class="lbl">BATT %</span><b data-t="suitBatt"></b></div>' +
        '<div data-sev="link"><span class="lbl">COMMS</span><b class="sm" data-t="link"></b></div></div>' +
        '<div class="w-em-btns"><button class="w-btn red" data-go="emContact">CONTACT EARTH</button><button class="w-btn red" data-go="emLife">LIFE SUPPORT</button>' +
        '<button class="w-btn red" data-go="emReturn">RETURN TO HAB</button><button class="w-btn red" data-go="emMedical">MEDICAL DATA</button></div>' +
        hold('cancelEm', 'CANCEL EMERGENCY', 'ghost wide', 1600) +
        '</div>';
    },

    emContact: function () {
      var sent = S.emSent;
      return head('CONTACT EARTH', 'EMERGENCY') + '<div class="w-scroll">' +
        '<div class="w-delay"><div><span class="lbl">ONE-WAY</span><b data-t="delay"></b></div><div><span class="lbl">EARLIEST REPLY</span><b data-t="rtt"></b></div></div>' +
        (sent ? '<div class="w-sent"><i>✓</i>EMERGENCY PACKET TRANSMITTED<small>Vitals + suit telemetry attached</small></div>' :
          hold('emSend', 'SEND EMERGENCY + TELEMETRY', 'red wide', 1200)) +
        '<div class="w-sent ok"><i>✓</i>HAB CREW NOTIFIED<small>Local link · &lt;1 s</small></div>' +
        '<p class="w-callout">Earth cannot respond in time for immediate decisions. FOLLOW LOCAL PROCEDURE → LIFE SUPPORT.</p></div>';
    },

    emLife: function () {
      var steps = ['STOP ACTIVITY · REST', 'SECONDARY O₂ — OPEN', 'CO₂ SCRUBBER — SWITCH TO B', 'COOLING / FAN — MAX', 'NOTIFY CREW · START RETURN'];
      return head('LIFE SUPPORT', 'CONCEPT PROCEDURE') + '<div class="w-scroll">' +
        steps.map(function (s, i) {
          var done = S.checklist[i];
          return '<button class="w-check' + (done ? ' done' : '') + '" data-act="check" data-i="' + i + '"><i>' + (done ? '✓' : (i + 1)) + '</i>' + s + '</button>';
        }).join('') +
        '<div class="w-kv"><span>O₂ REMAINING</span><b data-t="o2Time"></b></div><div class="w-kv"><span>BATTERY REMAINING</span><b data-t="battTime"></b></div></div>';
    },

    emReturn: function () {
      return head('RETURN TO HAB', 'SIM NAV') + '<div class="w-scroll">' +
        '<div class="w-turn"><svg viewBox="-50 -50 100 100"><circle r="46" class="rg"/><path class="turn-arrow" d="M0 -38 L16 -6 L6 -6 L6 30 L-6 30 L-6 -6 L-16 -6 Z"/></svg>' +
        '<div><span class="lbl">HABITAT</span><b data-t="habDist"></b><small data-t="habBearing"></small></div></div>' +
        '<div class="w-delay"><div><span class="lbl">WALK TIME</span><b data-t="walkback"></b></div><div data-sev="margin"><span class="lbl">MARGIN</span><b data-t="margin"></b></div></div>' +
        (S.returning ? '<div class="w-sent ok"><i>✓</i>RETURN ROUTE ACTIVE<small>Follow arrow · crew tracking</small></div>' : hold('startReturn', 'START RETURN ROUTE', 'red wide', 1200)) +
        '</div>';
    },

    emMedical: function () {
      return head('MEDICAL DATA', 'SIMULATED') + '<div class="w-trace" data-sev="hr"><canvas class="cardio"></canvas><div class="w-trace-v"><b data-t="hr"></b><u>BPM</u></div></div>' +
        '<div class="w-scroll">' + row('SpO₂', 'spo2', '%', 'spo2', 'spo2Trend') + row('RESPIRATION', 'resp', '/MIN', 'resp', 'respTrend') +
        row('BODY TEMP', 'temp', '°C', 'temp', null) +
        '<p class="w-note">Medical snapshot auto-attached to emergency packet. Not a diagnosis.</p></div>';
    }
  };

  /* ---------- router ---------- */
  function render() {
    screenEl.innerHTML = T[current]();
    screenEl.dataset.screen = current;
    sig = '';
    var cv = screenEl.querySelector('canvas.cardio');
    trace = cv ? new A.CardioTrace(cv, { seconds: 3, line: 2.2 }) : null;
    A.bind(screenEl); update(true);
  }
  function go(id, replace) {
    if (!T[id]) return;
    if (replace) stack = [id]; else if (current !== id) stack.push(id);
    current = id; render();
  }
  function back() {
    if (stack.length > 1) { stack.pop(); current = stack[stack.length - 1]; render(); }
    else home();
  }
  function home() { go(S.emergency.active ? 'emergency' : 'home', true); }

  /* ---------- per-tick dynamic parts ---------- */
  function update(force) {
    A.bind(root);
    var vm = A.vm; if (!vm) return;
    // signal bars
    root.querySelectorAll('[data-bars]').forEach(function (b) { b.dataset.bars = vm.T.bars; });

    if (current === 'home') {
      var crit = A.alerts.active().filter(function (a) { return a.sev === 2; });
      var cb = screenEl.querySelector('.w-crit');
      if (cb) { cb.hidden = !crit.length; if (crit.length) cb.querySelector('.w-crit-t').textContent = crit[0].title + (crit.length > 1 ? ' +' + (crit.length - 1) : ''); }
    }
    if (current === 'alerts') {
      var act = A.alerts.active(), s = act.map(function (a) { return a.key + a.sev + a.acked; }).join('|');
      if (force || s !== sig) { sig = s; screenEl.querySelector('.w-alerts').innerHTML = alertsHTML(act); }
    }
    if (current === 'comms') {
      var box = screenEl.querySelector('.w-msgs'), h = msgsHTML();
      if (box && box._h !== h) { box.innerHTML = h; box._h = h; }
    }
    if (current === 'nav' && S.phase === 'SURFACE') {
      var svg = screenEl.querySelector('.radar'); if (svg) navSVG(svg);
    }
    if (current === 'nav' && S.phase !== 'SURFACE') {
      var sc = A.sim.scenario(), p = sc.toGo === null ? 1 : sc.dist / (sc.dist + sc.toGo);
      var f = screenEl.querySelector('.traj-fill'), c = screenEl.querySelector('.traj-craft');
      if (f) { f.style.width = (p * 100) + '%'; c.style.left = (p * 100) + '%'; }
    }
    if (current === 'emReturn') {
      var ar = screenEl.querySelector('.turn-arrow'); if (ar) ar.setAttribute('transform', 'rotate(' + vm.T.turnArrow + ')');
    }
  }

  function alertsHTML(act) {
    var html = act.map(function (a) {
      return '<div class="w-alert sev-' + a.sev + (a.acked ? ' acked' : '') + '"><i>' + A.ICON[a.sev] + '</i><div><b>' + a.title + '</b><small>' + a.action + '</small></div></div>';
    }).join('');
    var keys = {}; act.forEach(function (a) { keys[a.group] = 1; });
    var nominal = [['LIFE SUPPORT', 'LIFE SUPPORT NOMINAL'], ['HEALTH', 'VITALS WITHIN LIMITS'], ['COMMS', 'EARTH LINK STABLE'], ['ENVIRONMENT', 'RADIATION NORMAL'], ['MISSION', 'RETURN MARGIN ADEQUATE']]
      .filter(function (n) { return !keys[n[0]]; })
      .map(function (n) { return '<div class="w-alert sev-0"><i>✓</i><div><b>' + n[1] + '</b></div></div>'; }).join('');
    return html + nominal;
  }

  function msgsHTML() {
    if (!S.msgs.length) return '<p class="w-note">No messages this shift.</p>';
    return S.msgs.slice(0, 6).map(function (m) {
      var st, now = S.met;
      if (m.dir === 'out') st = now < m.eta ? 'IN TRANSIT · ' + fmt.hms(m.eta - now) : 'DELIVERED ✓';
      else st = 'RCVD · SENT ' + fmt.dur(m.age + (now - m.t)) + ' AGO';
      return '<div class="w-msg ' + m.dir + (m.pri ? ' pri' : '') + '"><span>' + (m.dir === 'out' ? '▲ ' : '▼ ') + m.from + '</span><b>' + m.text + '</b><small>' + st + '</small></div>';
    }).join('');
  }

  function navSVG(svg) {
    var scale = 61 / 1000; // 1 km per middle ring... ring spacing ≈ 0.5 km
    var h = S.nav.heading * Math.PI / 180;
    if (!S.nav.rover) S.nav.rover = { x: 0, y: 0 };
    function rel(x, y) { // heading-up rotation
      var dx = x - S.nav.x, dy = y - S.nav.y;
      var rx = dx * Math.cos(h) - dy * Math.sin(h), ry = dx * Math.sin(h) + dy * Math.cos(h);
      var px = rx * scale, py = -ry * scale, r = Math.hypot(px, py);
      if (r > 88) { px *= 88 / r; py *= 88 / r; }
      return px.toFixed(1) + ' ' + py.toFixed(1);
    }
    var hab = svg.querySelector('.hab');
    var rov = svg.querySelector('.rover');
    var rose = svg.querySelector('.rose');
    if (hab) hab.setAttribute('transform', 'translate(' + rel(0, 0) + ')');
    if (rov) rov.setAttribute('transform', 'translate(' + rel(S.nav.rover.x, S.nav.rover.y) + ')');
    if (rose) rose.setAttribute('transform', 'rotate(' + (-S.nav.heading) + ')');
  }

  /* ---------- actions ---------- */
  function sendMsg(text, pri, toCrew) {
    var d = toCrew ? 0.3 : A.sim.oneWayDelay();
    S.msgs.unshift({ dir: 'out', from: toCrew ? 'TO HAB CREW' : (pri ? 'PRIORITY → MCC' : 'TO MCC'), text: text, pri: pri, t: S.met, eta: S.met + d });
    var reply = toCrew ? 'COPY — TRACKING YOU' : (pri ? 'PRIORITY ACK — FLIGHT SURGEON REVIEWING' : 'ACK — ' + text);
    var think = toCrew ? 3 : (pri ? 45 : 120);
    S.pending = S.pending || [];
    S.pending.push({ at: S.met + d * 2 + think, msg: { dir: 'in', from: toCrew ? 'ASTRONAUT-02 (HAB)' : 'MISSION CONTROL', text: reply, pri: pri, age: d } });
    A.audio.click();
  }
  var actions = {
    back: back,
    ack: function () { A.alerts.ackAll(); sig = ''; },
    priority: function () { sendMsg('PRIORITY: REQUEST MEDICAL CONSULT', true); },
    crew: function () { sendMsg('STATUS CHECK — ALL GOOD?', false, true); },
    send: function (el) { sendMsg(A.CANNED_MESSAGES[+el.dataset.i], false); back(); },
    emcomm: function () { sendMsg('EMERGENCY — CREW MEMBER AT RISK', true); A.emergency.activate('CREW · EMERGENCY COMM'); },
    cancelEm: function () { A.emergency.cancel(); },
    emSend: function () { S.emSent = true; sendMsg('EMERGENCY · TELEMETRY ATTACHED', true); render(); },
    check: function (el) { var i = +el.dataset.i; S.checklist[i] = !S.checklist[i]; render(); },
    startReturn: function () { S.returning = true; render(); }
  };

  /* Hold-to-confirm: pointer must stay down for data-ms; release cancels. */
  function bindHold(el) {
    var ms = +el.dataset.ms || 1200, t0 = 0, raf = 0, fill = el.querySelector('.fill');
    function stop() { cancelAnimationFrame(raf); el.classList.remove('holding'); if (fill) fill.style.width = '0%'; t0 = 0; }
    function tick() {
      var p = Math.min(1, (performance.now() - t0) / ms);
      if (fill) fill.style.width = (p * 100) + '%';
      if (p >= 1) { stop(); actions[el.dataset.hold] && actions[el.dataset.hold](el); return; }
      raf = requestAnimationFrame(tick);
    }
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); t0 = performance.now(); el.classList.add('holding'); raf = requestAnimationFrame(tick); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { el.addEventListener(ev, stop); });
    /* keyboard: hold Space/Enter */
    el.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !t0) { e.preventDefault(); t0 = performance.now(); el.classList.add('holding'); raf = requestAnimationFrame(tick); } });
    el.addEventListener('keyup', stop);
  }

  A.watch = {
    init: function (rootEl) {
      root = rootEl; screenEl = root.querySelector('.w-screen');
      /* delegated taps */
      root.addEventListener('click', function (e) {
        var el = e.target.closest('[data-go],[data-act]'); if (!el || !root.contains(el)) return;
        if (el.dataset.go) { A.audio.click(); go(el.dataset.go); }
        else if (actions[el.dataset.act]) actions[el.dataset.act](el);
      });
      /* hold buttons are created on each render — observe and bind */
      new MutationObserver(function () {
        screenEl.querySelectorAll('[data-hold]:not([data-bound])').forEach(function (b) { b.dataset.bound = 1; bindHold(b); });
        root.querySelectorAll('[data-hold]:not([data-bound])').forEach(function (b) { b.dataset.bound = 1; bindHold(b); });
      }).observe(screenEl, { childList: true, subtree: true });
      root.querySelectorAll('[data-hold]').forEach(function (b) { b.dataset.bound = 1; bindHold(b); });
      /* physical bezel / edge buttons */
      var homeBtn = root.querySelector('[data-hw="home"]');
      if (homeBtn) {
        var pressTimer = null, longFired = false;
        var clearPress = function () { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
        homeBtn.addEventListener('pointerdown', function (e) {
          longFired = false; clearPress();
          pressTimer = setTimeout(function () { longFired = true; A.audio && A.audio.click && A.audio.click(); back(); }, 600);
        });
        ['pointerup','pointerleave','pointercancel'].forEach(function (ev) { homeBtn.addEventListener(ev, clearPress); });
        homeBtn.addEventListener('click', function (e) {
          if (longFired) { e.preventDefault(); e.stopPropagation(); return; }
          home();
        });
      }
      root.querySelector('.w-status').addEventListener('click', home); // tap status bar = home
      var backBtn = root.querySelector('[data-hw="back"]');
      if (backBtn) backBtn.addEventListener('click', back);
      var ackBtn = root.querySelector('[data-hw="ack"]');
      if (ackBtn) ackBtn.addEventListener('click', function () { A.alerts.ackAll(); go('alerts'); });
      actions.hwEmergency = function () { if (!S.emergency.active) A.emergency.activate('CREW-INITIATED'); };
      render();
    },
    go: go, home: home, back: back,
    current: function () { return current; },
    tick: function () {
      /* deliver pending incoming messages */
      if (S.pending) S.pending = S.pending.filter(function (p) { if (S.met >= p.at) { S.msgs.unshift(p.msg); return false; } return true; });
      /* return route: steer toward habitat */
      if (S.returning && S.phase === 'SURFACE') {
        var brg = A.sim.habBearing(), diff = ((brg - S.nav.heading + 540) % 360) - 180;
        S.nav.heading = (S.nav.heading + diff * 0.15 + 360) % 360;
        if (A.sim.habDistance() < 30) S.returning = false;
      }
      update(false);
    },
    frame: function (dt) { if (trace) trace.frame(dt); var lc = screenEl.querySelector('canvas.w-light'); if (lc && A.signalStrip) A.signalStrip(lc, performance.now() / 1000); },
    rerender: render,
    seedMessages: function () {
      var d = A.sim.oneWayDelay();
      S.msgs = [{ dir: 'in', from: 'MISSION CONTROL', text: S.location === 'MARS' ? 'WX: DUST OPACITY τ 0.6 · NO STORM ACTIVITY' : 'SPACE WX: NO SOLAR ACTIVITY FORECAST', t: S.met, age: d + 40 }];
    }
  };
})(window.AMWS);
