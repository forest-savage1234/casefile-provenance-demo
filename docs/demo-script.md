# Three-minute presenter walkthrough

Before presenting, run `npm test`, start the application with `npm start`, and open [the local demo](http://127.0.0.1:4173). Select **Reset** to begin at intake. The interface numbers its seven stages 01–07. Use **Next** for each advance and the **Investigation timeline** slider for the return to an earlier stage. All case details are fictional. If the lecture requires prerecorded demonstrations, record this walkthrough for the slides and offer the site as a separate QR companion.

| Time | Action | Suggested narration |
| --- | --- | --- |
| 0:00–0:20 | Show stage 1: intake. | “This fictional case asks a provenance question: what information was available, where did it come from, and how did people use it? The case begins with an intake record.” |
| 0:20–0:40 | Advance to stage 2: the original red-van witness. | “A witness reports a red van. This record tells us what was reported. It does not make the identification an established fact. The coordinator records a provisional search decision.” |
| 0:40–1:00 | Advance to stage 3: two repeating reports. | “The collection grows. These reports appear separately in the record, but their origins have not yet been resolved. More reports do not automatically mean more independent support.” |
| 1:00–1:25 | Advance to stage 4: the analyst's linkage. | “The analyst discovers that both tips repeat the witness's social post. That discovery is a new recorded finding. The reports are preserved, and an earlier view must still show that the linkage was unknown then.” |
| 1:25–1:50 | Advance to stage 5: footage review and assessment. | “A fictional footage-review record enters the collection. A human assessment refutes the red-van identification, prompting review of the earlier decision. The original reports remain available with their histories.” |
| 1:50–2:15 | Advance to stage 6 and select the footbridge decision. | “Separate library and footbridge observations support a change of direction. We can inspect the new decision, who made it, and which reports it used. The coordinator records superseding the earlier decision.” |
| 2:15–2:30 | Advance to stage 7: found safe. | “The child is found safe. The outcome is added to the record, alongside the earlier reports, assessments, and decisions.” |
| 2:30–2:45 | Return to stage 3, then stage 7. | “A past view should show past knowledge. We can distinguish what was available then from relationships and assessments discovered later.” |
| 2:45–3:00 | Select **Export record**. | “The selected stage exports as JSON-LD, connecting records, activities, and responsible agents using PROV-O concepts. Lead assessments are application-specific. Provenance makes this recorded path inspectable; it does not certify that the claims are true.” |

## Questions the demonstration should answer

- At stage 3, was the shared origin already known? **No.** The source-linkage finding appears at stage 4.
- At stage 5, does the original report disappear? **No.** The record remains; a later assessment refutes its identification.
- Why did the case redirect at stage 6? **The decision record identifies its available inputs and rationale.**
- Does the final outcome erase earlier uncertainty? **No.** Earlier views retain the uncertainty present at their time.

## Boundaries to state if asked

This is a fictional, static lecture demonstration with no backend. It has not been validated against real policing workflows. It does not establish evidentiary truth, provide integrity guarantees, or certify claims. PROV-O provides a vocabulary for provenance relationships; the lead-assessment vocabulary belongs to this application. No affiliation or endorsement is implied.

Reference: [W3C PROV-O: The PROV Ontology](https://www.w3.org/TR/prov-o/).
