from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class Settings:
    app_name: str
    db_path: Path
    artifact_dir: Path
    tamarind_api_key: str | None
    tamarind_base_url: str


def get_settings() -> Settings:
    root = Path(__file__).resolve().parent.parent
    db_path = Path(os.getenv("APP_DB_PATH", root / "data" / "demo.sqlite3")).resolve()
    artifact_dir = Path(
        os.getenv("APP_ARTIFACT_DIR", root / "data" / "artifacts")
    ).resolve()
    artifact_dir.mkdir(parents=True, exist_ok=True)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return Settings(
        app_name="EGFR Resistance Simulator",
        db_path=db_path,
        artifact_dir=artifact_dir,
        tamarind_api_key=os.getenv("TAMARIND_API_KEY"),
        tamarind_base_url=os.getenv(
            "TAMARIND_BASE_URL", "https://app.tamarind.bio/api/"
        ),
    )
