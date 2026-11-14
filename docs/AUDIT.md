# AMWS Phase 1 Audit

## Vitals & Health Monitoring

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| Heart rate (HR) | **YES** — Elevated HR indicates high workload, stress, or medical issue affecting EVA capability and consumables rate | PARTIAL — threshold ranges exist in NASA standards, but current values are "loosely based" per config.js | **REWORK** — Find exact NASA medical thresholds |
| SpO₂ (blood oxygen) | **YES** — Direct indicator of O₂ delivery, critical for crew safety. Low SpO₂ requires immediate action | PARTIAL — 94% warning threshold is clinical standard, needs NASA flight rule verification | **REWORK** — Verify NASA EVA SpO₂ limits |
| Body temperature | **YES** — Hypo/hyperthermia affects performance and is life-threatening. Drives cooling system decisions | PARTIAL — Normal range loosely clinical, needs NASA suit thermal limits | **REWORK** — Source NASA core temp limits for EVA |
| Respiration rate | **YES** — Abnormal respiration indicates CO₂ issues, stress, or medical problem | PARTIAL — 12-20/min is clinical normal, needs NASA verification | **REWORK** — Verify NASA respiration thresholds |
| "Stress" index (derived) | **NO** — Simulated metric with no stated physiological model or validation. Would not be trusted for decisions without validation | NO — Described as "not a diagnosis," formula is ad-hoc (HR + CO₂ + SpO₂ weighted) | **CUT** — No defensible model, crew wouldn't trust it |
| "Fatigue" index (derived) | **NO** — Same issue as stress: no validated model, not actionable | NO — Ad-hoc formula combining HR, sleep, hydration | **CUT** — Unvalidated metric |
| Hydration | **MAYBE** — Important for performance, but real-time hydration sensing is difficult. If shown, needs source | NO — No sensor tech or threshold cited | **CUT or REWORK** — Cut unless we find NASA hydration monitoring research |
| Sleep hours | **YES** — Sleep deprivation affects performance, NASA tracks this | PARTIAL — 7+ hours as "good" is general guidance, needs NASA fatigue countermeasures citation | **REWORK** — Source NASA sleep requirements and circadian research |
| "Mental load" label | **NO** — Just a UI presentation of the "stress" metric | NO | **CUT** — Goes with stress metric |

## Suit & Life Support

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| Suit pressure (PSI) | **YES** — Critical parameter. Low pressure = leak = immediate abort. Drives leak checks and DCS risk | PARTIAL — 4.3 PSI cited (EMU value), but thresholds not sourced | **REWORK** — Source EMU/xEMU pressure specs and leak rate thresholds |
| CO₂ level (ppCO₂ mmHg) | **YES** — Direct threat to crew, drives scrubber decisions | PARTIAL — Config shows 4 mmHg normal, 7.6 critical. Need NASA SMAC limits | **REWORK** — Source NASA SMAC CO₂ limits for EVA |
| O₂ supply (%) | **YES** — Consumable that determines EVA duration and return margin | YES — General concept valid, but consumption model needs validation | **REWORK** — Model O₂ consumption with NASA EVA rates |
| Suit temperature | **YES** — Thermal comfort and safety, drives LCVG settings | PARTIAL — Range seems reasonable but not sourced | **REWORK** — Source suit thermal control limits |
| Suit battery (%) | **YES** — Powers life support, determines EVA duration | PARTIAL — Concept valid, 8h nominal mentioned but not sourced | **REWORK** — Source EMU/xEMU power system specs |
| "O₂ time remaining" | **YES** — Critical decision metric for return timing | PARTIAL — Formula present but not validated against NASA models | **REWORK** — Validate consumption model vs NASA data |
| "Battery time remaining" | **YES** — Same as O₂ time | PARTIAL | **REWORK** |
| Helmet seal status | **YES** — Unsealed helmet = no pressure = emergency | Concept valid | **KEEP** — Simple boolean based on pressure |
| "Integrity" status | **NO** — Redundant with pressure reading | Derived from pressure | **CUT** — Amendment: No rework, cut entirely |

## Return Margin & Navigation

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| **Return margin (consumables − walkback time)** | **YES** — THE key EVA decision metric. This is the app's strongest feature | PARTIAL — Concept is correct, but walkback speed (2.5 km/h) not sourced | **KEEP & REWORK** — Source suited walking speed from NASA EVA studies |
| Habitat distance | **YES** — Needed to calculate walkback time | Simulation valid for concept | **KEEP** — Sourced walkback speed needed |
| Habitat bearing | **YES** — Direction home | Valid | **KEEP** |
| Walkback time estimate | **YES** — Critical for margin calculation | Depends on sourced walking speed | **KEEP & REWORK** |
| Current heading | **YES** — Directional awareness | Valid for surface EVA | **KEEP** |
| Radar-style navigation display | **YES** — Visual situational awareness for surface ops | Concept valid (beacon nav, not GPS — honest) | **KEEP** — Good example of appropriate tech for Moon/Mars |
| Rover position | **MAYBE** — Useful if rover is an asset, but adds complexity | Not essential for core demo | **CUT** — Focus on hab return |
| "Terrain" description | **NO** — Descriptive text doesn't change decisions | Static text | **CUT or SIMPLIFY** — Don't need "rock density medium" |

