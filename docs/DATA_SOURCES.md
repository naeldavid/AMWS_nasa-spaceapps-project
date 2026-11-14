# AMWS Data Sources

**Research conducted**: November 14, 2026  
**Date accessed for all sources**: November 14, 2026  
**Search strategy**: Timeboxed web search focusing on NASA public domain sources, NTRS, NASA-STD-3001, published mission data.

**Format**: Topic → Value → Exact Source (URL + quoted value where applicable) → Confidence

---

## 1. VITAL SIGNS — CREW HEALTH THRESHOLDS

### Heart Rate
- **ASSUMPTION**: Specific NASA flight rule HR thresholds not found in public domain during timeboxed search
- Clinical normal range 50-100 BPM commonly referenced but not specifically cited for EVA
- Elevated HR (>170 BPM) documented as cause of EVA termination in early missions (Gemini)
- **Source**: NTRS 19910001262 (EVA - Past, Present, and Future) mentions HR >170 BPM terminations
- **Confidence**: MEDIUM — Clinical ranges apply, but NASA-specific flight rules not publicly detailed

### SpO₂ (Blood Oxygen Saturation)
- **ASSUMPTION**: NASA EVA SpO₂ alarm thresholds not found in public sources
- Clinical standard: <94% warning, <90% critical commonly used in medical practice
- **Confidence**: MEDIUM — Clinical standards likely inform NASA limits but not explicitly confirmed

### Body Temperature
- **ASSUMPTION**: Core temperature limits for EVA not publicly specified
- Normal human range 36.1–37.5°C widely accepted
- Hyperthermia documented as EVA hazard in early missions
- **Confidence**: MEDIUM — Clinical norms apply, NASA-specific limits not found

### Respiration Rate
- **ASSUMPTION**: NASA respiratory rate alarm limits not in public domain
- Clinical normal 12-20 breaths/min standard
- **Confidence**: MEDIUM — Clinical baseline applicable

---

## 2. SUIT ENVIRONMENT & LIFE SUPPORT

### Suit Pressure
- **VALUE**: EMU operates at **4.3 psi (29.6 kPa)** differential, 100% O₂
- **Apollo**: 3.7 psi suit pressure
- **Rationale**: 4.3 psi provides equivalent O₂ partial pressure to sea level (alveolar gas equation)
- **Source**: Multiple NASA sources including Wikipedia EMU article, NTRS documents, EMU fact sheets
- **Confidence**: **HIGH** — Well-documented operational parameter

### CO₂ Limits

#### Cabin SMAC (Spacecraft Maximum Allowable Concentration)
- **VALUE**: 
  - **24-hour limit**: 10 mmHg ppCO₂
  - **7-180 day limit**: 5.3 mmHg ppCO₂ (0.7% CO₂)
  - **ISS flight rule**: <4 mmHg operationally maintained (well below SMAC)
- **Source**: NTRS 20100036637, 20150021777, 20160013696 (NASA SMAC documents, CO₂ exposure studies)
- **Confidence**: **HIGH** — Published NASA standards

#### EVA Suit CO₂ Limits
- **VALUE**: 
  - **Suit inlet target**: <2 mmHg
  - **Inspired CO₂ limit**: 15 mmHg nominal upper limit per NASA standards
  - **xPLSS design**: 3.8 mmHg average over 8-hour EVA
- **Source**: NASA Technical Bulletin 02182025 (Suited CO₂), NTRS 20170010189 (xPLSS CDHCU), Nature article s41526-026-00589-x
- **Confidence**: **HIGH** — Recent NASA technical documentation

### O₂ Supply & Consumption
- **VALUE**: 
  - EMU O₂ supply provides **≈7-8 hours** nominal EVA duration
  - 30-minute emergency reserve included in system
  - Consumption rate varies with metabolic workload
- **Source**: Multiple sources cite 7-8 hour figure (CCTV article from 2008, science articles)
- **Confidence**: **HIGH** — Widely documented operational parameter

### Suit Battery / Power
- **VALUE**: EMU battery provides **≈7-8 hours** of power for suit functions
- Same duration as O₂ supply (both consumables sized for 8-hour EVA)
- **Source**: CCTV 2008 article on EMU specifications
- **Confidence**: **HIGH** — Matches operational EVA duration

### Thermal / Cooling
- **ASSUMPTION**: Specific thermal load limits and LCVG (Liquid Cooling Ventilation Garment) capacity not quantified in public sources
- Overheating documented as Gemini-era EVA hazard
- Metabolic heat generation drives cooling requirements
- **Confidence**: LOW — Concept valid but no specific numbers found

---

## 3. EVA OPERATIONS

### Prebreathe / DCS Risk
- **PROTOCOL**: 
  - Shuttle/ISS: 1 hour O₂ prebreathe + 12-hour cabin depress to 10.2 psi + 40-min prebreathe before 4.3 psi suit
  - OR: **4-hour in-suit prebreathe** at 100% O₂
  - Lunar/planetary EVA requires different protocols due to ambulatory workload increasing DCS risk
