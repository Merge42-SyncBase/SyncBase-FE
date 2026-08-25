# SyncBase logo generation prompts

These prompts record the built-in image-generation ideation that informed the final vector. The generated images are exploration only and do not ship as brand assets.

## Study 1 — three structural candidates

```text
Use case: logo-brand
Asset type: internal logo concept study for the SyncBase product
Primary request: Create a single clean concept sheet containing exactly three distinct geometric symbol-mark candidates for SyncBase, an open-source, Korean-first AI document evidence search platform where every result traces to an ACTIVE Document, Version, and exact Original page. Evolve the current simple “S in a cobalt square” into an ownable mark. Each candidate should express an abstract S through two aligned record/page layers connected by one continuous evidence trace, with a tiny proof node only if it remains legible.
Style/medium: rigorous flat vector logo construction; crisp Swiss/institutional design; calm high-trust infrastructure character; precise modular geometry on an implied square grid; strong negative space; no lettering.
Composition/framing: three marks side by side on a plain white sheet, evenly spaced, each centered in its own invisible square with generous margin; no labels or captions; show only the marks.
Color palette: deep navy #0E1B2E and action cobalt #2463DE; optional verified green #087451 only as one small proof node. Flat solid colors only.
Constraints: each candidate must have a strong silhouette and remain recognizable at 16px; maximum three colors; balanced optical weight; suitable for a product sidebar, favicon, GitHub README, contest report, and presentation title card.
Avoid: all text, the word SyncBase, letters other than the abstract negative-space S, gradients, shadows, transparency effects, mockups, 3D, database cylinders or stacks, circular sync arrows, ordinary arrows, infinity loops, chain links, clouds, shields, checkmarks, sparkles, brains, circuit traces, hexagons, generic app-icon gloss, fine detail, decorative flourishes, watermark.
```

Disposition: rejected as artwork. The study overrode the flat-vector constraints with page folds, gradients, bevels, and arrow-like seams. The usable finding was structural: two record fields can make the `S` through the seam between them.

## Study 2 — targeted simplification

```text
Use case: logo-brand
Input images: Image 1 is an internal concept study and edit target.
Asset type: refined SyncBase logo mark concept
Primary request: keep only the conceptual structure of the FIRST (leftmost) candidate—two authoritative record fields joined by a continuous S-like evidence seam—and redraw it as one radically simplified, production-grade flat vector symbol. Remove the other two candidates entirely. The mark should feel like an abstract S created by the negative-space seam between an upper cobalt record and a lower deep-navy record. Replace the large center ring with one very small verified-green square node that sits precisely on the seam, only if it remains optically balanced.
Style/medium: pure flat vector logo geometry; solid fills; crisp edges; rigorous grid; restrained 4–7px corner language at app-icon scale; no dimensional effects.
Composition/framing: exactly one centered square mark on a plain white background with generous clear space; front-on orthographic view.
Color palette: action cobalt #2463DE, deep navy #0E1B2E, optional tiny verified green #087451. No other colors except white negative space.
Constraints: strong silhouette; recognizable at 16px; simple enough to recreate exactly in SVG; the seam must read as evidence continuity and an abstract S, not as two arrows.
Change only the rendering and simplification described; keep the two-field-plus-seam idea.
Avoid: extra marks, text, labels, page-corner folds, paper icons, gradients, shadows, highlights, bevels, outlines, 3D, perspective, arrowheads, arrows, infinity loops, chain links, database cylinders, clouds, shields, checks, sparkles, circuits, hexagons, watermark.
```

Disposition: accepted only as a structure reference. The study clarified the negative-space `S` and the proof node but still introduced gradients. The shipping vectors remove all generated rendering and rebuild the geometry from paths with exact palette values.
