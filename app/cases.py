from __future__ import annotations

from copy import deepcopy
from typing import Any

from .models import BranchSummary, CaseDefinition


def _score(total: float, response: float, risk: float, toxicity: float, plausibility: float) -> dict[str, float]:
    return {
        "response_score": response,
        "resistance_risk": risk,
        "toxicity_penalty": toxicity,
        "plausibility_score": plausibility,
        "total_score": total,
    }


BASE_CASE: dict[str, Any] = {
    "id": "egfr-osimertinib",
    "title": "EGFR Resistance Simulator",
    "overview": (
        "Simulate how an EGFR-mutant NSCLC tumor escapes osimertinib and patch the failure "
        "with branch-specific interventions backed by structural checkpoints."
    ),
    "target": "EGFR L858R/Ex19del signaling axis",
    "drug": "Osimertinib",
    "indication": "EGFR-mutant non-small-cell lung cancer",
    "default_branch": "c797s",
    "branches": [
        {"id": "c797s", "title": "C797S Escape", "summary": "Covalent binding fails after C797S emerges."},
        {"id": "met_amp", "title": "MET Bypass", "summary": "Tumor reroutes signaling through MET amplification."},
    ],
}


CASE_BRANCHES: dict[str, dict[str, Any]] = {
    "c797s": {
        "title": "C797S Escape",
        "summary": "Canonical on-target resistance where the cysteine required for covalent binding is lost.",
        "turns": [
            {
                "title": "Initial Response",
                "summary": "Osimertinib sharply suppresses EGFR signaling and the tumor enters a transient response state.",
                "tumor_state": {
                    "burden": 0.42,
                    "fitness": 0.31,
                    "pathway_activity": {"EGFR": 0.21, "MAPK": 0.33, "MET": 0.11},
                    "resistance_risk": 0.27,
                },
                "recommended_intervention": {
                    "id": "osi-monitor",
                    "name": "Continue osimertinib with ctDNA surveillance",
                    "kind": "monotherapy",
                    "summary": "Maintain selective pressure while watching for emerging on-target mutations.",
                    "mechanism": "Irreversible EGFR inhibition",
                    "structural_hypothesis": "Wild-type mutant pocket remains accessible for covalent binding.",
                    "expected_response": 0.84,
                    "resistance_risk": 0.28,
                    "toxicity_penalty": 0.14,
                    "plausibility": 0.92,
                    "score": 0.84,
                },
                "alternatives": [
                    {
                        "id": "osi-bevacizumab",
                        "name": "Add anti-angiogenic partner",
                        "kind": "combo",
                        "summary": "Increase depth of response, but without addressing the eventual EGFR escape route.",
                        "mechanism": "EGFR inhibition plus VEGF blockade",
                        "structural_hypothesis": "No rescue of future C797S binding loss.",
                        "expected_response": 0.67,
                        "resistance_risk": 0.42,
                        "toxicity_penalty": 0.33,
                        "plausibility": 0.69,
                        "score": 0.57,
                    }
                ],
                "evidence_artifacts": ["egfr-wt-osimertinib"],
                "scorecard": _score(0.84, 0.84, 0.28, 0.14, 0.92),
            },
            {
                "title": "Resistance Emerges",
                "summary": "A C797S subclone takes over. Covalent engagement collapses and MAPK signaling rebounds.",
                "tumor_state": {
                    "burden": 0.66,
                    "fitness": 0.74,
                    "pathway_activity": {"EGFR": 0.63, "MAPK": 0.77, "MET": 0.18},
                    "resistance_risk": 0.82,
                },
                "resistance_event": {
                    "event_type": "mutation",
                    "label": "EGFR C797S",
                    "summary": "The covalent anchor residue is replaced, preventing durable osimertinib engagement.",
                    "confidence": 0.94,
                    "pathway_effect": "Direct reactivation of EGFR output and downstream MAPK signaling.",
                },
                "recommended_intervention": {
                    "id": "blu945-cetux",
                    "name": "Escalate to BLU-945 + cetuximab",
                    "kind": "rescue_combo",
                    "summary": "Use a fourth-generation mutant-selective EGFR inhibitor and extracellular blockade to suppress C797S escape.",
                    "mechanism": "Non-covalent mutant-selective EGFR inhibition plus receptor down-modulation",
                    "structural_hypothesis": "BLU-945 can retain affinity without depending on C797 covalency.",
                    "expected_response": 0.78,
                    "resistance_risk": 0.34,
                    "toxicity_penalty": 0.29,
                    "plausibility": 0.81,
                    "score": 0.77,
                },
                "alternatives": [
                    {
                        "id": "afatinib-rechallenge",
                        "name": "Pan-HER rechallenge",
                        "kind": "monotherapy",
                        "summary": "Broader inhibition may transiently reduce signaling but is weak against the dominant escape clone.",
                        "mechanism": "Broader HER-family blockade",
                        "structural_hypothesis": "No specific accommodation of the C797S pocket change.",
                        "expected_response": 0.39,
                        "resistance_risk": 0.71,
                        "toxicity_penalty": 0.47,
                        "plausibility": 0.55,
                        "score": 0.33,
                    }
                ],
                "evidence_artifacts": [
                    "egfr-wt-osimertinib",
                    "egfr-c797s-osimertinib",
                    "egfr-c797s-blu945",
                ],
                "scorecard": _score(0.77, 0.78, 0.34, 0.29, 0.81),
            },
            {
                "title": "Patched Strategy",
                "summary": "The rescue regimen restores pathway suppression and lowers the probability of immediate repeat escape.",
                "tumor_state": {
                    "burden": 0.37,
                    "fitness": 0.29,
                    "pathway_activity": {"EGFR": 0.25, "MAPK": 0.31, "MET": 0.13},
                    "resistance_risk": 0.33,
                },
                "recommended_intervention": {
                    "id": "hold-rescue",
                    "name": "Stay on BLU-945 + cetuximab and monitor tertiary escape",
                    "kind": "maintenance_combo",
                    "summary": "Maintain the rescue combo while watching for tertiary EGFR mutations or lineage drift.",
                    "mechanism": "Continued on-target suppression after structural rescue",
                    "structural_hypothesis": "Recovered pocket occupancy and receptor suppression reduce EGFR-driven fitness.",
                    "expected_response": 0.82,
                    "resistance_risk": 0.31,
                    "toxicity_penalty": 0.29,
                    "plausibility": 0.83,
                    "score": 0.8,
                },
                "alternatives": [],
                "evidence_artifacts": ["egfr-c797s-blu945"],
                "scorecard": _score(0.8, 0.82, 0.31, 0.29, 0.83),
            },
        ],
    },
    "met_amp": {
        "title": "MET Bypass",
        "summary": "Off-target resistance where MET amplification restores downstream signaling despite EGFR blockade.",
        "turns": [
            {
                "title": "Initial Response",
                "summary": "Osimertinib produces the expected early drop in EGFR signaling and tumor fitness.",
                "tumor_state": {
                    "burden": 0.46,
                    "fitness": 0.35,
                    "pathway_activity": {"EGFR": 0.23, "MAPK": 0.35, "MET": 0.14},
                    "resistance_risk": 0.29,
                },
                "recommended_intervention": {
                    "id": "osi-monitor-met",
                    "name": "Continue osimertinib and watch bypass nodes",
                    "kind": "monotherapy",
                    "summary": "Maintain treatment response while profiling bypass pathways in plasma and imaging.",
                    "mechanism": "Irreversible EGFR inhibition",
                    "structural_hypothesis": "On-target binding remains intact; future failure is likely pathway-level.",
                    "expected_response": 0.82,
                    "resistance_risk": 0.3,
                    "toxicity_penalty": 0.14,
                    "plausibility": 0.89,
                    "score": 0.82,
                },
                "alternatives": [],
                "evidence_artifacts": ["egfr-wt-osimertinib"],
                "scorecard": _score(0.82, 0.82, 0.3, 0.14, 0.89),
            },
            {
                "title": "Bypass Activation",
                "summary": "MET amplification restores MAPK and PI3K signaling without changing the EGFR pocket itself.",
                "tumor_state": {
                    "burden": 0.71,
                    "fitness": 0.79,
                    "pathway_activity": {"EGFR": 0.28, "MAPK": 0.81, "MET": 0.88},
                    "resistance_risk": 0.79,
                },
                "resistance_event": {
                    "event_type": "bypass",
                    "label": "MET amplification",
                    "summary": "The tumor reactivates downstream survival signaling through a parallel RTK.",
                    "confidence": 0.9,
                    "pathway_effect": "High MET output feeds MAPK and PI3K despite continued EGFR occupancy.",
                },
                "recommended_intervention": {
                    "id": "osi-savolitinib",
                    "name": "Add savolitinib to osimertinib",
                    "kind": "combo",
                    "summary": "Pair the existing EGFR inhibitor with a MET inhibitor to shut off the bypass route.",
                    "mechanism": "Dual EGFR and MET suppression",
                    "structural_hypothesis": "EGFR binding is intact; the rescue comes from parallel pathway suppression.",
                    "expected_response": 0.76,
                    "resistance_risk": 0.36,
                    "toxicity_penalty": 0.32,
                    "plausibility": 0.86,
                    "score": 0.76,
                },
                "alternatives": [
                    {
                        "id": "chemo-switch",
                        "name": "Switch to chemo-immunotherapy",
                        "kind": "salvage",
                        "summary": "Broad salvage option with lower mechanistic precision and weaker narrative fit.",
                        "mechanism": "Non-targeted systemic therapy",
                        "structural_hypothesis": "Does not leverage the intact EGFR structural evidence.",
                        "expected_response": 0.44,
                        "resistance_risk": 0.55,
                        "toxicity_penalty": 0.58,
                        "plausibility": 0.63,
                        "score": 0.31,
                    }
                ],
                "evidence_artifacts": [
                    "egfr-wt-osimertinib",
                    "met-bypass-map",
                    "met-combo-rationale",
                ],
                "scorecard": _score(0.76, 0.76, 0.36, 0.32, 0.86),
            },
            {
                "title": "Patched Strategy",
                "summary": "Dual EGFR and MET blockade restores control of downstream signaling and reduces near-term relapse risk.",
                "tumor_state": {
                    "burden": 0.39,
                    "fitness": 0.32,
                    "pathway_activity": {"EGFR": 0.24, "MAPK": 0.33, "MET": 0.28},
                    "resistance_risk": 0.35,
                },
                "recommended_intervention": {
                    "id": "hold-met-combo",
                    "name": "Continue osimertinib + savolitinib",
                    "kind": "maintenance_combo",
                    "summary": "Hold the branch-specific rescue and monitor for lineage drift or further bypass nodes.",
                    "mechanism": "Sustained EGFR plus MET suppression",
                    "structural_hypothesis": "The core EGFR binding mode stays valid while bypass activity is contained.",
                    "expected_response": 0.79,
                    "resistance_risk": 0.34,
                    "toxicity_penalty": 0.32,
                    "plausibility": 0.84,
                    "score": 0.78,
                },
                "alternatives": [],
                "evidence_artifacts": ["met-combo-rationale"],
                "scorecard": _score(0.78, 0.79, 0.34, 0.32, 0.84),
            },
        ],
    },
}


