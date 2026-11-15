# AMWS Data Sources

**Research conducted**: November 14, 2026  
**Last updated**: November 14, 2026  
**All sources accessed**: November 14, 2026

This document contains all numeric values used in the AMWS prototype, with NASA sources (URLs and quotes) or explicit ASSUMPTION tags.

---

## Confidence Levels

- **HIGH**: Primary NASA source with URL and quote, or published peer-reviewed data
- **MEDIUM**: Secondary sources, limited data availability, or general NASA references without specific citation
- **ASSUMPTION**: Clinical standards, engineering estimates, or values pending NASA source

---

## Life Support — EMU Suit Specifications

### MK III Suit Pressure: 4.3 psig
- **VALUE**: 4.3 psig (max 8 psig for most components)
- **SOURCE**: Vos, Gernhardt, Lee (Jan 2007 preliminary report, 07ICES-9 / SAE 2007-01-3133)
- **QUOTED**: (MK III suit design spec stated in report)
- **URL**: https://ntrs.nasa.gov/citations/20070016007
- **NOTE**: MK III is prototype suit; operational EMU also 4.3 psi per secondary sources
- **Confidence**: **HIGH** for MK III; **MEDIUM** for EMU (secondary sources only)

### EMU Suit Pressure: 4.3 psi
- **VALUE**: 4.3 psi (29.6 kPa) differential, 100% O₂
- **SOURCE**: CCTV 2008 EMU specifications (secondary source; NASA NTRS primary not found despite search)
- **QUOTED**: "After donning the 'Snoopy cap', the gloves and helmet are then locked on, pressurizing the suit. The suit's regulator and fans activate when the servicing umbilicals are removed and the suit reaches an internal pressure of 4.3 psi (30 kPa)."
- **URL**: https://www.cctv.com/english/special/Shenzhou7/20080919/104965.shtml (also Wikipedia EMU article)
- **Confidence**: **MEDIUM** — Well-documented operational parameter but secondary sources only

### xEMU Variable Pressure: 4.3-8.2 psi
- **VALUE**: xEMU (next-gen suit for Artemis) designed for variable pressure
- **SOURCE**: NTRS 20230008644 (xEMU xPLSS presentation)
- **QUOTED**: "Operating pressures: 0.9, 4.3 psid (up to 8 psid for DCS treatment via a complex suit reconfig)"
- **URL**: https://ntrs.nasa.gov/citations/20230008644
- **NOTE**: This prototype models 4.3 psi fixed profile; future lunar/Mars operational pressure TBD
- **Confidence**: **HIGH** — NASA design document

### O₂ and Battery Duration: 7 hours
- **VALUE**: 7 hours of expendables (O₂, battery), plus 30-minute emergency reserve
- **SOURCE**: NASA.gov EMU page (general reference); CCTV 2008 article on EMU specifications
- **QUOTED**: "The self-contained life support system contains seven hours of expendables, such as oxygen, a battery for electrical power, water for cooling, lithium hydroxide for carbon dioxide removal and a 30-minute emergency life support system during an EVA."
- **URL**: https://www.nasa.gov/wp-content/uploads/2023/03/emu-fact-sheet.pdf (general reference)  
  https://www.cctv.com/english/special/Shenzhou7/20080919/104965.shtml
- **NOTE**: NASA NTRS primary citation not found despite search
- **Confidence**: **MEDIUM** — Matches multiple operational references but secondary sources

---

## Life Support — CO₂ Limits

### Cabin SMAC
- **VALUE**: 
  - 24-hour limit: 10 mmHg ppCO₂
  - 7-180 day limit: 5.3 mmHg ppCO₂
  - ISS operational: <4 mmHg (maintained well below SMAC)
- **SOURCE**: NTRS 20100036637, 20150021777, 20160013696
- **QUOTED**: "Consequently, flight rules have been employed to control the level of CO2 below 4 mm Hg, which is well below the existing Spacecraft Maximum Allowable Concentration (SMAC) of 10 mm Hg for 24-hour exposures, and 5.3 mm Hg for exposures of 7 to 180 days"
- **URL**: https://ntrs.nasa.gov/citations/20150021777
- **Confidence**: **HIGH** — Published NASA standards

