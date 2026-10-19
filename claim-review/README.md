# Claim Review

A browser tool by Forest Savage for checking the arithmetic and declared source context behind a quantitative scientific claim. It retains source data, reads specified cells, replays a bounded calculation, and keeps unresolved evidence questions visible.

[Open Claim Review](https://forest-savage1234.github.io/casefile-provenance-demo/claim-review/) · [Metabolic Engineering Forensics](https://github.com/forest-savage1234/metabolic-engineering-forensics) · [Published application](index.html)

**Public edition:** 0.3.2, a research prototype. This directory contains the standalone browser distribution and its licenses. It is hosted alongside the Casefile Provenance Demo; it has a separate scientific workflow.

## Try the published example

1. Open the app and choose **Published example**.
2. Select **Run review**.
3. Inspect the declared source cells, calculation, and remaining evidence questions.

The example uses the Figure 4 workbook from Cho et al. (2026). The declared endpoint calculation is **141.517 g/L ÷ 48 h = 2.95 g/L/h**, rounded to two decimal places. The app reports **Arithmetic reproduced** and **Partial support**: numerical agreement does not reconstruct the measurement history or establish the complete experimental context.

Choose **Synthetic fault test** to compare deliberately altered test records. Those examples are labeled synthetic and are separate from findings about the published study.

## Use and inspect

- **Your own claim:** supply an XLSX, CSV, or TSV source and declare the cells, units, calculation, and relevant conditions.
- **Replicate observations:** inspect reconstructed counts, means, sample SD, and SEM within the supported calculation scope.
- **Export project:** retain a portable copy, including source bytes. **Export report** saves the review record.
- **Offline use:** download this repository and open `claim-review/index.html` in a desktop browser. The standalone file includes its application code, parsing dependencies, and example data.

Source processing takes place in the browser. Treat exported projects as copies of the supplied data. A file fingerprint identifies bytes; it does not authenticate their origin.

## Scope

This edition checks declared numerical relationships and conditions. A person supplies the claim, source interpretation, and relevant context. It does not automatically audit an entire paper or establish biological truth. Passing arithmetic leaves measurement, identity, and publication-context questions open.

The [research repository](https://github.com/forest-savage1234/metabolic-engineering-forensics) contains the earlier verification protocol, structured cases, Python manifest verifier, and evidence reports. That verifier checks a different scope from this browser calculation tool; its original study findings are preserved separately.

## Attribution and licenses

Forest Savage's application code is covered by the included [Apache License 2.0](LICENSE). Published data and third-party dependencies retain their own terms in [NOTICE](NOTICE) and [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt). The notice retains its earlier distribution label; the application identifies this browser edition as 0.3.2.

The published example is attributed to Cho et al. and the linked source-data release in NOTICE. The study's authors did not create or endorse this tool.
