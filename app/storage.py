from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterator

from .cases import get_case_definition, get_tamarind_checkpoints
from .models import RunRecord


class Storage:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _initialize(self) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL,
                    branch_id TEXT NOT NULL,
                    current_turn INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS checkpoints (
                    artifact_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL,
                    job_name TEXT NOT NULL,
                    tool TEXT NOT NULL,
                    status TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
        self.seed_checkpoints()

    def seed_checkpoints(self) -> None:
        case_id = get_case_definition("egfr-osimertinib").id
        with self.connect() as conn:
            for checkpoint in get_tamarind_checkpoints():
                conn.execute(
                    """
                    INSERT INTO checkpoints (artifact_id, case_id, job_name, tool, status, metadata_json, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(artifact_id) DO NOTHING
                    """,
                    (
                        checkpoint["artifact_id"],
                        case_id,
                        checkpoint["job_name"],
                        checkpoint["tool"],
                        "cached",
                        json.dumps(checkpoint),
                        datetime.now(UTC).isoformat(),
                    ),
                )

    def create_run(self, case_id: str, branch_id: str) -> RunRecord:
        run_id = str(uuid.uuid4())
        created_at = datetime.now(UTC)
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO runs (id, case_id, branch_id, current_turn, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (run_id, case_id, branch_id, 0, created_at.isoformat()),
            )
        return RunRecord(
            id=run_id,
            case_id=case_id,
            branch_id=branch_id,
            current_turn=0,
            created_at=created_at,
        )

    def get_run(self, run_id: str) -> RunRecord | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
        if row is None:
            return None
        return RunRecord(
            id=row["id"],
            case_id=row["case_id"],
            branch_id=row["branch_id"],
            current_turn=row["current_turn"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    def advance_run(self, run_id: str, max_turn_index: int) -> RunRecord | None:
        record = self.get_run(run_id)
        if record is None:
            return None
        next_turn = min(record.current_turn + 1, max_turn_index)
        with self.connect() as conn:
            conn.execute(
                "UPDATE runs SET current_turn = ? WHERE id = ?",
                (next_turn, run_id),
            )
        return self.get_run(run_id)

    def list_checkpoints(self) -> list[dict]:
        with self.connect() as conn:
            rows = conn.execute("SELECT * FROM checkpoints ORDER BY artifact_id").fetchall()
        return [dict(row) for row in rows]

    def update_checkpoint_status(
        self,
        artifact_id: str,
        status: str,
        metadata: dict,
    ) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                UPDATE checkpoints
                SET status = ?, metadata_json = ?, updated_at = ?
                WHERE artifact_id = ?
                """,
                (
                    status,
                    json.dumps(metadata),
                    datetime.now(UTC).isoformat(),
                    artifact_id,
                ),
            )
