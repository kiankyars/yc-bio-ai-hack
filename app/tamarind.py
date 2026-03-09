from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx


class TamarindError(RuntimeError):
    """Raised when Tamarind returns an unexpected response."""


@dataclass(slots=True)
class TamarindClient:
    api_key: str
    base_url: str = "https://app.tamarind.bio/api/"
    timeout: float = 60.0

    @property
    def headers(self) -> dict[str, str]:
        return {"x-api-key": self.api_key}

    def _url(self, path: str) -> str:
        return f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"

    def list_tools(self) -> list[dict[str, Any]]:
        response = httpx.get(self._url("tools"), headers=self.headers, timeout=self.timeout)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, list):
            raise TamarindError(f"Unexpected /tools response: {type(payload).__name__}")
        return payload

    def submit_job(self, job_name: str, tool: str, settings: dict[str, Any]) -> dict[str, Any]:
        payload = {"jobName": job_name, "type": tool, "settings": settings}
        response = httpx.post(
            self._url("submit-job"),
            headers=self.headers,
            json=payload,
            timeout=self.timeout,
        )
        if response.is_error:
            raise TamarindError(
                f"Tamarind submit-job failed with {response.status_code}: {response.text}"
            )
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            data = response.json()
            if not isinstance(data, dict):
                raise TamarindError(
                    f"Unexpected /submit-job response: {type(data).__name__}"
                )
            return data
        return {"message": response.text}

    def list_jobs(self) -> dict[str, Any]:
        response = httpx.get(self._url("jobs"), headers=self.headers, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, (dict, list)):
            raise TamarindError(f"Unexpected /jobs response: {type(data).__name__}")
        return {"jobs": data} if isinstance(data, list) else data

    def download_result(self, job_name: str) -> bytes:
        response = httpx.post(
            self._url("result"),
            headers=self.headers,
            json={"jobName": job_name},
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.content

    def write_result(self, job_name: str, output_path: str) -> None:
        content = self.download_result(job_name)
        with open(output_path, "wb") as handle:
            handle.write(content)

    def dump_tools(self) -> str:
        return json.dumps(self.list_tools(), indent=2)
