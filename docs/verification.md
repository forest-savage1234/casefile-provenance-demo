# Verification and boundaries

## Version 1.1: preserved Python engine integration

Verified 15 October 2026 for the integration in this new repository.

- The 8 JavaScript story tests and 9 new native Python engine tests pass. Source-manifest verification reproduces all 21 recorded runs: 7 stages across the case story, note-only control, and missing-link control.
- All 21 runs were executed through the real Python engine in Edge using Pyodide 0.29.4 and SQLite. Each full browser result matched its native Python baseline before the live-execution label appeared.
- The actual downloaded live-engine record for step 5 matches native `run_casefile(4, 'linked')` exactly. Its execution receipt identifies live Python, 14 verified files, and the expected source-manifest digest.
- Browser execution verifies the manifest SHA-256 for all 14 supplied files before Python imports the adapter. Eleven copied core, license and attribution files remain byte-identical to their selected original files. The original distribution is not edited.
- Linked mode emits a real review request for the changed human assessment and later appends a simulated human review and successor. Editorial mode changes bytes without changing mapped fields and emits no request. Missing-link mode emits no request and reports incomplete dependency coverage.
- Recorded output remains explicitly labeled until live execution succeeds. Cancellation, stale-response rejection, and mismatch fallback were independently inspected and exercised using a mock worker; these bridge checks are separate from the 21 actual browser executions.
- The engine panel was inspected at a 390 × 844 browser viewport with no page-level horizontal overflow. Heading text remains 25px and controls wrap within the panel. This is a browser layout check, not a physical phone scan.
- The new fixture and example are separate from the paper's earlier snapshot study and the later ledger benchmark. No metrics from those studies were changed or combined.

Live execution downloads a pinned Python runtime and SQLite package from jsDelivr. The engine executes locally in a browser worker. The default recorded replay does not require that runtime; it does require access to the site files. There are no case uploads, accounts, analytics, or application backend. Reloading recreates the demonstration ledger; export retains a run.

## Version 1.0: story-view verification

The following checks document the original story view. They do not establish Python-engine execution by that earlier version.

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

Temporary JSON-LD and QR verification libraries were installed outside this repository. Version 1.0's story view had no external runtime dependencies; optional live Python execution was added in version 1.1 as described above.
