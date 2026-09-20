"""Select the Athena query implementation without coupling API routes to it."""

import importlib
import os

def run_query(sql: str) -> list[dict]:
    mode = os.getenv("ATHENA_MODE", "mock").strip().lower()
    if mode == "mock":
        from . import athena_client_mock

        return athena_client_mock.run_query(sql)
    if mode == "real":
        try:
            real_client = importlib.import_module(".athena_client_real", __package__)
        except ModuleNotFoundError as exc:
            if exc.name != f"{__package__}.athena_client_real":
                raise
            raise RuntimeError("ATHENA_MODE=real requiere la Fase B") from exc
        return real_client.run_query(sql)
    raise RuntimeError(f"ATHENA_MODE no soportado: {mode!r}")
