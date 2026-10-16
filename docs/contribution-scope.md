# Contribution and scope

**The claim:** When a recorded assessment changes, the tool follows declared dependencies to identify decisions for human review, while retaining earlier evidence and decisions.

## Why this is the useful next step

The changing evidence pool and the integrity of an individual item meet at a practical question: **what was a decision based on, and does that recorded basis now need review?** Preserving evidence versions gives that question a stable starting point. Recording assessment and decision dependencies makes the impact of a later change inspectable.

The immediate contribution to demonstrate is **provenance-directed reassessment**. “Triage of decisions for review” is also accurate within the declared dependency graph. “Provenance-directed triage” without that qualification could suggest automatic ranking of all incoming leads, which this engine does not implement.

## The concrete experiment

The original witness report is retained. A separate human identification assessment initially supports a provisional decision, D1. After new footage enters the fictional case, a human changes the assessment's recorded identification field. The ledger compares the mapped values, follows the explicit dependency path, and appends a request to review D1.

A simulated human reviewer later records an outcome and successor decision D2. D1 remains in the history. The engine records the review; it does not choose the new disposition or infer an identity from footage.

The two controls make the limits testable:

| Experiment | Distinction being demonstrated |
| --- | --- |
| **Case story** | A relevant mapped field changes and a declared dependency reaches D1: request human reassessment. |
| **Note-only control** | Source bytes change but mapped fields do not: do not equate every byte change with a change in the decision's recorded basis. |
| **Missing-link control** | The relevant assessment changes but decision coverage is undeclared: report incomplete coverage rather than treating no request as assurance. |

These controls are alternative experiments in the engine panel. They do not rewrite the surrounding story timeline. Neither control appends D2, because neither produces the machine request that the simulated reviewer would answer.

## Where the work happens

| Component | Responsibility |
| --- | --- |
| Human inputs in the fictional fixture | Record reports, shared-source findings, identification assessments, dependency declarations, and later review outcomes. |
| Existing Python ledger | Preserve source versions and evidence anchors; compare mapped structured values; traverse declared dependencies; append targeted review requests; retain human reviews and superseded decisions. |
| New adapter and browser integration | Translate the small fictional case into ledger operations, replay it at selected stages, show the result, and export the engine record. |
| Illustrated case view | Explain the evolving evidence pool and show recorded relationships using a scripted teaching narrative. |

The live browser worker executes the selected existing Python files unchanged, using Pyodide and SQLite. Its source manifest and comparison with native recorded outputs provide a reproducibility check for this demonstration. They do not establish authenticity of the original evidence, complete dependency capture, or operational effectiveness.

## Connection to the paper

The connection is conceptual: preserving the identity and history of evidence supports inspection of the reasoning built on it. The new demo makes a later consequence visible: a changed recorded basis can trigger review of dependent decisions without erasing the earlier record.

The paper's earlier **24-scenario snapshot study**, the later standalone ledger's **16-case study**, and this new missing-child demonstration must remain separate. This integration does not alter the paper, revise the earlier metrics, combine those datasets, or establish that the paper already evaluated this new capability. Whether the paper's stated claim should broaden requires a separate review of its text and evidence.

## Attribution and limits

CaseLinker was created and is maintained by **Mrinaal Ramachandran and contributors**. Forest Savage's merged CaseLinker PR #6 and PR #7 concern source-document/extraction-run provenance and deterministic snapshot manifests/drift verification. The standalone ledger is later, separate work. Running it here does not make it an upstream CaseLinker release.

Existing truth-maintenance, decision-provenance, and CASE/UCO work are foundations. This demo makes no general algorithm novelty, ontology certification, or validated invention claim. Source attribution and licenses are retained with the copied Python core; [`SOURCE_MANIFEST.json`](../actual_tool/SOURCE_MANIFEST.json) identifies exactly what was copied.

The engine sees structured recorded inputs, not the world. It does not discover common origins, analyze video, rank new police leads, prove a report true, decide investigative action, or guarantee that all dependencies were recorded. A new source with no recorded dependency path does not prompt reassessment of an existing decision. Human assessments and reviews are supplied fictional inputs. The missing child and safe outcome are scripted teaching material.
