# AMWS Specification

**Version**: 1.2  
**Date**: November 14, 2026

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
**Auto-emergency trigger**: ONLY for rapid pressure loss (<3.5 psi), toxic CO₂ (>15 mmHg), and critical O₂ (<10%)

**Emergency SCREEN relationship**: Auto-emergency conditions trigger the emergency screen immediately. Crew can also manually navigate to the emergency screen for procedures/checklists even if no auto-emergency is active.

**SOURCE**: NASA HSI Workshop presentations (NTRS 20240003565)  
**Decision impact**: Aligns with NASA operational standards; crew trained on this hierarchy

---

## Part 2: Feature Inventory

### 2.1 HOME SCREEN (Wrist)

#### Return Margin (PRIMARY FEATURE)
- **Display**: Time beyond walkback (e.g., "+47 min" or "CANNOT REACH HAB")
- **What this tells crew**: How much buffer exists before consumables run out during return walkback
- **Calculation**: 
  - Consumable time remaining at walkback metabolic burn rate (NOT current EVA rate)
  - `min(O₂_time_walkback, battery_time_walkback, scrubber_time_walkback, coolant_time_walkback) − walkback_duration`
- **Limiting resource named**: "O₂ LIMITING" / "BATTERY LIMITING" / "SCRUBBER LIMITING" / "COOLANT LIMITING"
- **Walkback scenario**: Uses sourced walkback pace and metabolic rate (NOT current crew rate)
  - **Lunar test pace**: 6.3 km/h at 2374 BTU/hr (sourced)
  - **Lunar cooling-limited pace**: Configurable lower speed/metabolic rate (ASSUMPTION)
  - **Mars pace**: Configurable (ASSUMPTION; no sourced Mars 10 km walkback data)
- **Display options**: Show margin as range across paces (test vs cooling-limited)
- **Alert generation** (from margin, NOT from margin class):
  - Margin <60 min → CAUTION alert
  - Margin <30 min → WARNING alert (anchored to EMU 30-min emergency reserve)
  - Margin <0 min → WARNING "CANNOT REACH HAB" (top priority queue; NO Emergency class)
- **SOURCE**: 
  - 10 km walkback limit: NTRS 20070016007
  - Walkback test data: Vos, Gernhardt, Lee (Jan 2007 preliminary report, 07ICES-9 / SAE 2007-01-3133)
    - Available at: https://ntrs.nasa.gov/citations/20070016007
    - 6 astronauts, MK III suit at 4.3 psig, lunar gravity (1/6 g) simulator
    - 10 km completed in avg 95.8 min at avg 3.94 mph (6.3 km/h)
    - Avg metabolic rate 2374 BTU/hr (~10 kcal/min), max 15-min avg 2617 BTU/hr
    - Total 944 kcal, both averages "exceed Apollo and EMU cooling capabilities"
    - Subjects wanted to go faster but were cooling-limited
    - Scenario: 10 km return after ~4 h surface activity
  - EMU 30-min emergency reserve: CCTV 2008 EMU specs
- **CONFIDENCE**: HIGH for walkback pace/metabolic (sourced NASA test); ASSUMPTION for cooling-limited pace and Mars pace (configurable)
- **CAVEAT**: Walkback test was preliminary quicklook, level treadmill, offloaded gravity simulator, prototype MK III suit, lunar only; final NASA/TP-2009-214796 report may differ
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
- **Decision impact**: Context for scheduled events, physiological state

---

### 2.2 VITALS SCREEN

| Metric | Range/Threshold | SOURCE or ASSUMPTION | Classification |
|--------|----------------|---------------------|----------------|
| **Heart Rate** | EVA workload typical range | ASSUMPTION (derived from metabolic rate model; NASA flight rules not public) | ASSUMPTION: CAUTION >125 BPM, WARNING >140 BPM, EMERGENCY >155 BPM |
| **SpO₂** | Normal ≥95% | ASSUMPTION (clinical <94% warn, <90% crit) | ASSUMPTION: CAUTION <94%, WARNING <92%, EMERGENCY <90% |
| **Respiration** | EVA workload elevated | ASSUMPTION (EVA metabolic demand, not resting 12-20/min) | ASSUMPTION: CAUTION <12 or >35, WARNING <10 or >40 |
| **Body Temp** | Normal 36.1-37.5°C | ASSUMPTION (clinical hypo/hyperthermia) | ASSUMPTION: CAUTION <36 or >38, WARNING <35.5 or >38.5, EMERGENCY <35 or >39 |

**Thresholds rationale**: HR derived from metabolic model (not sourced EVA HR ranges); SpO₂ and temp use clinical standards; resp adapted for EVA workload context. NASA flight rules exist but not publicly detailed.

**Optional future enhancement** (low priority): Walkback test termination criterion was sustained HR/VO₂ >85% of peak; could implement relative-intensity HR alerts based on configurable crew HRmax (tagged ASSUMPTION).

**Trend indicators**: 6-minute moving average vs prior period (▲ RISING / ▼ FALLING / ■ STABLE)  
**Decision impact**: Detect physiological stress, overheating, hypoxia; inform workload reduction decisions

**REMOVED**: Stress, fatigue, mental load metrics (no validated model found)

---

### 2.3 SUIT / LIFE SUPPORT SCREEN

