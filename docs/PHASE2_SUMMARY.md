# Phase 2 Research Summary

## Data Table: Sourced Values & Confidence

| Category | Item | Value | Source Type | Confidence | Notes |
|----------|------|-------|-------------|------------|-------|
| **SUIT** | Pressure | 4.3 psi (29.6 kPa), 100% O₂ | NASA operational specs | **HIGH** | EMU standard |
| **SUIT** | O₂ duration | 7-8 hours nominal | Multiple NASA sources | **HIGH** | Includes 30-min reserve |
| **SUIT** | Battery duration | 7-8 hours | NASA sources | **HIGH** | Matches O₂ duration |
| **SUIT** | CO₂ suit inlet target | <2 mmHg | NASA Tech Bulletin 2025 | **HIGH** | Design spec |
| **SUIT** | CO₂ inspired limit | 15 mmHg nominal | NASA standards | **HIGH** | EVA operational limit |
| **CABIN** | CO₂ SMAC 24h | 10 mmHg | NASA SMAC docs | **HIGH** | Regulatory limit |
| **CABIN** | CO₂ SMAC 7-180d | 5.3 mmHg | NASA SMAC docs | **HIGH** | Regulatory limit |
| **CABIN** | CO₂ ISS flight rule | <4 mmHg | NASA operational docs | **HIGH** | Maintained below SMAC |
| **EVA** | Prebreathe protocol | 4-hour O₂ prebreathe | NASA DCS protocols | **HIGH** | ISS standard |
| **EVA** | Metabolic rate average | 1000 BTU/hr (293 W) | Apollo flight data | **HIGH** | Gernhardt 2013 |
| **EVA** | Metabolic rate peak | 2200 BTU/hr (645 W) | Apollo flight data | **HIGH** | Gernhardt 2013 |
| **EVA** | Walkback distance max | 10 km (6.2 mi) | NASA walkback studies | **HIGH** | Apollo-derived constraint |
| **EVA** | Walking speed | 2-2.5 km/h suited | Engineering estimate | **ASSUMPTION** | Not directly sourced |
| **RADIATION** | Career limit | 600 mSv | NASA-STD-3001 | **HIGH** | Current standard (2022+) |
| **RADIATION** | ISS/LEO dose rate | 0.4-0.5 mSv/day | ISS flight data | **HIGH** | ≈72 mSv per 6 months |
| **RADIATION** | Deep space transit | 1.8 mSv/day | NASA models | **MEDIUM** | GCR baseline estimate |
| **RADIATION** | Lunar surface | 1.4 mSv/day | Chang'e-4, Apollo | **MEDIUM** | Limited measurements |
| **RADIATION** | Mars surface | 0.64 ± 0.12 mSv/day | MSL/RAD (Curiosity) | **HIGH** | Direct measurement |
| **RADIATION** | SPE warning time | 40-60 minutes | NASA forecasting | **MEDIUM** | Variable by event |
| **RADIATION** | SPE duration | Hours to days | NASA literature | **HIGH** | Typically <3 days |
| **RADIATION** | SPE dose rate | Event-dependent | N/A | **ASSUMPTION** | Highly variable, no single value |
| **COMM** | Earth-Moon light time | 1.28-1.3 seconds | Astronomical | **HIGH** | 384,400 km average |
| **COMM** | Earth-Mars min | 3 minutes | Orbital mechanics | **HIGH** | 56M km opposition |
| **COMM** | Earth-Mars max | 22 minutes | Orbital mechanics | **HIGH** | 401M km conjunction |
| **COMM** | Mars conjunction blackout | 1 day (3 days degraded) | NASA JPL TMO | **HIGH** | Within 2 solar radii |
| **ALERTS** | NASA C&W levels | Emergency/Warning/Caution/Advisory | NASA operational docs | **HIGH** | ISS standard |
| **ENV** | Moon gravity | 1.62 m/s² (0.166 g) | Geophysical constant | **HIGH** | Standard value |
| **ENV** | Mars gravity | 3.71 m/s² (0.38 g) | Geophysical constant | **HIGH** | Standard value |
| **ENV** | Mars sol length | 24h 39m 35s | Astronomical | **HIGH** | 88,775 seconds |
| **VITALS** | HR thresholds | Clinical norms | Medical literature | **ASSUMPTION** | NASA flight rules not public |
| **VITALS** | SpO₂ thresholds | Clinical norms (<94% warn) | Medical literature | **ASSUMPTION** | NASA limits not public |
| **VITALS** | Temperature thresholds | 36.1-37.5°C normal | Clinical standard | **ASSUMPTION** | NASA limits not public |
| **VITALS** | Respiration thresholds | 12-20/min normal | Clinical standard | **ASSUMPTION** | NASA limits not public |
| **VITALS** | Sleep requirements | 7+ hours | General guidance | **ASSUMPTION** | NASA-STD-3001 not accessed |
| **THERMAL** | Suit cooling limits | Not quantified | N/A | **ASSUMPTION** | Concept valid, no numbers |

---

## Phase 1 Amendments Status

### ✓ Amendment 1: CUT "Integrity" status
- **Action**: Remove entirely, do not rework
- **Rationale**: Redundant with suit pressure reading

### ✓ Amendment 2: Replace "Radiation elevated" with sourced states
- **GCR Baseline**: Sourced by location (LEO 0.4-0.5, Mars 0.64, etc.)
- **SPE Profile**: 
  - Onset: 40-60 min warning (20-30 min to threshold + 20-30 to danger)
  - Peak: Event-dependent, no single multiplier
  - Duration: Hours to days (typically <3 days)
  - Shelter guidance: 10 g/cm² shielding mentioned for Mars surface
