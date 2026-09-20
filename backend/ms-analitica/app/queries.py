"""Athena SQL for the current S3 export shape.

Glue table names, column types and JSON SerDe still need confirmation in Phase B.
In particular, the current pedidos exporter writes one outer JSON array per
file. Phase B must expose its elements as one Glue row per pedido (or adjust
these queries) before Athena can execute them. Orders use the latest complete
snapshot; product and user dimensions use the latest known row for each ID.
An empty latest pedidos snapshot has no row from which to discover its S3 path;
Phase B must expose snapshot metadata or a normalized table to handle that case.
"""

from datetime import date


_PEDIDOS = """pedidos_actuales AS (
    SELECT _id, id_usuario, fecha, items, total
    FROM pedidos
    WHERE \"$path\" = (SELECT MAX(\"$path\") FROM pedidos)
)"""


def ventas_por_categoria() -> str:
    return f"""-- analytics:ventas_por_categoria
WITH {_PEDIDOS},
productos_con_prioridad AS (
    SELECT id, categoria_nombre,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY \"$path\" DESC) AS rn
    FROM productos
),
productos_referencia AS (
    SELECT id, categoria_nombre
    FROM productos_con_prioridad
    WHERE rn = 1
)
SELECT pr.categoria_nombre AS categoria,
       ROUND(SUM(CAST(item.cantidad AS DOUBLE) *
                 CAST(item.precio_unitario AS DOUBLE)), 2) AS total_vendido
FROM pedidos_actuales p
CROSS JOIN UNNEST(p.items) AS t(item)
JOIN productos_referencia pr ON CAST(pr.id AS BIGINT) = CAST(item.id_producto AS BIGINT)
GROUP BY pr.categoria_nombre
ORDER BY total_vendido DESC, categoria ASC"""


def top_clientes(limit: int) -> str:
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 100:
        raise ValueError("limit debe estar entre 1 y 100")
    return f"""-- analytics:top_clientes
WITH {_PEDIDOS},
usuarios_con_prioridad AS (
    SELECT id, nombre, email,
           DENSE_RANK() OVER (PARTITION BY id ORDER BY \"$path\" DESC) AS rn
    FROM usuarios
),
usuarios_unicos AS (
    SELECT id, MAX(nombre) AS nombre, MAX(email) AS email
    FROM usuarios_con_prioridad
    WHERE rn = 1
    GROUP BY id
)
SELECT CAST(u.id AS BIGINT) AS id_usuario,
       u.nombre, u.email,
       ROUND(SUM(CAST(p.total AS DOUBLE)), 2) AS total_comprado
FROM pedidos_actuales p
JOIN usuarios_unicos u ON CAST(u.id AS BIGINT) = CAST(p.id_usuario AS BIGINT)
GROUP BY u.id, u.nombre, u.email
ORDER BY total_comprado DESC, id_usuario ASC
LIMIT {limit}"""


def pedidos_por_rango(fecha_inicio: date, fecha_fin: date) -> str:
    if type(fecha_inicio) is not date or type(fecha_fin) is not date:
        raise TypeError("Las fechas deben ser objetos date")
    if fecha_inicio > fecha_fin:
        raise ValueError("fecha_inicio debe ser anterior o igual a fecha_fin")
    return f"""-- analytics:pedidos_por_rango
WITH {_PEDIDOS}
SELECT COUNT(*) AS cantidad_pedidos,
       COALESCE(ROUND(SUM(CAST(p.total AS DOUBLE)), 2), 0.0) AS monto_total
FROM pedidos_actuales p
WHERE CAST(from_iso8601_timestamp(CAST(p.fecha AS VARCHAR)) AS DATE)
      BETWEEN DATE '{fecha_inicio.isoformat()}' AND DATE '{fecha_fin.isoformat()}'"""
