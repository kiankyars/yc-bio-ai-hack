from __future__ import annotations

import json
from pathlib import Path

from fastapi import HTTPException

from .cases import get_artifact_manifest, get_branch, get_case_definition, list_branches
from .models import (
    BranchSummary,
    EvidenceArtifact,
    RunCreate,
    RunState,
    SimulationTurn,
)
from .storage import Storage


class SimulationService:
    def __init__(self, storage: Storage, artifact_dir: Path) -> None:
        self.storage = storage
        self.artifact_dir = artifact_dir
        self.case = get_case_definition("egfr-osimertinib")
        self.artifacts = get_artifact_manifest()

    def list_cases(self) -> list[dict]:
        return [self.case.model_dump()]

    def create_run(self, payload: RunCreate) -> RunState:
        if payload.case_id != self.case.id:
            raise HTTPException(status_code=404, detail=f"Unknown case: {payload.case_id}")
        branch_id = payload.branch or self.case.default_branch
        run = self.storage.create_run(payload.case_id, branch_id)
        return self._build_run_state(run.id, branch_id, run.current_turn)

    def get_run_state(self, run_id: str) -> RunState:
        run = self.storage.get_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail=f"Unknown run: {run_id}")
        return self._build_run_state(run.id, run.branch_id, run.current_turn)

    def advance_run(self, run_id: str) -> RunState:
        run = self.storage.get_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail=f"Unknown run: {run_id}")
        branch = get_branch(run.branch_id)
        updated = self.storage.advance_run(run_id, len(branch["turns"]) - 1)
        assert updated is not None
        return self._build_run_state(updated.id, updated.branch_id, updated.current_turn)

    def get_artifact(self, artifact_id: str) -> dict:
        manifest = self.artifacts.get(artifact_id)
        if manifest is None:
            raise HTTPException(status_code=404, detail=f"Unknown artifact: {artifact_id}")
        payload = dict(manifest)
        local_path = payload.get("local_path")
        if local_path:
            path = self.artifact_dir / local_path
            if path.exists():
                payload["content"] = json.loads(path.read_text())
        return payload

    def _build_run_state(self, run_id: str, branch_id: str, current_turn: int) -> RunState:
        branch = get_branch(branch_id)
        turns = [
            self._materialize_turn(idx, turn)
            for idx, turn in enumerate(branch["turns"][: current_turn + 1])
        ]
        return RunState(
            run_id=run_id,
            case=self.case,
            branch=self._get_branch_summary(branch_id),
            current_turn=current_turn,
            completed=current_turn >= len(branch["turns"]) - 1,
            turns=turns,
            available_branches=list_branches(),
        )

    def _materialize_turn(self, index: int, payload: dict) -> SimulationTurn:
        enriched = dict(payload)
        enriched["index"] = index
        enriched["evidence_artifacts"] = [
            self._materialize_artifact(artifact_id)
            for artifact_id in payload.get("evidence_artifacts", [])
        ]
        return SimulationTurn(**enriched)

    def _materialize_artifact(self, artifact_id: str) -> EvidenceArtifact:
        payload = dict(self.artifacts[artifact_id])
        local_path = payload.get("local_path")
        if local_path:
            payload["local_path"] = f"/artifacts/{artifact_id}"
        return EvidenceArtifact(**payload)

    def _get_branch_summary(self, branch_id: str) -> BranchSummary:
        for branch in self.case.branches:
            if branch.id == branch_id:
                return branch
        raise HTTPException(status_code=404, detail=f"Unknown branch: {branch_id}")
