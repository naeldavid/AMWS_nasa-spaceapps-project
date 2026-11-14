# AMWS Phase 3 Specification

**Version**: 1.0  
**Date**: November 14, 2026  
**Status**: For Review

---

## Design Principles

1. **Defensible**: Every number sourced from NASA data or explicitly tagged ASSUMPTION
2. **Decision-focused**: Features exist only if they change crew/ground actions
3. **Honest**: No invented metrics; clear about simulation limitations
4. **Glove-operable**: Touch targets ≥56px, hold-to-confirm for critical actions
5. **Autonomous**: Delay-aware design assumes Earth cannot help in real-time

---

## Part 1: Alert Classification System

### NASA C&W Mapping

**Each parameter** classified against its own threshold:

| Level | Definition | Crew Action | Visual |
|-------|------------|-------------|--------|
| **EMERGENCY** | Time-critical LOC/LOM condition | Immediate memory-item response | Red, pulsing |
| **WARNING** | Immediate action required | Quick response, procedure reference | Red |
| **CAUTION** | Attention needed, not immediate | Monitor, plan action | Amber |
| **ADVISORY** | Informational, normal status | Acknowledge | Green/Blue |

**Overall mission status** = highest active classification  
**Auto-emergency trigger**: Emergency-level conditions only (rapid pressure loss, critical O₂, toxic CO₂) per NASA definition

**SOURCE**: NASA HSI Workshop presentations (NTRS 20240003565)  
**Decision impact**: Aligns with NASA operational standards; crew trained on this hierarchy

---

## Part 2: Feature Inventory

### 2.1 HOME SCREEN (Wrist)

#### Return Margin (PRIMARY FEATURE)
- **Display**: Time beyond walkback (e.g., "+47 min" or "−3 min CRITICAL")
- **Calculation**: `min(O₂_time, CO₂_scrubber_time, battery_time) − walkback_time`
- **Limiting resource named**: "O₂ LIMITING" / "BATTERY LIMITING" / "SCRUBBER LIMITING"
- **Walkback time**: Distance ÷ suited_walking_speed (configurable, default Moon 2.5 km/h, Mars 2.0 km/h)
- **Metabolic scaling**: O₂ and CO₂ consumption scaled by HR (proxy for metabolic rate)
- **Classification**:
  - EMERGENCY: <15 minutes margin (immediate return required)
  - WARNING: <30 minutes (return recommended)
  - CAUTION: <60 minutes (plan return)
  - NOMINAL: ≥60 minutes
- **SOURCE**: 
  - 10 km walkback limit: NTRS 20070016007
  - Metabolic rates: Gernhardt 2013 (1000 BTU/hr avg, 2200 peak)
  - EMU consumables: 7-hour nominal (CCTV 2008 EMU specs)
- **ASSUMPTION**: Walking speeds (Moon 2.5 km/h, Mars 2.0 km/h) — configurable pending full walkback report data
- **Decision impact**: Determines when crew must abort EVA and return; THE critical safety metric

#### Highest Active Alert
- **Display**: Top alert by classification (Emergency > Warning > Caution > Advisory)
- **Format**: "[ICON] ALERT_TITLE — Tap for action"
- **Decision impact**: Directs crew attention to most critical issue first

#### Key Vitals Summary
- **Heart Rate**: Value + trend arrow + classification chip
- **SpO₂**: Value + classification chip
- **Suit Pressure**: Value + classification chip
- **CO₂**: Value + classification chip
- **Decision impact**: At-a-glance health and life support status

#### Mission Elapsed Time
- **Display**: "DAY 236 14:23:18"
- **Decision impact**: Context for scheduled events, physiological state (fatigue)

---

### 2.2 VITALS SCREEN

| Metric | Range/Threshold | SOURCE or ASSUMPTION | Classification |
|--------|----------------|---------------------|----------------|
| **Heart Rate** | Normal 50-100 BPM | ASSUMPTION (clinical); NASA flight rules not public | CAUTION >115, WARNING >130, EMERGENCY >150 |
| **SpO₂** | Normal ≥95% | ASSUMPTION (clinical <94% warn, <90% crit) | CAUTION <94%, WARNING <92%, EMERGENCY <90% |
| **Respiration** | Normal 12-20/min | ASSUMPTION (clinical) | CAUTION <10 or >24, WARNING <8 or >30 |
| **Body Temp** | Normal 36.1-37.5°C | ASSUMPTION (clinical) | CAUTION <36 or >38, WARNING <35.5 or >38.5, EMERGENCY <35 or >39 |