| Metric | Threshold | SOURCE or ASSUMPTION | Classification |
|--------|-----------|----------------------|----------------|
| **Suit Pressure** | 4.3 psig nominal (MK III) | Walkback report (NTRS 20070016007): MK III designed for 4.3 psig (max 8 psig most components) | ASSUMPTION: CAUTION <4.1 or >4.7, WARNING <4.0 or >4.9, EMERGENCY <3.5 (rapid breach) |
| **CO₂ Inspired** | 15 mmHg nominal limit | NASA Tech Bulletin 02182025, Nature s41526-026-00589-x | ASSUMPTION: CAUTION >5 mmHg, WARNING >10 mmHg (source: none); EMERGENCY >15 mmHg (sourced) |
| **O₂ Supply** | 7 hours nominal | CCTV 2008 EMU specs | ASSUMPTION: CAUTION <25%, WARNING <15%, EMERGENCY <10% |
| **Suit Battery** | 7 hours nominal | CCTV 2008 EMU specs | ASSUMPTION: CAUTION <25%, WARNING <15%, EMERGENCY <10% |
| **Cooling Water** | 7 hours nominal (part of EMU expendables) | CCTV 2008 EMU specs | ASSUMPTION: CAUTION <25%, WARNING <15%, consumption rate ASSUMPTION |
| **Suit Temp** | Nominal 18-26°C | ASSUMPTION (reasonable crew comfort range) | ASSUMPTION: CAUTION <15 or >29, WARNING <12 or >32 |

**EMU consumables basis**: One 7-hour figure for O₂, battery, LiOH scrubber, and cooling water (+30 min emergency reserve). Not separate durations.

**NOTE on EMU vs MK III**: Walkback test used MK III prototype suit at 4.3 psig. Operational EMU also 4.3 psi per secondary sources (CCTV 2008, Wikipedia). No NASA NTRS primary citation found for EMU operational specs despite search.

**xEMU future note**: xEMU design shows variable pressure capability (4.3-8.2 psi per NTRS 20230008644: "Operating pressures: 0.9, 4.3 psid (up to 8 psid for DCS treatment via a complex suit reconfig)"). This prototype models fixed 4.3 psi profile only; future lunar/Mars operational pressure TBD.

**Time remaining**: Displayed for O₂, battery, coolant, scrubber (metabolically scaled by current metabolic rate during EVA; walkback burn rate used for return margin calculation)

**Decision impact**: Immediate abort criteria (pressure loss, O₂ depletion); consumables management

**REMOVED**: "Integrity" status (redundant with pressure), "Helmet seal" indicator (redundant), "Hydration" (no real-time monitoring tech sourced)

---

### 2.4 NAVIGATION SCREEN (Surface EVA)

#### Radar Display (Heading-Up)
- **Habitat**: Direction and distance
- **Heading**: Current bearing
- **Walkback time**: Distance ÷ walkback_speed (test pace or cooling-limited pace)
- **SOURCE**: Beacon-based nav concept (realistic for Moon/Mars, not GPS)
- **Decision impact**: Situational awareness, return route planning

#### Return Margin Detail
- **O₂ time**: Based on walkback metabolic burn rate
- **Battery time**: Based on walkback load
- **Scrubber time**: Based on walkback CO₂ production
- **Coolant time**: Based on walkback thermal load (ASSUMPTION: consumption rate)
- **Limiting resource**: Which hits zero first
- **Margin**: Limiting_time − walkback_duration
- **Display**: Buffer time with pace context (test pace vs cooling-limited)
- **Decision impact**: Determines safe turnaround point

**REMOVED**: Rover position, decorative terrain text, light-time visualization strip

---

### 2.5 COMMUNICATION SCREEN

| Metric | Value | SOURCE | Classification |
|--------|-------|--------|----------------|
| **One-way delay** | Moon 1.3s, Mars 3-22 min | Astronomical constants | N/A (informational) |
| **Round-trip time** | 2× one-way | Calculated | Advisory if >5 min (no real-time help) |
| **Signal strength** | % | Simulated link budget | ASSUMPTION: CAUTION <40%, WARNING <20%, EMERGENCY <5% (LOS) |

**Mars Conjunction Blackout**: 
- State: "MARS CONJUNCTION — COMMAND MORATORIUM"
- **Definitions**:
  - **Behind Sun disk**: ~1 day (geometric alignment, total blackout) — 2023 geometry per JPL TMO 42-147
  - **Severe degradation**: ~3 days (within 2 solar radii) — 2023 geometry per JPL TMO 42-147
  - **Command moratorium**: ~2 weeks (NASA robotic-fleet operational practice per NASA.gov Nov 2023; includes margins)
  - **Crewed planning**: "weeks" of autonomous capability required per NTRS 20210015955
- **SOURCE**: NASA.gov Nov 2023 article, JPL TMO 42-147 (2023 specific geometry), NTRS 20210015955
- **Alert regime** (ASSUMPTION: design choice, not a NASA sequence):
  - ADVISORY when conjunction window opens (30 days out)
  - CAUTION when degradation begins (7 days out)
  - WARNING during severe degradation (3 days)
  - EMERGENCY if loss-of-signal during time-critical operation (not routine moratorium)
- **Design note**: On Mars, SPE alert must come from onboard/hab monitor because Earth forecast could arrive up to ~22 min late
- **Decision impact**: Reinforces delay-driven autonomy; no Earth commanding during moratorium

**Relay path text**: "Wrist → Suit → Hab → Orbiter → DSN Earth"  
**Message log**: In-transit countdown for outbound, age for received  
**Canned messages**: Pre-set text for gloved operation  
**Decision impact**: Realistic comm architecture; delay-aware interface

---

### 2.6 RADIATION SCREEN

| Metric | Value | SOURCE | Classification |
|--------|-------|--------|----------------|
| **Career dose** | Running total vs 600 mSv limit | NASA-STD-3001 (Radiation Protection Tech Brief) | ASSUMPTION: CAUTION >400 mSv, WARNING >500 mSv (limit is sourced; bands are ASSUMPTION) |
| **Mission dose** | Accumulated this mission | Integrated from dose rates | N/A (tracking) |
| **Daily dose** | Today's accumulation | Time-integrated | ADVISORY (normal GCR) |
| **Dose rate** | Current µSv/h | Location-dependent baseline | ADVISORY (normal) |

