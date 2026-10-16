# Short presenter walkthrough

**One sentence:** “My tool preserves the recorded basis of a decision and identifies it for human review when that basis changes.”

All case details are fictional. Open the [demo](https://forest-savage1234.github.io/casefile-provenance-demo/) and select **Reset**.

1. **Stage 02 — One red-van sighting.** “A witness report supports an identification assessment. A search decision records that basis.”
2. **Stage 04 — A shared source emerges.** “An analyst records that the extra tips share one source. The tool does not discover this relationship.”
3. **Stage 05 — New footage changes the assessment.** “The witness report stays. A human adds a revised assessment. The tool follows the recorded dependency and requests review of D1.”
4. Under **What the tool computes**, select **Run actual tool**. Wait for **Live Python engine**. “This runs my existing Python ledger in the browser. It checks its result against the recorded run.”
5. Open **Compare a note-only edit or a missing link**. Select **Note-only control**. “An editorial byte change alone does not change the decision's mapped basis.” Select **Missing-link control**. “Without declared dependencies, coverage is incomplete. Silence does not mean the decision is safe.”
6. Return to **Case story**, then advance to **stage 06**. “A simulated human reviewer records D2. D1 and the original evidence remain.”
7. Select **Export engine record**. “The review request, dependency path, evidence versions, and human decision can be inspected.”

**Closing sentence:** “This is provenance-directed reassessment: deciding what needs a human review as the record evolves.”

## If the live runtime cannot load

Use the clearly labeled **Recorded engine output**. Say: “These are saved results from the same Python engine; this is not a live run.” The live runtime needs internet access. Rehearse on the venue network and keep a short video available.

## If asked

- **Does the tool rank leads or find the child?** No. It identifies recorded decisions for human reassessment.
- **Does the footage rewrite the witness report?** No. A separate human assessment receives a new version.
- **Does it infer that three tips share a source?** No. A human supplies that finding.
- **Does it change a decision automatically?** No. The fixture supplies the simulated human review.
- **Does this change the paper's results?** No. The earlier snapshot study, later ledger study, and this demo remain separate.

For technical scope and attribution, see [Contribution and scope](contribution-scope.md) and the [README](../README.md).
