from datetime import date
import logging

from fastapi import FastAPI, HTTPException, Query

from . import athena_client, queries
from .schemas import PedidosPorRango, TopCliente, VentaPorCategoria


app = FastAPI(title="CloudCommerce - ms-analitica", version="1.0.0")
logger = logging.getLogger(__name__)


def _rows(sql: str) -> list[dict]:
    try:
        return athena_client.run_query(sql)
    except Exception as exc:
        logger.exception("Fallo al consultar datos analiticos")
        raise HTTPException(status_code=503, detail="Cliente de datos no disponible") from exc


def _date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="La fecha debe existir en el calendario") from exc


@app.get("/health", tags=["Estado"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ms-analitica"}


@app.get(
    "/analitica/ventas-por-categoria",
    response_model=list[VentaPorCategoria],
    tags=["Analitica"],
)
def ventas_por_categoria() -> list[dict]:
    """Monto vendido por categoria de producto."""
    return _rows(queries.ventas_por_categoria())


@app.get(
    "/analitica/top-clientes",
    response_model=list[TopCliente],
    tags=["Analitica"],
)
def top_clientes(limit: int = Query(10, ge=1, le=100)) -> list[dict]:
    """Clientes ordenados por monto total comprado."""
    return _rows(queries.top_clientes(limit))


@app.get(
    "/analitica/pedidos-por-rango",
    response_model=PedidosPorRango,
    tags=["Analitica"],
)
def pedidos_por_rango(
    fecha_inicio: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Fecha inicial inclusiva (YYYY-MM-DD)"),
    fecha_fin: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Fecha final inclusiva (YYYY-MM-DD)"),
) -> dict:
    """Cantidad y monto de pedidos en un rango de fechas inclusivo."""
    inicio, fin = _date(fecha_inicio), _date(fecha_fin)
    if inicio > fin:
        raise HTTPException(status_code=422, detail="fecha_inicio debe ser anterior o igual a fecha_fin")
    rows = _rows(queries.pedidos_por_rango(inicio, fin))
    if not rows:
        raise HTTPException(status_code=502, detail="La consulta no devolvio un resumen")
    return rows[0]
