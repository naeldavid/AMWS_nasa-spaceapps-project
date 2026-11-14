# AMWS — Astronaut Mission Wrist System
**Concept prototype** of an aerospace-grade wrist-mounted mission computer for crews travelling to the Moon, Mars and beyond.

> All data is **simulated** in the browser. This is not a medical device or flight system and is not approved by any space agency.

---

## Run it (127.0.0.1)

No install, no internet, no build step, no external APIs.

| Platform | Command |
|---|---|
| macOS / Linux | `./start.sh` |
| Windows | double-click `start.bat` |
| Any (Python 3) | `python3 serve.py` → http://127.0.0.1:8080 |
| Any (Node) | `npx http-server -a 127.0.0.1 -p 8080` |

`serve.py` binds to 127.0.0.1 only and opens your browser. Pass a port to change it: `python3 serve.py 9000`.
You can also just double-click `index.html` — the app uses plain scripts, so it works from `file://` too.

Open `http://127.0.0.1:8080/?view=wrist` to start directly in WRIST mode.

---

## What's inside

**One unified product experience**

1. **Wrist computer** (hero) — a physical-looking unit with bezel keys: HOME, BACK, ACK (acknowledge alarms) and a guarded red EMER key (hold 1.5 s).
2. **Live astronaut status** — mission-control view: readiness ring + factor breakdown, emergency risk engine with active alerts, ECG sweep, SpO₂ / temperature / respiration with sparklines and normal bands, stress/fatigue (derived), sleep/circadian, consumables, radiation dose vs. career limit, suit/environment table, gravity/location, communication delay with light-time visualisation, event log.
3. **The system** — what the device is, architecture diagram, sensor / mission computer / comms explanations, human-factors rules.
4. **Deep-space benefits** — delay, health, environmental hazards, cognitive load, autonomy; light-time table.
5. **Simulation controls** — slide-out drawer (docked in WRIST mode): every vital and suit parameter, location (Earth/Moon/Mars), phase (Transit/Landing/Surface), radiation (Normal/Elevated/Solar Particle Event), Earth link (Nominal/Degraded/LOS), time acceleration, auto-emergency, alarm tones, TRIGGER EMERGENCY, reset.

**Watch screens:** Home · Vitals · Suit · Mission · Nav · Comms (+ message composer) · Alerts · Emergency (+ Contact Earth, Life Support checklist, Return to Hab, Medical Data).

**Demo scenario** (START / PAUSE / RESET): Mars surface EVA → heart rate rises → CO₂ climbs and SpO₂ falls → suit battery drains → slow pressure decay → risk escalates → automatic EMERGENCY mode (~60 s).

### Design decisions worth pointing out
- **Redundant status coding:** every state is colour + icon (✓ ⚠ ✕) + word — readable with colour-vision deficiency.
- **Glove operation:** on-screen targets ≥ 56 px; physical keys for navigation; **hold-to-confirm** for dangerous actions (cancel emergency, emergency transmit, start return) — releasing cancels.
- **Return margin:** consumables time (O₂ at current metabolic rate, battery) minus walk-back time to the habitat — the number an EVA crew member actually cares about.
- **Delay-aware comms:** messages show in-transit countdowns; received messages show *how old* they are; emergency screens tell the crew Earth cannot answer in time and point to local procedures. Pre-set messages avoid typing in gloves. Crew/habitat link is near-instant.
- **Honest comms architecture:** wrist → suit radio → habitat/rover → orbiter/spacecraft relay → Earth antennas. The watch never talks to Earth directly.
- **Readiness** is a weighted score (HR, SpO₂, temperature, respiration, fatigue, stress, sleep, hydration) capped at 40 when any vital is critical.
- **Risk engine:** 1 warning → MODERATE; ≥2 warnings or 1 critical → HIGH; ≥2 criticals or any life-support critical → CRITICAL (auto-emergency).
- Radiation dose-rate magnitudes are based on published measurements (≈0.5 mSv/day LEO, ≈1.8 deep-space cruise, ≈1.4 lunar surface, ≈0.64 Mars surface); career limit 600 mSv.

Keyboard: `H` = home, `Backspace` = back, `Esc` = close drawer. Hold buttons also work with a held Space/Enter.

---

## Project structure

```
index.html          markup for all sections + the wrist unit + controls drawer
css/base.css        tokens, typography, top bar, drawer, shared controls
css/dashboard.css   hero, telemetry grid, info sections, DESKTOP/WRIST modes
css/watch.css       physical unit + every watch screen
js/config.js        DATA: thresholds, scenarios (Earth/Moon/Mars × phase), events, demo script
js/sim.js           SIMULATION: physiology & suit model, consumables, nav, dose
js/assess.js        ALERTS: status classes, readiness score, risk engine, alert log, emergency controller
js/ui.js            view-model + declarative bindings (data-t / data-sev / data-chip / data-w), formatting, audio
js/charts.js        canvas ECG sweep, sparklines, light-time strip
js/watch.js         WATCH INTERFACE: router, screen templates, hold-to-confirm, messages
js/dashboard.js     desktop telemetry rendering
js/controls.js      simulation controls + demo engine
js/main.js          NAVIGATION/boot: main loop (10 Hz physics, 4 Hz UI, 1 Hz history), view switching
serve.py / start.*  local server on 127.0.0.1
```

Plain HTML/CSS/JavaScript, no dependencies. Tested in current Chrome; uses `color-mix()`, `:has()` and CSS `zoom` (Chrome/Edge, Safari 16.4+, Firefox 126+).
