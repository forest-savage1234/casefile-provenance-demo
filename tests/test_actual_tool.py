"""Behavioral checks of the real copied core with the new fictional inputs."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "actual_tool"))
from casefile_adapter import run_casefile


def node(state, node_id):
    return next(n for n in state["nodes"] if n["id"] == node_id)


def source_versions(state, source_key):
    document_ids = {n["source_key"]: n["source_version_id"] for n in state["nodes"] if n["kind"] == "observation"}
    if source_key not in document_ids:
        return []
    latest = next(v for v in state["source_versions"] if v["id"] == document_ids[source_key])
    return [v for v in state["source_versions"] if v["document_id"] == latest["document_id"]]


class ActualToolTests(unittest.TestCase):
    def test_original_witness_bytes_and_digest_remain_unchanged(self):
        before = source_versions(run_casefile(1)["state"], "source_witness")
        after = source_versions(run_casefile(6)["state"], "source_witness")
        self.assertEqual(before, after)
        self.assertEqual(len(after), 1)
        self.assertEqual(hashlib.sha256(after[0]["content"].encode()).hexdigest(), after[0]["sha256"])
        assessment_versions = source_versions(run_casefile(6)["state"], "source_identification_assessment")
        self.assertEqual(len(assessment_versions), 2)
        self.assertEqual({json.loads(v["content"])["identification_assessment"] for v in assessment_versions}, {"possibly_mika", "different_child"})

    def test_real_request_follows_assessment_edge_and_preserves_d1(self):
        before = run_casefile(1)["state"]
        changed = run_casefile(4)
        self.assertEqual(changed["summary"]["requestCount"], 1)
        self.assertEqual(changed["summary"]["pendingReviewCount"], 1)
        request = changed["state"]["review_requests"][0]
        self.assertEqual(request["decision_id"], "decision_van_d1")
        self.assertEqual(request["changed_fields"], ["identification_assessment"])
        self.assertEqual(request["old_values"]["identification_assessment"], "possibly_mika")
        self.assertEqual(request["new_values"]["identification_assessment"], "different_child")
        self.assertEqual(request["dependency_path"][-1], "decision_van_d1")
        self.assertEqual(node(changed["state"], request["dependency_path"][0])["source_key"], "source_identification_assessment")
        self.assertIn({"input_id": request["dependency_path"][0], "owner_id": "decision_van_d1", "fields": ["identification_assessment"]}, changed["state"]["dependencies"])
        self.assertEqual(node(before, "decision_van_d1"), node(changed["state"], "decision_van_d1"))

    def test_human_review_appends_successor_not_automatic_disposition(self):
        pending = run_casefile(4)["state"]
        reviewed = run_casefile(5)
        self.assertEqual(node(pending, "decision_van_d1")["disposition"], "pursue")
        self.assertEqual(node(pending, "decision_van_d1"), node(reviewed["state"], "decision_van_d1"))
        successor = node(reviewed["state"], "decision_van_d2")
        self.assertEqual(successor["supersedes"], "decision_van_d1")
        self.assertEqual(successor["disposition"], "defer")
        self.assertEqual(len(reviewed["state"]["human_reviews"]), 1)
        self.assertEqual(reviewed["state"]["review_requests"][0]["status"], "reviewed")
        self.assertEqual(reviewed["summary"]["pendingReviewCount"], 0)
        self.assertEqual(reviewed["summary"]["decisionCount"], 3)

    def test_new_reports_and_supplied_source_link_do_not_infer_requests(self):
        initial = run_casefile(1)
        new_reports = run_casefile(2)
        human_link = run_casefile(3)
        self.assertGreater(new_reports["summary"]["sourceVersionCount"], initial["summary"]["sourceVersionCount"])
        self.assertEqual(new_reports["summary"]["requestCount"], 0)
        self.assertEqual(human_link["summary"]["requestCount"], 0)
        self.assertEqual(human_link["state"]["dependencies"], initial["state"]["dependencies"])
        finding = source_versions(human_link["state"], "source_common_origin_finding")[0]
        self.assertTrue(json.loads(finding["content"])["relationship_supplied_by_human"])

    def test_editorial_bytes_change_without_mapped_change_or_request(self):
        before = source_versions(run_casefile(1, "editorial")["state"], "source_identification_assessment")
        changed = run_casefile(4, "editorial")
        after = source_versions(changed["state"], "source_identification_assessment")
        self.assertEqual(len(before), 1)
        self.assertEqual(len(after), 2)
        self.assertEqual(len({v["sha256"] for v in after}), 2)
        self.assertEqual({json.loads(v["content"])["identification_assessment"] for v in after}, {"possibly_mika"})
        self.assertEqual(changed["summary"]["changedFields"], [])
        self.assertEqual(changed["summary"]["requestCount"], 0)
        self.assertFalse(run_casefile(5, "editorial")["state"]["human_reviews"])

    def test_supported_legacy_import_exposes_missing_coverage_and_miss(self):
        changed = run_casefile(4, "missing_link")
        d1 = node(changed["state"], "decision_van_d1")
        self.assertEqual(len(d1["inputs"]), 2)
        self.assertTrue(d1["legacy_reason"])
        self.assertFalse(changed["state"]["dependencies"])
        self.assertEqual(changed["summary"]["changedFields"], ["identification_assessment"])
        self.assertEqual(changed["summary"]["requestCount"], 0)
        self.assertEqual(changed["summary"]["coverageStatus"], "incomplete")
        self.assertTrue(any("missing" in i["reason"] for i in changed["state"]["coverage"]["issues"]))
        later = run_casefile(6, "missing_link")
        self.assertEqual(later["summary"]["coverageStatus"], "incomplete")
        self.assertFalse(later["state"]["human_reviews"])

    def test_all_stages_keep_integrity_and_history_in_all_modes(self):
        for mode in ("linked", "editorial", "missing_link"):
            with self.subTest(mode=mode):
                earlier_nodes = {}
                earlier_versions = {}
                for stage in range(7):
                    run = run_casefile(stage, mode)
                    self.assertEqual(run["summary"]["integrityStatus"], "pass")
                    nodes = {n["id"]: n for n in run["state"]["nodes"]}
                    versions = {v["id"]: v for v in run["state"]["source_versions"]}
                    for key, value in earlier_nodes.items():
                        self.assertEqual(nodes[key], value)
                    for key, value in earlier_versions.items():
                        self.assertEqual(versions[key], value)
                    earlier_nodes, earlier_versions = nodes, versions

    def test_committed_capture_and_pinned_copied_source_hashes(self):
        spec = importlib.util.spec_from_file_location("verify_actual_tool", ROOT / "scripts" / "verify_actual_tool.py")
        verifier = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(verifier)
        self.assertEqual(verifier.verify_or_generate(check=True)["status"], "pass")

    def test_invalid_stage_and_mode_rejected(self):
        for stage in (-1, 7, True, "4", 3.5):
            with self.subTest(stage=stage), self.assertRaises(ValueError):
                run_casefile(stage)
        with self.assertRaises(ValueError):
            run_casefile(4, "invented")


if __name__ == "__main__":
    unittest.main()
