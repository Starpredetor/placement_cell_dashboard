# Design System

**Status:** Proposed (Phase 2.5)
**Date:** 2026-08-07
**Applies to:** `frontend/src/index.css` token layer, `components/ui`, and every screen built from Phase 2b onward.

---

## 1. Thesis

> **Colour is reserved for state. The chrome is monochrome.**

This app exists to answer one question: *where does every student stand right now?* Eligible or not. Applied → shortlisted → offered → joined. Present or absent. Draft, published, closed.

In a product like that, colour is data. So the interface gives it up everywhere else — buttons, headers, and brand furniture are neutral, and the only saturated pixels on screen encode a record's status.

That is the aesthetic risk in this direction, and the reason it is justified rather than merely minimal.

## 2. The defect this fixes

The current palette is not just dated — it collides with itself.

| Token | Value | Meaning |
| --- | --- | --- |
| `--color-accent` | `#0d9488` | "you can click this" |
| `--color-success` | `#0d9488` | "this succeeded" |
| `--color-primary` | `#8b1e1e` | brand |
| `--color-error` | `#ef4444` | absent / rejected |

Two problems, both structural:

1. **`--color-accent` and `--color-success` are the same hex.** Interactive affordance and success state are visually indistinguishable.
2. **The brand sits in the same hue family as failure.** Every primary button competes with the "Absent" chip beside it for the same signal.

The palette was inherited from the earlier attendance-only system, where there was far less state to express. It does not survive contact with placement drives, rounds, and eligibility.

## 3. Palette

Neutrals carry a slight blue bias toward the accent rather than sitting at pure grey — chosen, not inherited.

### Chrome (light)

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#12161C` | Primary text, sidebar ground |
| `--ink-soft` | `#1B212A` | Secondary text |
| `--paper` | `#FBFAF7` | Workspace ground |
| `--surface` | `#FFFFFF` | Cards, tables, inputs |
| `--rule` | `#DFDDD6` | Hairline borders and dividers |
| `--muted` | `#67707E` | Labels, captions, disabled |
| `--stamp` | `#24379B` | The single accent — links, focus, primary action |

`--stamp` is the ultramarine of an official seal: the blue that appears on offer letters and institutional stamps. It also sits safely outside the green/amber/red triad that state needs, which is the practical constraint that ruled out the obvious alternatives (terracotta collides with *rejected*, any green collides with *offered*).

### State — reserved

These never appear on a button, a header, or a border that is not encoding a record's status.

| Token | Hex | Applies to |
| --- | --- | --- |
| `--won` | `#0F7B4A` | offered · joined · present · qualified |
| `--hold` | `#A65A00` | shortlisted · pending · hold · late |
| `--lost` | `#A82B22` | rejected · absent · withdrawn · declined |
| `--open` | `#24379B` | published · accepting applications |
| `--draft` | `#67707E` | draft · closed · inactive · not applied |

Tinted backgrounds for chips: `--won-bg #E6F2EC`, `--hold-bg #F7EEE1`, `--lost-bg #F7E8E6`, `--open-bg #E8EAF6`, `--draft-bg #EDEEF0`.

`--open` deliberately equals `--stamp`. An open drive is the one you are meant to act on, so the actionable state sharing the interactive colour is meaningful rather than accidental. It is the one intentional overlap; nothing else reuses a chrome token.

### Dark theme

Not an inversion — the accent is lifted to stay legible on a dark ground, and state colours are desaturated so chips do not glare.

| Token | Dark value |
| --- | --- |
| `--ink` / `--ink-soft` | `#E7E9EC` / `#C7CBD2` |
| `--paper` / `--surface` | `#0E1116` / `#161A21` |
| `--rule` / `--muted` | `#2A303A` / `#8A93A1` |
| `--stamp` | `#8E9BFF` |
| `--won` / `--hold` / `--lost` | `#4FBF8B` / `#D99A4E` / `#E8776B` |
| `--won-bg` / `--hold-bg` / `--lost-bg` | `#12261D` / `#2A2015` / `#2B1917` |
| `--open-bg` / `--draft-bg` | `#1C2340` / `#1D222A` |

## 4. Status → token mapping

The reference that keeps screens consistent. Every status string the API can return maps to exactly one state token.

| Domain | Status | Token |
| --- | --- | --- |
| Opportunity | `DRAFT` | `draft` |
| Opportunity | `PUBLISHED` | `open` |
| Opportunity | `CLOSED` | `draft` |
| Application | `APPLIED` | `open` |
| Application | `SHORTLISTED` | `hold` |
| Application | `OFFERED` / `JOINED` | `won` |
| Application | `REJECTED` / `WITHDRAWN` / `DECLINED` | `lost` |
| Round result | `QUALIFIED` | `won` |
| Round result | `HOLD` | `hold` |
| Round result | `REJECTED` | `lost` |
| Attendance | `PRESENT` | `won` |
| Attendance | `LATE` | `hold` |
| Attendance | `ABSENT` | `lost` |
| Student | `ACTIVE` | `open` |
| Student | `GRADUATED` / `ALUMNI` | `draft` |
| Eligibility | eligible / not eligible | `won` / `lost` |

