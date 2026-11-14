/* =========================================================================
   AMWS — Astronaut Mission Wrist System (concept prototype)
   config.js — static data: thresholds, mission scenarios, demo script.
   All values are SIMULATED and for demonstration only.
   ========================================================================= */
window.AMWS = window.AMWS || {};

(function (A) {
  'use strict';

  /* Speed of light, km/s — used for one-way light-time (comm delay). */
  A.C_KMS = 299792.458;

  /* -----------------------------------------------------------------------
     Status thresholds. Each metric: warn / crit bounds (low and/or high).
     Values loosely based on published human-spaceflight & clinical norms,
     simplified for a concept demo. NOT medical or flight rules.
     ----------------------------------------------------------------------- */
  A.LIMITS = {
    hr:        { unit: 'BPM',  normal: [50, 100],  warnLo: 45,  critLo: 40,  warnHi: 115, critHi: 150 },
    spo2:      { unit: '%',    normal: [95, 100],  warnLo: 94,  critLo: 90 },
    temp:      { unit: '°C',   normal: [36.1, 37.5], warnLo: 35.8, critLo: 35.0, warnHi: 37.9, critHi: 39.0 },
    resp:      { unit: 'BR/MIN', normal: [12, 20], warnLo: 10,  critLo: 8,   warnHi: 24,  critHi: 30 },
    fatigue:   { unit: '%',    normal: [0, 45],    warnHi: 60,  critHi: 85 },
    stress:    { unit: '%',    normal: [0, 45],    warnHi: 65,  critHi: 88 },
    hydration: { unit: '%',    normal: [70, 100],  warnLo: 55,  critLo: 40 },
    suitP:     { unit: 'PSI',  normal: [4.1, 4.5], warnLo: 4.0, critLo: 3.5, warnHi: 4.7, critHi: 5.0 },
    suitT:     { unit: '°C',   normal: [18, 26],   warnLo: 15,  critLo: 10,  warnHi: 29,  critHi: 33 },
    co2:       { unit: 'mmHg', normal: [0, 4.0],   warnHi: 5.0, critHi: 7.6 },
    o2:        { unit: '%',    normal: [30, 100],  warnLo: 25,  critLo: 10 },
    suitBatt:  { unit: '%',    normal: [30, 100],  warnLo: 25,  critLo: 10 },
    watchBatt: { unit: '%',    normal: [25, 100],  warnLo: 20,  critLo: 8 },
    signal:    { unit: '%',    normal: [40, 100],  warnLo: 30,  critLo: 5 },
    lifeSupport:{ unit: '%',   normal: [60, 100],  warnLo: 45,  critLo: 25 },
    food:      { unit: '%',    normal: [40, 100],  warnLo: 25,  critLo: 10 }
  };

  /* Career effective-dose limit used for the exposure meter (NASA 2022 standard: 600 mSv). */
  A.CAREER_LIMIT_MSV = 600;

  /* Radiation dose-rate multipliers selectable from the simulation controls. */
  A.RAD_LEVELS = {
    NORMAL:   { mult: 1,   label: 'NORMAL' },
    ELEVATED: { mult: 3.5, label: 'ELEVATED' },
    SPE:      { mult: 40,  label: 'SOLAR PARTICLE EVENT' }
  };

  /* -----------------------------------------------------------------------
     Mission scenarios: location × phase.
     dist     = distance from Earth (km)
     toGo     = remaining distance to destination (km) or null
     gravity  = local g
     dose     = baseline dose rate mSv/day (approximate published magnitudes:
                LEO ≈0.5, deep-space cruise ≈1.8, lunar surface ≈1.4, Mars surface ≈0.65)
     ----------------------------------------------------------------------- */
  A.LOCATIONS = {
    EARTH: {
      name: 'EARTH', destination: 'LOW EARTH ORBIT', site: 'TRAINING / LEO STATION',
      phases: {
        TRANSIT: { label: 'LEO — ORBITAL', dist: 420, toGo: null, gravity: 0.0, altitude: '420 km', dose: 0.5, relay: 0.35, env: 'MICROGRAVITY · PRESSURIZED CABIN', terrain: 'N/A — ORBITAL' },
        LANDING: { label: 'ENTRY / DESCENT', dist: 80, toGo: 80, gravity: 1.6, altitude: '80 km', dose: 0.3, relay: 0.35, env: 'ENTRY LOADS · SUITED', terrain: 'RECOVERY ZONE' },
        SURFACE: { label: 'EARTH — SURFACE', dist: 0, toGo: null, gravity: 1.0, altitude: '0.02 km', dose: 0.008, relay: 0.05, env: 'ANALOG FIELD TEST', terrain: 'BASALT FIELD · ANALOG SITE' }
      }
    },
    MOON: {
      name: 'MOON', destination: 'MOON', site: 'SOUTH POLAR SITE',
      phases: {
        TRANSIT: { label: 'TRANS-LUNAR CRUISE', dist: 212000, toGo: 172400, gravity: 0.0, altitude: '—', dose: 1.6, relay: 0.2, env: 'MICROGRAVITY · CABIN', terrain: 'N/A — CRUISE' },
        LANDING: { label: 'POWERED DESCENT', dist: 384400, toGo: 12, gravity: 0.3, altitude: '12 km', dose: 1.4, relay: 0.2, env: 'DESCENT · SUITED', terrain: 'CRATER RIM APPROACH' },
        SURFACE: { label: 'MOON — SURFACE', dist: 384400, toGo: null, gravity: 0.166, altitude: '1.8 km (rim)', dose: 1.37, relay: 0.2, env: 'VACUUM · EVA', terrain: 'REGOLITH · SLOPE 8° · LONG SHADOWS' }
      }
    },
    MARS: {
      name: 'MARS', destination: 'MARS', site: 'BASE ALPHA',
      phases: {
        TRANSIT: { label: 'EARTH–MARS CRUISE', dist: 118000000, toGo: 96000000, gravity: 0.0, altitude: '—', dose: 1.8, relay: 0.5, env: 'MICROGRAVITY · CABIN', terrain: 'N/A — CRUISE' },
        LANDING: { label: 'ENTRY, DESCENT & LANDING', dist: 226000000, toGo: 22, gravity: 0.9, altitude: '22 km', dose: 0.9, relay: 0.5, env: 'EDL · SUITED', terrain: 'LANDING ELLIPSE' },
        SURFACE: { label: 'MARS — SURFACE', dist: 226000000, toGo: null, gravity: 0.38, altitude: '1.2 km', dose: 0.64, relay: 0.5, env: '0.6 kPa CO₂ ATM · EVA', terrain: 'REGOLITH · SLOPE 6° · ROCK DENSITY MED · DUST LOW' }
      }
    }
  };

  /* Mission timeline (offsets from now, seconds) — next-event countdown. */
  A.EVENTS = [
    { t: 13331, name: 'EVA END — HAB INGRESS' },
    { t: 20131, name: 'MEDICAL CHECK · CREW' },
    { t: 30331, name: 'COMMS WINDOW — DSN PASS' },
    { t: 43200, name: 'SLEEP PERIOD' },
    { t: 86400, name: 'ROVER TRAVERSE 04' }
  ];

  /* Pre-set glove-friendly messages (typing on a wrist unit in gloves is impractical). */
  A.CANNED_MESSAGES = [
    'EVA PROGRESSING NOMINAL',
    'SAMPLE COLLECTED — SITE 3',
    'REQUEST SCHEDULE UPDATE',
    'RETURNING TO HABITAT'
  ];

  /* -----------------------------------------------------------------------
     Demo scenario — Mars surface EVA with a developing suit fault.
     Each step ramps targets over `dur` seconds. Narrative is shown in UI.
     ----------------------------------------------------------------------- */
  A.DEMO = [
    { at: 0,  dur: 6,  text: 'Nominal EVA. ASTRONAUT-01 on Mars surface, 1.4 km from habitat.', set: { hrBase: 74, spo2Base: 98, co2Base: 2.1, suitPBase: 4.3, suitBattDrain: 1 } },
    { at: 8,  dur: 14, text: 'Heart rate rising — high workload, possible thermal stress.', set: { hrBase: 128, stressBase: 55, tempBase: 37.6 } },
    { at: 20, dur: 14, text: 'CO₂ scrubber degrading. SpO₂ beginning to fall.', set: { co2Base: 6.2, spo2Base: 92 } },
    { at: 32, dur: 12, text: 'Suit battery draining faster than plan (heater + fan load).', set: { suitBattTarget: 17 } },
    { at: 42, dur: 10, text: 'Slow suit pressure decay detected. Mission risk escalating.', set: { suitPBase: 3.8, spo2Base: 88, hrBase: 146 } },
    { at: 54, dur: 6,  text: 'Multiple critical parameters → automatic EMERGENCY MODE.', set: { co2Base: 8.0, spo2Base: 86, suitPBase: 3.4 } }
  ];
  A.DEMO_LENGTH = 62;
})(window.AMWS);
