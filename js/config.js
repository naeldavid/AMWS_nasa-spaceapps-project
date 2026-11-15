/* =========================================================================
   AMWS — Astronaut Mission Wrist System (concept prototype)
   config.js — static data: sourced constants, thresholds, mission scenarios.

   COMMENT CONVENTIONS:
     // source: <short ref> (see docs/DATA_SOURCES.md)   — citable value
     // ASSUMPTION: <reason>                             — not in a source
   Every constant has one of these two tags.
   ========================================================================= */
window.AMWS = window.AMWS || {};

(function (A) {
  'use strict';

  /* -----------------------------------------------------------------------
     PHYSICAL CONSTANTS
     ----------------------------------------------------------------------- */

  // source: exact SI value (see docs/DATA_SOURCES.md — astronomical constants)
  A.C_KMS = 299792.458; // km/s, speed of light

  /* -----------------------------------------------------------------------
     LIFE SUPPORT: EMU / MK III SUIT SPECS
     ----------------------------------------------------------------------- */

  // source: NTRS 20070016007 (Vos, Gernhardt, Lee 2007) — MK III 4.3 psig
  //         CCTV 2008 EMU specs (secondary; NASA NTRS primary not found)
  //         NTRS 20230008644 — xEMU variable 4.3–8.2 psi
  //         Prototype models 4.3 psi fixed (conservative, MK III basis)
  // CONFIDENCE: MEDIUM (MK III sourced; operational EMU secondary source)
  A.SUIT_PRESSURE_NOMINAL = 4.3; // psig

  // ASSUMPTION: pressure alert bands — no NASA public source for specific thresholds
  A.SUIT_PRESSURE_CAUTION_LO  = 4.1; // psi
  A.SUIT_PRESSURE_CAUTION_HI  = 4.7; // psi
  A.SUIT_PRESSURE_WARNING_LO  = 4.0; // psi
  A.SUIT_PRESSURE_WARNING_HI  = 4.9; // psi
  A.SUIT_PRESSURE_EMERGENCY_LO = 3.5; // psi — rapid breach; triggers auto-emergency

  // source: CCTV 2008 EMU specs — 7-hour unified expendables (O₂, battery, LiOH, cooling water)
  //         Gernhardt 2013 Apollo EVA data — 1000 BTU/hr Apollo EVA average as baseline
  // CONFIDENCE: MEDIUM (secondary source; matched by multiple references)
  A.CONSUMABLES_DURATION_NOMINAL = 7;   // hours at 1000 BTU/hr metabolic baseline
  A.EMERGENCY_RESERVE_H          = 0.5; // hours (30-min EMU emergency reserve)

  // ASSUMPTION: O₂ / battery / coolant / scrubber alert bands
  //             (600 mSv career limit and 30-min reserve are sourced; % bands are not)
  A.O2_CAUTION_PCT     = 25; // %
  A.O2_WARNING_PCT     = 15; // %
  A.O2_EMERGENCY_PCT   = 10; // % — triggers auto-emergency
  A.BATT_CAUTION_PCT   = 25; // % — ASSUMPTION (see O2 bands above)
  A.BATT_WARNING_PCT   = 15; // % — ASSUMPTION
  A.BATT_EMERGENCY_PCT = 10; // % — ASSUMPTION
  A.COOL_CAUTION_PCT   = 25; // % — ASSUMPTION
  A.COOL_WARNING_PCT   = 15; // % — ASSUMPTION
  A.SCRUB_CAUTION_PCT  = 25; // % — ASSUMPTION
  A.SCRUB_WARNING_PCT  = 15; // % — ASSUMPTION

  /* -----------------------------------------------------------------------
     CO₂ LIMITS
     ----------------------------------------------------------------------- */

  // source: NTRS 20150021777 — NASA SMAC cabin limits
  // CONFIDENCE: HIGH
  A.CO2_CABIN_SMAC_24H  = 10;  // mmHg ppCO₂ (24-hour exposure limit)
  A.CO2_CABIN_SMAC_180D = 5.3; // mmHg ppCO₂ (7–180 day limit)

  // source: NASA Tech Bulletin 02182025; Nature s41526-026-00589-x
  // CONFIDENCE: HIGH
  A.CO2_SUIT_INSPIRED_LIMIT = 15; // mmHg — nominal EVA upper limit; triggers auto-emergency

  // ASSUMPTION: intermediate CO₂ alert bands (15 mmHg limit sourced; caution/warning levels are not)
  A.CO2_CAUTION  =  5; // mmHg
  A.CO2_WARNING  = 10; // mmHg
  A.CO2_EMERGENCY = 15; // mmHg — sourced limit; also auto-emergency trigger

  /* -----------------------------------------------------------------------
     METABOLIC MODEL (PRIMARY STATE VARIABLE)
     ----------------------------------------------------------------------- */

  // source: Gernhardt 2013 (gernhardt-eva-ops-chp-5.4-2013.pdf) — Apollo EVA data
  //         1000 BTU/hr = Apollo EVA AVERAGE (not resting); peak ≤ 2200 BTU/hr
  // CONFIDENCE: HIGH
  A.METABOLIC_BASE = 1000; // BTU/hr — 7-hour consumables rated at this rate
  A.METABOLIC_PEAK = 2200; // BTU/hr — peak exertion

  // ASSUMPTION: HR derived from metabolic rate (no sourced EVA HR range from Gernhardt 2013)
  //             HR = HR_BASELINE + (metabolic - METABOLIC_BASE) × HR_SCALE
  A.HR_BASELINE = 90;    // BPM at metabolic baseline (ASSUMPTION)
  A.HR_SCALE    = 0.05;  // BPM per BTU/hr above baseline (ASSUMPTION)

  /* -----------------------------------------------------------------------
     WALKBACK SCENARIO
     ----------------------------------------------------------------------- */

  // source: NTRS 20070016007 (Vos, Gernhardt, Lee Jan 2007)
  // CONFIDENCE: HIGH
  A.WALKBACK_LIMIT_KM = 10; // km — operational constraint from Apollo experience

  // source: NTRS 20070016007 — 6 astronauts, MK III at 4.3 psig, lunar gravity simulator
  //         10 km in avg 95.8 min at avg 3.94 mph (6.3 km/h)
  //         Avg metabolic 2374 BTU/hr; subjects cooling-limited (wanted to go faster)
  //         CAVEAT: preliminary quicklook, level treadmill, partial-gravity offload, lunar only
  // CONFIDENCE: HIGH (sourced) with caveats (treadmill, MK III, lunar only)
  // source: NTRS 20070016007 (continued)
  A.WALKBACK_LUNAR_TEST_SPEED      = 6.3;  // km/h
  A.WALKBACK_LUNAR_TEST_METABOLIC  = 2374; // BTU/hr
  // Energy cost (derived from above): 2374 / 6.3 = 376.8 BTU/km
  A.WALKBACK_LUNAR_TEST_ENERGY_PER_KM = 376.8; // BTU/km — source: NTRS 20070016007

  // ASSUMPTION: cooling-limited pace.
  // The sourced test pace (6.3 km/h) exceeded Apollo/EMU cooling capability per NTRS 20070016007
  // (subjects were cooling-limited; they wanted to go faster but couldn't).
  // The conservative case uses a higher energy cost per km, NOT a sourced thermal limit.
  // Conservative multiplier: 450/376.8 = 1.19x over the sourced test pace (ASSUMPTION).
  A.WALKBACK_LUNAR_COOL_SPEED         = 4.0;   // km/h (ASSUMPTION — configurable)
  A.WALKBACK_LUNAR_COOL_METABOLIC     = 1800;  // BTU/hr (ASSUMPTION — configurable)
  A.WALKBACK_LUNAR_COOL_ENERGY_PER_KM = 450.0; // BTU/km (ASSUMPTION)
  A.WALKBACK_LUNAR_COOL_MULTIPLIER    = 1.19;   // ASSUMPTION: conservative case multiplier

  // ASSUMPTION: Mars pace — no sourced Mars 10 km walkback test data
  A.WALKBACK_MARS_SPEED     = 3.5;  // km/h (configurable)
  A.WALKBACK_MARS_METABOLIC = 2000; // BTU/hr (configurable)

  // ASSUMPTION: Earth / analog site pace
  A.WALKBACK_EARTH_SPEED     = 5.0;  // km/h (ASSUMPTION)
  A.WALKBACK_EARTH_METABOLIC = 1500; // BTU/hr (ASSUMPTION)

  // Return margin alert bands
  // source: 30-min EMU emergency reserve (CCTV 2008) anchors WARNING threshold
  // ASSUMPTION: 60-min CAUTION band
  A.MARGIN_CAUTION_S  = 60 * 60; // seconds (ASSUMPTION: 60 min)
  A.MARGIN_WARNING_S  = 30 * 60; // seconds — anchored to 30-min EMU reserve
  // margin < 0 → WARNING "CANNOT REACH HAB" (never Emergency class)

  /* -----------------------------------------------------------------------
     VITAL SIGN THRESHOLDS
     All tagged ASSUMPTION — NASA flight rules exist but are not publicly detailed.
     Clinical hypoxia / hyperthermia / hypocapnia thresholds adapted for EVA context.
     ----------------------------------------------------------------------- */

  // ASSUMPTION: heart rate thresholds (derived metric; mapped from metabolic rate)
  A.HR_CAUTION_HI   = 125; // BPM
  A.HR_WARNING_HI   = 140; // BPM
  A.HR_EMERGENCY_HI = 155; // BPM
  A.HR_CAUTION_LO   =  50; // BPM (resting bradycardia concern)
  A.HR_WARNING_LO   =  45; // BPM

  // ASSUMPTION: SpO₂ — clinical hypoxia standards
  A.SPO2_CAUTION_LO   = 94; // %
  A.SPO2_WARNING_LO   = 92; // %
  A.SPO2_EMERGENCY_LO = 90; // %

  // ASSUMPTION: respiration rate — adapted for EVA workload (not resting 12–20/min range)
  A.RESP_CAUTION_LO  = 12; // breaths/min
  A.RESP_CAUTION_HI  = 35; // breaths/min
  A.RESP_WARNING_LO  = 10; // breaths/min
  A.RESP_WARNING_HI  = 40; // breaths/min

  // ASSUMPTION: core temperature — clinical hypo/hyperthermia thresholds
  A.TEMP_CAUTION_LO   = 36.0; // °C
  A.TEMP_CAUTION_HI   = 38.0; // °C
  A.TEMP_WARNING_LO   = 35.5; // °C
  A.TEMP_WARNING_HI   = 38.5; // °C
  // ASSUMPTION: temperature thresholds (continued)
  A.TEMP_EMERGENCY_LO = 35.0; // °C
  A.TEMP_EMERGENCY_HI = 39.0; // °C

  // ASSUMPTION: suit temperature — reasonable crew comfort and suit-system range
  A.SUIT_TEMP_CAUTION_LO  = 15; // °C
  A.SUIT_TEMP_CAUTION_HI  = 29; // °C
  A.SUIT_TEMP_WARNING_LO  = 12; // °C
  A.SUIT_TEMP_WARNING_HI  = 32; // °C

  /* -----------------------------------------------------------------------
     LIMITS TABLE — drives all classification in assess.js.
     Levels: 0 = nominal / 1 = caution / 2 = warning / 3 = emergency
     (assess.js maps 1→CAUTION, 2→WARNING, 3→EMERGENCY for display;
      internally 0/1/2 as before for backward compat, but emergency
      is a distinct flag on specific parameters)
     ----------------------------------------------------------------------- */
  A.LIMITS = {
    // ASSUMPTION: all threshold values (see individual constants above for rationale)
    hr:       { unit: 'BPM',    normal: [50, 100],   cautionLo: A.HR_CAUTION_LO,   cautionHi: A.HR_CAUTION_HI,
                                                      warnLo: A.HR_WARNING_LO,      warnHi: A.HR_WARNING_HI,
                                                      emergHi: A.HR_EMERGENCY_HI },
    spo2:     { unit: '%',      normal: [95, 100],   cautionLo: A.SPO2_CAUTION_LO,
                                                      warnLo: A.SPO2_WARNING_LO,
                                                      emergLo: A.SPO2_EMERGENCY_LO },
    temp:     { unit: '°C',     normal: [36.1, 37.5], cautionLo: A.TEMP_CAUTION_LO,  cautionHi: A.TEMP_CAUTION_HI,
                                                      warnLo: A.TEMP_WARNING_LO,    warnHi: A.TEMP_WARNING_HI,
                                                      emergLo: A.TEMP_EMERGENCY_LO,  emergHi: A.TEMP_EMERGENCY_HI },
    resp:     { unit: 'BR/MIN', normal: [12, 20],    cautionLo: A.RESP_CAUTION_LO,  cautionHi: A.RESP_CAUTION_HI,
                                                      warnLo: A.RESP_WARNING_LO,    warnHi: A.RESP_WARNING_HI },
    suitP:    { unit: 'PSI',    normal: [4.1, 4.5],  cautionLo: A.SUIT_PRESSURE_CAUTION_LO,  cautionHi: A.SUIT_PRESSURE_CAUTION_HI,
                                                      warnLo: A.SUIT_PRESSURE_WARNING_LO,    warnHi: A.SUIT_PRESSURE_WARNING_HI,
                                                      emergLo: A.SUIT_PRESSURE_EMERGENCY_LO },
    suitT:    { unit: '°C',     normal: [18, 26],    cautionLo: A.SUIT_TEMP_CAUTION_LO, cautionHi: A.SUIT_TEMP_CAUTION_HI,
                                                      warnLo: A.SUIT_TEMP_WARNING_LO,   warnHi: A.SUIT_TEMP_WARNING_HI },
    co2:      { unit: 'mmHg',   normal: [0, 4.0],    cautionHi: A.CO2_CAUTION,
                                                      warnHi: A.CO2_WARNING,
                                                      emergHi: A.CO2_EMERGENCY },
    // source: 7-hour EMU basis; alert bands ASSUMPTION
    o2:       { unit: '%',      normal: [30, 100],   cautionLo: A.O2_CAUTION_PCT,   warnLo: A.O2_WARNING_PCT,
                                                      emergLo: A.O2_EMERGENCY_PCT },
    suitBatt: { unit: '%',      normal: [30, 100],   cautionLo: A.BATT_CAUTION_PCT, warnLo: A.BATT_WARNING_PCT,
                                                      emergLo: A.BATT_EMERGENCY_PCT },
    coolant:  { unit: '%',      normal: [30, 100],   cautionLo: A.COOL_CAUTION_PCT, warnLo: A.COOL_WARNING_PCT },
    scrubber: { unit: '%',      normal: [30, 100],   cautionLo: A.SCRUB_CAUTION_PCT, warnLo: A.SCRUB_WARNING_PCT },
    watchBatt:{ unit: '%',      normal: [25, 100],   cautionLo: 20, warnLo: 8 },
    // ASSUMPTION: signal thresholds (simulated link budget)
    signal:   { unit: '%',      normal: [40, 100],   cautionLo: 40, warnLo: 20, emergLo: 5 }
  };

  /* -----------------------------------------------------------------------
     RADIATION
     ----------------------------------------------------------------------- */

  // source: NASA-STD-3001 Vol 1 Rev B; NASA Radiation Protection Technical Brief
  // CONFIDENCE: HIGH
  A.CAREER_LIMIT_MSV = 600; // mSv — career effective dose limit

  // ASSUMPTION: career dose alert bands (limit sourced; band thresholds are not)
  A.CAREER_DOSE_CAUTION_MSV = 400; // mSv
  A.CAREER_DOSE_WARNING_MSV = 500; // mSv

  // source: MSL/RAD cruise phase 1.84 ± 0.33 mSv/day (see docs/DATA_SOURCES.md)
  // CONFIDENCE: HIGH (direct measurement)
  A.DOSE_RATE_TRANSIT_MSVD = 1.84;

  // source: MSL/RAD Hassler 2014 Science — 0.64 ± 0.12 mSv/day on Mars surface
  // CONFIDENCE: HIGH (direct measurement)
  A.DOSE_RATE_MARS_MSVD = 0.64;

  // source: NIH PMC 18582161 — ~0.42 mSv/day (72 mSv per 6-month ISS mission)
  // CONFIDENCE: HIGH (flight dosimetry data)
  A.DOSE_RATE_ISS_MSVD = 0.42;

  // ASSUMPTION: lunar surface ~1.4 mSv/day (Chang'e-4 LND + Apollo-era limited data)
  // CONFIDENCE: MEDIUM
  A.DOSE_RATE_LUNAR_MSVD = 1.4;

  // Radiation level multipliers (applied to baseline dose rate in sim.js)
  // ASSUMPTION: multiplier values — SPE dose-rate magnitude is event-specific;
  //             Aug 1972 BFO doses (NTRS 20040100724) used as ILLUSTRATIVE reference only
  A.RAD_LEVELS = {
    NORMAL:   { mult: 1,   label: 'NORMAL' },
    ELEVATED: { mult: 3.5, label: 'ELEVATED' },      // ASSUMPTION
    SPE:      { mult: 40,  label: 'SOLAR PARTICLE EVENT' } // ASSUMPTION — illustrative
  };

  // ASSUMPTION: career dose percentage alert bands
  A.RAD_CAUTION_PCT  = 67; // % of career limit (~400 mSv) — ASSUMPTION
  A.RAD_WARNING_PCT  = 83; // % of career limit (~500 mSv) — ASSUMPTION

  /* -----------------------------------------------------------------------
     COMMUNICATION DELAYS
     ----------------------------------------------------------------------- */

  // source: Astronomical constants; RMG/BBC 1.3 s Moon; NASA mars-communications PDF
  // CONFIDENCE: HIGH
  A.DELAY_MOON_S     = 1.3;    // seconds one-way (Moon average distance 384,400 km)
  A.DELAY_MARS_MIN_S = 180;    // seconds (3 min at closest approach ~56 Mkm)
  A.DELAY_MARS_MAX_S = 1320;   // seconds (22 min at conjunction ~401 Mkm)

  // source: NASA.gov Nov 2023 robotic-fleet moratorium; JPL TMO 42-147 2023 geometry
  // CONFIDENCE: HIGH (all three figures from separate NASA sources)
  A.CONJUNCTION_DISK_DAYS        = 1;  // day — behind Sun disk (2023 geometry)
  A.CONJUNCTION_DEGRADED_DAYS    = 3;  // days — within 2 solar radii, severe noise
  A.CONJUNCTION_MORATORIUM_DAYS  = 14; // days — robotic-fleet command moratorium (practice)

  // ASSUMPTION: conjunction alert timeline (design choice for crewed ops)
  A.CONJUNCTION_ADVISORY_DAYS = 30; // days out — ASSUMPTION
  A.CONJUNCTION_CAUTION_DAYS  =  7; // days out — ASSUMPTION
  A.CONJUNCTION_WARNING_DAYS  =  3; // days — severe degradation window — ASSUMPTION

  /* -----------------------------------------------------------------------
     MISSION SCENARIOS: location × phase
     dist   = one-way distance from Earth (km) — used to compute light-time
     gravity = local surface g (multiples of Earth g)
     dose    = baseline GCR dose rate (mSv/day) — see constants above
     ----------------------------------------------------------------------- */
  A.LOCATIONS = {
    EARTH: {
      name: 'EARTH', destination: 'LOW EARTH ORBIT', site: 'TRAINING / LEO STATION',
      phases: {
        TRANSIT: {
          label: 'LEO — ORBITAL', dist: 420, toGo: null, gravity: 0.0,
          altitude: '420 km',
          // source: NIH PMC 18582161 — ISS ~0.42 mSv/day
          dose: A.DOSE_RATE_ISS_MSVD,
          relay: 0.35, env: 'MICROGRAVITY · PRESSURIZED CABIN'
        },
        LANDING: {
          label: 'ENTRY / DESCENT', dist: 80, toGo: 80, gravity: 1.6,
          altitude: '80 km', dose: 0.3, // ASSUMPTION: re-entry shielding
          relay: 0.35, env: 'ENTRY LOADS · SUITED'
        },
        SURFACE: {
          label: 'EARTH — SURFACE', dist: 0, toGo: null, gravity: 1.0,
          altitude: '0.02 km', dose: 0.008, // ASSUMPTION: Earth surface background
          relay: 0.05, env: 'ANALOG FIELD TEST'
        }
      }
    },
    MOON: {
      name: 'MOON', destination: 'MOON', site: 'SOUTH POLAR SITE',
      phases: {
        TRANSIT: {
          label: 'TRANS-LUNAR CRUISE', dist: 212000, toGo: 172400, gravity: 0.0,
          altitude: '—',
          // source: MSL/RAD cruise ~1.84 mSv/day (trans-lunar is similar deep-space environment)
          // ASSUMPTION: using transit value as proxy; lunar transit-specific data not found
          dose: 1.6,
          relay: 0.2, env: 'MICROGRAVITY · CABIN'
        },
        LANDING: {
          label: 'POWERED DESCENT', dist: 384400, toGo: 12, gravity: 0.3,
          altitude: '12 km',
          // ASSUMPTION: descent dose rate (between transit and surface)
          dose: 1.4,
          relay: 0.2, env: 'DESCENT · SUITED'
        },
        SURFACE: {
          label: 'MOON — SURFACE', dist: 384400, toGo: null,
          // source: Chang'e-4 LND + Apollo-era data (~1.4 mSv/day) — MEDIUM confidence
          gravity: 0.166, altitude: '1.8 km (rim)', dose: A.DOSE_RATE_LUNAR_MSVD,
          relay: 0.2, env: 'VACUUM · EVA'
        }
      }
    },
    MARS: {
      name: 'MARS', destination: 'MARS', site: 'BASE ALPHA',
      phases: {
        TRANSIT: {
          label: 'EARTH–MARS CRUISE', dist: 118000000, toGo: 96000000, gravity: 0.0,
          altitude: '—',
          // source: MSL/RAD cruise phase 1.84 mSv/day (NTRS / Guo 2014)
          dose: A.DOSE_RATE_TRANSIT_MSVD,
          relay: 0.5, env: 'MICROGRAVITY · CABIN'
        },
        LANDING: {
          label: 'ENTRY, DESCENT & LANDING', dist: 226000000, toGo: 22, gravity: 0.9,
          altitude: '22 km',
          // ASSUMPTION: EDL dose rate between transit and surface
          dose: 0.9,
          relay: 0.5, env: 'EDL · SUITED'
        },
        SURFACE: {
          label: 'MARS — SURFACE', dist: 226000000, toGo: null,
          // source: MSL/RAD Hassler 2014 Science — 0.64 mSv/day on Mars surface
          gravity: 0.38, altitude: '1.2 km', dose: A.DOSE_RATE_MARS_MSVD,
          relay: 0.5, env: '0.6 kPa CO₂ ATM · EVA'
        }
      }
    }
  };

  /* -----------------------------------------------------------------------
     MISSION TIMELINE — next-event countdown (offsets from MET start, seconds)
     ASSUMPTION: event schedule is illustrative
     ----------------------------------------------------------------------- */
  A.EVENTS = [
    { t: 13331, name: 'EVA END — HAB INGRESS' },
    { t: 20131, name: 'MEDICAL CHECK · CREW' },
    { t: 30331, name: 'COMMS WINDOW — DSN PASS' },
    { t: 43200, name: 'SLEEP PERIOD' },
    { t: 86400, name: 'TRAVERSE 04' }
  ];

  /* Pre-set glove-friendly messages (typing in gloves is impractical) */
  A.CANNED_MESSAGES = [
    'EVA PROGRESSING NOMINAL',
    'SAMPLE COLLECTED — SITE 3',
    'REQUEST SCHEDULE UPDATE',
    'RETURNING TO HABITAT'
  ];

  /* -----------------------------------------------------------------------
     MET SCENARIO START POINTS
     met  = mission elapsed time (days) at scenario start
     dose = cumulative mission dose (mSv) accumulated to that point
     Both are ASSUMPTION (illustrative scenario timing and accumulated dose)
     ----------------------------------------------------------------------- */
  A.SCENARIO_START = {
    'EARTH:TRANSIT': { met: 142, dose: 71.0  },
    'EARTH:LANDING': { met: 182, dose: 91.0  },
    'EARTH:SURFACE': { met: 3,   dose: 0.03  },
    'MOON:TRANSIT':  { met: 2,   dose: 3.1   },
    'MOON:LANDING':  { met: 4,   dose: 6.4   },
    'MOON:SURFACE':  { met: 6,   dose: 9.1   },
    'MARS:TRANSIT':  { met: 142, dose: 255.6 },
    'MARS:LANDING':  { met: 205, dose: 369.0 },
    'MARS:SURFACE':  { met: 236, dose: 388.8 }
  };

  /* -----------------------------------------------------------------------
     DEMO SCENARIO — Mars surface EVA, suit fault develops → emergency ~60 s
     Uses metabolic rate as the driver; HR, SpO₂, CO₂ follow from it.
     Initial scrubber=55% so SCRUBBER is the limiting resource at start.
     At t≈32 s battery drops to 17% → BATTERY becomes the limiting resource.
     ASSUMPTION: scenario timing and ramp magnitudes (illustrative)
     ----------------------------------------------------------------------- */
  A.DEMO = [
    { at: 0,  dur: 6,  text: 'Nominal Mars EVA. ASTRONAUT-01 at 1.4 km from habitat. SCRUBBER limiting.',
      set: { metabolic: 1000, spo2Base: 98, co2Base: 2.1, suitPBase: 4.3, suitBattDrain: 1 } },
    { at: 8,  dur: 14, text: 'Metabolic rate rising — high workload, possible thermal stress.',
      set: { metabolic: 1600, tempBase: 37.6 } },
    { at: 20, dur: 14, text: 'CO₂ scrubber degrading. SpO₂ beginning to fall.',
      set: { co2Base: 6.2, spo2Base: 92 } },
    { at: 32, dur: 12, text: 'Battery draining fast (heater load). BATTERY now limiting resource.',
      set: { suitBattTarget: 17 } },
    { at: 42, dur: 10, text: 'Slow suit pressure decay. Metabolic workload elevated.',
      set: { suitPBase: 3.8, spo2Base: 88, metabolic: 1900 } },
    { at: 54, dur: 6,  text: 'CO₂ critical + pressure approaching breach threshold → auto-EMERGENCY.',
      set: { co2Base: 8.0, spo2Base: 86, suitPBase: 3.4 } }
  ];
  // ASSUMPTION: demo scenario length
  A.DEMO_LENGTH = 62; // seconds

})(window.AMWS);
