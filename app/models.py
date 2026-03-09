from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TumorState(BaseModel):
    burden: float = Field(..., ge=0, le=1)
    fitness: float = Field(..., ge=0, le=1)
    pathway_activity: dict[str, float]
    resistance_risk: float = Field(..., ge=0, le=1)


class ResistanceEvent(BaseModel):
    event_type: str
    label: str
    summary: str
    confidence: float = Field(..., ge=0, le=1)
    pathway_effect: str


class InterventionOption(BaseModel):
    id: str
    name: str
    kind: str
    summary: str
    mechanism: str
    structural_hypothesis: str
    expected_response: float = Field(..., ge=0, le=1)
    resistance_risk: float = Field(..., ge=0, le=1)
    toxicity_penalty: float = Field(..., ge=0, le=1)
    plausibility: float = Field(..., ge=0, le=1)
    score: float = Field(..., ge=0, le=1)


class Scorecard(BaseModel):
    response_score: float = Field(..., ge=0, le=1)
    resistance_risk: float = Field(..., ge=0, le=1)
    toxicity_penalty: float = Field(..., ge=0, le=1)
    plausibility_score: float = Field(..., ge=0, le=1)
    total_score: float = Field(..., ge=0, le=1)


class EvidenceArtifact(BaseModel):
    id: str
    title: str
    kind: str
    provider: str
    status: str
    summary: str
    source_url: str | None = None
    local_path: str | None = None
    metrics: dict[str, Any] = Field(default_factory=dict)


class SimulationTurn(BaseModel):
    index: int
    title: str
    summary: str
    tumor_state: TumorState
    resistance_event: ResistanceEvent | None = None
    recommended_intervention: InterventionOption
    alternatives: list[InterventionOption] = Field(default_factory=list)
    evidence_artifacts: list[EvidenceArtifact] = Field(default_factory=list)
    scorecard: Scorecard


class BranchSummary(BaseModel):
    id: str
    title: str
    summary: str


class CaseDefinition(BaseModel):
    id: str
    title: str
    overview: str
    target: str
    drug: str
    indication: str
    default_branch: str
    branches: list[BranchSummary]


class RunCreate(BaseModel):
    case_id: str
    branch: str | None = None
    seed: int | None = None


class RunRecord(BaseModel):
    id: str
    case_id: str
    branch_id: str
    current_turn: int
    created_at: datetime


class RunState(BaseModel):
    run_id: str
    case: CaseDefinition
    branch: BranchSummary
    current_turn: int
    completed: bool
    turns: list[SimulationTurn]
    available_branches: list[BranchSummary]
