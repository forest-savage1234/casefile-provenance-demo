# Casefile Provenance Demo

A fictional missing-child case shows how provenance makes an evolving evidence collection and the reasoning built from it inspectable. Reports accumulate, an analyst discovers that apparently separate reports share an origin, new footage prompts a revised assessment, and a recorded decision redirects attention to an independent lead. The child is found safe.

The central distinction: **a report can remain unchanged while the collection, its known relationships, and its assessed significance change.** Earlier records remain available in later case views.

## Run locally

Use Node.js 22 or later. There are no external dependencies.

```sh
npm test
npm start
```

Open [the local demo](http://127.0.0.1:4173). Use **Back**, **Next**, or the **Investigation timeline** slider to inspect the seven stages. **Play / Pause** advances the story; **Reset** returns to intake. Select a source, report, or decision to inspect its recorded relationships. Use **Export record** to download the selected stage as JSON-LD and **About this demo** for the explanatory dialog. The [three-minute presenter script](docs/demo-script.md) provides a guided walkthrough.

Event times and recorded times are distinct: something can happen before the investigation receives a report about it. A stage's case view includes records known at that stage, even though the navigation exposes the complete fictional story.

This is a static browser application. GitHub Pages can serve its files directly; the local Node server is only a convenient development server. It has no case-management backend.

For a lecture that requires prerecorded demonstrations, capture a short walkthrough for the slides and use the live site as a separate QR companion. Confirm the venue's requirements and the deployed link before presenting.

## What changes

| Stage | Case development | Provenance point |
| --- | --- | --- |
| 1 | Intake | Start with a dated case state and its available records. |
| 2 | A witness reports a red van | Separate the reported observation from an established fact and record the initial search decision. |
| 3 | Two more reports repeat the red-van story | Their shared origin is not yet known; three records do not establish three independent sources. |
| 4 | An analyst discovers their common source | Record the later linkage through a social post without rewriting what was known earlier. |
| 5 | A footage-review record and human assessment refute the red-van identification | Preserve the reports and add the basis for revising the lead assessment and reviewing the initial decision. |
| 6 | Separate library and footbridge observations prompt a recorded decision | Make the inputs, responsible person, and reason for redirecting attention inspectable. |
| 7 | The child is found safe | Record the outcome while retaining the path to it. |

## Demonstration acceptance criteria

- Each step shows only information available at that point, including when a source relationship is still unknown.
- The original red-van report and its repeats remain inspectable after their common origin is recorded and their identification is refuted.
- The analyst's source-linkage finding and the later human assessment are recorded developments, with attributable inputs and times.
- The footbridge decision can be traced to the information available when it was recorded.
- Returning to an earlier step reconstructs that earlier view instead of projecting later knowledge backward.
- Exported JSON-LD represents the selected case state and its provenance relationships without claiming that provenance establishes the truth of a report.

## Ontology scope

The export uses concepts from [W3C PROV-O: The PROV Ontology](https://www.w3.org/TR/prov-o/): entities for records, activities for work performed, agents for the fictional people responsible, and relationships describing use, generation, and derivation. Linkage findings and human assessments generate new assertion entities; they do not regenerate earlier reports. Lead assessments and their status labels are application-specific concepts. A refuted lead is not the deletion or invalidation of the report that recorded it.

The export illustrates a PROV-O mapping. It is not a certification of ontology conformance, evidence reliability, or investigative correctness.

## Limits and contribution

All people, records, times, and events in the scenario are fictional. No actual missing child is represented. The footage is described by a fictional review record; no actual video is included. Exercise times are local labels on a fictional day, not authenticated timestamps. This is a lecture demonstration, without validation against real policing workflows. It provides no operational guidance, tamper resistance, cryptographic integrity guarantees, authentication, persistence service, or multi-user coordination. It implies no affiliation or endorsement by any person, organization, or standards body.

To contribute, keep scenario changes fictional, document the provenance distinction they demonstrate, and run `npm test`. Do not add real case information or personal meeting notes.
