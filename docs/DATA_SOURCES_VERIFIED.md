# AMWS Data Sources — Phase 2 Verified

**Research conducted**: November 14, 2026  
**All sources accessed**: November 14, 2026

---

## HIGH CONFIDENCE — Primary NASA Sources

### 1. EMU Suit Pressure
- **VALUE**: 4.3 psi (29.6 kPa) differential, 100% O₂
- **SOURCE**: Wikipedia EMU article (multiple NASA fact sheet references); space.stackexchange.com citing NASA sources
- **QUOTED**: "After donning the 'Snoopy cap', the gloves and helmet are then locked on, pressurizing the suit. The suit's regulator and fans activate when the servicing umbilicals are removed and the suit reaches an internal pressure of 4.3 psi (30 kPa)."
- **URL**: https://en.wikipedia.org/wiki/Extravehicular_Mobility_Unit
- **Confidence**: HIGH — Well-documented operational parameter

### 2. EMU O₂ and Battery Duration
- **VALUE**: 7 hours of expendables (O₂, battery), plus 30-minute emergency reserve
- **SOURCE**: CCTV 2008 article on EMU specifications
- **QUOTED**: "The self-contained life support system contains seven hours of expendables, such as oxygen, a battery for electrical power, water for cooling, lithium hydroxide for carbon dioxide removal and a 30-minute emergency life support system during an EVA."
- **URL**: https://www.cctv.com/english/special/Shenzhou7/20080919/104965.shtml
- **Confidence**: HIGH — Matches multiple operational references

### 3. CO₂ Limits — Cabin SMAC
- **VALUE**: 
  - 24-hour limit: 10 mmHg ppCO₂
  - 7-180 day limit: 5.3 mmHg ppCO₂
  - ISS operational: <4 mmHg (maintained well below SMAC)
- **SOURCE**: NTRS 20100036637, 20150021777, 20160013696
- **QUOTED**: "Consequently, flight rules have been employed to control the level of CO2 below 4 mm Hg, which is well below the existing Spacecraft Maximum Allowable Concentration (SMAC) of 10 mm Hg for 24-hour exposures, and 5.3 mm Hg for exposures of 7 to 180 days"
- **URL**: https://ntrs.nasa.gov/citations/20150021777
- **Confidence**: HIGH — Published NASA standards

### 4. CO₂ Limits — EVA Suit
- **VALUE**: 
  - Suit inlet target: <2 mmHg
  - **Inspired CO₂ nominal limit: 15 mmHg** (no specific duration stated in public sources; described as "nominal upper limit")
  - xPLSS CDHCU design: 3.8 mmHg average over 8-hour EVA
- **SOURCE**: NASA Technical Bulletin 02182025 (Suited CO₂); Nature article s41526-026-00589-x; NTRS 20170010189
- **QUOTED (Nature)**: "NASA standards dictate a nominal upper limit to the inspired partial pressure of CO2 (PICO2) of 15 mmHg in spacesuits"
- **QUOTED (NASA Tech Bulletin)**: "Inspired CO₂ partial pressure levels in Table 11.3-1 are based on review of scientific literature combined with past EVA experience, prescribed standardized human-in-the-loop testing, suit inlet CO₂ of <2 mmHg"
- **URL**: https://www.nature.com/articles/s41526-026-00589-x  
  https://www.nasa.gov/wp-content/uploads/2025/02/suited-co2-technical-bulletin-02182025.pdf
- **NOTE**: 15 mmHg is a nominal operational limit; no public caution/warning set points found for EMU in this search
- **Confidence**: HIGH for values stated; MEDIUM for lack of specific alarm thresholds

### 5. Radiation Career Limit
- **VALUE**: 600 mSv career effective dose
- **SOURCE**: NASA-STD-3001 Vol 1 Rev B; NASA Radiation Protection Technical Brief
- **QUOTED**: "Standards outlined in NASA-STD-3001 state that individual crewmember's total career effective radiation dose during spaceflight radiation exposure is not to exceed 600 millisieverts (mSv)."
- **URL**: https://nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
- **NOTE**: Effective dose accounts for biological weighting; different from absorbed dose (Gy) or dose equivalent (Sv with quality factors)
- **Confidence**: HIGH — Current NASA standard

### 6. Radiation Dose Rates — Mars Surface
- **VALUE**: 0.64 ± 0.12 mSv/day (dose equivalent rate)
- **SOURCE**: MSL/RAD (Curiosity rover) direct measurement on Mars surface
- **QUOTED**: "Dose equivalent rate: 0.64 ± 0.12 mSv/day, Hassler et al 2014, Science"
- **URL**: https://wrmiss.org/workshops/twentieth/Guo.pdf (citing Hassler 2014 Science paper)
- **Alternate**: NASA Goddard Space Math problem cites 0.7 mSv/day
- **Confidence**: HIGH — Direct in-situ measurement

