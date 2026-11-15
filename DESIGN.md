# AMWS design system

**Direction:** "Calm instrument, not sci-fi poster." Dark-only instrument UI for astronaut health/EVA decision support (concept prototype). One blue accent for actions/focus; green/amber/red indicate nominal/warning/critical state only. No web fonts, CDNs, external assets, or build step.

**Source of truth:** token values are defined in `:root` in `css/base.css`. Changing a token means editing `:root` in `css/base.css` and `DESIGN.md` together.

## Direction
- Calm, readable, dense where needed; color reserved for state.
- Status is never color alone: always color + icon (✓/⚠/✕) + word.
- Provenance is not severity: `ASSUMED` and `ILLUSTRATIVE` badges are neutral (muted text, 1px dashed border, no fill), never amber.
- Watch targets >= 56px; desktop controls >= 40px.
- Dangerous actions stay hold-to-confirm with visible fill and "HOLD" labeling.
- `prefers-reduced-motion`: stop ECG sweep animation (static trace), replace drawer slide with fade, transitions ~0, alarm flashing at most 2 Hz.

## Color (token, value, role)

| Token | Value | Role |
|---|---:|---|
| `--bg` | `#07090D` | Page background |
| `--surface-1` | `#0D1117` | Tiles, drawer, watch glass |
| `--surface-2` | `#151B24` | Inputs, raised controls |
| `--border` | `#232C39` | Decorative dividers (not for required contrast) |
| `--border-strong` | `#6B7A90` | Input/button/segmented-control edges (>=3:1) |
| `--text` | `#E8EDF4` | Primary text/values |
| `--text-muted` | `#9AA7B8` | Labels, secondary text |
| `--text-faint` | `#7A8798` | Disabled/timestamps/fine text |
| `--white` | `var(--text)` | Alias |
| `--primary` | `#5B9BFF` | Actions, links, focus, active segment |
| `--primary-hover` | `#7DB1FF` | Primary hover |
| `--on-primary` | `#07090D` | Text on primary fill |
| `--nominal` | `#3DDC97` | Nominal/in-range status |
| `--warning` | `#FFB020` | Warning/caution/advisory status |
| `--critical` | `#FF6B6F` | Critical/warning-level status |
| `--emergency` | `#E5484D` | Emergency key fill only (saturated red) |

Status classes preserved for JS: `sev-nominal`, `sev-advisory`, `sev-caution`, `sev-warning`, `sev-emergency` (and `sev-cannot-reach` where used). Tinted fills use `color-mix(in srgb, var(--status) 14%, var(--surface-1))`.

## Typography

| Token | Value | Role |
|---|---|---|
| `--font-ui` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | UI/body text |
| `--font-mono` | `ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace` | Numbers/readouts |
| `--fs-xs` / `--lh-xs` | `11px / 16px` | Uppercase labels, badges, legend (0.06em tracking, weight 500) |
| `--fs-sm` / `--lh-sm` | `13px / 20px` | Fine print, table/log text |
| `--fs-base` / `--lh-base` | `16px / 24px` | Body, drawer text |
| `--fs-md` / `--lh-md` | `18px / 26px` | Tile headings (`h3`, weight 600) |
| `--fs-lg` / `--lh-lg` | `24px / 32px` | Vital/section values |
| `--fs-xl` / `--lh-xl` | `36px / 40px` | Watch hero numbers (mono) |
| `--fs-2xl` / `--lh-2xl` | `56px / 56px` | Return Margin hero (mono) |

Weights: 400, 500, 600 only. All changing numbers (MET, UTC, readings, delays) use mono + `font-variant-numeric: tabular-nums`.

## Spacing and layout

4px base scale:

| Token | Value |
|---|---:|
| `--s1` | `4px` |
| `--s2` | `8px` |
| `--s3` | `12px` |
| `--s4` | `16px` |
| `--s5` | `24px` |
| `--s6` | `32px` |
| `--s7` | `48px` |

Desktop: 12-column tile grid (`c4/c6/c8/c12`), gap `--s4`, tile padding `--s4`, page max-width `1440px`, side padding `--s5`, section gap `--s6`. Wrist view: centered single watch column.

## Shape and depth

| Token | Value | Use |
|---|---:|---|
| `--r-sm` | `3px` | Badges, chips |
| `--r-md` | `8px` | Buttons, inputs, tiles |
| `--r-lg` | `16px` | Drawer, watch glass |
| `--r-case` | `24px` | Physical watch case only |

Depth via surface steps + 1px borders. Shadows only on presenter drawer: `0 0 0 1px var(--border), 0 16px 48px rgb(0 0 0 / .6)`. Only `.watch-glow` may glow, in `--primary` at low opacity.

## Components
- **Buttons:** primary = `--primary` fill / `--on-primary` text; secondary = transparent + 1px `--border-strong`; quiet = no border, `--text-muted`; danger = 1px `--critical` border/text (+ icon prefix where used). Hold buttons keep `.fill` and "HOLD" label.
- **Focus:** `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }` on interactive elements; outlines not removed.
- **Status chips (`data-chip`):** `--r-sm`, 11px uppercase, tinted fill, icon + word.
- **Tiles:** `--surface-1`, 1px `--border`, `--r-md`, `h3` left/chip right. Warning/critical tiles add 3px left status bar in addition to chip.
- **Vital cells:** muted xs label, mono `--fs-lg` value in status color with icon, sparkline normal band shaded with `--text-faint` at ~15%.
- **Segmented controls (`.seg`, `.view-toggle`):** shared 1px `--border-strong` outline; active segment `--primary` text, `--surface-2` fill, 2px `--primary` underline.
- **Inputs/sliders:** `--surface-2`, 1px `--border-strong`, `--r-md`; slider thumb `--primary`; output values mono.
- **Top bar:** `--surface-1`, bottom 1px `--border`; SIMULATED DATA pill uses neutral dashed provenance style.
- **Drawer:** `--surface-1`, `--r-lg` open edge, backdrop `rgb(0 0 0 / .55)`, provenance-style banner, drawer shadow only.
- **EMER key:** only saturated red fill (`--emergency`) with `--text` label.

## Imagery and icons
No photographs or external assets. Visuals (ECG/sparklines/indicators) are drawn in-app (canvas/SVG). Icons/marks are inline SVG; status indicated by icon + word + color.

## Motion
Functional motion kept minimal (sweep, holds, progress). `@media (prefers-reduced-motion: reduce)`: ECG sweep disabled in favor of static trace (`js/charts.js`), drawer transitions to fade/instant, fills/transitions reduced, decorative animation disabled. Alarm flashing limited to <= 2 Hz.

## Open decisions
1. **Optional light variant:** for projector demos, desktop only; watch stays dark.
2. **Emergency key style:** red fill (current, recommended for salience) vs outline-only.
