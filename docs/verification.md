# Verification and boundaries

Verified 15 October 2026 for this standalone fictional demo.

- All 8 Node replay tests pass locally. GitHub's Node 22 workflow also passes.
- JavaScript syntax checks pass for the application, fixture, model, and local server.
- All 7 selected-stage exports expand successfully in JSON-LD 1.1 safe mode using an independent processor (`jsonld` 9.0.0). Original report JSON literals and graph-node counts survive expansion. This checks serialization, not full PROV constraint compliance or domain ontology certification.
- An actual browser download from step 5 matches `exportSnapshot(4)` exactly: 5 preserved reports and 50 graph nodes.
- Edge browser checks cover earlier unknown origins, later source linkage, the retained original witness report after refutation, and the decision requiring review. Stage controls retain keyboard focus; tracing from the inspector or lead register focuses the selected record.
- A 390 × 844 browser viewport shows no page-level horizontal overflow. The network scrolls within its own region with a visible hint. The report register provides an alternate route to each report, and selection opens its inspector.
- The PNG QR code decodes independently to `https://forest-savage1234.github.io/casefile-provenance-demo/` exactly. Both PNG and SVG use a four-module quiet zone and high error correction.
- GitHub Pages reports a successful build with HTTPS enabled. The deployed page was opened and exercised in the browser without a sign-in.

The replay is deterministic and scripted. A browser viewport check is not a physical phone scan or a venue rehearsal. No practitioner evaluation, real case, authenticated timestamps, cryptographic custody, persistence backend, or operational workflow is established. No existing paper, deck, application, or repository was modified.

Temporary JSON-LD and QR verification libraries were installed outside this repository. The published application has no external runtime dependencies, accounts, uploads, analytics, or case-data network calls.
