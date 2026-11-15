# AMWS — Astronaut Mission Wrist System

**Live demo:** https://amws.vercel.app  
**Repository:** https://github.com/naeldavid/AMWS_nasa-spaceapps-project (branch: `nael`)

AMWS is a concept prototype of a wrist-mounted mission computer for astronauts during EVA and transit on the Moon, Mars, and beyond. It helps crews answer the questions that matter in real time: **Can I get back safely? What is failing? How long until Earth can respond?** All telemetry is **simulated locally in the browser**. This is **not** a medical device or flight-certified system.

Built for the **NASA International Space Apps Challenge** — *Wearable Technology for Astronaut Health and Safety*.

---

## The problem

On planetary EVAs, crews operate with limited consumables, communication delays, and no immediate rescue. Existing status displays can overwhelm operators with raw numbers; what astronauts need is **actionable margin** (time/resources left to return), clear severity, and procedures that work when Earth is minutes or tens of minutes away.

## Our solution

AMWS combines a **glove-friendly wrist UI** with a **Ground/Flight Controller view** in one browser-based prototype:

- **Return Margin (hero metric):** time beyond walkback based on the *limiting consumable* at walkback metabolic rates (sourced/assumption-tagged paces), not just current EVA burn — directly supports abort/return decisions.
- **Delay-aware operations:** Earth link status and one-way/round-trip delay are always visible; emergency flows emphasize local actions and crew coordination when replies are too slow.
- **Suit + life support awareness:** O₂, battery, coolant/scrubber context, pressure, CO₂ (ppCO₂), and alerts prioritized by severity.
- **Vitals + trends:** heart rate, SpO₂, respiration, temperature with sparklines and threshold states (clinical thresholds labeled **ASSUMED** where no public NASA flight-rule source is used).
- **Radiation & environment context:** dose rate/mission totals, career-limit context, and illustrative SPE state handling.
- **Crew-ready interactions:** large hit areas, hold-to-confirm for dangerous actions, physical/edge controls, persistent simulation disclaimer, and severity encoding by shape/fill/icon/word (not color alone).

Every numeric assumption is documented in-app/config and in source docs; sourced values are cited to NASA/NTRS/MSL-RAD references.

---

## Screenshots

| Desktop / Ground view | Wrist computer |
|---|---|
| ![Desktop view](assets/screenshots/desktop.png) | ![Wrist view](assets/screenshots/wrist.png) |

---

## Run it

**Live:** https://amws.vercel.app

**Locally (no build, no install):**
1. Open `index.html` directly in Chrome/Edge/Safari, or serve:
   ```bash
   python3 -m http.server 8080
   ```
2. Open `http://localhost:8080`.
3. Add `?view=wrist` to start in wrist mode.

**Keyboard:** `H` home · `Backspace` back · `Esc` close Presenter drawer.

---

## 60-second demo (for judges)

1. Open the app and click **PRESENTER** (top right) → **▶ START** (Mars surface EVA scenario).
2. **~8 s:** metabolic rate rises.
3. **~20 s:** CO₂ climbs, SpO₂ falls, return margin tightens.
4. **~32 s:** battery drain accelerates — **BATTERY** becomes the limiting resource.
5. **~42 s:** suit pressure begins a slow decay.
6. **~55–62 s:** pressure/CO₂ thresholds trigger **auto-EMERGENCY**.
7. On the wrist: open **Emergency** actions — **Contact Earth**, **Life Support** checklist, **Return to Hab**, **Medical Data**.
8. Click **⟳ RESET** to restore nominal.

---

## What’s in the prototype

**Wrist computer (fitness-band form factor):** Home, Vitals, Suit, Mission, Nav, Comms (+ composer), Alerts, Emergency (Contact Earth, Life Support checklist, Return to Hab, Medical Data). Edge controls include Home/Back and guarded Emergency hold.

**Ground / Flight Controller view:** Return Margin hero, Consumables, Vitals + sparklines, Comms delay/link, Radiation, Active Alerts, Event Log (4 Hz UI updates).

**Presenter Tool:** demo start/pause/reset, scenario selectors, SPE/comm/time controls, auto-emergency toggle — clearly separated from crew UI.

---

## Data honesty & sources

- Values are **sourced** (cited), **ASSUMED** (explicitly tagged), or **ILLUSTRATIVE** (reference scenarios, not predictive). See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) and [docs/SPEC.md](docs/SPEC.md).
- Key sources include NTRS 20070016007 (lunar walkback test), NASA-STD-3001 Vol 1 (career dose limit), NTRS 20150021777 (CO₂ SMAC), NTRS 20230008644 (xEMU pressure), MSL/RAD dose-rate publications, and NASA comms delay references (full list in docs).

---

## Tech

- **Stack:** Vanilla HTML/CSS/JavaScript (no build step, runs offline).
- **Simulation:** deterministic-ish tick loop (physics/UI/history/canvas rates), local-only generated telemetry.
- **Deploy:** Vercel static hosting.

## Tests

```bash
npm test
```
Includes boot smoke, config/sim/assess/demo checks (see `package.json` / `tests/`).

---

## Known limitations

- Illustrative SPE progression (not NOAA S-scale operational logic), no turnaround/time-to-threshold/conjunction countdown, no DONKI/LOLA integration, simplified navigation/walkback assumptions, synthetic cardiac waveform for display only. The standalone risk engine was removed. Details in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).
- README/OG screenshots in-repo were captured from a local build of the deployed commit; automated capture directly from the deployed URL was unavailable in the final verification environment.

## Disclaimer

AMWS is a **design concept / prototype**. Not a certified medical device or flight system. Not approved by NASA, ESA, or any space agency. All readings are generated locally by simulation. Emergency procedures shown are **illustrative**, not NASA-certified flight procedures.

**Team:** MLF #2 · **Members:** Yara El Kassir (Team Owner), Talia El Komy, Naël David, Reem Lougladi, Ahmad Atef, Melek Sanliturk
