# EGFR Resistance Simulator

FastAPI demo for the `AI Drug Discovery` track. The app simulates resistance to `osimertinib` in EGFR-mutant NSCLC and recommends branch-specific rescue strategies, with cached structural checkpoints designed to be hydrated from Tamarind.

## Submission Copy

### What problem are you solving?

Drug programs do not usually fail because no one can name a target. They fail because tumors adapt. A therapy works, resistance emerges, and teams lose months or years figuring out why. We built a system that predicts how an EGFR-mutant lung cancer treated with osimertinib is likely to escape, shows the mechanism of failure step by step, and recommends the smallest credible patch. Instead of only proposing a drug, we model the failure trajectory first. That makes the output more useful for real biotech decision-making, where avoiding dead-end programs is as valuable as finding a hit.

### What did you build?

We built a resistance simulator for EGFR-mutant NSCLC with a live demo loop: initial response, resistance event, and patched therapy. The backend is a FastAPI app with a curated resistance engine covering `C797S` and `MET amplification`, a run API, and artifact endpoints for evidence cards. The frontend presents the project like a boss fight, so judges can watch the tumor adapt and the therapy respond turn by turn. We also integrated Tamarind to submit real structural checkpoints for the wild-type EGFR plus osimertinib complex, the resistant mutant with osimertinib, and the resistant mutant with a rescue inhibitor.

## Run

```bash
uv sync --dev
cp .env.example .env
uv run uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`.

## API

- `GET /cases`
- `POST /runs`
- `POST /runs/{run_id}/advance`
- `GET /runs/{run_id}`
- `GET /artifacts/{artifact_id}`

## Tamarind

The frontend works with seeded local evidence. To wire in real Tamarind assets, set `TAMARIND_API_KEY` and run:

```bash
uv run python scripts/precompute_tamarind.py --submit
```