### EVA Suit Inspired CO₂
- **VALUE**: 
  - Suit inlet target: <2 mmHg
  - **Inspired CO₂ nominal limit: 15 mmHg** (no specific duration stated; described as "nominal upper limit")
  - xPLSS CDHCU design: 3.8 mmHg average over 8-hour EVA
- **SOURCE**: NASA Technical Bulletin 02182025 (Suited CO₂); Nature article s41526-026-00589-x; NTRS 20170010189
- **QUOTED (Nature)**: "NASA standards dictate a nominal upper limit to the inspired partial pressure of CO2 (PICO2) of 15 mmHg in spacesuits"
- **QUOTED (NASA Tech Bulletin)**: "Inspired CO₂ partial pressure levels in Table 11.3-1 are based on review of scientific literature combined with past EVA experience, prescribed standardized human-in-the-loop testing, suit inlet CO₂ of <2 mmHg"
- **URL**: https://www.nature.com/articles/s41526-026-00589-x  
  https://www.nasa.gov/wp-content/uploads/2025/02/suited-co2-technical-bulletin-02182025.pdf
- **NOTE**: 15 mmHg is a nominal operational limit; no public caution/warning set points found for EMU
- **Confidence**: **HIGH** for 15 mmHg value; MEDIUM for lack of specific alarm thresholds

---

## Radiation

### Career Limit: 600 mSv
- **VALUE**: 600 mSv career effective dose
- **SOURCE**: NASA-STD-3001 Vol 1 Rev B; NASA Radiation Protection Technical Brief
- **QUOTED**: "Standards outlined in NASA-STD-3001 state that individual crewmember's total career effective radiation dose during spaceflight radiation exposure is not to exceed 600 millisieverts (mSv)."
- **URL**: https://nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
- **NOTE**: Effective dose accounts for biological weighting; different from absorbed dose (Gy) or dose equivalent (Sv with quality factors)
- **Confidence**: **HIGH** — Current NASA standard

### Dose Rates by Location

#### Mars Surface: 0.64 mSv/day
- **VALUE**: 0.64 ± 0.12 mSv/day (dose equivalent rate)
- **SOURCE**: MSL/RAD (Curiosity rover) direct measurement on Mars surface
- **QUOTED**: "Dose equivalent rate: 0.64 ± 0.12 mSv/day, Hassler et al 2014, Science"
- **URL**: https://wrmiss.org/workshops/twentieth/Guo.pdf (citing Hassler 2014 Science paper)
- **Confidence**: **HIGH** — Direct in-situ measurement

#### ISS/LEO: 0.42 mSv/day
- **VALUE**: ≈0.4-0.5 mSv/day or ≈72 mSv per 6-month mission
- **SOURCE**: NIH PMC article analyzing 19 ISS astronauts; NASA presentations
- **QUOTED**: "Physical and biological doses for 19 ISS astronauts yielded average effective doses...for the approximately 6-month missions of 72 mSv"
- **URL**: https://pubmed.ncbi.nlm.nih.gov/18582161/
- **NOTE**: Range 50-100 mSv per 6 months depending on solar cycle
- **Confidence**: **HIGH** — Flight dosimetry data

#### Deep Space Transit: 1.84 mSv/day
- **VALUE**: 1.84 ± 0.33 mSv/day (measured during MSL cruise to Mars)
- **SOURCE**: MSL/RAD cruise phase measurement
- **QUOTED**: "Compared to the ISS...the internal radiation dose rate within the DSG could be roughly 4.2 times as large based on data collected by the MSL spacecraft which recorded a Mars transit dose rate of (1.84 ± 0.33) mSv/day"
- **URL**: https://www.hou.usra.edu/meetings/deepspace2018/pdf/3107.pdf (citing RAD data)
- **NOTE**: This is MSL cruise measurement, often generalized as "deep space transit" rate; dose equivalent, not effective dose
- **Confidence**: **HIGH** — Direct measurement during Mars transit