## Communication

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| One-way light time delay | **YES** — Defines autonomy requirement, affects procedure execution | PARTIAL — 1.3s Moon, 3-22min Mars cited but need orbital geometry validation | **REWORK** — Source actual Earth-Moon/Mars distances and light-time |
| Round-trip time | **YES** — Clarifies "no help from Earth" timeframe | Derived from one-way | **KEEP** |
| Signal strength / link status | **YES** — Determines if Earth contact possible | Concept valid but degradation/LOS criteria not sourced | **REWORK** — Source comm link budget / relay requirements |
| Communication relay path description | **YES** — Educational and honest (wrist → suit → hab → orbiter → Earth) | Architecture is realistic | **KEEP** — This is good transparency |
| Message composition (canned messages) | **YES** — Practical for gloved operation | Concept valid | **KEEP** — Example of good HF design |
| Message log with in-transit times | **YES** — Shows delay impact, reinforces autonomy need | Concept valid | **KEEP** |
| Light-time visualization strip | **MAYBE** — Pretty but decorative. Data already shown as text | No functional value | **CUT or SIMPLIFY** — Delay already shown numerically |

## Radiation

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| Career dose limit (600 mSv) | **YES** — Real constraint on mission assignments | PARTIAL — 600 mSv cited as "NASA 2022 standard" but needs verification | **REWORK** — Verify current NASA dose limit policy (NASA-STD-3001) |
| Current dose rate (µSv/h) | **YES** — Informs radiation exposure risk | PARTIAL — Magnitudes cited (LEO 0.5, Mars 0.64 mSv/d) but need sources | **REWORK** — Source dose rates from MSL/RAD, ISS, lunar measurements |
| Mission total dose | **YES** — Tracks against career limit | Depends on sourced rates | **REWORK** |
| Solar particle event (SPE) alert | **YES** — Requires immediate shelter, critical alert | Concept valid, but onset/magnitude not modeled realistically | **REWORK** — Source SPE characteristics and shelter protocols |
| "Radiation elevated" state | **MAYBE** — 3.5× multiplier seems arbitrary | No source for this intermediate level | **CUT or REWORK** — Either SPE or normal, unless we can source elevated scenario |

## Mission Readiness & Risk Engine

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| Readiness score (weighted %) | **NO** — Custom scoring formula with arbitrary weights. Not a NASA system | NO — Weights invented for demo (e.g., SpO₂ 20%, HR 15%) | **CUT** — Replaces actionable individual vitals with single number. Removes nuance |
| Readiness ring visualization | **NO** — Eye candy for readiness score | N/A | **CUT** — Goes with readiness score |
| Risk level (LOW/MODERATE/HIGH/CRITICAL) | **MAYBE** — Concept of escalating caution/warning/emergency valid, but specific combinatorics (1 warning = MODERATE, 2 warnings = HIGH) are invented | PARTIAL — Escalation logic invented but follows general C&W philosophy | **REWORK** — Simplify to caution/warning/emergency aligned with NASA C&W standards |
| Alert prioritization queue | **YES** — Displaying most critical issue first is valid HF design | Concept valid | **KEEP** — Ensure it shows the right action |
| Auto-emergency trigger | **YES** — Automatic safeguard when multiple critical parameters breached makes sense | Logic invented but concept valid | **KEEP & SIMPLIFY** — Clarify triggers with sourced thresholds |

## Watch Screens

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| Home screen | **YES** — Overview, critical alerts visible | Valid | **KEEP & SIMPLIFY** — Remove readiness score, keep vitals summary |
| Vitals screen | **YES** — Detail view of physiological data | Valid | **KEEP & REWORK** — Remove stress/fatigue |
| Suit screen | **YES** — Life support detail | Valid | **KEEP** |
| Mission screen | **MAYBE** — MET, next event countdown | MET is real, "next event" is simulated schedule | **KEEP & SIMPLIFY** — Keep MET, remove or simplify event list |
| Nav screen | **YES** — Return margin & direction | Valid for surface | **KEEP** |
| Comms screen | **YES** — Delay info, messaging | Valid | **KEEP** |
| Alerts screen | **YES** — List of active issues with actions | Valid | **KEEP** |
| Emergency screens (Contact Earth, Life Support, Return, Medical) | **YES** — Offline procedures concept is exactly right for delay scenario | Life support checklist is illustrative, not real procedure | **KEEP & REWORK** — Make checklist more realistic or clearly label as concept |

