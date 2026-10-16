# Actual engine integration

The selected Python core in `lead_review/` is copied without changing its
bytes. `SOURCE_MANIFEST.json` identifies the local distribution, its public
base commit and each copied file's SHA-256. It does not claim that the local
distribution is byte-identical to that public commit. Original MIT licenses,
vendor provenance and attribution are retained.

`casefile_adapter.py` and `casefile_inputs.json` are new. They run a small
fictional scenario through `Ledger`, not a JavaScript imitation of its rules.
The adapter's `run_casefile(stage, mode="linked")` creates a fresh in-memory
ledger and returns raw state, raw operation results and a display summary.
Stages are integers 0..6; modes are `linked`, `editorial` and `missing_link`.

The original witness report is never corrected. A separate, explicitly
human-authored identification assessment changes from `possibly_mika` to
`different_child`. D1 records that assessment as an input. The engine follows
that declared dependency and requests human reassessment. A simulated person
then appends D2 through the engine's review API. All originals remain.

The shared-source finding, footage assessment, investigative decisions and
safe outcome are supplied fictional human inputs. The engine does not infer
them. New sources alone do not trigger an automatic request. The editorial
control changes only unmapped bytes. The missing-link control imports D1 via
the engine's supported legacy path: its refs remain in the decision payload,
but no dependency edges are registered and coverage is incomplete. Neither
control invents a machine request or records a van review at stage 5.

The browser may execute this unchanged Python core with its SQLite dependency
in a worker. `recorded.json` is a separately labeled native-Python capture
for fallback and cross-runtime comparison; displaying it is a recorded replay,
not live engine execution. `scripts/verify_actual_tool.py` regenerates all 21
captures deterministically or checks the committed captures and copied bytes.

The integrity result covers the source/observation checks implemented by the
engine. It does not authenticate people, prove source truth or establish an
externally authenticated chain of custody. This is reassessment triage over
declared relationships, not automatic ranking of police leads.

This later ledger and new fixture are distinct from the paper's earlier
24-scenario snapshot implementation and the original 16-case ledger corpus.
No earlier benchmark is reproduced by this case. The original distribution's
HTTP server, UI, evaluation corpus and presenter fixture are not included in
this minimal copy. The retained original NOTICE refers to that distribution;
the files actually copied here are enumerated in `SOURCE_MANIFEST.json`.
