# EGFR Resistance Simulator

FastAPI demo for the `AI Drug Discovery` track. The app simulates resistance to `osimertinib` in EGFR-mutant NSCLC and recommends branch-specific rescue strategies, with cached structural checkpoints designed to be hydrated from Tamarind.

## Submission Copy

### What problem are you solving?

Drug programs usually fail because tumors adapt. I built a system that predicts how an EGFR-mutant lung cancer treated with osimertinib is likely to escape, shows the mechanism of failure step by step, and recommends the smallest credible patch. Instead of only proposing a drug, we model the failure trajectory first, avoiding dead-end programs.

### What did you build?

I built a resistance simulator for EGFR-mutant NSCLC with a live demo loop: initial response, resistance event, and patched therapy. The backend is a FastAPI app with a resistance engine covering `C797S` and `MET amplification`, a run API, and artifact endpoints for evidence cards. I used Tamarind to submit real structural checkpoints for the wild-type EGFR plus osimertinib complex, the resistant mutant with osimertinib, and the resistant mutant with a rescue inhibitor.

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