**ECG waveform**: Synthetic, visual HR indicator only (not diagnostic, labeled as such)  
**Trend indicators**: 6-minute moving average vs prior period (▲ RISING / ▼ FALLING / ■ STABLE)  
**Decision impact**: Detect physiological stress, overheating, hypoxia; inform workload reduction decisions

**REMOVED**: Stress, fatigue, mental load metrics (no validated model found)

---

### 2.3 SUIT / LIFE SUPPORT SCREEN

| Metric | Threshold | SOURCE | Classification |
|--------|-----------|--------|----------------|
| **Suit Pressure** | 4.3 psi nominal | EMU spec (Wikipedia, multiple sources) | CAUTION <4.1 or >4.7, WARNING <4.0 or >4.9, EMERGENCY <3.5 (breach) |
| **CO₂ Inspired** | Suit inlet <2 mmHg, inspired nominal limit 15 mmHg | NASA Tech Bulletin 02182025, Nature s41526-026-00589-x | CAUTION >5 mmHg, WARNING >10 mmHg, EMERGENCY >15 mmHg |
| **O₂ Supply** | 7 hours nominal | CCTV 2008 EMU specs | CAUTION <25%, WARNING <15%, EMERGENCY <10% |
| **Suit Battery** | 7 hours nominal | CCTV 2008 EMU specs | CAUTION <25%, WARNING <15%, EMERGENCY <10% |
| **Suit Temp** | Nominal 18-26°C | ASSUMPTION (reasonable operating range) | CAUTION <15 or >29, WARNING <12 or >32 |

**Time remaining**: Displayed for O₂ and battery (metabolically scaled by current HR)  
**Helmet seal**: SEALED / CHECK SEAL (derived from pressure <3.5 psi)  
**Decision impact**: Immediate abort criteria (pressure loss, O₂ depletion); scrubber/thermal management

**REMOVED**: "Integrity" status (redundant with pressure), "Hydration" (no real-time monitoring tech sourced)

---

### 2.4 NAVIGATION SCREEN (Surface EVA)

#### Radar Display (Heading-Up)
- **Habitat**: Direction and distance
- **Heading**: Current bearing
- **Walkback time**: Distance ÷ speed
- **SOURCE**: Beacon-based nav concept (realistic for Moon/Mars, not GPS)
- **Decision impact**: Situational awareness, return route planning

#### Return Margin Detail
- **O₂ time**: Based on current metabolic rate
- **Battery time**: Based on current load
- **Scrubber time**: Based on metabolic CO₂ production
- **Limiting resource**: Which hits zero first
- **Margin**: Limiting_time − walkback_time
- **Decision impact**: Determines safe turnaround point

**REMOVED**: Rover position (adds clutter), decorative terrain text

---

### 2.5 COMMUNICATION SCREEN

| Metric | Value | SOURCE | Classification |
|--------|-------|--------|----------------|
| **One-way delay** | Moon 1.3s, Mars 3-22 min | Astronomical constants | N/A (informational) |
| **Round-trip time** | 2× one-way | Calculated | Advisory if >5 min (no real-time help) |
| **Signal strength** | % | Simulated link budget | CAUTION <40%, WARNING <20%, EMERGENCY <5% (LOS) |

**Mars Conjunction Blackout**: 
- State: "MARS CONJUNCTION — COMMAND MORATORIUM"
- Duration: ~2 weeks (command moratorium), 1 day behind disk, 3 days severe degradation
- SOURCE: NASA.gov Nov 2023 article, JPL TMO 42-147
- Decision impact: Autonomous operations requirement, no Earth commanding

**Relay path text**: "Wrist → Suit → Hab → Orbiter → DSN Earth"  
**Message log**: In-transit countdown for outbound, age for received  
**Canned messages**: Pre-set text for gloved operation  
**Decision impact**: Reinforces delay-driven autonomy; realistic comm architecture

---

### 2.6 RADIATION SCREEN

| Metric | Value | SOURCE | Classification |
|--------|-------|--------|----------------|
| **Career dose** | Running total vs 600 mSv limit | NASA-STD-3001 (Radiation Protection Tech Brief) | CAUTION >400 mSv, WARNING >500 mSv |
| **Mission dose** | Accumulated this mission | Integrated from dose rates | N/A (tracking) |
| **Daily dose** | Today's accumulation | Time-integrated | ADVISORY (normal GCR) |
| **Dose rate** | Current µSv/h | Location-dependent baseline | ADVISORY (normal) |

