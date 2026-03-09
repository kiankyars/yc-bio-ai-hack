from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import Settings, get_settings
from .models import RunCreate
from .simulator import SimulationService
from .storage import Storage


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    storage = Storage(settings.db_path)
    service = SimulationService(storage=storage, artifact_dir=settings.artifact_dir)

    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.settings = settings
    app.state.storage = storage
    app.state.simulation = service

    static_dir = Path(__file__).resolve().parent.parent / "static"
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/cases")
    def list_cases() -> list[dict]:
        return service.list_cases()

    @app.post("/runs")
    def create_run(payload: RunCreate) -> dict:
        return service.create_run(payload).model_dump(mode="json")

    @app.get("/runs/{run_id}")
    def get_run(run_id: str) -> dict:
        return service.get_run_state(run_id).model_dump(mode="json")

    @app.post("/runs/{run_id}/advance")
    def advance_run(run_id: str) -> dict:
        return service.advance_run(run_id).model_dump(mode="json")

    @app.get("/artifacts/{artifact_id}")
    def get_artifact(artifact_id: str) -> dict:
        return service.get_artifact(artifact_id)

    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(static_dir / "index.html")

    return app


app = create_app()