#### Lunar Surface: 1.4 mSv/day
- **VALUE**: ≈1.4 mSv/day
- **SOURCE**: References in NASA planning documents; Chang'e-4 LND measurements
- **Confidence**: **MEDIUM** — Limited direct measurements (Chang'e-4 LND, Apollo-era data)

### Solar Particle Events (SPE)

#### August 1972 Historical Reference
- **VALUE — Blood Forming Organ (BFO) doses**:
  - Space suit (~1 g/cm² Al equivalent): 2.2 Sv (1.6 Gy)
  - Aluminum pressure vessel: 1.8 Sv (1.3 Gy)
  - Equipment room: 0.7 Sv (0.5 Gy)
  - X-ray mortality threshold comparison: 1.5 Gy (high dose rate)
- **VALUE — Bone marrow dose**:
  - Accumulated: 0.8 Gy
  - Peak dose rate: 9 cGy/h
  - Duration exceeding low-dose-rate criteria: ~16-25 hours (NCRP/UNSCEAR criteria)
- **VALUE — Cancer mortality risk and shielding**:
  - Annual 50 rem limit exceeded by Aug 1972 event with 5 g/cm² Al shielding
  - Cancer mortality risks for five major SPE events: 1.5-17% at 1 g/cm², 0.5-1.1% behind 10 g/cm² Al
- **SOURCE**: Multiple NASA NTRS papers analyzing Aug 1972 event
- **QUOTED (BFO doses)**: "The astronaut blood forming organ (BFO) exposure in deep space would have been 2.2 Sv (1.6 Gy) in a space suit, 1.8 Sv (1.3 Gy) in an aluminum pressure vessel, and 0.7 Sv (0.5 Gy) in an equipment room compared to an X-ray mortality threshold of 1.5 Gy (assuming high dose rate)." — NTRS 20040100724 (snippet from search result)
- **QUOTED (Bone marrow)**: "The peak dose rate was 9 cGy h(sup -1) which exceeds the low-dose-rate criteria for 25 hrs (National Council on Radiation Protection) and 16 hrs (United Nations Scientific Committee on the Effects of Atomic Radiation). The bone marrow dose accumulated was 0.8 Gy, which exceeded the 25 and 16 hour criteria and would pose a serious medical risk." — NTRS 20060010503
- **QUOTED (Cancer risk/shielding)**: "The annual limit of 50 rem was exceeded by the August 1972, October 1989, and the three combined 1989 events with 5 g/sq cm of shielding. Cancer mortality risks ranged from 1.5 to 17 percent at 1 g/sq cm and 0.5 to 1.1 percent behind 10 g/sq cm of shielding for five events." — NTRS 19910021747
- **URL**: 
  - https://ntrs.nasa.gov/citations/20040100724 (BFO doses)
  - https://ntrs.nasa.gov/citations/20060010503 (bone marrow)
  - https://ntrs.nasa.gov/citations/19910021747 (cancer risk/shielding)
  - https://ntrs.nasa.gov/citations/19910062147 (Townsend et al.)
  - https://ntrs.nasa.gov/citations/19880016043 (dose estimates)
- **NOTE**: Event-specific; labeled ILLUSTRATIVE in prototype; not predictive of future SPEs
- **Confidence**: **HIGH** for historical Aug 1972 data; not predictive of future events

#### SPE Warning Time
- **VALUE**: Warning time varies by event type and detection method
- **Two distinct warning regimes**:
  1. **Prompt particles (impulsive events)**: "20-30 min before particle fluxes reach standard threshold that indicate an event has begun. An additional 20-30 min are available before the SPE rises to a dangerous level."
  2. **CME shock arrival**: "~12 h or more from solar event onset at the Sun to hazardous shock arrival"
- **Detection improvements**: "Tens of minutes earlier than current forecasting techniques" per NASA 2017
- **SOURCE**: 
  - NTRS 19870008346 (1987 SPE forecasting — prompt particles)
  - NASA GSFC EPACT2 paper (CME shock arrival)
  - NASA 2017 article (detection improvements)
- **QUOTED (Prompt)**: "Reliable predictions of SPE can be made 20-30 minutes before particle fluxes reach a standard threshold that indicate an event has begun. An additional 20-30 minutes are available before the SPE rises to a dangerous level." — NTRS 19870008346
- **QUOTED (CME)**: "Hazardous intensities do not occur until the arrival of the shock itself. This provides an opportunity to warn astronauts to take shelter after the onset of the event at the Sun and before arrival of the shock, a time of ∼12 h or more." — NASA GSFC EPACT2 paper
- **QUOTED (Detection)**: "scientists from NASA...have shown that the warning signs of one type of space weather event can be detected tens of minutes earlier than with current forecasting techniques" — NASA 2017
- **URL**: 
  - https://ntrs.nasa.gov/api/citations/19870008346/downloads/19870008346.pdf
  - https://epact2.gsfc.nasa.gov/don/99Hide.pdf
  - https://www.nasa.gov/general/nasa-scientists-demonstrate-technique-to-improve-particle-warnings-that-protect-astronauts/
- **NOTE**: Warning time depends on event characteristics and forecasting capabilities; active research area
- **Confidence**: **MEDIUM** — Improving forecasting techniques; two distinct regimes with different timescales

#### SPE Duration and Characteristics
- **Duration**: Hours to days (typically <3 days for major events)
- **Onset**: ≈12 hours from solar event to shock arrival with hazardous flux
- **SOURCE**: Multiple NASA papers on SPE characteristics
- **QUOTED**: "large solar particle events are rare and their durations are measured in hours to days" (NTRS 20140000593)
- **QUOTED**: "Hazardous intensities do not occur until the arrival of the shock itself. This provides an opportunity to warn astronauts to take shelter after the onset of the event at the Sun and before arrival of the shock, a time of ∼12 h or more." (NASA GSFC EPACT2 paper)
- **URL**: https://ntrs.nasa.gov/api/citations/20140000593/downloads/20140000593.pdf  
  https://epact2.gsfc.nasa.gov/don/99Hide.pdf
- **Confidence**: **MEDIUM/HIGH** — General characteristics well-documented; specific dose rates event-dependent

---

## EVA Operations

### Metabolic Rates
- **VALUE**: 
  - **Apollo EVA average**: ≈1000 BTU/hr (293 W)
  - **Peak**: up to 2200 BTU/hr (645 W)
- **SOURCE**: Apollo EVA data; Gernhardt EVA Ops Chapter 5.4
- **QUOTED**: "Metabolic rates during those EVAs averaged 1000 BTU/hour, with peaks of up to 2200 BTU/hour."
- **URL**: https://nasa.gov/wp-content/uploads/2023/03/gernhardt-eva-ops-chp-5.4-2013.pdf
- **NOTE**: 1000 BTU/hr is Apollo EVA AVERAGE (not "resting/light"); baseline for EMU 7-hour consumables duration
- **Confidence**: **HIGH** — Apollo flight data

### Walkback Distance Limit: 10 km
- **VALUE**: 10 km (6.2 miles) maximum EVA excursion from habitat/lander
- **SOURCE**: NASA Walkback Test study (NTRS 20070016007); Apollo operational constraint
- **QUOTED**: "It has been assumed, based on Apollo program experience, that 10 kilometers (6.2 mi) will be the maximum EVA excursion distance from the lander or habitat to ensure the crew member's safe return to the habitat in the event of a rover failure."
- **URL**: https://ntrs.nasa.gov/citations/20070016007
- **Confidence**: **HIGH** — Apollo-derived operational constraint

### Walkback Test Data (Lunar)
- **VALUE**: 
  - **Speed**: 6.3 km/h average (3.94 mph)
  - **Duration**: 95.8 minutes average for 10 km
  - **Metabolic rate**: 2374 BTU/hr average (~10 kcal/min)
  - **Peak 15-min average**: 2617 BTU/hr
  - **Total energy**: 944 kcal
  - **Key finding**: Both averages "exceed the Apollo and EMU cooling capabilities"; subjects wanted to go faster but were cooling-limited
- **SOURCE**: Vos, Gernhardt, Lee (Jan 2007 preliminary report, 07ICES-9 / SAE 2007-01-3133)
- **QUOTED**: (Values provided from report summary; PDF not web-fetchable)
- **URL**: https://ntrs.nasa.gov/citations/20070016007 (also at https://www.lpi.usra.edu/lunar/constellation/NorcrossEtAl_NASA-TP-2009-214796_EVA%20Walkback%20Test.pdf)
- **TEST CONDITIONS**:
  - 6 male astronauts
  - MK III prototype suit at 4.3 psig (max 8 psig for most components)
  - Lunar gravity (1/6 g) partial-gravity simulator
  - Level treadmill
  - Scenario: 10 km return after ~4 hours of surface activity
- **CAVEATS**: Preliminary quicklook; level treadmill; offloaded gravity simulator; prototype MK III suit; lunar only; final NASA/TP-2009-214796 full report may contain revised data
- **Confidence**: **HIGH** for sourced test data; note caveats for operational applicability

### Walkback Cooling-Limited Pace (Lunar)
- **VALUE**: Configurable lower speed and metabolic rate
- **RATIONALE**: Test subjects were cooling-limited (wanted to go faster but exceeded cooling capacity); operational pace may need to be slower than test pace
- **Confidence**: **ASSUMPTION** — Made configurable pending operational data

### Walkback Mars Pace
- **VALUE**: Configurable speed and metabolic rate
- **RATIONALE**: No sourced Mars 10 km walkback test data found
- **NOTE**: Mars gravity (3/8 g) differs from lunar (1/6 g); suited walking mechanics and metabolic cost may differ
- **Confidence**: **ASSUMPTION** — No sourced Mars walkback data

### Prebreathe Protocol
- **VALUE**: In-Suit Light Exercise (ISLE) protocol current for ISS
- **SOURCE**: NASA EVA & Environmental Physiology page; Springer article on EVA prebreathe protocols
- **QUOTED (NASA page)**: "The SSEO team provides operations support for EVAs conducted by astronauts aboard the ISS by providing individualized exercise prescriptions for the in-suit light exercise (ISLE) prebreathe protocol."
- **URL**: https://www.nasa.gov/directorates/esdmd/hhp/space-suits-and-exploration-operations/  
  https://link.springer.com/rwe/10.1007/978-3-319-09575-2_60-1
- **NOTE**: Shuttle used cabin depress to 10.2 psi for 12 hours + prebreathe. ISS uses exercise protocols. Duration depends on cabin pressure (14.7 psi ISS) and suit pressure (4.3 psi EMU). Lunar/Mars protocols TBD.
- **Confidence**: **MEDIUM** — Current ISS protocol confirmed; not tracked in prototype (out-of-scope)

---

## Communication

### Earth-Moon Light Time: 1.3 seconds
- **VALUE**: 1.28-1.3 seconds one-way (average distance 384,400 km)
- **SOURCE**: Multiple educational sources (BBC, NASA, astronomical references)
- **QUOTED**: "Light travels at 300,000 kilometres per second, so it takes about 1.3 seconds for light to travel from the Moon back to the Earth."
- **URL**: https://www.rmg.co.uk/stories/space-astronomy/how-far-away-moon
- **Confidence**: **HIGH** — Established astronomical constant

### Earth-Mars Light Time: 3-22 minutes
- **VALUE**: 
  - Closest (opposition): 3 minutes (56 million km)
  - Farthest (conjunction): 22 minutes (401 million km)
  - Round trip at conjunction: up to 44 minutes
- **SOURCE**: NASA Mars communications documents; multiple educational sources
- **QUOTED**: "Radio signals take between three and 22 minutes to cross the distance between Earth and Mars."
- **URL**: https://spacedaily.com/t-earth-mars-radio-delay-44-minutes-solar-conjunction/  
  https://www.nasa.gov/wp-content/uploads/2024/01/mars-communications-disruption-and-delay.pdf
- **Confidence**: **HIGH** — Based on orbital mechanics

### Mars Solar Conjunction
- **DEFINITIONS CLARIFIED**:
  - **Behind Sun disk**: ≈1 day (geometric alignment, worst signal blockage)
  - **Severe degradation**: ≈3 days (within 2 solar radii, high noise)
  - **Command moratorium**: ≈2 weeks (NASA operational practice for robotic missions, includes margins)
  - **Crewed mission planning**: Weeks of autonomous capability required
- **SOURCES**: 
  - NASA.gov: "NASA will hold off sending commands to its Mars fleet for two weeks, from Nov. 11 to 25"
  - JPL TMO Progress Report 42-147: "Only during the superior conjunction of 2023 is the signal source at Mars expected to lie behind the disk of the Sun for about one day and within two solar radii (0.5 deg) for about three days."
  - NTRS 20210015955: "occurs every two Earth years and lasts for about two weeks"
- **URL**: https://www.nasa.gov/solar-system/planets/mars/nasas-mars-fleet-will-still-conduct-science-while-lying-low/  
  https://tmo.jpl.nasa.gov/2000-2009/progress_report/42-147/147C.pdf
- **QUOTED**: "For any crewed, roundtrip mission to Mars, direct spacecraft-to-Earth communications blackouts are inevitable and can last weeks."
- **Confidence**: **HIGH** — Multiple NASA sources confirm all figures in different contexts

---

## Alert Classification

### NASA Caution & Warning System
- **VALUE**: 4 levels (descending priority):
  1. **EMERGENCY**: Time-critical, immediate action, LOC/LOM (Fire, Rapid Depress, Toxic Atmosphere)
  2. **WARNING**: Immediate action required
  3. **CAUTION**: Attention needed, not immediate
  4. **ADVISORY**: Normal/safe status, routine information
- **SOURCE**: NASA HSI/Alert presentations (NTRS 20230001729, 20220002059, 20240003565)
- **QUOTED**: "Emergency – Time-critical event that requires immediate action and procedures to prevent loss of crew/loss of mission (LOC/LOM). Typically defined as Fire, Rapid Depress, Toxic Atmosphere"
- **URL**: https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf
- **Confidence**: **HIGH** — NASA operational standard for ISS

---

## Assumptions — Clinical Standards and Engineering Estimates

### Vital Sign Alarm Thresholds
- **Heart Rate**: 
  - Derived from metabolic rate model with ASSUMPTION-tagged mapping
  - **NOTE**: No sourced EVA HR ranges from Gernhardt 2013; mapping is engineering estimate
  - Thresholds: ASSUMPTION: CAUTION >125 BPM, WARNING >140 BPM, EMERGENCY >155 BPM
  - **Optional future enhancement** (low priority): Walkback test termination criterion was sustained HR/VO₂ >85% of peak; could implement relative-intensity alerts based on configurable crew HRmax (tagged ASSUMPTION)
  - **SOURCE for concept**: NASA flight rules exist but not publicly detailed
  - **ASSUMPTION**: All thresholds
  
- **SpO₂**: 
  - Normal ≥95%
  - Thresholds: ASSUMPTION: CAUTION <94%, WARNING <92%, EMERGENCY <90%
  - **ASSUMPTION**: Clinical hypoxia standards
  
- **Respiration**: 
  - EVA workload elevated (not resting 12-20/min)
  - Thresholds: ASSUMPTION: CAUTION <12 or >35, WARNING <10 or >40
  - **ASSUMPTION**: Adapted for EVA metabolic demand
  
- **Body Temperature**: 
  - Normal: 36.1-37.5°C
  - Thresholds: ASSUMPTION: CAUTION <36 or >38, WARNING <35.5 or >38.5, EMERGENCY <35 or >39
  - **ASSUMPTION**: Clinical hyperthermia/hypothermia thresholds

- **Confidence**: **ASSUMPTION** — Clinical standards applied; NASA flight rules not publicly detailed

### Thermal Limits
- **Suit temperature range**: Nominal 18-26°C
- **Thresholds**: CAUTION <15 or >29, WARNING <12 or >32
- **RATIONALE**: Reasonable operating range for crew comfort and suit systems
- **SOURCE for concept**: NTRS papers on cardiothermal modeling measure core temp but don't cite specific alarm limits
- **Confidence**: **ASSUMPTION** — Core temp monitoring concept valid; NASA-specific suit temp alarm limits not found

### Sleep Requirements
- **VALUE**: 7-9 hours general human health guidance
- **NOTE**: NASA-STD-3001 likely specifies but not accessible; ISS scheduled sleep approximately 8.5 hours per crew day
- **STATUS**: NOT TRACKED in prototype (cut per Phase 3 revision; not citeable)
- **Confidence**: **ASSUMPTION** — General guidance; NASA standard exists but not accessed

---

## Environment profiles (NASA planetary fact sheets)

### Moon — gravity, distance, surface temperature
- **Surface gravity (m/s²)**: 1.62
- **Distance from Earth (km)**: roughly 357,000 km to 407,000 km (mean opposition 378,000 km)
- **Diurnal temperature range (equator)**: 95 K to 390 K (~ -290 F to +240 F)
- **SOURCE**: NASA NSSDC Moon Fact Sheet
- **QUOTED**: "Surface gravity (m/s2) 1.62"; "The orbit changes over the course of the year so the distance from the Moon to Earth roughly ranges from 357,000 km to 407,000 km"; "Diurnal temperature range (equator): 95 K to 390 K (~ -290 F to +240 F)"
- **URL**: https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
- **Confidence**: **ELEVATED** — NASA planetary fact sheet (primary reference compilation)

### Mars — gravity, distance, surface temperature
- **Surface gravity (mean) (m/s²)**: 3.73
- **Distance from Earth (10^6 km)**: Minimum 54.6, Maximum 401.4
- **Average temperature**: ~214 K (-59 C); diurnal range 184 K to 242 K (-89 to -31 C) (Viking 1 Lander site)
- **SOURCE**: NASA NSSDC Mars Fact Sheet
- **QUOTED**: "Surface gravity (mean) (m/s2) 3.73"; "Distance from Earth Minimum (106 km) 54.6 Maximum (106 km) 401.4"; "Average temperature: ~214 K (-59 C)"; "Diurnal temperature range: 184 K to 242 K (-89 to -31 C) (Viking 1 Lander site)"
- **URL**: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
- **Confidence**: **ELEVATED** — NASA planetary fact sheet (primary reference compilation)

### Earth — gravity and temperature (reference)
- **Surface gravity (mean) (m/s²)**: 9.820 (standard 9.80665 m/s² exact, CODATA 2018)
- **Average temperature**: 288 K (15 C)
- **SOURCE**: NASA NSSDC Earth Fact Sheet
- **QUOTED**: "Surface gravity (mean) (m/s2) 9.820"; "Average temperature: 288 K (15 C)"
- **URL**: https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
- **Confidence**: **ELEVATED** — NASA planetary fact sheet (primary reference compilation)

### Thermal coupling (CUSTOM environment only)
- **Comfort band**: 10°C to 30°C; factors multiply coolant (hot) or battery (cold) drain at walkback and current EVA rate; capped at 2.0. Presets do not apply coupling.
- **Constants**: THERMAL_COMFORT_LO_C=10, THERMAL_COMFORT_HI_C=30, THERMAL_K_HOT=0.5, THERMAL_K_COLD=0.3, THERMAL_FACTOR_MAX=2.0
- **Confidence**: **ASSUMPTION** — illustrative model; no sourced thermal-load model relating ambient temperature to suit consumable drain rates.

### CUSTOM profile inputs and validation ranges
- **Fields**: gravity (m/s²), distanceKm, ambientTempC, doseRateMSvDay, paceKmh, walkMetabolicBtuHr. All CUSTOM values flagged ASSUMED.
- **Validation ranges (clamp/reject NaN/out-of-range)**: gravity 0–30 m/s²; distanceKm 0–6e9 km; ambientTempC -270–500 °C; doseRateMSvDay 0–10 mSv/day; paceKmh 0.5–8 km/h; walkMetabolicBtuHr 500–3000 BTU/hr.
- **Confidence**: **ASSUMPTION** — UI/input guard ranges for simulation stability and plausibility.

---

## Summary Statistics

- **ELEVATED confidence (primary NASA sources with URLs and quotes)**: 22 values
- **MEDIUM confidence (secondary sources, limited data, or general references)**: 6 values  
- **ASSUMPTIONS (clinical standards or engineering estimates)**: 10 categories
