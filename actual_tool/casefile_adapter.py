"""Run new fictional inputs through an unchanged copied lead-review engine.

All assessments, relationships, decisions and outcomes are authored fixture
inputs. The engine detects changes to mapped fields and follows explicit
dependencies; it does not discover facts or choose investigative priorities.
"""
from datetime import datetime
import json
from pathlib import Path

if __package__:
    from .lead_review.engine import Ledger
    from .lead_review.runner import execute
else:
    from lead_review.engine import Ledger
    from lead_review.runner import execute


ROOT = Path(__file__).resolve().parent
MODES = ("linked", "editorial", "missing_link")


def _message(stage, mode):
    if stage == 0:
        return "Fictional intake recorded. No investigative decision yet."
    if stage == 1:
        return "A simulated officer records D1 using the witness report and a separate human identification assessment."
    if stage == 2:
        return "New reports were added. A newly registered source alone does not trigger reassessment in this engine."
    if stage == 3:
        return "A human-authored finding supplies the common-source relationship. The engine did not discover it."
    if stage == 4:
        return {
            "linked": "A supplied human correction changed the mapped identification assessment. The engine requested human reassessment of D1.",
            "editorial": "Only an unmapped note changed in the assessment. Its mapped value stayed the same; the engine generated no request.",
            "missing_link": "The mapped assessment changed, but imported D1 has no registered dependency edges. No request was generated; declared-record coverage is incomplete.",
        }[mode]
    if stage == 5:
        if mode == "linked":
            return "A simulated human review appends D2 and a person records a separate footbridge decision. D1 and the witness report remain."
        return "A person records a separate footbridge decision. This control generated no van reassessment request, so no van review is simulated."
    return "The supplied fictional outcome says the child was found safe. The engine did not find the child or establish recovery benefit."


def run_casefile(stage: int, mode: str = "linked") -> dict:
    """Return a deterministic actual-engine replay through stage 0..6.

    Every invocation creates a fresh in-memory ledger. No previous work,
    source file, persistent ledger or user record is modified.
    """
    if isinstance(stage, bool) or not isinstance(stage, int) or not 0 <= stage <= 6:
        raise ValueError("stage must be an integer from 0 through 6")
    if mode not in MODES:
        raise ValueError("mode must be linked, editorial, or missing_link")
    fixture = json.loads((ROOT / "casefile_inputs.json").read_text(encoding="utf-8"))
    modeled_clock = datetime.fromisoformat(fixture["modeled_clock"].replace("Z", "+00:00"))
    ledger = Ledger(":memory:", clock=lambda: modeled_clock)
    operations = []
    current_changed_fields = set()
    try:
        for item in fixture["operations"]:
            if item["stage"] > stage or mode not in item.get("modes", MODES):
                continue
            result = execute(ledger, item["action"])
            operations.append({"stage": item["stage"], "label": item["label"], "result": result})
            if item["stage"] == stage and isinstance(result, dict):
                current_changed_fields.update(result.get("changed_fields", []))
        state = ledger.state()
        summary = {
            "pendingReviewCount": sum(r["status"] == "awaiting_human_review" for r in state["review_requests"]),
            "requestCount": len(state["review_requests"]),
            "sourceVersionCount": len(state["source_versions"]),
            "decisionCount": sum(n["kind"] == "decision" for n in state["nodes"]),
            "changedFields": sorted(current_changed_fields),
            "coverageStatus": state["coverage"]["status"],
            "integrityStatus": state["integrity"]["status"],
            "message": _message(stage, mode),
        }
        return {"stage": stage, "mode": mode, "summary": summary, "state": state, "operations": operations}
    finally:
        ledger.close()