**Dose rates by location** (GCR baseline):
- ISS: 0.42 mSv/day (72 mSv/6mo) — SOURCE: NIH PMC 18582161 (HIGH)
- Transit: 1.84 mSv/day — SOURCE: MSL/RAD cruise (USRA Deep Space 2018 paper citing MSL data) (HIGH)
- Lunar surface: 1.4 mSv/day — ASSUMPTION (limited Apollo/Chang'e-4 data) (MEDIUM)
- Mars surface: 0.64 mSv/day — SOURCE: MSL/RAD (Hassler 2014 Science) (HIGH)

**Solar Particle Event (SPE) Alert**:
- **State**: "SPE DETECTED — SEEK SHELTER NOW"
- **Alert progression** (ASSUMPTION: design choice, not a NASA sequence):
  - **ADVISORY**: SEP watch issued (elevated solar activity, no particles yet)
  - **CAUTION**: Energetic protons detected by space weather network
  - **WARNING**: Dose rate rising, immediate shelter action required
  - **EMERGENCY**: High dose rate observed by onboard/hab monitor
- **Countdown**: Time since onset (not time-to-shelter, as shelter location varies)
- **Reference scenario (labeled ILLUSTRATIVE)**:
  - "Aug 1972 event: Astronaut blood-forming organ (BFO) exposure in deep space would have been 2.2 Sv (1.6 Gy) in a spacesuit, 1.8 Sv (1.3 Gy) in an aluminum pressure vessel, and 0.7 Sv (0.5 Gy) in an equipment room (compared to X-ray mortality threshold of 1.5 Gy at high dose rate)."
  - "Bone marrow dose: 0.8 Gy accumulated, peak dose rate 9 cGy/h over ~16-25 hours."
  - "Annual 50 rem limit exceeded with 5 g/cm² shielding. Cancer mortality risks: 1.5-17% at 1 g/cm², 0.5-1.1% behind 10 g/cm² for five major events."
  - "Event-specific; not predictive of future SPEs."
- **SOURCE for Aug 1972 data**: 
  - BFO doses: NTRS 20040100724 (quoted snippet from search result)
  - Bone marrow dose: NTRS 20060010503
  - Cancer risk/shielding: NTRS 19910021747
  - General: NTRS 19910062147, 19880016043
- **Warning regimes** (two distinct scenarios):
  - **Prompt particles (impulsive event)**: "20-30 min before particle fluxes reach threshold, additional 20-30 min before dangerous level" (SOURCE: NTRS 19870008346, 1987 forecasting)
  - **CME shock arrival**: "~12 h or more from solar event onset to hazardous shock arrival" (SOURCE: NASA GSFC EPACT2 paper)
  - **Detection improvements**: "Tens of minutes earlier than current techniques" per NASA 2017 (SOURCE: NASA 2017 forecasting article)
- **No real-time dose prediction shown**: Event-dependent, requires spectral analysis beyond prototype scope
- **Decision impact**: Immediate shelter-seeking trigger; mission abort consideration

**NOTE on dose types**: Career limit (600 mSv) is effective dose (biologically weighted); displayed dose rates are dose equivalent (Sv with quality factors). For GCR, these are approximately equal. For SPE, quality factor varies by particle energy; Aug 1972 references use Gy (absorbed dose) and Sv (dose equivalent); we display as dose equivalent (Sv).

---

### 2.7 MISSION / TIMELINE SCREEN

| Element | Value/SOURCE | Decision Impact |
|---------|-------------|-----------------|
| **MET** | Mission Elapsed Time (DAY HH:MM:SS) | Context for scheduled events |
| **EVA Elapsed** | Time since current EVA start | Consumables planning |
| **EVA Planned** | Configurable duration (e.g., 6 hours) | ASSUMPTION: CAUTION if elapsed >90% planned, WARNING if >100% |
| **Next Event** | Countdown to scheduled milestone | Planning aid |
| **Phase** | Surface/Transit/Landing | Environmental context |
| **Location** | Moon/Mars/Earth orbit | Gravity, comms, radiation context |

**Sleep tracking**: CUT (NASA-STD-3001 sleep requirement figure not accessible; cannot source)

**Prebreathe**: Not tracked; out-of-scope (ISS uses ISLE protocol per NASA EVA page; lunar/Mars protocols TBD)

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

**Trigger conditions** (auto-emergency ONLY for these):
- Suit pressure <3.5 psi (rapid depress)
- CO₂ inspired >15 mmHg (toxic atmosphere)
- O₂ supply <10% (critical life support)

**Return margin does NOT trigger auto-emergency** (generates Warning alerts only, including "CANNOT REACH HAB" at top priority)

**Display**:
- Large EMERGENCY banner
- Reason + time since activation
- Key vitals snapshot (HR, SpO₂, O₂, CO₂, Pressure, Battery, Coolant)
- Procedure quick-links (LABELED "ILLUSTRATIVE CHECKLIST — Not flight-certified"):
  - CONTACT EARTH (with delay warning: "Earth cannot respond in time — follow local procedure")
  - LIFE SUPPORT (checklist: Stop activity, secondary O₂, switch scrubber, max cooling, notify crew, start return)
  - RETURN TO HAB (direction arrow, distance, walkback time, margin at test/cooling-limited pace)
  - MEDICAL DATA (vitals snapshot for transmission)

**Checklist rationale**: Demonstrates decision-support concept; not NASA-certified flight procedures

**Hold-to-cancel**: 1.6-second hold prevents accidental deactivation

**Decision impact**: Structured emergency response; offline procedure support; delay-aware comms

---

### 2.10 DESKTOP MISSION CONTROL VIEW

**Reframed as**: "Ground / Flight Controller View"  
**Purpose**: Same telemetry as wrist device, expanded presentation for ground support or habitat monitoring

**Keep**:
- All vital and suit parameters with sparkline trends
- Alert log with MET timestamps
- Radiation dose tracking vs career limit
- Communication status and delay visualization
- Environmental parameters (location, gravity, phase)

**Remove**:
- Readiness score ring and factor breakdown (cut per audit)
- Stress/fatigue derived metrics (cut per audit)
- Synthetic ECG sweep (cut per revision; not diagnostic, adds clutter)
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
- Pace selection (test pace vs cooling-limited pace vs configurable)
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
| **Integrity status** | Redundant with suit pressure reading | CUT |
| **Readiness ring visualization** | Visualizes cut readiness score | CUT |
| **Readiness factor breakdown** | Expands cut readiness score | CUT |
| **"Radiation elevated" 3.5× state** | Arbitrary multiplier; replaced with GCR baseline + SPE alert | CUT |
| **Rover position on nav** | Adds clutter; not essential for return decision | CUT |
| **Decorative terrain text** | "Rock density medium" doesn't change decisions | CUT |
| **Light-time visualization strip** | Delay shown numerically; decorative | CUT |
| **Marketing sections 03 & 04** | Educational content, not functional | Move to README |
| **Sleep tracking** | NASA standard not citeable | CUT |
| **Synthetic ECG waveform** | Not diagnostic, clutters desktop view | CUT |
| **Helmet seal indicator** | Derived from pressure, redundant | CUT |
| **HR>140 speed penalty (20%)** | Replaced with sourced walkback scenario (test data uses fixed pace regardless of EVA state) | CUT |

---

## Part 4: Simulation Model Updates

### Metabolic Rate (PRIMARY STATE VARIABLE)
- **State variable**: Metabolic rate in BTU/hr or W (NOT HR)
- **Heart rate**: Derived from metabolic rate with ASSUMPTION-tagged mapping (NOT the driver)
- **Mapping**: `HR = HR_baseline + (metabolic_rate - METABOLIC_BASE) × HR_SCALING_FACTOR` (ASSUMPTION)
- **Range**: 
  - **Baseline**: 1000 BTU/hr (Apollo EVA AVERAGE per Gernhardt 2013, NOT "resting/light")
  - **Peak**: 2200 BTU/hr (peak EVA exertion per Gernhardt 2013)
- **SOURCE**: Gernhardt 2013 Apollo EVA data
- **Drives**: O₂ consumption, CO₂ production, thermal load (coolant consumption), battery drain (LCVG coupling tagged ASSUMPTION)

### O₂ Consumption
- **Formula**: `O₂_rate = BASE_O₂_RATE × (metabolic_rate / METABOLIC_BASE)`
- **Baseline**: 100% O₂ lasts 7 hours at 1000 BTU/hr baseline metabolic rate
- **SOURCE**: 7-hour nominal from CCTV 2008 EMU specs (part of unified 7h expendables); metabolic scaling from Gernhardt 2013

### CO₂ Production
- **Formula**: `CO₂_production = BASE_CO₂_RATE × (metabolic_rate / METABOLIC_BASE)`
- **Scrubber capacity**: Part of unified 7-hour EMU expendables at 1000 BTU/hr average
- **Tracking**: Accumulated CO₂ load vs scrubber capacity
- **SOURCE**: 7-hour nominal CCTV 2008 EMU specs
- **NOTE**: Do NOT use xPLSS 3.8 mmHg figure as capacity (that's inspired CO₂ level, not scrubber capacity)

### Cooling Water Consumption
- **Formula**: `coolant_rate = BASE_COOLANT_RATE × (metabolic_rate / METABOLIC_BASE)` (ASSUMPTION: consumption rate)
- **Capacity**: Part of unified 7-hour EMU expendables at 1000 BTU/hr average
- **SOURCE**: 7-hour nominal CCTV 2008 EMU specs

### Battery Drain
- **Formula**: `drain = BASE_DRAIN + LCVG_load × (metabolic_rate / METABOLIC_BASE)` (ASSUMPTION: LCVG coupling)
- **Nominal**: 7 hours at 1000 BTU/hr baseline metabolic rate
- **Increased load**: Higher metabolic rate → more LCVG pump/fan demand for thermal control (ASSUMPTION: coupling exists)
- **SOURCE**: 7-hour nominal CCTV 2008 EMU specs; coupling tagged ASSUMPTION

### Walkback Scenario
- **Separate from EVA state**: Return margin calculates consumables burn at WALKBACK rate, NOT current EVA rate
- **Lunar test pace**: 6.3 km/h at 2374 BTU/hr (sourced from NTRS 20070016007)
- **Lunar cooling-limited pace**: Configurable lower speed and metabolic rate (ASSUMPTION)
- **Mars pace**: Configurable speed and metabolic rate (ASSUMPTION; no sourced Mars 10 km data)
- **Duration**: Distance ÷ speed
- **Consumables during return**: `time_remaining = (current_consumable_level / walkback_burn_rate)`
- **Margin**: `min(O₂_time, battery_time, scrubber_time, coolant_time) - walkback_duration`
- **SOURCE**: NTRS 20070016007 for lunar test pace; rest tagged ASSUMPTION

### Radiation Accumulation
- **Formula**: `dose_today += dose_rate × Δt`
- **Dose rates**: Location-dependent GCR baseline (see §2.6)
- **SPE**: Alert state with reference scenario; no dose accumulation in sim (too event-specific, requires spectral model)
- **SOURCE**: Rates from MSL/RAD, ISS dosimetry

### Thermal Model
- **Cooling demand**: Driven by metabolic rate
- **LCVG**: Adjustable cooling (LOW/MED/HI setting in demo controls)
- **Suit temp**: Rises if cooling insufficient for metabolic load
- **Coolant consumption**: Scales with metabolic rate (ASSUMPTION)
- **SOURCE**: Concept only; NASA thermal limits not found (Gernhardt 2013 discusses core temp monitoring, no alarm thresholds cited)

---

## Part 5: Implementation Notes

### Config File Structure (js/config.js)
All sourced constants with inline comments and confidence tags:
```javascript
// ============================================================================
// LIFE SUPPORT: EMU/MK III SUIT SPECS
// ============================================================================

// Suit pressure: 4.3 psig
// SOURCE: MK III designed for 4.3 psig (max 8 psig most components) per NTRS 20070016007 (walkback report)
// NOTE: Operational EMU also 4.3 psi per CCTV 2008 (secondary source)
// NOTE: xEMU variable pressure 4.3-8.2 psi per NTRS 20230008644; prototype models 4.3 fixed
// CONFIDENCE: MEDIUM (MK III sourced; EMU from secondary source)
SUIT_PRESSURE_NOMINAL: 4.3, // psig

// ASSUMPTION: Pressure alert bands (no NASA source for thresholds)
SUIT_PRESSURE_CAUTION_LO: 4.1, // psi
SUIT_PRESSURE_CAUTION_HI: 4.7, // psi
SUIT_PRESSURE_WARNING_LO: 4.0, // psi
SUIT_PRESSURE_WARNING_HI: 4.9, // psi
SUIT_PRESSURE_EMERGENCY_LO: 3.5, // psi (rapid breach trigger)

// EMU consumables: 7-hour unified expendables (O2, battery, LiOH scrubber, cooling water)
// SOURCE: CCTV 2008 EMU specs (via multiple secondary sources; NASA NTRS not found)
// CONFIDENCE: MEDIUM (secondary source only)
CONSUMABLES_DURATION_NOMINAL: 7, // hours at 1000 BTU/hr baseline metabolic rate
EMERGENCY_RESERVE: 0.5, // hours (30 min)

// ASSUMPTION: Consumable percentage alert bands
O2_CAUTION_PCT: 25,    // %
O2_WARNING_PCT: 15,    // %
O2_EMERGENCY_PCT: 10,  // % (triggers auto-emergency)
BATTERY_CAUTION_PCT: 25,
BATTERY_WARNING_PCT: 15,
BATTERY_EMERGENCY_PCT: 10,
COOLANT_CAUTION_PCT: 25,
COOLANT_WARNING_PCT: 15,
// (scrubber uses same bands)

// CO2 limits: Cabin vs suit separated
// Cabin SMAC: 10 mmHg (24h), 5.3 mmHg (7-180d)
// SOURCE: NASA SMAC docs (NTRS 20150021777)
// CONFIDENCE: HIGH
CO2_CABIN_SMAC_24H: 10,      // mmHg ppCO2
CO2_CABIN_SMAC_180D: 5.3,    // mmHg ppCO2

// Suit inspired limit: 15 mmHg nominal
// SOURCE: NASA Tech Bulletin 02182025, Nature s41526-026-00589-x
// CONFIDENCE: HIGH
CO2_SUIT_INSPIRED_LIMIT: 15, // mmHg

// ASSUMPTION: CO2 alert bands (15 mmHg sourced; intermediate bands not sourced)
CO2_CAUTION: 5,   // mmHg (ASSUMPTION)
CO2_WARNING: 10,  // mmHg (ASSUMPTION)
CO2_EMERGENCY: 15, // mmHg (sourced; triggers auto-emergency)

// ============================================================================
// METABOLIC MODEL
// ============================================================================

// Metabolic rate: PRIMARY STATE VARIABLE
// Range: 1000 BTU/hr Apollo EVA AVERAGE (not resting), 2200 BTU/hr peak
// SOURCE: Gernhardt 2013 Apollo EVA data
// CONFIDENCE: HIGH
METABOLIC_RATE_BASE: 1000,  // BTU/hr (Apollo EVA average, baseline for 7h consumables)
METABOLIC_RATE_PEAK: 2200,  // BTU/hr (peak EVA exertion)

// Heart rate: DERIVED from metabolic rate (not the driver)
// ASSUMPTION: HR mapping (no sourced EVA HR range from Gernhardt 2013; mapping is engineering estimate)
HR_BASELINE: 90,  // BPM (corresponds to 1000 BTU/hr baseline)
HR_SCALING_FACTOR: 0.05, // (HR_current - HR_baseline) per (metabolic - baseline) BTU/hr (ASSUMPTION)

// ============================================================================
// WALKBACK SCENARIO
// ============================================================================

// Walkback limit: 10 km operational constraint
// SOURCE: NTRS 20070016007
// CONFIDENCE: HIGH
WALKBACK_LIMIT_KM: 10,

// Walkback test pace (lunar): SOURCED
// SOURCE: NTRS 20070016007 (Vos, Gernhardt, Lee Jan 2007)
// 6 astronauts, MK III at 4.3 psig, lunar gravity (1/6 g) simulator, level treadmill
// 10 km in avg 95.8 min at avg 3.94 mph (6.3 km/h)
// Avg metabolic 2374 BTU/hr, max 15-min avg 2617 BTU/hr, 944 kcal total
// Both averages "exceed Apollo and EMU cooling capabilities"; subjects wanted faster but cooling-limited
// CAVEAT: Preliminary quicklook, level treadmill, offloaded gravity, prototype suit, lunar only
// CONFIDENCE: HIGH (sourced NASA test data)
WALKBACK_LUNAR_TEST_SPEED: 6.3,      // km/h
WALKBACK_LUNAR_TEST_METABOLIC: 2374, // BTU/hr

// Walkback cooling-limited pace (lunar): ASSUMPTION (configurable)
// Rationale: Test subjects were cooling-limited; slower pace may be operationally required
WALKBACK_LUNAR_COOL_SPEED: 4.0,      // km/h (ASSUMPTION, configurable)
WALKBACK_LUNAR_COOL_METABOLIC: 1800, // BTU/hr (ASSUMPTION, configurable)

// Walkback Mars pace: ASSUMPTION (no sourced Mars 10 km walkback data)
WALKBACK_MARS_SPEED: 3.5,      // km/h (ASSUMPTION, configurable)
WALKBACK_MARS_METABOLIC: 2000, // BTU/hr (ASSUMPTION, configurable)

// Return margin alert bands
// SOURCE: 30-min emergency reserve from CCTV 2008 EMU specs (anchors WARNING band)
// ASSUMPTION: CAUTION and other bands
MARGIN_CAUTION: 60,  // minutes (ASSUMPTION)
MARGIN_WARNING: 30,  // minutes (anchored to 30-min EMU reserve)
// NO EMERGENCY band from margin (margin <0 generates WARNING "CANNOT REACH HAB")

// ============================================================================
// VITAL THRESHOLDS
// ============================================================================

// ASSUMPTION: All vital thresholds (NASA flight rules not public; clinical standards adapted)

// Heart rate: ASSUMPTION (derived from metabolic model, not sourced EVA HR ranges)
HR_CAUTION_HI: 125,   // BPM (ASSUMPTION)
HR_WARNING_HI: 140,   // BPM (ASSUMPTION)
HR_EMERGENCY_HI: 155, // BPM (ASSUMPTION)

// SpO2: ASSUMPTION (clinical hypoxia standards)
SPO2_CAUTION_LO: 94,   // %
SPO2_WARNING_LO: 92,   // %
SPO2_EMERGENCY_LO: 90, // %

// Respiration: ASSUMPTION (adapted for EVA workload, not resting 12-20/min)
RESP_CAUTION_LO: 12,   // breaths/min
RESP_CAUTION_HI: 35,   // breaths/min
RESP_WARNING_LO: 10,   // breaths/min
RESP_WARNING_HI: 40,   // breaths/min

// Temperature: ASSUMPTION (clinical hypo/hyperthermia)
TEMP_CAUTION_LO: 36.0, // °C
TEMP_CAUTION_HI: 38.0, // °C
TEMP_WARNING_LO: 35.5, // °C
TEMP_WARNING_HI: 38.5, // °C
TEMP_EMERGENCY_LO: 35.0, // °C
TEMP_EMERGENCY_HI: 39.0, // °C

// Suit temperature: ASSUMPTION (reasonable crew comfort range)
SUIT_TEMP_NOMINAL_LO: 18, // °C
SUIT_TEMP_NOMINAL_HI: 26, // °C
SUIT_TEMP_CAUTION_LO: 15, // °C (ASSUMPTION)
SUIT_TEMP_CAUTION_HI: 29, // °C (ASSUMPTION)
SUIT_TEMP_WARNING_LO: 12, // °C (ASSUMPTION)
SUIT_TEMP_WARNING_HI: 32, // °C (ASSUMPTION)

// ============================================================================
// RADIATION
// ============================================================================

// Career limit: 600 mSv
// SOURCE: NASA-STD-3001 Radiation Protection Tech Brief
// CONFIDENCE: HIGH
CAREER_DOSE_LIMIT: 600, // mSv

// ASSUMPTION: Career dose alert bands (600 mSv limit sourced; bands not sourced)
CAREER_DOSE_CAUTION: 400, // mSv (ASSUMPTION)
CAREER_DOSE_WARNING: 500, // mSv (ASSUMPTION)

// GCR dose rates by location
// ISS: 0.42 mSv/day — SOURCE: NIH PMC 18582161 (HIGH)
// Transit: 1.84 mSv/day — SOURCE: MSL/RAD cruise (HIGH)
// Mars surface: 0.64 mSv/day — SOURCE: MSL/RAD Hassler 2014 (HIGH)
// Lunar surface: 1.4 mSv/day — ASSUMPTION (Chang'e-4, Apollo-era limited data) (MEDIUM)
DOSE_RATE_ISS: 0.42,      // mSv/day
DOSE_RATE_TRANSIT: 1.84,  // mSv/day
DOSE_RATE_MARS: 0.64,     // mSv/day
DOSE_RATE_LUNAR: 1.4,     // mSv/day (ASSUMPTION)

// ============================================================================
// COMMUNICATION DELAYS
// ============================================================================

// One-way light time
// SOURCE: Astronomical constants (HIGH confidence)
DELAY_MOON: 1.3,        // seconds
DELAY_MARS_MIN: 180,    // seconds (3 min at closest approach)
DELAY_MARS_MAX: 1320,   // seconds (22 min at conjunction)

// Mars conjunction characteristics
// SOURCE: NASA.gov Nov 2023 (robotic-fleet moratorium), JPL TMO 42-147 (2023 geometry)
CONJUNCTION_DISK_DURATION: 1,      // day (behind Sun, 2023 geometry)
CONJUNCTION_DEGRADED_DURATION: 3,  // days (severe interference, 2023 geometry)
CONJUNCTION_MORATORIUM_DURATION: 14, // days (robotic-fleet command moratorium practice)

// ASSUMPTION: Conjunction alert timeline (design choice, not NASA sequence)
CONJUNCTION_ADVISORY_DAYS: 30,  // days out (ASSUMPTION)
CONJUNCTION_CAUTION_DAYS: 7,    // days out (ASSUMPTION)
CONJUNCTION_WARNING_DAYS: 3,    // days (severe degradation) (ASSUMPTION)

// ============================================================================
// MISSION TIMELINE
// ============================================================================

// ASSUMPTION: EVA elapsed vs planned alert bands
EVA_ELAPSED_CAUTION_PCT: 90,  // % of planned duration (ASSUMPTION)
EVA_ELAPSED_WARNING_PCT: 100, // % of planned duration (ASSUMPTION)

// ============================================================================
// SIGNAL STRENGTH
// ============================================================================

// ASSUMPTION: Signal strength alert bands (simulated link budget)
SIGNAL_CAUTION: 40,  // % (ASSUMPTION)
SIGNAL_WARNING: 20,  // % (ASSUMPTION)
SIGNAL_EMERGENCY: 5, // % LOS (ASSUMPTION)
```

### Alert Rule Generation (js/assess.js)
Each parameter evaluated independently against its own thresholds:
```javascript
function classifyParameter(key, value) {
  const limits = LIMITS[key];
  if (!limits) return 'NOMINAL';
  
  // Check emergency thresholds
  if ((limits.emergencyLo !== undefined && value < limits.emergencyLo) || 
      (limits.emergencyHi !== undefined && value > limits.emergencyHi)) {
    return 'EMERGENCY';
  }
  
  // Check warning thresholds
  if ((limits.warningLo !== undefined && value < limits.warningLo) || 
      (limits.warningHi !== undefined && value > limits.warningHi)) {
    return 'WARNING';
  }
  
  // Check caution thresholds
  if ((limits.cautionLo !== undefined && value < limits.cautionLo) || 
      (limits.cautionHi !== undefined && value > limits.cautionHi)) {
    return 'CAUTION';
  }
  
  return 'NOMINAL';
}

function computeOverallStatus(alerts) {
  // Overall = highest active classification
  const priority = ['EMERGENCY', 'WARNING', 'CAUTION', 'ADVISORY', 'NOMINAL'];
  for (const level of priority) {
    if (alerts.some(a => a.classification === level)) return level;
  }
  return 'NOMINAL';
}

function computeReturnMargin(state) {
  // Use WALKBACK burn rates, not current EVA rates
  const pace = state.selectedPace; // 'test' or 'cooling-limited' or 'custom'
  const speed = WALKBACK_SPEEDS[state.location][pace];
  const metabolic = WALKBACK_METABOLIC[state.location][pace];
  
  const walkbackDuration = state.distanceToHab / speed; // hours
  
  // Consumable times at WALKBACK burn rate
  const o2Time = state.o2Level / (BASE_O2_RATE * (metabolic / METABOLIC_BASE));
  const batteryTime = state.batteryLevel / (BASE_BATTERY_RATE + LCVG_RATE * (metabolic / METABOLIC_BASE));
  const scrubberTime = state.scrubberCapacity / (BASE_CO2_RATE * (metabolic / METABOLIC_BASE));
  const coolantTime = state.coolantLevel / (BASE_COOLANT_RATE * (metabolic / METABOLIC_BASE));
  
  const limitingTime = Math.min(o2Time, batteryTime, scrubberTime, coolantTime);
  const limitingResource = /* determine which is min */;
  
  const margin = limitingTime - walkbackDuration;
  
  // Generate alerts based on margin (NOT from margin class)
  if (margin < 0) {
    alerts.push({
      classification: 'WARNING',
      title: 'CANNOT REACH HAB',
      priority: 1, // top of queue
      message: `Consumables insufficient for return at ${pace} pace. Limiting: ${limitingResource}.`
    });
  } else if (margin < MARGIN_WARNING / 60) { // 30 min in hours
    alerts.push({
      classification: 'WARNING',
      title: 'RETURN MARGIN LOW',
      message: `${(margin * 60).toFixed(0)} min margin. Limiting: ${limitingResource}. Anchored to 30-min EMU reserve.`
    });
  } else if (margin < MARGIN_CAUTION / 60) { // 60 min in hours
    alerts.push({
      classification: 'CAUTION',
      title: 'RETURN MARGIN REDUCING',
      message: `${(margin * 60).toFixed(0)} min margin. Limiting: ${limitingResource}.`
    });
  }
  
  return {
    margin: margin * 60, // convert to minutes for display
    limitingResource,
    walkbackDuration: walkbackDuration * 60, // minutes
    pace
  };
}
```

Auto-emergency triggers ONLY for pressure <3.5, CO₂ >15, O₂ <10%. Return margin generates Warning/Caution alerts only.

### UI Updates
- Remove readiness score ring from dashboard
- Remove stress/fatigue rows from vitals
- Display return margin as buffer time with pace context (NOT emergency classification)
- Add limiting resource label
- Update risk classification labels (Emergency/Warning/Caution/Advisory)
- Add SPE multi-regime alert with Aug 1972 reference labeled ILLUSTRATIVE
- Label emergency checklist "ILLUSTRATIVE — Not flight-certified"
- Separate demo controls visually (border, label "PRESENTER TOOL")
- Add pace selector (test / cooling-limited / custom)
- Remove ECG sweep from desktop
- Remove helmet seal indicator
- Remove light-time visualization strip
- Show "CANNOT REACH HAB" as Warning (not Emergency) when margin <0

---

## Part 6: Data Sources

**All numeric values sourced from NASA or tagged ASSUMPTION.**

See `docs/DATA_SOURCES.md` for complete list with URLs, quotes, and confidence levels.

**Key sources**:
- NASA-STD-3001: Career radiation limit 600 mSv
- MSL/RAD: Mars surface 0.64 mSv/day, transit 1.84 mSv/day
- NIH PMC 18582161: ISS 0.42 mSv/day
- NTRS 20240003565: NASA C&W classification
- NTRS 20070016007: 10 km walkback limit, walkback test data (6.3 km/h, 2374 BTU/hr, MK III 4.3 psig)
- Gernhardt 2013: Metabolic rates 1000 BTU/hr Apollo EVA average, 2200 peak
- NTRS 20150021777: Cabin CO₂ SMAC
- Nature s41526-026-00589-x, NASA Tech Bulletin 02182025: Suit CO₂ 15 mmHg
- CCTV 2008: EMU 7h consumables (secondary source, MEDIUM confidence)
- NTRS 20230008644: xEMU 4.3-8.2 psi variable
- NTRS 20040100724, 20060010503, 19910021747: Aug 1972 SPE doses

---

## Part 7: README Updates

### Data Sources Section
"All numeric values in this simulation are sourced from NASA technical documents, published mission data, or peer-reviewed research. Values without primary NASA sources are explicitly tagged ASSUMPTION and made configurable where feasible. See `docs/DATA_SOURCES.md` for complete source list with URLs, quotes, and confidence ratings (HIGH/MEDIUM/ASSUMPTION)."

### Known Limitations / Assumptions
- **EMU specs**: 7h consumables from secondary source (CCTV 2008); NASA NTRS primary citation not found despite search. Tagged MEDIUM confidence.
- **MK III suit pressure**: 4.3 psig sourced from walkback report (NTRS 20070016007); operational EMU also 4.3 psi per secondary sources.
- **Vital sign thresholds**: All HR, SpO₂, respiration, body temp thresholds are ASSUMPTION (clinical medical standards adapted for EVA context; NASA flight rules not publicly detailed).
- **Walkback lunar test pace**: 6.3 km/h at 2374 BTU/hr sourced from NTRS 20070016007 (preliminary quicklook, level treadmill, offloaded gravity, MK III prototype, lunar only; final NASA/TP-2009-214796 report may differ).
- **Walkback cooling-limited pace**: ASSUMPTION (configurable; test subjects were cooling-limited per report).
- **Walkback Mars pace**: ASSUMPTION (no sourced Mars 10 km walkback data; configurable).
- **Lunar radiation**: 1.4 mSv/day GCR rate is ASSUMPTION based on limited Apollo and Chang'e-4 data.
- **Alert bands**: All caution/warning percentage and time bands are ASSUMPTION (sourced limits: CO₂ 15 mmHg, career dose 600 mSv, 30-min EMU reserve; intermediate bands not sourced).
- **Emergency procedures**: Checklists labeled ILLUSTRATIVE; not NASA-certified flight procedures.
- **xEMU pressure**: Prototype models 4.3 psi fixed; xEMU capable of 4.3-8.2 psi variable per design docs.
- **Metabolic-HR mapping**: HR derived from metabolic rate with ASSUMPTION-tagged mapping (no sourced EVA HR ranges from Gernhardt 2013).
- **Battery-LCVG coupling**: ASSUMPTION (higher metabolic rate increases LCVG thermal demand).
- **Coolant consumption rate**: ASSUMPTION (scales with metabolic rate).
- All data is SIMULATED; this is not a medical device or certified flight system.

### Features List
- **Return margin calculation**: O₂/battery/scrubber/coolant vs walkback time at SOURCED walkback pace (6.3 km/h, 2374 BTU/hr lunar test data), with limiting resource identification. Buffer time display, NOT emergency classification.
- **Walkback scenario modeling**: Separate pace and metabolic rate for return; consumables burn at walkback rate, not current EVA rate. Test pace (sourced) and cooling-limited pace (ASSUMPTION) options.
- **NASA C&W-aligned alert classification**: Emergency/Warning/Caution/Advisory per NASA operational standards. Auto-emergency ONLY for pressure <3.5, CO₂ >15, O₂ <10%.
- **Metabolic rate driver**: Primary state variable (BTU/hr); HR derived with ASSUMPTION mapping. O₂/CO₂/thermal/battery scaled by metabolic rate.
- **Sourced radiation dose tracking**: 600 mSv career limit, location-specific GCR rates, SPE multi-regime alert with Aug 1972 BFO reference (ILLUSTRATIVE).
- **Delay-aware communication**: Realistic light times, Mars conjunction blackout (1 day disk/3 days degraded/~2 weeks robotic-fleet moratorium).
- **Offline emergency procedures**: No real-time Earth help assumption, illustrative checklists.
- **Glove-operable interface**: ≥56px targets, hold-to-confirm for critical actions.

---

## Part 8: Verification Checklist

- [ ] Every config constant has inline SOURCE or ASSUMPTION comment with confidence tag
- [ ] Every assumption in code matches docs/DATA_SOURCES.md
- [ ] All cut features removed from code, CSS, HTML (no dead code)
- [ ] Alert classification uses Emergency/Warning/Caution/Advisory consistently
- [ ] Auto-emergency triggers ONLY for pressure <3.5, CO₂ >15, O₂ <10% (NOT margin)
- [ ] Return margin displays buffer time with pace context (NOT emergency classification)
- [ ] Return margin <0 displays "CANNOT REACH HAB" as WARNING (not Emergency)
- [ ] Return margin calculation uses walkback burn rate, NOT current EVA rate
- [ ] Walkback test pace (6.3 km/h, 2374 BTU/hr) sourced with caveat
- [ ] Cooling-limited and Mars paces tagged ASSUMPTION, configurable
- [ ] Metabolic rate is primary state variable; HR derived with ASSUMPTION mapping
- [ ] 1000 BTU/hr labeled "Apollo EVA average" (not "resting/light")
- [ ] Battery-LCVG coupling tagged ASSUMPTION
- [ ] Coolant consumption tagged ASSUMPTION
- [ ] All vital thresholds tagged ASSUMPTION in config.js
- [ ] All alert bands tagged ASSUMPTION in config.js
- [ ] Aug 1972 SPE reference uses BFO/bone marrow doses from NTRS, labeled ILLUSTRATIVE
- [ ] SPE warning regimes separated (prompt particles vs CME shock)
- [ ] SPE alert stages tagged ASSUMPTION (design choice)
- [ ] Mars conjunction labeled robotic-fleet practice and 2023 geometry
- [ ] Conjunction alert stages tagged ASSUMPTION
- [ ] Mars SPE alert design note added (onboard monitor, Earth forecast delayed)
- [ ] Emergency checklist labeled "ILLUSTRATIVE — Not flight-certified"
- [ ] Demo controls visually separated and labeled "PRESENTER TOOL" with pace selector
- [ ] README updated with data sources, limitations/assumptions, features list
- [ ] Zero console errors in Chrome
- [ ] All removed features have no lingering UI references

---

## Summary

**Core value proposition**: Return margin calculation with sourced lunar walkback test data (6.3 km/h, 2374 BTU/hr) and consumables modeling at walkback burn rate (separate from current EVA state)

**Alignment**: NASA C&W operational standard, independent parameter classification

**Honesty**: MEDIUM confidence for EMU specs (secondary sources), HIGH for walkback test data (sourced with caveats), ASSUMPTION tags for all alert bands, thresholds, and Mars/cooling-limited paces

**Cuts**: 17 features removed (readiness score, stress/fatigue/mental load/hydration, integrity, helmet seal, sleep, ECG sweep, light-viz, decorative elements, HR>140 speed penalty)

**Model**: Metabolic rate (BTU/hr) is primary state variable; HR derived with ASSUMPTION; walkback scenario separate from EVA state; unified 7h EMU consumables basis

**Ready for Phase 4 implementation.**