## Desktop "Mission Control" View

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| ECG waveform | **NO** — Visual decoration. "Not diagnostic" per app. Real ECG would require medical expertise to interpret | NO — Synthetic waveform for visual effect | **CUT** — Claimed not diagnostic, so it's decorative. Keep for wrist vitals only if it adds value |
| Sparklines for trends | **YES** — Trend over time more useful than instant value | Valid visualization | **KEEP** — Helps show SpO₂ falling, CO₂ rising |
| Event log (MET timestamps) | **MAYBE** — Useful for post-EVA review but not for real-time decisions | Valid concept | **KEEP** — Provides context |
| Readiness factors breakdown table | **NO** — Expands the invented readiness score | N/A | **CUT** — Goes with readiness score |
| Status table (suit environment) | **YES** — Consolidated view of life support params | Valid | **KEEP** |

## Informational Sections (HTML body)

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| "01 WRIST COMPUTER" hero section | **NO** — Marketing/presentation copy, not data | N/A | **SIMPLIFY** — Brief intro only, move details to docs |
| "02 LIVE ASTRONAUT STATUS" dashboard | **YES** — Actual UI | N/A | **KEEP** |
| "03 THE SYSTEM" architecture explainer | **NO** — Educational but doesn't inform decisions. More appropriate for documentation | Valid info but not functional | **CUT from main UI** — Move to separate docs page or README |
| "04 DEEP-SPACE BENEFITS" explainer | **NO** — More marketing/educational content | Some valid points but not functional | **CUT from main UI** — Move to README |
| Demo scenario panel | **MAYBE** — Needed for judges to see app in action, but not part of flight UI | N/A | **KEEP** — Essential for demo, but visually separate it as "presenter control" |

## Simulation Controls Drawer

| Item | Used in real mission decision? | Backed by real data? | Verdict |
|------|-------------------------------|---------------------|---------|
| All sliders & scenario controls | **NO** — Presenter tooling, not crew-facing | N/A | **KEEP** — Needed for demo, clearly labeled as sim controls |
| Demo START/PAUSE/RESET | **NO** | N/A | **KEEP** |
| Alarm tone toggle | **NO** — Convenience feature, not meaningful for sourcing | N/A | **KEEP** — Useful for demo |
| Auto-emergency toggle | **NO** | N/A | **KEEP** |

---

## Summary & Open Questions

### HIGH PRIORITY KEEP (with rework to source data)
- **Return margin** (consumables vs walkback) — The app's killer feature
- Suit pressure, O₂, CO₂, battery with time-remaining calculations
- Communication delay and relay path (honest, educates about autonomy)
- Radiation dose tracking vs career limit
- Alert queue with recommended actions
- Offline emergency procedures concept
- All watch screens except those depending on cut metrics

### CUTS (unsourced, decorative, or misleading)
- **Readiness score** — Invented weighting, obscures individual vitals
- **Stress and fatigue indices** — No model, not validated, wouldn't be trusted
- Hydration real-time monitoring (unless we find a source)
- Rover position on nav (adds clutter)
- Decorative terrain descriptions
- ECG waveform (keep only if it shows HR visually, not as "diagnostic")
- Light-time visualization strip (keep numeric delay)
- Marketing sections 03 & 04 from main UI (move to docs)
- "Mental load" UI element
- Readiness ring and factor breakdown

### REWORK (concept valid, need real numbers)
- All vital sign thresholds → NASA-STD-3001, flight medical standards
- Suit pressure, O₂, CO₂ limits → EMU/xEMU specs, NASA SMACs
- Radiation dose rates → ISS, MSL/RAD, lunar mission measurements
- Walkback speed → NASA EVA mobility studies
- Communication delay → Real Earth-Moon/Mars orbital distances
- Sleep requirements → NASA HRP fatigue countermeasures
- SPE handling → NASA radiation storm protocols
- Risk level simplification → Align with NASA C&W (caution/warning/emergency)

### KEY DECISION for Phase 2
**Question:** Keep or cut the desktop "mission control" view?
- **Keep argument:** Shows data richly, useful for ground support concept, demonstrates data that could be telemetered
- **Cut argument:** Adds scope, not the core wrist device, duplicates watch screens
- **Recommendation:** **KEEP but simplify** — It's valuable to show the same data in two contexts (crew vs ground), demonstrates telemetry concept, and makes the simulation more demo-able. Remove readiness score elements.

### Files needing change
- `js/config.js` — All thresholds, scenario data, dose rates
- `js/sim.js` — O₂/battery consumption models, walkback model
- `js/assess.js` — Readiness score (cut), risk engine (simplify), alert rules (verify)
- `js/ui.js` — Remove stress/fatigue/readiness UI bindings
- `js/watch.js` — Remove vitals screen stress/fatigue rows
- `index.html` — Cut sections 03 & 04 from body, simplify hero
- `css/*.css` — Remove unused styles after cuts

---

**Next:** Await approval to proceed to Phase 2 (research & sourcing), or discuss any contested cuts/keeps.