**Dose rates by location** (GCR baseline):
- ISS: 0.42 mSv/day (72 mSv/6mo) — SOURCE: NIH PMC 18582161
- Transit: 1.84 mSv/day — SOURCE: MSL/RAD cruise (USRA Deep Space 2018 paper citing MSL data)
- Lunar surface: 1.4 mSv/day — ASSUMPTION (limited data; Chang'e-4 LND, Apollo-era)
- Mars surface: 0.64 mSv/day — SOURCE: MSL/RAD (Hassler 2014 Science, quoted in Guo workshop paper)

**Solar Particle Event (SPE) Alert**:
- **State**: "SPE DETECTED — SEEK SHELTER NOW"
- **Countdown**: Time since onset (not time-to-shelter, as shelter location varies)
- **Reference scenario**: "Aug 1972 event: ~1 Sv behind 1 g/cm² Al shielding over ~10 hours" (label this as historical reference)
- **SOURCE for reference**: Apollo-era SPE (widely cited in literature as worst-case unshielded scenario)
- **Warning characteristics**: 
  - Detection: Tens of minutes before hazardous levels (NASA 2017 forecasting improvements)
  - Shock arrival: ~12 hours post-solar event (NASA EPACT2 paper)
  - Duration: Hours to days, typically <3 days (NTRS 20140000593)
- **No dose-rate multiplier shown**: Event-dependent, highly variable
- **Decision impact**: Immediate shelter-seeking trigger; mission abort consideration

**NOTE on dose types**: Career limit (600 mSv) is effective dose (biologically weighted); displayed dose rates are dose equivalent (Sv with quality factors). For GCR, these are approximately equal. Clarify in UI if needed.

---

### 2.7 MISSION / TIMELINE SCREEN

| Element | Value/SOURCE | Decision Impact |
|---------|-------------|-----------------|
| **MET** | Mission Elapsed Time (DAY HH:MM:SS) | Context for scheduled events |
| **EVA Elapsed** | Time since current EVA start | Consumables planning |
| **EVA Planned** | Configurable duration (e.g., 6 hours) | CAUTION if elapsed >90% planned, WARNING if >100% |
| **Next Event** | Countdown to scheduled milestone | Planning aid |
| **Phase** | Surface/Transit/Landing | Environmental context |
| **Location** | Moon/Mars/Earth orbit | Gravity, comms, radiation context |

**Sleep status**: 
- **Display**: "LAST SLEEP: 7h 30m — 14 hours ago"
- **SOURCE for requirements**: ASSUMPTION (7-9 hours general guidance; NASA-STD-3001 not accessed)
- **Classification**: CAUTION if <6 hours in last 24h, WARNING if <4 hours
- **Decision impact**: Fatigue awareness, workload reduction
- **NOTE**: If no citable NASA sleep standard found, CUT this element per amendments

---

### 2.8 ALERTS SCREEN

**Display**: List of active alerts sorted by classification (Emergency → Warning → Caution → Advisory)

**Each alert shows**:
- Classification icon + color
- Title (e.g., "SUIT PRESSURE LOW")
- Recommended action (e.g., "Leak check · secondary O₂ open · return to habitat")
- Timestamp (MET)
- Acknowledge button

**Nominal status tiles**: When no alerts in a category, show:
- "LIFE SUPPORT NOMINAL"
- "VITALS WITHIN LIMITS"
- "ENVIRONMENT NORMAL"

**Decision impact**: Prioritized action queue; situational awareness

---

### 2.9 EMERGENCY SCREEN

**Trigger conditions** (auto-emergency only for these):
- Suit pressure <3.5 psi (rapid depress)
- CO₂ inspired >15 mmHg (toxic atmosphere)
- O₂ supply <10% (critical life support)
- Return margin <0 (consumables exhausted before reaching habitat)

**Display**:
- Large EMERGENCY banner
- Reason + time since activation
- Key vitals snapshot (HR, SpO₂, O₂, CO₂, Pressure, Battery)
- Procedure quick-links:
  - CONTACT EARTH (with delay warning: "Earth cannot respond in time — follow local procedure")
  - LIFE SUPPORT (checklist: Stop activity, secondary O₂, switch scrubber, max cooling, notify crew, start return)
  - RETURN TO HAB (direction arrow, distance, walkback time, margin)
  - MEDICAL DATA (vitals snapshot for transmission)

**Hold-to-cancel**: 1.6-second hold prevents accidental deactivation

**Decision impact**: Structured emergency response; offline procedure support; delay-aware comms

---

### 2.10 DESKTOP MISSION CONTROL VIEW

**Reframed as**: "Ground / Flight Controller View"  
**Purpose**: Same telemetry as wrist device, expanded presentation for ground support or habitat monitoring

**Keep**:
- All vital and suit parameters with sparkline trends
- Alert log with MET timestamps
- ECG sweep (visual HR, labeled not diagnostic)
- Radiation dose tracking vs career limit
- Communication status and delay visualization
- Environmental parameters (location, gravity, phase)

**Remove**:
- Readiness score ring and factor breakdown (cut per audit)
- Stress/fatigue derived metrics (cut per audit)
- Marketing sections 03 & 04 (move to README or separate docs page)

**Decision impact**: Telemetry visibility for remote support; demonstrates data that could be relayed to ground

---

### 2.11 DEMO / PRESENTER CONTROLS

**Isolated in**:
- Separate drawer UI (clearly labeled "SIMULATION CONTROLS — PRESENTER TOOL")
- Separate code section (controls.js)
- Not part of crew-facing interface

**Includes**:
- Demo scenario START/PAUSE/RESET (Mars EVA degradation sequence)
- Manual parameter sliders (for testing/demonstration)
- Location/phase/radiation level selection
- Time acceleration (for demo compression)
- Auto-emergency toggle
- Alarm tone toggle
- TRIGGER EMERGENCY button (for demonstration)

**Decision impact**: Essential for judging/demonstration; clearly not a flight feature

---

## Part 3: Cut Features

| Feature | Reason for Cut | Audit Verdict |
|---------|---------------|---------------|
| **Readiness score** | Invented weighting with no NASA model; obscures individual vitals | CUT |
| **Stress index** | No validated physiological model found | CUT |
| **Fatigue index** | No validated physiological model found | CUT |
| **Mental load** | Derived from stress index | CUT |
| **Hydration real-time monitoring** | No sensor tech or monitoring method sourced | CUT |
| **Integrity status** | Redundant with suit pressure reading | CUT (per amendment 1) |
| **Readiness ring visualization** | Visualizes cut readiness score | CUT |
| **Readiness factor breakdown** | Expands cut readiness score | CUT |
| **"Radiation elevated" 3.5× state** | Arbitrary multiplier; replaced with GCR baseline + SPE alert | CUT (per amendment 2) |
| **Rover position on nav** | Adds clutter; not essential for return decision | CUT |
| **Decorative terrain text** | "Rock density medium" doesn't change decisions | CUT |
| **Light-time visualization strip** | Delay already shown numerically; decorative | CUT |
| **Marketing sections 03 & 04** | Educational content, not functional | Move to README |
| **Sleep tracking** | IF no NASA standard citable, CUT per amendment 5 | Conditional CUT |

---

## Part 4: Simulation Model Updates

### O₂ Consumption
- **Formula**: `rate = base_rate × (HR_current / HR_baseline) × pressure_factor`
- **Baseline**: 100% lasts 7 hours at 75 BPM resting
- **Pressure adjustment**: Increased consumption if pressure <4.0 psi (compensatory breathing)
- **SOURCE**: 7-hour nominal from EMU specs; metabolic scaling from Gernhardt 2013

### CO₂ Production
- **Formula**: `production = base_production × (HR_current / HR_baseline)`
- **Scrubber capacity**: 8-hour nominal at average workload
- **Tracking**: Accumulated CO₂ load vs scrubber capacity
- **SOURCE**: xPLSS CDHCU design (3.8 mmHg avg over 8 hours, NTRS 20170010189)

### Battery Drain
- **Formula**: `drain = base_drain × power_load_factor`
- **Nominal**: 7 hours at standard load
- **Increased load**: Higher metabolic rate → more LCVG pump/fan demand
- **SOURCE**: EMU battery 7-hour spec

### Walkback Time
- **Formula**: `time = distance / speed`
- **Speed**: Configurable per location (default Moon 2.5 km/h, Mars 2.0 km/h)
- **Metabolic penalty**: Speed reduced if HR >130 BPM (fatigue)
- **SOURCE**: 10 km limit from NTRS 20070016007; speed ASSUMPTION (configurable)

### Radiation Accumulation
- **Formula**: `dose_today += dose_rate × Δt`
- **Dose rates**: Location-dependent GCR baseline (see §2.6)
- **SPE**: Alert state only (no dose accumulation in sim; too event-specific)
- **SOURCE**: Rates from MSL/RAD, ISS dosimetry

---

## Part 5: Implementation Notes

### Config File Structure (js/config.js)
All sourced constants with inline comments:
```javascript
// Suit pressure: 4.3 psi EMU operational spec
// SOURCE: Wikipedia EMU, NASA fact sheets (see docs/DATA_SOURCES_VERIFIED.md #1)
SUIT_PRESSURE_NOMINAL: 4.3, // psi

// CO2 limits: Cabin vs suit separated
// Cabin SMAC: 10 mmHg (24h), 5.3 mmHg (7-180d) — NASA SMAC docs
// Suit inspired limit: 15 mmHg nominal — NASA standards (Nature s41526-026-00589-x)
// SOURCE: see docs/DATA_SOURCES_VERIFIED.md #3, #4
CO2_CABIN_SMAC_24H: 10,      // mmHg ppCO2
CO2_CABIN_SMAC_180D: 5.3,    // mmHg ppCO2
CO2_SUIT_INSPIRED_LIMIT: 15, // mmHg

// ASSUMPTION: Clinical vital thresholds (NASA flight rules not public)
HR_CAUTION_HI: 115,  // BPM
HR_WARNING_HI: 130,  // BPM
HR_EMERGENCY_HI: 150, // BPM
// (etc.)

// ASSUMPTION: Walking speeds pending full walkback report
WALK_SPEED_MOON: 2.5,  // km/h, configurable
WALK_SPEED_MARS: 2.0,  // km/h, configurable
```

### Alert Rule Generation (js/assess.js)
Each parameter evaluated independently:
```javascript
function classifyParameter(key, value) {
  const limits = LIMITS[key];
  if (value < limits.emergencyLo || value > limits.emergencyHi) return 'EMERGENCY';
  if (value < limits.warningLo || value > limits.warningHi) return 'WARNING';
  if (value < limits.cautionLo || value > limits.cautionHi) return 'CAUTION';
  return 'NOMINAL';
}
```

Overall status = max(all active classifications)

### UI Updates
- Remove readiness score ring from dashboard
- Remove stress/fatigue rows from vitals
- Add limiting resource label to return margin
- Update risk classification labels (Emergency/Warning/Caution/Advisory)
- Add SPE alert state with reference scenario
- Separate demo controls visually (border, label "PRESENTER TOOL")

---

## Part 6: README Updates

### Data Sources Section
"All numeric values in this simulation are sourced from NASA technical documents, published mission data, or peer-reviewed research. See `docs/DATA_SOURCES_VERIFIED.md` for complete source list with URLs and quotes."

### Known Limitations / Assumptions
- Vital sign alarm thresholds use clinical medical standards (NASA flight rules not publicly detailed)
- Suited walking speeds are engineering estimates based on operational constraints (Moon 2.5 km/h, Mars 2.0 km/h) — configurable
- Core temperature monitoring uses clinical hyperthermia/hypothermia thresholds
- Sleep requirements based on general human health guidance (NASA-STD-3001 not accessed)
- All data is SIMULATED; this is not a medical device or certified flight system

### Features List
- Return margin calculation (O₂/battery/scrubber vs walkback time)
- NASA C&W-aligned alert classification (Emergency/Warning/Caution/Advisory)
- Sourced radiation dose tracking (600 mSv career limit, location-specific GCR rates, SPE alert)
- Delay-aware communication (realistic light times, Mars conjunction blackout)
- Offline emergency procedures (no real-time Earth help assumption)
- Glove-operable interface (≥56px targets, hold-to-confirm)

---

## Part 7: Verification Checklist

- [ ] Every config constant has inline SOURCE or ASSUMPTION comment
- [ ] Every assumption in code matches docs/DATA_SOURCES_VERIFIED.md
- [ ] All cut features removed from code, CSS, HTML (no dead code)
- [ ] Alert classification uses Emergency/Warning/Caution/Advisory consistently
- [ ] Auto-emergency triggers only for time-critical LOC/LOM conditions
- [ ] Return margin displays limiting resource name
- [ ] SPE shows reference scenario, not dose-rate multiplier
- [ ] Mars conjunction shows both "1 day behind disk" and "~2 weeks moratorium" context
- [ ] Demo controls visually separated and labeled
- [ ] README updated with data sources section and assumptions list
- [ ] Zero console errors in Chrome
- [ ] All removed features have no lingering UI references

---

## Summary

**Core value proposition**: Return margin calculation with sourced data  
**Alignment**: NASA C&W operational standard  
**Honesty**: ASSUMPTION tags where NASA data unavailable  
**Cuts**: 12 features removed (unsourced or low decision-value)  
**Additions**: Limiting resource identification, EVA planned vs elapsed, SPE reference scenario  

**Ready for approval before implementation.**
