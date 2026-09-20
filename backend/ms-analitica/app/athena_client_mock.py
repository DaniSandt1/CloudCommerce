"""Deterministic Athena-shaped rows derived from the current export schemas."""

import re
from collections import defaultdict
from datetime import date
from decimal import Decimal


PRODUCTOS = {
    1: {"id": 1, "categoria_id": 10, "categoria_nombre": "Tecnologia"},
    2: {"id": 2, "categoria_id": 20, "categoria_nombre": "Hogar"},
    3: {"id": 3, "categoria_id": 30, "categoria_nombre": "Libros"},
    4: {"id": 4, "categoria_id": 10, "categoria_nombre": "Tecnologia"},
}

USUARIOS = {
    101: {"id": 101, "nombre": "Ana Torres", "email": "ana@example.com"},
    102: {"id": 102, "nombre": "Bruno Diaz", "email": "bruno@example.com"},
    103: {"id": 103, "nombre": "Carla Rios", "email": "carla@example.com"},
    104: {"id": 104, "nombre": "Diego Paz", "email": "diego@example.com"},
    105: {"id": 105, "nombre": "Elena Ruiz", "email": "elena@example.com"},
    106: {"id": 106, "nombre": "Fabio Vega", "email": "fabio@example.com"},
}

PEDIDOS = [
    {"_id": "mock-1", "id_usuario": 101, "fecha": "2026-01-15T10:00:00+00:00",
     "items": [{"id_producto": 1, "cantidad": 2, "precio_unitario": 250.0},
               {"id_producto": 3, "cantidad": 1, "precio_unitario": 30.0}],
     "total": 530.0, "estado": "pagado"},
    {"_id": "mock-2", "id_usuario": 102, "fecha": "2026-02-10T10:00:00+00:00",
     "items": [{"id_producto": 2, "cantidad": 3, "precio_unitario": 80.0}],
     "total": 240.0, "estado": "pagado"},
    {"_id": "mock-3", "id_usuario": 103, "fecha": "2026-03-08T10:00:00+00:00",
     "items": [{"id_producto": 4, "cantidad": 1, "precio_unitario": 120.0},
               {"id_producto": 3, "cantidad": 2, "precio_unitario": 30.0}],
     "total": 180.0, "estado": "enviado"},
    {"_id": "mock-4", "id_usuario": 104, "fecha": "2026-05-18T10:00:00+00:00",
     "items": [{"id_producto": 1, "cantidad": 1, "precio_unitario": 250.0}],
     "total": 250.0, "estado": "pagado"},
    {"_id": "mock-5", "id_usuario": 105, "fecha": "2026-10-01T10:00:00+00:00",
     "items": [{"id_producto": 2, "cantidad": 1, "precio_unitario": 80.0},
               {"id_producto": 4, "cantidad": 2, "precio_unitario": 120.0}],
     "total": 320.0, "estado": "pagado"},
    {"_id": "mock-6", "id_usuario": 106, "fecha": "2026-11-22T10:00:00+00:00",
     "items": [{"id_producto": 3, "cantidad": 4, "precio_unitario": 30.0}],
     "total": 120.0, "estado": "pendiente"},
    {"_id": "mock-7", "id_usuario": 101, "fecha": "2025-12-20T10:00:00+00:00",
     "items": [{"id_producto": 2, "cantidad": 1, "precio_unitario": 80.0}],
     "total": 80.0, "estado": "enviado"},
]


def _money(value: Decimal) -> float:
    return float(round(value, 2))


def run_query(sql: str) -> list[dict]:
    first_line = sql.splitlines()[0] if sql else ""
    if first_line == "-- analytics:ventas_por_categoria":
        totals = defaultdict(Decimal)
        for pedido in PEDIDOS:
            for item in pedido["items"]:
                categoria = PRODUCTOS[item["id_producto"]]["categoria_nombre"]
                totals[categoria] += Decimal(item["cantidad"]) * Decimal(
                    str(item["precio_unitario"])
                )
        rows = [
            {"categoria": categoria, "total_vendido": _money(total)}
            for categoria, total in totals.items()
        ]
        return sorted(rows, key=lambda row: (-row["total_vendido"], row["categoria"]))

    if first_line == "-- analytics:top_clientes":
        match = re.search(r"\bLIMIT (\d+)\s*$", sql)
        if not match:
            raise ValueError("La consulta top_clientes requiere LIMIT")
        limit = int(match.group(1))
        totals = defaultdict(Decimal)
        for pedido in PEDIDOS:
            totals[pedido["id_usuario"]] += Decimal(str(pedido["total"]))
        rows = [
            {"id_usuario": user_id, "nombre": USUARIOS[user_id]["nombre"],
             "email": USUARIOS[user_id]["email"], "total_comprado": _money(total)}
            for user_id, total in totals.items()
        ]
        return sorted(rows, key=lambda row: (-row["total_comprado"], row["id_usuario"]))[:limit]

    if first_line == "-- analytics:pedidos_por_rango":
        match = re.search(r"BETWEEN DATE '(\d{4}-\d{2}-\d{2})' AND DATE '(\d{4}-\d{2}-\d{2})'", sql)
        if not match:
            raise ValueError("La consulta pedidos_por_rango requiere fechas")
        fecha_inicio, fecha_fin = (date.fromisoformat(value) for value in match.groups())
        pedidos = [
            pedido for pedido in PEDIDOS
            if fecha_inicio <= date.fromisoformat(pedido["fecha"][:10]) <= fecha_fin
        ]
        total = sum((Decimal(str(pedido["total"])) for pedido in pedidos), Decimal(0))
        return [{"cantidad_pedidos": len(pedidos), "monto_total": _money(total)}]

    raise ValueError("Consulta analitica no reconocida por el cliente mock")
