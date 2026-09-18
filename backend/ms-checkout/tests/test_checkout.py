import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.checkout import construir_resumen
from app.main import app
from app.schemas import CheckoutInput


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["service"], "ms-checkout")
        self.assertEqual(response.json()["database"], "none")

    def test_swagger_documenta_los_endpoints(self):
        paths = self.client.get("/openapi.json").json()["paths"]
        self.assertIn("/checkout/resumen", paths)
        self.assertIn("/checkout/confirmar", paths)
        self.assertIn("/checkout/pedidos/{id_pedido}", paths)


class CheckoutTests(unittest.IsolatedAsyncioTestCase):
    def test_rechaza_items_vacios(self):
        with self.assertRaises(ValidationError):
            CheckoutInput(id_usuario=1, items=[])

    def test_rechaza_productos_repetidos(self):
        with self.assertRaises(ValidationError):
            CheckoutInput(
                id_usuario=1,
                items=[
                    {"id_producto": 2, "cantidad": 1},
                    {"id_producto": 2, "cantidad": 3},
                ],
            )

    @patch("app.checkout.services.obtener_producto", new_callable=AsyncMock)
    @patch("app.checkout.services.obtener_usuario", new_callable=AsyncMock)
    async def test_calcula_resumen(self, obtener_usuario, obtener_producto):
        obtener_usuario.return_value = {
            "id": 1,
            "nombre": "Ana",
            "email": "ana@example.com",
        }
        obtener_producto.return_value = {
            "id": 2,
            "nombre": "Teclado",
            "precio": 50.5,
            "stock": 10,
        }
        entrada = CheckoutInput(
            id_usuario=1, items=[{"id_producto": 2, "cantidad": 2}]
        )

        resumen = await construir_resumen(entrada)

        self.assertEqual(resumen.total, 101.0)
        self.assertEqual(resumen.items[0].nombre, "Teclado")

    @patch("app.checkout.services.obtener_producto", new_callable=AsyncMock)
    @patch("app.checkout.services.obtener_usuario", new_callable=AsyncMock)
    async def test_rechaza_stock_insuficiente(
        self, obtener_usuario, obtener_producto
    ):
        obtener_usuario.return_value = {
            "id": 1,
            "nombre": "Ana",
            "email": "ana@example.com",
        }
        obtener_producto.return_value = {
            "id": 2,
            "nombre": "Teclado",
            "precio": 50.5,
            "stock": 1,
        }
        entrada = CheckoutInput(
            id_usuario=1, items=[{"id_producto": 2, "cantidad": 2}]
        )

        with self.assertRaises(HTTPException) as error:
            await construir_resumen(entrada)
        self.assertEqual(error.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
