"""Verify copied engine bytes and deterministically generate/check 21 replays.

Default: generate manifests and recorded fallback outputs in this new repo.
--check: read and compare only; no output files are changed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / "actual_tool"
sys.path.insert(0, str(TOOL))
from casefile_adapter import MODES, run_casefile

# Pinned to the unmodified selected files in the local 15 October distribution.
# These constants are not refreshed by generation. Original source is untouched.
COPIED_SHA256 = {
    "lead_review/__init__.py": "148cb29ae840f8e64941034d2143e53b643aa9218582e404cabd1166139e7276",
    "lead_review/engine.py": "e1934174ca69dd759e0d8b57da6bfb8253959521bc4426c144a5e745b4ea9ae1",
    "lead_review/model.py": "811bcee9a04bf552bd8f0d4bae9d0f521f90dc00b892cbd6e88f228916de968b",
    "lead_review/runner.py": "b1ab11a3d0c7150a822d7f8443dd5374992b3cf885182ab839f361ee4f6edc06",
    "lead_review/vendor/__init__.py": "c5f1d18ae399bb8fc4a106e94cca0c72ec3bc79372f20650dafcf586ec120ff5",
    "lead_review/vendor/documents.py": "0e03548a9abb61dbcba1ecc0607e20684858d27a91f804ae0e5779d4fa203087",
    "lead_review/vendor/assertions.py": "5b969d5970e92bba4d28b5825aef456e668dd844877cfe207e0e5134eefe6969",
    "lead_review/vendor/LICENSE": "082102c6b0054cd61125743462daf3b205260a486f5affda79fb33ee8a274c36",
    "lead_review/vendor/PROVENANCE.json": "fff1af9db5350010b57e2319cbe4437ed08e5a4580e0c786b7e1e00caf60bfac",
    "LICENSE": "97ace90a991dda99229342676afc1717c11405155de2773f7e36756e3983365b",
    "NOTICE.md": "c530558d001a281d33bf42f4e1d2e0382d82db536667fae84200c5bc59224ef3",
}
NEW_FILES = {
    "__init__.py": "adapter",
    "casefile_adapter.py": "adapter",
    "casefile_inputs.json": "fixture",
}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n"


def generated_manifest():
    files = []
    for name, expected in COPIED_SHA256.items():
        raw = (TOOL / name).read_bytes()
        actual = hashlib.sha256(raw).hexdigest()
        if actual != expected:
            raise ValueError("Copied source bytes changed: " + name)
        role = "license" if name in {"LICENSE", "NOTICE.md", "lead_review/vendor/LICENSE"} else "unchanged-core"
        files.append({"path": name, "sha256": actual, "bytes": len(raw), "role": role})
    for name, role in NEW_FILES.items():
        raw = (TOOL / name).read_bytes()
        files.append({"path": name, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw), "role": role})
    return {
        "schema": 1,
        "source": {
            "description": "Selected unchanged core from the local DFRWS authorization-response-fix distribution, 2026-10-15. The core hash identifies these copied bytes; the omitted HTTP fix is not executed by this integration.",
            "baseCommit": "65b7b4849af4fefccb4253d3a7634fd14acd4c53",
            "repository": "https://github.com/forest-savage1234/dfrws-lead-review",
            "origin": "Selected unchanged core copied from a local distribution derived from the identified public base. The local distribution also contains an HTTP fix, but that HTTP module is not copied or executed here. No claim that the entire local distribution equals that commit.",
            "engineSha256": COPIED_SHA256["lead_review/engine.py"],
            "scope": "Copied core and original attribution only; original HTTP UI, benchmark, presenter fixture and earlier snapshot implementation excluded.",
        },
        "files": files,
    }


def generated_recordings():
    return {"schema": 1, "runs": {mode: [run_casefile(stage, mode) for stage in range(7)] for mode in MODES}}


def verify_or_generate(check=False):
    manifest = generated_manifest()
    recordings = generated_recordings()
    if any(run["summary"]["integrityStatus"] != "pass" for runs in recordings["runs"].values() for run in runs):
        raise ValueError("An engine integrity check failed")
    if check:
        current_manifest = json.loads((TOOL / "SOURCE_MANIFEST.json").read_text(encoding="utf-8-sig"))
        current_recordings = json.loads((TOOL / "recorded.json").read_text(encoding="utf-8"))
        if current_manifest != manifest:
            raise ValueError("SOURCE_MANIFEST.json differs from verified source and adapter bytes")
        if current_recordings != recordings:
            raise ValueError("recorded.json differs from a fresh actual-engine execution")
    else:
        (TOOL / "SOURCE_MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        (TOOL / "recorded.json").write_text(canonical(recordings), encoding="utf-8", newline="\n")
    return {"status": "pass", "mode": "check" if check else "generate", "copiedFiles": len(COPIED_SHA256), "manifestFiles": len(manifest["files"]), "replays": 21, "sourceHashes": "verified", "recordedReplay": "matches fresh actual-engine execution"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Compare only; do not write generated files")
    args = parser.parse_args()
    try:
        print(json.dumps(verify_or_generate(args.check), sort_keys=True))
    except (OSError, ValueError) as exc:
        print(json.dumps({"status": "fail", "reason": str(exc)}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
