from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.cases import get_artifact_manifest, get_tamarind_checkpoints  # noqa: E402
from app.tamarind import TamarindClient  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Precompute Tamarind checkpoints for the EGFR demo.")
    parser.add_argument(
        "--submit",
        action="store_true",
        help="Actually submit jobs. Without this flag the script only validates tool availability and shows the planned submissions.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    api_key = os.getenv("TAMARIND_API_KEY")
    if not api_key:
        print("Set TAMARIND_API_KEY before running this script.")
        return 1

    artifact_dir = ROOT / "data" / "artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)

    client = TamarindClient(api_key=api_key, base_url=os.getenv("TAMARIND_BASE_URL", "https://app.tamarind.bio/api/"))
    manifest = get_artifact_manifest()
    existing_jobs_payload = client.list_jobs()
    existing_jobs = {
        job.get("JobName")
        for job in existing_jobs_payload.get("jobs", [])
        if isinstance(job, dict) and job.get("JobName")
    }

    print("Verifying Tamarind tool availability...")
    tools = {tool["name"] for tool in client.list_tools()}
    for checkpoint in get_tamarind_checkpoints():
        if checkpoint["tool"] not in tools:
            print(f"Skipping {checkpoint['artifact_id']}: tool {checkpoint['tool']} not available")
            continue
        artifact_payload = manifest[checkpoint["artifact_id"]]
        target = artifact_dir / artifact_payload["local_path"]
        if checkpoint["job_name"] in existing_jobs:
            print(f"Skipping {checkpoint['artifact_id']}: {checkpoint['job_name']} already exists")
            target.write_text(
                json.dumps(
                    {
                        "note": "Existing Tamarind job detected. Use the dashboard or /jobs endpoint to monitor completion.",
                        "submission": checkpoint,
                        "response": {"message": "job already exists"},
                    },
                    indent=2,
                )
            )
            continue
        if not args.submit:
            print(
                f"Dry run: would submit {checkpoint['artifact_id']} via "
                f"{checkpoint['tool']} as {checkpoint['job_name']}"
            )
            continue
        print(f"Submitting {checkpoint['artifact_id']} via {checkpoint['tool']} as {checkpoint['job_name']}")
        response = client.submit_job(
            job_name=checkpoint["job_name"],
            tool=checkpoint["tool"],
            settings=checkpoint["settings"],
        )
        target.write_text(
            json.dumps(
                {
                    "note": "Submission accepted by Tamarind. Replace this cache with final result artifacts once the job completes.",
                    "submission": checkpoint,
                    "response": response,
                },
                indent=2,
            )
        )
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