## 5. Typography

| Role | Face | Notes |
| --- | --- | --- |
| Display | **Archivo**, 700, `-0.03em` | Page titles, headline figures |
| Body / UI | **Archivo**, 400–600 | Everything read as prose |
| Data | **JetBrains Mono**, tabular figures | Roll numbers, branch codes, CGPI, CTC, dates, IDs |
| Label | **JetBrains Mono**, 11px, `0.12em`, uppercase | Column heads, eyebrows, field labels |

Archivo replaces Outfit: a grotesque with signage lineage rather than a friendly geometric, and it holds its shape at the 12–13px sizes a dense table actually runs at. Outfit's roundness was tuned for the earlier, gentler product.

**Mono for data is functional before it is decorative.** A roll number is a code, not prose. Tabular figures let a 300-row directory be scanned down a column instead of read across a line — which is the actual task.

Scale: `34 / 20 / 15 / 13 / 11`. Body text stays near 65 characters; headings get `text-wrap: balance`.

## 6. Shape, elevation, motion

- **Radius: a single 4px**, down from 14/10/6. A precise instrument, not soft SaaS.
- **No decorative shadows.** `--shadow-glow` (a maroon glow) and the layered card shadows are deleted; hairline `--rule` borders replace them. One elevation level survives, reserved for overlays — a status board does not glow.
- **Motion is limited to feedback**: state transitions on chips, row hover, focus rings. No entrance choreography. Respect `prefers-reduced-motion`.
- **Focus is always visible**: 2px `--stamp` outline with a 2px offset, on every interactive element.

## 7. Signature — the cohort funnel

The one element the product should be remembered by, because it is the one thing the product is about: **a list of names getting shorter.**

A compact horizontal stepped bar — Applied → Shortlisted → Offered → Joined — with segment widths proportional to real counts, drawn in state colour:

```
┌──────────────────────────────┬──────────┬───┬──┐
│ 128 applied                  │ 46       │12 │9 │
└──────────────────────────────┴──────────┴───┴──┘
  --open                        --hold     --won  (joined: deeper --won)
```

It appears in three places and nowhere else: on every drive card, at the head of the drive workspace, and on the dashboard. Implemented as `<Funnel counts={...} />`, sized `sm` on cards and `md` on headers.

## 8. Structural devices

**Rounds are numbered; nothing else is.** R1 → R2 → R3 is a genuine sequence — round 2's roster *is* round 1's qualifiers — so the ordinal carries information the reader needs. Numbered markers are not used anywhere else in the app, because nowhere else is ordered.

**The eligibility gate** renders straight from the engine's `failed` list, so the screen can never disagree with the decision the API made:

```
OK   Branch is CE or IT
OK   Final year (year 4 of 4)
NO   CGPI 6.20 — needs 6.50
NO   1 live KT — needs 0
OK   Not already placed
```

Failures are full-contrast; passes recede to `--muted`. What went wrong is what you read first.

## 9. Two new primitives

Both are prerequisites for Phase 2b's component kit, not products of it:

- **`<StateChip status={...} />`** — resolves a domain status string to its token via the §4 map. Screens never pick a colour by hand, which is what keeps 17 pages consistent.
- **`<Funnel counts={...} />`** — the §7 signature.

## 10. What changes in code

- The `:root` token block in `frontend/src/index.css` is replaced. Most of the 201 existing classes inherit from it, so the palette swap propagates without touching them individually.
- `--color-accent` and `--color-success` stop being the same value; state tokens are split out and named for what they *mean*, not what they look like.
- `--shadow-glow` and the layered card shadows are deleted.
- Radii collapse to a single `--r: 4px`.
- The Google Fonts import changes from Inter + Outfit to Archivo + JetBrains Mono.
- `StateChip` and `Funnel` are added under `components/ui`.
- The existing `.badge-*` classes (`badge-applied`, `badge-eligible`, `badge-not-eligible`, …) are folded into `StateChip` so status colour has exactly one source.

## 11. Deliberately unchanged

A dark rail beside a light workspace is not a novel layout, and it is the right structure for a tool staff operate all day — so it stays. The existing page structures, route layout, and information hierarchy stay too.

The distinctiveness is meant to come from the colour discipline, the mono data treatment, and the funnel — not from moving the furniture. Redesigning the shell would be change for its own sake, and would cost Phase 2b time it should spend on the component kit.
