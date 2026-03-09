from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def make_client(tmp_path: Path) -> TestClient:
    settings = Settings(
        app_name="test-app",
        db_path=tmp_path / "demo.sqlite3",
        artifact_dir=Path(__file__).resolve().parent.parent / "data" / "artifacts",
        tamarind_api_key=None,
        tamarind_base_url="https://app.tamarind.bio/api/",
    )
    return TestClient(create_app(settings))


def test_cases_endpoint(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.get("/cases")
    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["id"] == "egfr-osimertinib"
    assert len(payload[0]["branches"]) == 2


def test_run_lifecycle_c797s(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    created = client.post("/runs", json={"case_id": "egfr-osimertinib", "branch": "c797s"})
    assert created.status_code == 200
    run = created.json()
    assert run["current_turn"] == 0
    assert run["turns"][-1]["title"] == "Initial Response"

    advanced = client.post(f"/runs/{run['run_id']}/advance")
    assert advanced.status_code == 200
    run = advanced.json()
    assert run["current_turn"] == 1
    assert run["turns"][-1]["resistance_event"]["label"] == "EGFR C797S"

    advanced = client.post(f"/runs/{run['run_id']}/advance")
    run = advanced.json()
    assert run["completed"] is True
    assert run["turns"][-1]["recommended_intervention"]["name"].startswith("Stay on BLU-945")


def test_default_branch_is_used(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.post("/runs", json={"case_id": "egfr-osimertinib"})
    assert response.status_code == 200
    assert response.json()["branch"]["id"] == "c797s"


def test_artifact_endpoint(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    response = client.get("/artifacts/egfr-c797s-osimertinib")
    assert response.status_code == 200
    payload = response.json()
    assert payload["kind"] == "structure"
    assert "content" in payload
