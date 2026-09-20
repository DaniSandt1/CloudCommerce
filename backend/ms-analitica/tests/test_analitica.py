import os
import unittest
from datetime import date, datetime
from unittest.mock import patch

from fastapi.testclient import TestClient

from app import athena_client, queries
from app.athena_client_mock import PEDIDOS
from app.main import app


class AnaliticaApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_y_openapi(self):
        self.assertEqual(self.client.get("/health").json()["status"], "ok")
        paths = self.client.get("/openapi.json").json()["paths"]
        for path in (
            "/health",
            "/analitica/ventas-por-categoria",
            "/analitica/top-clientes",
            "/analitica/pedidos-por-rango",
        ):
            self.assertIn(path, paths)

    def test_ventas_coinciden_con_los_pedidos_mock(self):
        response = self.client.get("/analitica/ventas-por-categoria")
        self.assertEqual(response.status_code, 200)
        rows = response.json()
        self.assertEqual(len(rows), 3)
        self.assertEqual(sum(row["total_vendido"] for row in rows),
                         sum(pedido["total"] for pedido in PEDIDOS))

    def test_top_respeta_limit_y_valida_rango(self):
        response = self.client.get("/analitica/top-clientes?limit=5")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 5)
        self.assertEqual(response.json()[0]["id_usuario"], 101)
        self.assertEqual(self.client.get("/analitica/top-clientes?limit=0").status_code, 422)
        self.assertEqual(self.client.get("/analitica/top-clientes?limit=101").status_code, 422)

    def test_rango_inclusivo_vacio_y_fechas_invalidas(self):
        url = "/analitica/pedidos-por-rango"
        response = self.client.get(url, params={"fecha_inicio": "2026-01-01", "fecha_fin": "2026-12-31"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"cantidad_pedidos": 6, "monto_total": 1640.0})

        empty = self.client.get(url, params={"fecha_inicio": "2024-01-01", "fecha_fin": "2024-12-31"})
        self.assertEqual(empty.json(), {"cantidad_pedidos": 0, "monto_total": 0.0})

        for start, end in (
            ("2026-12-31", "2026-01-01"),
            ("2026-01-01T00:00:00", "2026-12-31"),
            ("2026-02-30", "2026-12-31"),
        ):
            with self.subTest(start=start, end=end):
                self.assertEqual(self.client.get(url, params={"fecha_inicio": start,
                                                              "fecha_fin": end}).status_code, 422)

    def test_error_del_cliente_no_expone_detalles(self):
        with patch.object(athena_client, "run_query", side_effect=RuntimeError("secret-provider-detail")):
            response = self.client.get("/analitica/ventas-por-categoria")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("secret-provider-detail", response.text)


class QueryContractTests(unittest.TestCase):
    def test_sql_usa_columnas_exportadas_y_ultimo_snapshot(self):
        ventas = queries.ventas_por_categoria()
        self.assertIn("UNNEST(p.items)", ventas)
        self.assertIn("categoria_nombre", ventas)
        self.assertIn('MAX("$path") FROM pedidos', ventas)
        self.assertIn("PARTITION BY id", ventas)

        top = queries.top_clientes(5)
        self.assertIn("usuarios_con_prioridad", top)
        self.assertIn("GROUP BY id", top)
        self.assertTrue(top.endswith("LIMIT 5"))

    def test_parametros_sql_acotados(self):
        with self.assertRaises(ValueError):
            queries.top_clientes(0)
        with self.assertRaises(TypeError):
            queries.pedidos_por_rango(datetime(2026, 1, 1), date(2026, 12, 31))
        sql = queries.pedidos_por_rango(date(2026, 1, 1), date(2026, 12, 31))
        self.assertIn("DATE '2026-01-01' AND DATE '2026-12-31'", sql)

    def test_mock_es_predeterminado_y_real_espera_fase_b(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(len(athena_client.run_query(queries.top_clientes(5))), 5)
        with patch.dict(os.environ, {"ATHENA_MODE": "real"}):
            with self.assertRaisesRegex(RuntimeError, "Fase B"):
                athena_client.run_query(queries.top_clientes(5))


if __name__ == "__main__":
    unittest.main()