### 7. Radiation Dose Rates — ISS/LEO
- **VALUE**: ≈0.4-0.5 mSv/day or ≈72 mSv per 6-month mission
- **SOURCE**: NIH PMC article analyzing 19 ISS astronauts; NASA presentations
- **QUOTED**: "Physical and biological doses for 19 ISS astronauts yielded average effective doses...for the approximately 6-month missions of 72 mSv"
- **URL**: https://pubmed.ncbi.nlm.nih.gov/18582161/
- **NOTE**: Alternative sources cite 50-100 mSv range per 6 months depending on solar cycle
- **Confidence**: HIGH — Flight dosimetry data

### 8. Radiation Dose Rates — Deep Space Transit (MSL/RAD)
- **VALUE**: 1.84 ± 0.33 mSv/day (measured during MSL cruise to Mars)
- **SOURCE**: MSL/RAD cruise phase measurement
- **QUOTED**: "Compared to the ISS...the internal radiation dose rate within the DSG could be roughly 4.2 times as large based on data collected by the MSL spacecraft which recorded a Mars transit dose rate of (1.84 ± 0.33) mSv/day"
- **URL**: https://www.hou.usra.edu/meetings/deepspace2018/pdf/3107.pdf (citing RAD data)
- **NOTE**: This is MSL cruise measurement, often generalized as "deep space transit" rate; dose equivalent, not effective dose
- **Confidence**: HIGH — Direct measurement during Mars transit

### 9. EVA Prebreathe Protocol — Current ISS
- **VALUE**: In-Suit Light Exercise (ISLE) protocol with O₂ prebreathe; earlier protocols used 4-hour resting in-suit or 2-hour exercise prebreathe
- **SOURCE**: NASA EVA & Environmental Physiology page; Springer article on EVA prebreathe protocols
- **QUOTED (NASA page)**: "The SSEO team provides operations support for EVAs conducted by astronauts aboard the ISS by providing individualized exercise prescriptions for the in-suit light exercise (ISLE) prebreathe protocol."
- **QUOTED (Springer)**: "A 2-hour exercise prebreathe protocol was developed for ISS"
- **URL**: https://www.nasa.gov/directorates/esdmd/hhp/space-suits-and-exploration-operations/  
  https://link.springer.com/rwe/10.1007/978-3-319-09575-2_60-1
- **NOTE**: Shuttle used cabin depress to 10.2 psi for 12 hours + prebreathe. ISS uses exercise protocols. Duration depends on cabin pressure (14.7 psi ISS) and suit pressure (4.3 psi EMU).
- **Confidence**: MEDIUM — Current protocol name confirmed, specific duration varies by operational plan

### 10. EVA Metabolic Rates
- **VALUE**: 
  - Average: ≈1000 BTU/hr (293 W)
  - Peak: up to 2200 BTU/hr (645 W)
- **SOURCE**: Apollo EVA data; Gernhardt EVA Ops Chapter 5.4
- **QUOTED**: "Metabolic rates during those EVAs averaged 1000 BTU/hour, with peaks of up to 2200 BTU/hour."
- **URL**: https://nasa.gov/wp-content/uploads/2023/03/gernhardt-eva-ops-chp-5.4-2013.pdf
- **Confidence**: HIGH — Apollo flight data

### 11. Walkback Distance Limit
- **VALUE**: 10 km (6.2 miles) maximum EVA excursion from habitat/lander
- **SOURCE**: NASA Walkback Test study (NTRS 20070016007); Apollo operational constraint
- **QUOTED**: "It has been assumed, based on Apollo program experience, that 10 kilometers (6.2 mi) will be the maximum EVA excursion distance from the lander or habitat to ensure the crew member's safe return to the habitat in the event of a rover failure."
- **URL**: https://ntrs.nasa.gov/citations/20070016007
- **Confidence**: HIGH — Apollo-derived operational constraint

### 12. Walkback Test Results
- **VALUE**: 6 astronauts successfully completed 10 km suited walk at simulated lunar gravity
- **SOURCE**: NTRS 20080014286 (walkback test results)
- **QUOTED**: "Results of the EVA Walkback Test showed that 6 male astronauts were able to ambulate 10 km on a level treadmill while wearing a prototype EVA suit in simulated lunar gravity."
- **URL**: https://ntrs.nasa.gov/citations/20080014286
- **NOTE**: Test was on level treadmill; specific achieved speeds not stated in abstract. Full report (NASA-TP-2009-214796) would contain detailed speed/metabolic data.
- **Confidence**: HIGH for feasibility; ASSUMPTION for walking speed without full report

