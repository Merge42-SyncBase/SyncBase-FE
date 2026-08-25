# Third-party notices

SyncBase Frontend is licensed under Apache-2.0. The following components are
not relicensed by SyncBase and remain subject to their upstream terms.

| Component | Version | Use | Upstream license | Source |
| --- | --- | --- | --- | --- |
| React | 19.1.1 | Browser UI runtime | MIT; copyright Meta Platforms, Inc. and affiliates | <https://github.com/facebook/react/tree/v19.1.1> |
| React DOM | 19.1.1 | Browser rendering runtime | MIT; copyright Meta Platforms, Inc. and affiliates | <https://github.com/facebook/react/tree/v19.1.1> |
| React Router / React Router DOM | 7.18.2 | Browser routing | MIT; copyright notices retained in the installed packages | <https://github.com/remix-run/react-router/tree/react-router%407.18.2> |
| `pdfjs-dist` | 5.4.296 | PDF canvas, text layer, and worker bundled by Vite | Apache-2.0 | <https://github.com/mozilla/pdf.js/tree/v5.4.296> |
| Vendored PDF.js modules | 6.1.200 | Tracked under `static/vendor/pdfjs/` | Apache-2.0; embedded Mozilla notice retained in both modules | <https://github.com/mozilla/pdf.js/tree/v6.1.200> |

The complete Apache-2.0 text for the vendored PDF.js copy is retained at
`static/vendor/pdfjs/LICENSE`. MIT license texts and copyright notices for
React and React Router are present in their respective installed packages and
must be retained by any binary-distribution notice generator.

`package-lock.json` is the authoritative pinned npm inventory. This file calls
out direct runtime and vendored components; it is not a substitute for the
release CycloneDX SBOM, which must include resolved transitive packages.