ARTIFACTS: dict[str, dict[str, Any]] = {
    "egfr-wt-osimertinib": {
        "id": "egfr-wt-osimertinib",
        "title": "Wild-type pocket with osimertinib",
        "kind": "structure",
        "provider": "Tamarind / Chai",
        "status": "cached",
        "summary": "Reference complex showing the baseline binding geometry of osimertinib in the EGFR pocket.",
        "source_url": "https://docs.tamarind.bio/tasks/structure-prediction",
        "local_path": "egfr-wt-osimertinib.json",
        "metrics": {"predicted_affinity": 0.81, "pocket_confidence": 0.88},
    },
    "egfr-c797s-osimertinib": {
        "id": "egfr-c797s-osimertinib",
        "title": "C797S mutant with osimertinib",
        "kind": "structure",
        "provider": "Tamarind / Boltz",
        "status": "cached",
        "summary": "Mutant checkpoint illustrating why loss of C797 compromises the original engagement strategy.",
        "source_url": "https://docs.tamarind.bio/tasks/structure-prediction",
        "local_path": "egfr-c797s-osimertinib.json",
        "metrics": {"predicted_affinity": 0.31, "pocket_confidence": 0.82},
    },
    "egfr-c797s-blu945": {
        "id": "egfr-c797s-blu945",
        "title": "C797S mutant with rescue inhibitor",
        "kind": "structure",
        "provider": "Tamarind / Boltz",
        "status": "cached",
        "summary": "Rescue checkpoint showing a non-covalent mutant-selective inhibitor retaining favorable pocket occupancy.",
        "source_url": "https://docs.tamarind.bio/tasks/structure-prediction",
        "local_path": "egfr-c797s-blu945.json",
        "metrics": {"predicted_affinity": 0.72, "pocket_confidence": 0.84},
    },
    "met-bypass-map": {
        "id": "met-bypass-map",
        "title": "MET bypass pathway map",
        "kind": "pathway",
        "provider": "Curated biology graph",
        "status": "cached",
        "summary": "Evidence card showing how downstream MAPK output is restored through MET amplification.",
        "local_path": "met-bypass-map.json",
        "metrics": {"met_activity": 0.88, "mapk_rebound": 0.81},
    },
    "met-combo-rationale": {
        "id": "met-combo-rationale",
        "title": "Dual EGFR plus MET suppression rationale",
        "kind": "strategy",
        "provider": "Curated resistance engine",
        "status": "cached",
        "summary": "Mechanistic rationale for combining savolitinib with osimertinib when MET drives the relapse.",
        "local_path": "met-combo-rationale.json",
        "metrics": {"expected_combo_response": 0.76, "toxicity_penalty": 0.32},
    },
}