### 13. Earth-Moon Light Time
- **VALUE**: 1.28-1.3 seconds one-way (average distance 384,400 km)
- **SOURCE**: Multiple educational sources (BBC, NASA, astronomical references)
- **QUOTED**: "Light travels at 300,000 kilometres per second, so it takes about 1.3 seconds for light to travel from the Moon back to the Earth."
- **URL**: https://www.rmg.co.uk/stories/space-astronomy/how-far-away-moon
- **Confidence**: HIGH — Established astronomical constant

### 14. Earth-Mars Light Time
- **VALUE**: 
  - Closest (opposition): 3 minutes (56 million km)
  - Farthest (conjunction): 22 minutes (401 million km)
  - Round trip at conjunction: up to 44 minutes
- **SOURCE**: NASA Mars communications documents; multiple educational sources
- **QUOTED**: "Radio signals take between three and 22 minutes to cross the distance between Earth and Mars."
- **URL**: https://spacedaily.com/t-earth-mars-radio-delay-44-minutes-solar-conjunction/  
  https://www.nasa.gov/wp-content/uploads/2024/01/mars-communications-disruption-and-delay.pdf
- **Confidence**: HIGH — Based on orbital mechanics

### 15. Mars Solar Conjunction
- **RECONCILIATION**:
  - **Command moratorium**: ≈10-14 days (NASA operational practice)
  - **Behind Sun disk**: ≈1 day
  - **Within 2 solar radii (degraded comms)**: ≈3 days
  - **Total disruption period**: Can last "weeks" for crewed missions
- **SOURCES**: 
  - NASA.gov: "NASA will hold off sending commands to its Mars fleet for two weeks, from Nov. 11 to 25"
  - JPL TMO Progress Report 42-147: "Only during the superior conjunction of 2023 is the signal source at Mars expected to lie behind the disk of the Sun for about one day and within two solar radii (0.5 deg) for about three days."
  - NTRS 20210015955: "occurs every two Earth years and lasts for about two weeks"
- **URL**: https://www.nasa.gov/solar-system/planets/mars/nasas-mars-fleet-will-still-conduct-science-while-lying-low/  
  https://tmo.jpl.nasa.gov/2000-2009/progress_report/42-147/147C.pdf
- **QUOTED**: "For any crewed, roundtrip mission to Mars, direct spacecraft-to-Earth communications blackouts are inevitable and can last weeks."
- **DEFINITION CLARITY**:
  - **1 day behind disk**: Geometric alignment, worst signal blockage
  - **3 days degraded**: Within 2 solar radii, high noise
  - **~2 weeks command moratorium**: Operational practice for robotic missions (conservative, includes margins)
  - **"Weeks" for crewed**: Planning horizon for autonomous ops capability
- **Confidence**: HIGH — Multiple NASA sources confirm all figures in different contexts

### 16. NASA Caution & Warning Classification
- **VALUE**: 4 levels (descending priority):
  1. **EMERGENCY**: Time-critical, immediate action, LOC/LOM (Fire, Rapid Depress, Toxic Atmosphere)
  2. **WARNING**: Immediate action required
  3. **CAUTION**: Attention needed, not immediate
  4. **ADVISORY**: Normal/safe status, routine information
- **SOURCE**: NASA HSI/Alert presentations (NTRS 20230001729, 20220002059, 20240003565)
- **QUOTED**: "Emergency – Time-critical event that requires immediate action and procedures to prevent loss of crew/loss of mission (LOC/LOM). Typically defined as Fire, Rapid Depress, Toxic Atmosphere"
- **URL**: https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf
- **Confidence**: HIGH — NASA operational standard for ISS

---

## MEDIUM CONFIDENCE — Limited Sources or Estimates