- **Rationale**: Denitrogenation to prevent decompression sickness when going from 14.7 psi cabin (nitrogen mix) to 4.3 psi suit (pure O₂)
- **Source**: NTRS 19940029133, 20240005151 (EA Tests), NASA DCS Technical Brief, NASA EVA & Environmental Physiology page
- **Confidence**: **HIGH** — Well-documented operational requirement

### Metabolic Rates
- **VALUE**: 
  - **Average EVA**: ≈1000 BTU/hr (≈293 W)
  - **Peak workload**: up to 2200 BTU/hr (≈645 W)
  - Apollo lunar EVA: Lower than ground analog (up to 50% lower in some tasks)
- **Source**: NTRS (Gernhardt EVA Ops Chapter 5.4), NTRS 20220009964 (Artemis metabolic study)
- **Confidence**: **HIGH** — Flight data from Apollo, ongoing Artemis studies

### Suited Locomotion / Walkback
- **VALUE**: 
  - **Maximum walkback distance**: 10 km (6.2 mi) assumed based on Apollo experience
  - **Apollo rover constraint**: Never drive farther than crew can walk back on remaining consumables
  - **ASSUMPTION**: Walking speed ≈2-2.5 km/h suited (not explicitly sourced from Apollo data)
- **Source**: NTRS 20070016007 (10 km Walkback Test), multiple Quora/Space.SE discussions citing Apollo walkback limit
- **Confidence**: **MEDIUM/HIGH** — 10 km limit well-documented; walking speed is reasonable engineering estimate

### EVA Duration Limits
- **VALUE**: Current EMU **7-8 hours** nominal, 30-min emergency reserve
- Apollo: Similar duration constraints
- **Confidence**: **HIGH**

---

## 4. RADIATION

### Career Dose Limits
- **VALUE**: **600 mSv** career effective dose limit (NASA-STD-3001)
- Replaces older age/sex-dependent limits
- Based on 3% lifetime cancer risk (REID model)
- **Source**: NASA Technical Brief (Radiation Protection), NASA-STD-3001 citations, NTRS 20230017836, 20240011288
- **Confidence**: **HIGH** — Current NASA standard as of 2022+

### Dose Rates by Location

#### LEO / ISS
- **VALUE**: ≈**0.4-0.5 mSv/day** or **72 mSv per 6-month mission** (140-day average ≈60 mSv)
- Source altitude: ISS ≈420 km
- **Source**: NIH PMC article (19 ISS astronauts averaged 72 mSv/6mo), NASA presentations citing 50-100 mSv per 6 months
- **Confidence**: **HIGH** — Flight data from ISS dosimetry

#### Deep Space Transit
- **VALUE**: ≈**1.8 mSv/day** GCR baseline (deep space cruise outside magnetosphere)
- **Source**: Multiple references to deep-space cruise rates in Mars mission planning documents
- **Confidence**: **MEDIUM** — Estimated from models and short-duration data

