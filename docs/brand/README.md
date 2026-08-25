# SyncBase logo system

## Concept: Evidence Seam · 근거의 이음선

The mark compresses SyncBase's product promise into three pieces:

- The cobalt upper field is the searchable, active record—the result the user is acting on.
- The navy lower field is the controlled data base where document identity, metadata, and vectors stay aligned.
- The open seam between them draws an abstract `S` and represents the trace from a result to its exact Document, Version, and Original page.
- The green square is a verified handoff. It is deliberately a node, not a decorative accent: green retains the product design system's literal ACTIVE/proof meaning.

The symbol is an evolution of the existing cobalt `S` tile. It avoids the category defaults—database cylinders, circular sync arrows, clouds, chains, shields, and AI sparkles—so the identity is tied to SyncBase's evidence mechanism rather than generic infrastructure.

## Files

| Asset | Use |
| --- | --- |
| `public/brand/syncbase-mark.svg` | Primary full-color mark on light backgrounds |
| `public/brand/syncbase-mark-inverse.svg` | Full-color mark on navy or other dark backgrounds |
| `public/brand/syncbase-mark-mono.svg` | One-color printing, embossing, and very small light-background use |
| `public/brand/syncbase-mark-mono-inverse.svg` | One-color use on dark backgrounds |
| `public/brand/syncbase-logo-horizontal.svg` | Primary horizontal logo on light backgrounds |
| `public/brand/syncbase-logo-horizontal-inverse.svg` | Horizontal logo on dark backgrounds |
| `public/brand/syncbase-brand-sheet.svg` | Visual reference and presentation sheet |

PNG exports are generated from these SVG sources for channels that do not accept vector files. The SVGs remain the source of truth.

## Color

| Role | Color | Existing SyncBase token |
| --- | --- | --- |
| Active record | `#2463DE` | Action Cobalt / `blue-600` |
| Controlled base | `#0E1B2E` | Role Rail Navy / `navy-950` |
| Verified handoff | `#087451` | Verified Green / `green-700` |
| Dark-background node | `#15A477` | Optical lift for the 16–32px inverse mark |

The green node must keep its proof meaning. Do not spread green to the wordmark or use it as ambient decoration.

## Usage rules

- Keep clear space equal to at least one eighth of the mark's width on all sides.
- Use the primary mark at 16px or larger. Prefer the monochrome mark where reproduction makes the green node unreliable.
- Use the horizontal logo at 112px wide or larger. For smaller UI placements, pair the mark with live product text as the frontend does.
- Use the inverse artwork on navy or similarly dark surfaces; the primary navy lower field will disappear into the role rail.
- Preserve proportions and flat color. Do not add gradients, bevels, page folds, outlines, drop shadows inside the artwork, or an enclosing app-icon tile.
- Do not rotate the symbol or animate the seam as a generic sync loop. If animated later, the only faithful motion is a single trace traveling from the active field through the verified node to the base.

## Wordmark note

The horizontal SVG keeps `SyncBase` as live text using the product's existing Pretendard-first stack. This preserves alignment with the Korean-first interface and makes the lockup easy to localize in production layouts. Convert the text to outlines in a vector editor before sending the logo to a print vendor that cannot guarantee the font.

## Generation provenance

The built-in image-generation tool was used for two internal structure studies. Both generated rasters were rejected as shipping artwork because they introduced gradients and dimensional document motifs. The final mark is deterministic, hand-authored SVG geometry. Exact study prompts and the rejection record are in [logo-generation-prompts.md](logo-generation-prompts.md).
