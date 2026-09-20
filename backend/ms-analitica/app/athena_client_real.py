"""Fase B: cliente real de Athena, misma firma que athena_client_mock.

Usa el rol IAM de la instancia (LabInstanceProfile) o las credenciales de sesion
del entorno via boto3 - nunca credenciales hardcodeadas aqui.
"""
import os
import time

import boto3

ATHENA_DATABASE = os.getenv("ATHENA_DATABASE", "cloudcommerce_datalake")
ATHENA_OUTPUT_S3 = os.getenv("ATHENA_OUTPUT_S3")
ATHENA_WORKGROUP = os.getenv("ATHENA_WORKGROUP", "primary")
POLL_INTERVAL_SECONDS = float(os.getenv("ATHENA_POLL_INTERVAL_SECONDS", "1"))
MAX_POLL_ATTEMPTS = int(os.getenv("ATHENA_MAX_POLL_ATTEMPTS", "60"))

_client = None


def _athena():
    global _client
    if _client is None:
        _client = boto3.client("athena")
    return _client


def run_query(sql: str) -> list[dict]:
    if not ATHENA_OUTPUT_S3:
        raise RuntimeError("Falta la variable de entorno ATHENA_OUTPUT_S3")

    athena = _athena()
    response = athena.start_query_execution(
        QueryString=sql,
        QueryExecutionContext={"Database": ATHENA_DATABASE},
        ResultConfiguration={"OutputLocation": ATHENA_OUTPUT_S3},
        WorkGroup=ATHENA_WORKGROUP,
    )
    query_execution_id = response["QueryExecutionId"]
    _esperar_finalizacion(athena, query_execution_id)
    return _parsear_resultados(athena, query_execution_id)


def _esperar_finalizacion(athena, query_execution_id: str) -> None:
    for _ in range(MAX_POLL_ATTEMPTS):
        execution = athena.get_query_execution(QueryExecutionId=query_execution_id)
        state = execution["QueryExecution"]["Status"]["State"]
        if state == "SUCCEEDED":
            return
        if state in ("FAILED", "CANCELLED"):
            reason = execution["QueryExecution"]["Status"].get(
                "StateChangeReason", "sin detalle"
            )
            raise RuntimeError(f"Query de Athena {state.lower()}: {reason}")
        time.sleep(POLL_INTERVAL_SECONDS)
    raise TimeoutError(f"Query de Athena no termino tras {MAX_POLL_ATTEMPTS} intentos")


def _parsear_resultados(athena, query_execution_id: str) -> list[dict]:
    filas: list[dict] = []
    columnas = None
    paginator = athena.get_paginator("get_query_results")
    for pagina in paginator.paginate(QueryExecutionId=query_execution_id):
        rows = pagina["ResultSet"]["Rows"]
        if columnas is None:
            columnas = [c.get("VarCharValue") for c in rows[0]["Data"]]
            rows = rows[1:]
        for row in rows:
            valores = [c.get("VarCharValue") for c in row["Data"]]
            filas.append(dict(zip(columnas, valores)))
    return filas