#### Lunar Surface
- **VALUE**: ≈**1.4 mSv/day** (Chang'e-4 LND measurements, Apollo-era data)
- No magnetosphere, but regolith provides some shielding
- **Source**: References in NASA radiation planning docs
- **Confidence**: **MEDIUM** — Limited direct measurements (Chang'e-4 LND, Apollo)

#### Mars Surface
- **VALUE**: **0.64 ± 0.12 mSv/day** (measured by MSL/RAD Curiosity rover)
- Alternative source: **0.7 mSv/day** in NASA education materials
- Dose rate: **≈210 μGy/day** absorbed dose
- Mars atmosphere (0.6 kPa CO₂) provides modest shielding from GCR
- **Source**: Hassler et al. 2014 Science, NTRS education materials, NASA Goddard Space Math problem
- **Confidence**: **HIGH** — Direct measurement from MSL/RAD instrument

### Solar Particle Events (SPE)
- **Characteristics**:
  - **Duration**: Hours to days (typically <3 days for major events)
  - **Warning time**: 20-30 minutes before threshold, additional 20-30 min before dangerous levels (total ≈40-60 min warning)
  - **Onset**: After solar flare/CME observed, ≈12 hours until shock arrival with hazardous particle flux
  - **Shielding**: SPE particles (mostly protons) can be effectively attenuated with moderate shielding (10 g/cm² mentioned for Mars surface shelter)
- **ASSUMPTION**: Specific dose-rate magnitudes for SPE not quantified (varies widely by event)
- **Source**: NTRS 19870008346 (SPE forecasting), multiple papers on SPE characteristics and shelter requirements
- **Confidence**: **MEDIUM** — Characteristics well-documented, but dose rates event-specific and highly variable

---

## 5. COMMUNICATION & NAVIGATION

### Earth-Moon Distance & Light Time
- **VALUE**: 
  - **Average distance**: 384,400 km (≈239,000 mi)
  - **Light time**: **1.28-1.3 seconds** one-way
- **Source**: Multiple educational sources (BBC, NASA, Wikipedia)
- **Confidence**: **HIGH** — Well-established astronomical constant

### Earth-Mars Distance & Light Time
- **VALUE**: 
  - **Closest approach (opposition)**: ≈56 million km → **3 minutes** one-way
  - **Farthest (conjunction)**: ≈401 million km → **22 minutes** one-way
  - **Round-trip at conjunction**: up to **44 minutes**
- **Source**: NASA Mars communication docs, multiple educational sources
- **Confidence**: **HIGH** — Based on orbital mechanics

### Mars Solar Conjunction
- **VALUE**: 
  - **Duration**: Mars behind Sun disk ≈1 day; within 2 solar radii (0.5°) ≈3 days
  - **Effect**: Communication blackout or severe degradation
  - **Frequency**: Approximately every 26 months (Mars synodic period)
- **Source**: NASA JPL TMO Progress Report 42-147 (Communications with Mars During Periods of Solar Conjunction)
- **Confidence**: **HIGH** — Known operational constraint

### Communication Architecture
- **Honest relay path** (not sourced but conceptually accurate):
  - Wrist device → Suit radio (short-range)
  - → Habitat/Rover relay
  - → Orbiter/Spacecraft relay (high-gain antenna)
  - → Deep Space Network (DSN) Earth stations
- Wrist device cannot directly communicate with Earth
- **Confidence**: **HIGH** — Architecture concept is operationally accurate

---

## 6. SLEEP & CIRCADIAN

### Sleep Requirements
- **ASSUMPTION**: NASA-specific sleep duration requirements for Mars missions not found in timeboxed search
- General guidance: 7-9 hours for human health widely accepted
- NASA-STD-3001 likely specifies but PDFs not text-searchable in web search
- **Confidence**: LOW — Cut if not sourceable from standard

### Mars Sol Adaptation
- **VALUE**: Mars sol = **24 hours 39 minutes 35 seconds**
- +39 min/day drift relative to Earth
- Circadian adaptation research ongoing (NASA HRP)
- **Source**: Common astronomical reference
- **Confidence**: **HIGH** for sol length; **ASSUMPTION** for adaptation protocols

---

## 7. ENVIRONMENTAL DATA

### Gravity
- **VALUE**:
  - **Moon**: 1.62 m/s² (0.166 g)
  - **Mars**: 3.71 m/s² (0.38 g)
- **Source**: Standard astronomical/geophysical constants
- **Confidence**: **HIGH**

### Day Length
- **VALUE**:
  - **Mars sol**: 24h 39m 35s (88,775 seconds)
  - **Lunar day**: ≈29.5 Earth days (synodic month)
- **Source**: Astronomical reference
- **Confidence**: **HIGH**

---

## 8. NASA CAUTION & WARNING CLASSIFICATION

### ISS/Spacecraft Alert Levels
- **VALUE** (4 levels, descending priority):
  1. **EMERGENCY**: Time-critical, immediate action required, LOC/LOM scenarios (Fire, Rapid Depress, Toxic Atmosphere). Red indication. Memory items required.
  2. **WARNING**: Requires immediate crew action (not memorized, but quick response).
  3. **CAUTION**: Needs attention but not immediate action.
  4. **ADVISORY**: Normal/safe status message, routine information.
- **Source**: NTRS 20230001729, 20220002059, 20240003565 (NASA HSI/Alert presentations); ESA Tim Peake blog; Quora astronaut answers
- **Confidence**: **HIGH** — Documented NASA operational standard

---

## ASSUMPTIONS (items requiring explicit tagging)

1. **Vital sign alarm thresholds** (HR, SpO₂, temp, respiration) — Clinical ranges used pending NASA-STD-3001 access
2. **Suited walking speed** — 2-2.5 km/h estimate based on Apollo walkback constraint, not directly measured
3. **Thermal/cooling limits** — Concept valid but no quantitative thresholds found
4. **Sleep requirements** — General 7+ hours guideline, specific NASA standard not accessed
5. **SPE dose rates** — Event-dependent, no single value; magnitude varies by event size
6. **"Stress/Fatigue" metrics** — No NASA model found; these remain **CUT** items per audit

---

## Research Limitations

- **NASA-STD-3001 PDFs**: Located but not text-searchable via web_fetch (PDF limitation)
- **Detailed flight rules**: Many specific alarm thresholds likely exist in internal NASA documentation not publicly indexed
- **Timeboxed search**: ~90 minutes total; deeper NTRS dives could yield more specific values
- **Clinical fallback**: Where NASA-specific data unavailable, used widely-accepted clinical/engineering standards with ASSUMPTION tags

---

## Key Wins (HIGH confidence, sourced values)

✓ EMU suit pressure (4.3 psi)  
✓ CO₂ limits (cabin SMAC & EVA suit targets)  
✓ Radiation career limit (600 mSv)  
✓ Mars surface dose rate (0.64 mSv/day from MSL/RAD)  
✓ ISS dose rate (≈0.4-0.5 mSv/day)  
✓ Earth-Moon/Mars light times  
✓ EVA duration (7-8 hours)  
✓ Prebreathe protocol (4-hour O₂)  
✓ Metabolic rates (1000 BTU/hr avg, 2200 peak)  
✓ 10 km walkback distance limit  
✓ NASA C&W classification (Emergency/Warning/Caution/Advisory)  
✓ Mars solar conjunction blackout