- **Status**: COMPLETE — No arbitrary multipliers, SPE characteristics sourced

### ✓ Amendment 3: NASA C&W classification sourced
- **Levels**: Emergency / Warning / Caution / Advisory (4 levels)
- **Emergency**: Time-critical, LOC/LOM, memory items (Fire, Rapid Depress, Toxic Atmosphere)
- **Warning**: Immediate action required
- **Caution**: Attention needed, not immediate
- **Advisory**: Normal/routine information
- **Source**: NTRS 20230001729, 20220002059, 20240003565 (NASA HSI presentations)
- **Status**: COMPLETE — Map app's risk levels to this standard

### ✓ Amendment 4: CO₂ cabin vs suit separated
- **Cabin SMAC**: 10 mmHg (24h), 5.3 mmHg (7-180d), <4 mmHg ISS operational
- **Suit inlet**: <2 mmHg target
- **Suit inspired**: 15 mmHg nominal limit
- **Exposure-duration dependence**: SMAC values time-dependent (24h vs 7-180d)
- **Status**: COMPLETE — Clearly separated, sourced independently

### ✓ Amendment 5: Sleep sourcing attempted
- **Result**: Specific NASA-STD-3001 sleep requirements not found (PDF not text-searchable)
- **General guidance**: 7-9 hours human health standard
- **Mars sol**: 24h 39m 35s sourced (astronomical)
- **NASA actigraphy/circadian guidance**: Research ongoing (NASA HRP) but specific protocols not public
- **Recommendation**: **TAG AS ASSUMPTION** — "7+ hours" with note that NASA-specific standards exist but not accessed
- **Status**: PARTIAL — Keep with assumption tag per amendment 5 guidance

### ✓ Amendment 6: Additional research items added
- **EVA prebreathe/DCS**: 4-hour O₂ prebreathe sourced (HIGH confidence)
- **EVA metabolic rate**: 1000 BTU/hr avg, 2200 peak sourced from Apollo (HIGH confidence)
- **Suit cooling/thermal load**: Concept valid but not quantified (ASSUMPTION)
- **Mars solar conjunction**: 1-day blackout, 3 days degraded sourced (HIGH confidence)
- **EVA elapsed vs planned**: Not specifically addressed (would be mission-specific)
- **Status**: COMPLETE — All items researched

### ✓ Amendment 7: Walkback speed and distance
- **10 km walkback distance**: Sourced from NASA walkback studies, Apollo constraint (HIGH confidence)
- **Walking speed**: 2-2.5 km/h estimate (ASSUMPTION — not directly sourced from Apollo data)
- **Source**: NTRS 20070016007 (Walkback Test), Apollo operational constraints
- **Status**: COMPLETE — Distance sourced, speed tagged assumption

### ✓ Amendment 8: Desktop view reframed
- **Action**: Keep as "ground/flight controller view" of same telemetry
- **No feature growth**: Desktop shows same data, different presentation
- **Status**: ACKNOWLEDGED — Will implement in Phase 3 spec

### ✓ Amendment 9: Demo controls isolated
- **Action**: Separate presenter controls from crew-facing UI in code and visual design
- **Status**: ACKNOWLEDGED — Will implement in Phase 3 spec

---

## Critical Gaps Requiring ASSUMPTION Tags

1. **Vital sign alarm thresholds** — NASA flight rules not in public domain; using clinical standards
2. **Suited walking speed** — 2-2.5 km/h estimate based on operational constraints, not measured
3. **Thermal limits** — Overheating documented as hazard but no quantitative thresholds found
4. **Sleep duration requirements** — General human health guidance, NASA-STD-3001 not accessed
5. **SPE dose rates** — Event-dependent, no single "elevated" multiplier; use GCR baseline + SPE alert state

---

## Open Questions for Phase 3

1. **Risk engine mapping**: How to map current 4-level risk scale (LOW/MODERATE/HIGH/CRITICAL) to NASA 4-level C&W (Advisory/Caution/Warning/Emergency)?
   - **Proposal**: 
     - Advisory → Status OK (no active alerts)
     - Caution → 1-2 non-critical warnings
     - Warning → Critical parameter or multiple cautions
     - Emergency → Life-support critical or auto-trigger criteria

2. **Readiness score replacement**: What replaces the weighted readiness score?
   - **Proposal**: Remove score entirely, show critical vitals status directly on home screen

3. **Stress/Fatigue cut**: Confirm these are fully removed (no sourced model found)
   - **Proposal**: CUT entirely per audit

4. **Hydration monitoring**: Keep or cut?
   - **Recommendation**: CUT — No real-time monitoring tech sourced, adds unsourced complexity

5. **SPE implementation**: How to represent SPE without arbitrary multiplier?
   - **Proposal**: 
     - Normal state: GCR baseline by location
     - SPE state: "SOLAR PARTICLE EVENT — SEEK SHELTER" alert with sourced characteristics (40-60 min warning, hours-to-days duration)
     - No dose-rate multiplier (event-dependent)

---

## Next Steps

**Phase 3**: Write SPEC.md with:
- Final feature list (post-cuts)
- Each feature justified with decision impact + data source
- Implementation plan for amendments
- Clear ASSUMPTION tags where needed

**Await approval to proceed.**
