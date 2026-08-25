---
name: SyncBase Evidence Workbench
description: "A Korean-first evidence operations interface that traces every result to its ACTIVE Document, Version, and Original page."
colors:
  navy-950: "#0e1b2e"
  navy-900: "#14243a"
  navy-800: "#223a5e"
  blue-700: "#174bb8"
  blue-600: "#2463de"
  blue-100: "#e9f0ff"
  green-700: "#087451"
  green-100: "#dcf6ea"
  amber-800: "#80510a"
  amber-100: "#fff3d8"
  red-700: "#a11d38"
  red-100: "#ffe9ed"
  ink-900: "#17243a"
  ink-700: "#41536d"
  ink-500: "#65758a"
  line: "#d6deea"
  line-strong: "#bdc9d9"
  surface: "#ffffff"
  worktop: "#f3f5f8"
typography:
  display:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(2rem, 4vw, 3.2rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.036em"
  headline:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(1.65rem, 3vw, 2.1rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.032em"
  title:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1.02rem"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "-0.018em"
  body:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.72rem"
    fontWeight: 720
    lineHeight: 1.45
    letterSpacing: "normal"
  metadata-mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.02em"
rounded:
  square: "0"
  utility: "4px"
  control: "5px"
  inset: "6px"
  panel: "7px"
  pill: "999px"
spacing:
  micro: "4px"
  tight: "6px"
  compact: "8px"
  cluster: "10px"
  small-section: "12px"
  inset: "14px"
  row: "16px"
  workspace: "20px"
  panel: "22px"
components:
  button-primary:
    backgroundColor: "{colors.blue-600}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.blue-700}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
    height: "38px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "#263651"
    rounded: "{rounded.control}"
    padding: "8px 13px"
    height: "38px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.control}"
    padding: "0 42px 0 38px"
    height: "46px"
  nav-active:
    backgroundColor: "{colors.navy-800}"
    textColor: "{colors.surface}"
    rounded: "{rounded.inset}"
    padding: "9px 11px"
    height: "38px"
  active-chip:
    backgroundColor: "{colors.green-100}"
    textColor: "{colors.green-700}"
    rounded: "{rounded.pill}"
    padding: "4px 7px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  evidence-result-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.control}"
    padding: "16px 13px"
  provenance-strip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-900}"
    padding: "10px"
  viewer-toolbar:
    backgroundColor: "#f8fafc"
    textColor: "#30445f"
    padding: "8px 10px"
  pipeline-stage-complete:
    backgroundColor: "#12815e"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    size: "27px"
---

# Design System: SyncBase Evidence Workbench

## Overview

**Creative North Star: "Evidence Workbench"**

SyncBase is a quiet, high-trust institutional evidence ledger. It should feel like an operations instrument for inspecting verified organizational knowledge: a compact deep-navy role rail frames a bright neutral workspace, and every important claim remains visibly connected to its Document, Version, and Original page.

The world is compact rather than sparse, but its density stays calm through consistent alignment, short Korean-first labels, restrained type sizes, and generous separation between task regions. Search results, processing states, metadata, and source controls read as one factual system rather than a collection of promotional cards.

Hierarchy is structural. Flat bordered surfaces, neutral tonal shifts, and precise rules do most of the work; blue is reserved for selection, links, focus, and primary action, while green is reserved for ACTIVE or successful evidence states. Decorative gradients, glass effects, oversized radii, and ambient card shadows do not belong in this world.

**Key Characteristics:**

- Deep-navy role framing around a bright operational worktop.
- Dense, aligned evidence rows with calm neutral separation.
- Exact Document · Version · page provenance beside the Original.
- Blue for intent and selection; semantic color only for operational state.
- Flat bordered surfaces with restrained 4–7px corners.
- Desktop evidence adjacency and a linear search → results → source mobile flow.

## Brand Identity

**Logo concept: “Evidence Seam · 근거의 이음선”**

The SyncBase mark is built from two authoritative record fields separated by a continuous S-shaped seam. The cobalt upper field represents the ACTIVE record a user can act on; the deep-navy lower field represents the controlled data base where document identity, metadata, and vectors stay aligned. The seam carries the traceability idea without an added status node, keeping the identity to two colors and one decisive gesture.

Use `public/brand/syncbase-mark.svg` on light surfaces and `public/brand/syncbase-mark-inverse.svg` on the deep-navy role rail and login perimeter. Use the monochrome variants when a process requires one-color reproduction. The mark must remain flat and front-on: no database cylinders, circular sync arrows, gradients, folds, bevels, enclosing app-icon tiles, status dots, or decorative motion loops. At least one eighth of the mark width remains clear on every side. The primary mark starts at 16px; the horizontal lockup starts at 112px.

The full rationale, asset inventory, print note, and generation provenance live in `docs/brand/README.md`.

## Colors

The palette is a cool institutional ledger: near-black navy provides authority, cobalt marks intent, status colors carry literal operational meaning, and blue-gray neutrals keep evidence readable without visual noise.

### Primary

- **Action Cobalt** (`blue-600`): Primary buttons, selected ranks, selection emphasis, text selection, and the strongest actionable cues.
- **Deep Action Cobalt** (`blue-700`): Hovered primary controls, skip-link treatment, and darker action emphasis.
- **Selection Wash** (`blue-100`): Pale support for focus and selected-state backgrounds where a full cobalt fill would overpower the evidence.

### Operational Status

- **Verified Green** (`green-700`) and **Verified Mint** (`green-100`): ACTIVE chips, successful notices, completed processing, and the selected evidence score.
- **Attention Amber** (`amber-800`) and **Attention Wash** (`amber-100`): Queued or in-progress states that require patience rather than alarm.
- **Failure Crimson** (`red-700`) and **Failure Wash** (`red-100`): Failed processing, blocking errors, and recovery-required states.

### Neutral

- **Role Rail Navy** (`navy-950`): The authenticated application rail and login perimeter.
- **Layered Rail Navy** (`navy-900`): The login introduction and a slightly raised navy layer.
- **Selected Rail Navy** (`navy-800`): Active or hovered navigation inside the role rail.
- **Primary Evidence Ink** (`ink-900`): Body copy, source content labels, and primary operational text.
- **Supporting Evidence Ink** (`ink-700`): Secondary descriptions and control text.
- **Muted Metadata Ink** (`ink-500`): Explanatory text, provenance labels, and quiet counts.
- **Ledger Rule** (`line`): Default dividers, rows, and surface boundaries.
- **Strong Control Rule** (`line-strong`): Inputs, viewer controls, and boundaries that must remain legible against the worktop.
- **Evidence Surface** (`surface`): Panels, selected results, controls, and the PDF sheet.
- **Quiet Worktop** (`worktop`): The application canvas behind operational surfaces.

**The Blue Means Intent Rule.** Blue marks something the user can choose, open, focus, or act on; it is not a general-purpose decoration or section color.

**The Green Means Proof Rule.** Green appears only when the interface can name a successful state: ACTIVE, completed, success, or the positive score of the evidence currently selected for verification.

## Typography

**Display Font:** Pretendard Variable with Pretendard and platform sans-serif fallbacks

**Body Font:** Pretendard Variable with Pretendard and platform sans-serif fallbacks

**Label/Mono Font:** Platform UI monospace for identifiers, hashes, request keys, and code-like provenance

**Character:** The single Korean-capable sans family keeps the system sober and immediate; hierarchy comes from compact scale changes, weight, and tracking rather than a decorative font pairing. Monospace is functional and appears only where exact identity matters.

### Hierarchy

- **Display:** Reserved for the login promise; compact tracking and a short line length give the entry surface authority without turning it into marketing.
- **Headline:** Page-level operational titles with a maximum line length of roughly 28 characters and tight tracking.
- **Title:** Panel, Version record, source-panel, and upload-step headings.
- **Body:** Default reading text and form content; explanatory paragraphs generally stop near 72 characters.
- **Label:** Table headers, provenance labels, result metadata, compact roles, and operational counts.
- **Metadata Mono:** Document IDs, Version IDs, SHA-256 values, run identifiers, correlation identifiers, and recovery codes. Numeric ranks, scores, pages, zoom, and metrics use tabular figures even when they remain in the sans family.

**The Korean First Rule.** Interface labels and explanatory copy begin in Korean; confirmed official terms such as Document, Version, Original, ACTIVE, Parse, Embed, Store, and Processing run remain unchanged.

**The Provenance Is Data Rule.** Exact identifiers and numeric evidence are aligned, tabular, and selectively monospace; they are never styled as decorative technical texture.

## Layout

The authenticated desktop shell uses a compact sticky role rail (190px) and a fluid workspace. Standard operational pages sit in a centered container (maximum 1280px) with measured page padding, while the search route becomes a full-height two-pane workbench: discovery is at least 470px wide and the source pane at least 430px, with a near-even 1fr / 0.96fr balance.

Density follows a small rhythm: 8–14px inside controls and compact clusters, 16px in evidence rows, 20px around workbench regions, and 22px inside default panels. One-pixel rules establish rows and metadata cells. Desktop search results and the PDF stage own their scrolling so the query, result context, provenance, and source controls remain stable.

At 1120px the evidence minima tighten to 430px and 390px. At 980px the role rail becomes a sticky horizontal bar and the workbench stacks into one column. At 720px operational metrics become a two-column grid. At 560px page padding compresses, evidence rows reflow to two columns, viewer controls stack, and navigation icons yield to text. The system supports a 320px minimum viewport and keeps logout reachable in the compact shell.

**The Evidence Adjacency Rule.** On wide screens, the selected result and its exact Original stay visible side by side; neither pane becomes a detached modal or a decorative preview.

**The Mobile Reading Order Rule.** On narrow screens, preserve the evidence story as search → ranked results → selected provenance → Original page, with no hidden source step.

## Elevation & Depth

This is a flat-by-default system. Default panels, ledgers, tables, inputs, and metadata strips use white or quiet blue-gray tonal layers plus one-pixel borders. Shadows appear only where they explain interaction, selection, a physical PDF sheet, or the exceptional login shell.

### Shadow Vocabulary

- **Brand Mark** (`0 5px 14px #07101f66`): Gives the small SyncBase mark enough separation from the deep role rail.
- **Action Rest** (`0 2px 5px #244db33d`): A low cobalt shadow on primary actions only.
- **Action Hover** (`0 4px 10px #244db347`): The restrained hover lift for primary actions.
- **Search Inset** (`inset 0 1px 2px #1f29370a`): A nearly imperceptible inner edge in the main evidence search field.
- **Selected Evidence** (`0 5px 16px #315ed91c`): A faint blue selection shadow paired with the explicit cobalt border.
- **Source Page** (`0 9px 28px #17243a38`): Separates the white PDF page from its gray document stage.
- **Login Shell** (`0 24px 70px #050b14a3`): A one-surface exception used only for the centered authentication shell on larger screens.

**The Flat Ledger Rule.** A surface earns elevation only when depth communicates action, current selection, or a physical document; ordinary containers remain border-led and flat.

## Shapes

Corners are restrained and functional. Utility controls use a gently squared 4px radius, standard inputs and actions use 5px, inset navigation and notices use 6px, and default panels use 7px. Pills are reserved for status and compact identity markers. Full-height workbench panes, tables, metadata strips, list rows, and the PDF page keep square shared edges so adjacent evidence reads as one ledger.

Borders are normally 1px. A selected evidence row replaces its bottom-divider treatment with a complete cobalt outline; strong control borders distinguish inputs and viewer controls without adding depth. The login shell's slightly larger corner is an isolated authentication treatment, not a general card radius.

**The Restrained Radius Rule.** Use 4–7px for ordinary product geometry and 999px only for status circles or chips; large soft cards would weaken the institutional evidence character.

## Components

### Buttons

- **Shape:** Compact rectangular controls with a 5px radius, a 38px minimum height, and 8px × 13px padding. The search submit and login submit expand to their local 43–46px field height.
- **Primary:** White text on Action Cobalt with a low action shadow; use for one clear submit, registration, or Original-opening action in a region.
- **Hover / Focus:** Hover deepens to Deep Action Cobalt over 140ms and increases the low shadow. Keyboard focus uses a 3px light-blue outline with a 2px offset.
- **Secondary:** White, Strong Control Rule border, and dark control text. Hover shifts to a very pale blue surface and a blue-gray border.
- **Disabled:** Preserve layout and label while reducing opacity to 0.55; never substitute a status color.

### Chips

- **Style:** Compact 999px pills with 4px × 7px padding, bold small text, and no border.
- **State:** ACTIVE uses Verified Green on Verified Mint; processing uses amber, failure uses crimson, and superseded uses a quiet gray pair. Chips name states and never act as ornamental tags.

### Cards / Containers

- **Corner Style:** Default operational panels use 7px corners; nested notices and dropzones use 6px.
- **Background:** Evidence Surface over Quiet Worktop, with subtle neutral variants for headers, selected-source framing, and dropzones.
- **Shadow Strategy:** Flat at rest; use the documented shadow vocabulary only for explicit interaction or document depth.
- **Border:** One-pixel Ledger Rule by default; Strong Control Rule where a control boundary must read more clearly.
- **Internal Padding:** 22px for default panels, 16px for compact mobile panels, and zero where tables or Version ledgers need edge-to-edge rows.

### Inputs / Fields

- **Style:** White fields with a Strong Control Rule border and 5px corners. Standard fields are 39–43px high; the evidence search field is 46px high and reserves internal space for search and clear controls.
- **Focus:** The evidence search field shifts its border to a mid cobalt and gains a 3px pale-blue outline; the caret remains Action Cobalt.
- **Error / Disabled:** Errors are stated in bordered crimson notices. Disabled controls retain their geometry and use reduced opacity or a quiet gray fill.

### Navigation

- **Style:** The desktop role rail is deep navy, 190px wide, and visually compact. White identifies the current route; inactive text is muted blue-gray; the active row uses Selected Rail Navy with a 6px corner.
- **Responsive:** At 980px the rail becomes a sticky horizontal bar. At 560px text remains while navigation icons hide; the logout control remains visible.
- **Permission:** General team members see grounded search only. Document operations appear only for the document-admin role.

**The Role Rail Is Permission Rule.** Navigation mirrors confirmed capability; do not add a destination merely to balance the rail or fill empty space.

### Evidence Result

Evidence results are full-width ledger buttons separated by rules. A selected row receives a 1px cobalt outline, 5px corners, a blue rank disk, and a faint selection shadow. The title is actionable blue, metadata states exact Version and page, the snippet remains supporting evidence text, and the similarity score uses tabular figures. On mobile the row reflows while keeping rank, title, provenance, snippet, and score in that reading order.

### Provenance Strip

The selected source begins with identity plus an ACTIVE chip, followed by three equal metadata cells for Version, evidence page, and similarity. Each value is centered, tabular, and adjacent to the Original viewer. Use the exact terms `Document`, `Version`, and `페이지`; do not collapse them into a generic source label.

### PDF Viewer Toolbar

The toolbar is a flat pale header over the PDF stage. Page and zoom controls use 34px square buttons with 4px corners and Strong Control Rule borders. The current page input and zoom value use tabular figures. The PDF itself is a white square sheet on a cool-gray stage, with source depth supplied by the Source Page shadow.

### Processing Pipeline

The six-step METADATA → PARSE → CHUNK → EMBED → STORE → ACTIVATE sequence uses small numbered circles and one-pixel connectors. Complete is green, current is amber, failed is crimson, and pending is neutral. State is encoded by text and structure as well as color.

## Do's and Don'ts

### Do:

- Do keep Korean as the default interface language while preserving confirmed official English terms exactly.
- Do keep Document · Version · page provenance visible beside every selected Original.
- Do use blue for selection, links, focus, and primary action, and reserve semantic colors for literal operational states.
- Do use one-pixel borders, aligned metadata cells, tabular numerals, and 4–7px corners to maintain the ledger character.
- Do preserve the desktop side-by-side evidence relationship and the mobile search → results → source reading order.
- Do keep role-specific navigation honest, including a visible logout action in the compact shell.

### Don't:

- Don't use gradients, glass effects, oversized rounded cards, or ambient shadows as general decoration.
- Don't color ordinary headings, panels, or large background regions with the action blue or status colors.
- Don't use green for neutral similarity values, decorative accents, or unconfirmed claims.
- Don't present a snippet as the Original; retain the exact Document, Version, and page bridge to source.
- Don't replace dense evidence rows with spacious marketing cards or hide critical metadata behind hover.
- Don't add unconfirmed product claims, customer proof, navigation destinations, or operational capabilities for visual completeness.