TAMARIND_CHECKPOINTS: list[dict[str, Any]] = [
    {
        "artifact_id": "egfr-wt-osimertinib",
        "job_name": "egfr-wt-osimertinib-demo",
        "tool": "chai",
        "settings": {
            "inputFormat": "sequence",
            "sequence": "LVWKSPPEQNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCVGPDNCIQCAHYIDGPHCVKTCPAGVMGENNTLVWKYADAGHVCHLCHPNCTYGCTGPGLRGCPTNGPKIPS",
            "ligands": ["COC1=CC2=C(C=C1)N(C3CCN(CC3)C)C4=NC(=NC(=C4)NC5=CN=C(C=C5)N)Cl"],
            "numSamples": 1,
            "numTrunkSamples": 1,
            "useMSA": False,
        },
    },
    {
        "artifact_id": "egfr-c797s-osimertinib",
        "job_name": "egfr-c797s-osimertinib-demo",
        "tool": "boltz",
        "settings": {
            "inputFormat": "sequence",
            "sequence": "LVWKSPPEQNLQEILHGAVRFSNNPALSNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCVGPDNCIQCAHYIDGPHCVKTCPAGVMGENNTLVWKYADAGHVCHLCHPNCTYGCTGPGLRGCPTNGPKIPS",
            "ligands": ["COC1=CC2=C(C=C1)N(C3CCN(CC3)C)C4=NC(=NC(=C4)NC5=CN=C(C=C5)N)Cl"],
            "addLigands": True,
            "predictAffinity": True,
            "numSamples": 1,
        },
    },
    {
        "artifact_id": "egfr-c797s-blu945",
        "job_name": "egfr-c797s-blu945-demo",
        "tool": "boltz",
        "settings": {
            "inputFormat": "sequence",
            "sequence": "LVWKSPPEQNLQEILHGAVRFSNNPALSNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCVGPDNCIQCAHYIDGPHCVKTCPAGVMGENNTLVWKYADAGHVCHLCHPNCTYGCTGPGLRGCPTNGPKIPS",
            "ligands": ["CC1=CC(=CC=C1NC2=NC(=NC=N2)N3CCN(CC3)C)C4CCN(CC4)C(=O)C"],
            "addLigands": True,
            "predictAffinity": True,
            "numSamples": 1,
        },
    },
]


def get_case_definition(case_id: str) -> CaseDefinition:
    if case_id != BASE_CASE["id"]:
        raise KeyError(case_id)
    return CaseDefinition(**BASE_CASE)


def list_case_definitions() -> list[CaseDefinition]:
    return [CaseDefinition(**BASE_CASE)]


def get_branch(branch_id: str) -> dict[str, Any]:
    if branch_id not in CASE_BRANCHES:
        raise KeyError(branch_id)
    return deepcopy(CASE_BRANCHES[branch_id])


def list_branches() -> list[BranchSummary]:
    return [BranchSummary(**branch) for branch in BASE_CASE["branches"]]


def get_artifact_manifest() -> dict[str, dict[str, Any]]:
    return deepcopy(ARTIFACTS)


def get_tamarind_checkpoints() -> list[dict[str, Any]]:
    return deepcopy(TAMARIND_CHECKPOINTS)