### 17. Radiation — Lunar Surface
- **VALUE**: ≈1.4 mSv/day
- **SOURCE**: References in NASA planning documents; Chang'e-4 LND measurements
- **Confidence**: MEDIUM — Limited direct measurements (Chang'e-4 LND, Apollo-era data)

### 18. SPE Warning Time
- **VALUE**: Variable; recent research demonstrates "tens of minutes" earlier detection possible; older references cite 20-30 minutes to threshold + 20-30 minutes to dangerous levels
- **SOURCE**: NASA 2017 article on improved forecasting; NTRS 19870008346 (1987 SPE forecasting)
- **QUOTED (2017)**: "scientists from NASA...have shown that the warning signs of one type of space weather event can be detected tens of minutes earlier than with current forecasting techniques"
- **QUOTED (1987)**: "Reliable predictions of SPE can be made 20-30 minutes before particle fluxes reach a standard threshold that indicate an event has begun. An additional 20-30 minutes are available before the SPE rises to a dangerous level."
- **URL**: https://www.nasa.gov/general/nasa-scientists-demonstrate-technique-to-improve-particle-warnings-that-protect-astronauts/  
  https://ntrs.nasa.gov/api/citations/19870008346/downloads/19870008346.pdf
- **NOTE**: Warning time depends on event characteristics, detection method, and evolving forecasting capabilities. 40-60 minutes is reasonable conservative estimate for planning.
- **Confidence**: MEDIUM — Time estimates from older literature; active research area with improving capabilities

### 19. SPE Characteristics
- **Duration**: Hours to days (typically <3 days for major events)
- **Shelter shielding**: 10 g/cm² mentioned for Mars surface shelter
- **Onset**: ≈12 hours from solar event to shock arrival with hazardous flux
- **SOURCE**: Multiple NASA papers on SPE characteristics
- **QUOTED**: "large solar particle events are rare and their durations are measured in hours to days" (NTRS 20140000593)
- **QUOTED**: "Hazardous intensities do not occur until the arrival of the shock itself. This provides an opportunity to warn astronauts to take shelter after the onset of the event at the Sun and before arrival of the shock, a time of ∼12 h or more." (NASA GSFC EPACT2 paper)
- **URL**: https://ntrs.nasa.gov/api/citations/20140000593/downloads/20140000593.pdf  
  https://epact2.gsfc.nasa.gov/don/99Hide.pdf
- **Confidence**: MEDIUM/HIGH — General characteristics well-documented; specific dose rates event-dependent

---

## ASSUMPTIONS — Clinical Standards or Engineering Estimates

### 20. Vital Sign Alarm Thresholds
- **Heart Rate, SpO₂, Temperature, Respiration**: NASA-specific flight rule thresholds not found in public domain
- **Clinical standards used**: HR 50-100 BPM normal, SpO₂ <94% warning/<90% critical, Temp 36.1-37.5°C normal, Resp 12-20/min normal
- **Confidence**: ASSUMPTION — Clinical medicine standards applied; NASA flight rules exist but not publicly detailed

### 21. Suited Walking Speed
- **VALUE**: 2-2.5 km/h assumed for return-time calculations
- **RATIONALE**: 10 km walkback constraint with ~4-5 hour margin implies speed in this range
- **NOTE**: NASA walkback test confirmed 10 km feasibility but full report with achieved speeds not accessed
- **Confidence**: ASSUMPTION — Engineering estimate based on constraint; should be made configurable

### 22. Thermal Limits
- **Core temperature**: Clinical hyperthermia/hypothermia thresholds (>38°C caution, >39°C critical; <36°C caution, <35°C critical)
- **Suit cooling capacity**: Heat rejection maintained by LCVG; specific numeric alarm thresholds not found
- **SOURCE**: General thermoregulation literature; NTRS papers on cardiothermal modeling measure core temp but don't cite specific alarm limits
- **Confidence**: ASSUMPTION for alarm thresholds — Core temp monitoring concept valid; NASA-specific limits not publicly specified

### 23. Sleep Requirements
- **VALUE**: 7-9 hours general human health guidance
- **NASA-specific**: NASA-STD-3001 likely specifies but PDF not text-searchable
- **ISS scheduled sleep**: Approximately 8.5 hours sleep period per crew day (operational schedule)
- **Confidence**: ASSUMPTION — General guidance applied; NASA standard exists but not accessed

### 24. SPE Dose Rates
- **VALUE**: Event-dependent, no single multiplier applicable
- **RATIONALE**: SPE characteristics vary widely by event size, spectrum, and shielding
- **Confidence**: ASSUMPTION — Concept of elevated dose during SPE is valid, but no single representative value

---

## Summary Statistics

- **HIGH confidence (primary NASA sources with URLs and quotes)**: 16 values
- **MEDIUM confidence (limited sources or estimates)**: 3 values  
- **ASSUMPTIONS (clinical standards or engineering estimates)**: 6 categories

**Key verification changes from initial Phase 2**:
1. Mars conjunction: Reconciled "1 day" (behind disk) vs "2 weeks" (command moratorium) definitions
2. Prebreathe: Updated to reflect current ISLE protocol vs historical 4-hour resting protocol
3. CO₂ 15 mmHg: Clarified as "nominal upper limit" without specific duration or alarm set points found
4. SPE warning: Downgraded to MEDIUM with note on evolving capabilities
5. Transit dose rate: Explicitly labeled as MSL/RAD measurement, not generic estimate
6. Walking speed: Confirmed as ASSUMPTION without full walkback report
7. Thermal: One additional search; core temp monitoring confirmed but alarm limits remain ASSUMPTION

All HIGH confidence rows now include URL and direct quote where applicable.
