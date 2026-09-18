# ms-checkout

Microservicio orquestador **sin base de datos propia**, implementado en **Python con FastAPI**. Corresponde al microservicio de la rúbrica que solo consume otros microservicios para armar el flujo de compra.

## Qué hace

- Consume `ms-usuarios` para validar y obtener al cliente.
- Consume `ms-productos` para obtener nombres, precios y stock.
- Consume `ms-pedidos` para registrar o consultar el pedido.
- Calcula el resumen y total de la compra sin guardar datos propios.
- Valida cantidades, productos repetidos y stock disponible.
- Expone documentación automática con Swagger UI.

## Estructura

```text
ms-checkout/
├── app/
│   ├── __init__.py
│   ├── checkout.py
│   ├── config.py
│   ├── main.py
│   ├── schemas.py
│   └── services.py
├── tests/
│   └── test_checkout.py
├── .dockerignore
├── Dockerfile
├── requirements.txt
└── README.md
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Confirma que el servicio está disponible |
| `POST` | `/checkout/resumen` | Valida usuario, productos y stock; calcula el total sin guardar |
| `POST` | `/checkout/confirmar` | Valida la compra y crea el pedido mediante `ms-pedidos` |
| `GET` | `/checkout/pedidos/{id_pedido}` | Consulta y enriquece un pedido con usuario y productos |
| `GET` | `/docs` | Swagger UI generado por FastAPI |
| `GET` | `/openapi.json` | Contrato OpenAPI |

Ejemplo para los endpoints POST:

```json
{
  "id_usuario": 123,
  "items": [
    { "id_producto": 45, "cantidad": 2 },
    { "id_producto": 46, "cantidad": 1 }
  ]
}
```

## Cómo ejecutarlo localmente

Primero deben estar levantados los otros tres microservicios en sus puertos actuales:

- `ms-productos`: `http://localhost:8001`
- `ms-usuarios`: `http://localhost:8002`
- `ms-pedidos`: `http://localhost:8003`

Luego:

```bash
cd backend/ms-checkout
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8004
```

Abrir Swagger en `http://localhost:8004/docs`.

## Pruebas

Con el entorno virtual activado:

```bash
python -m unittest discover -s tests -v
```

Las pruebas no necesitan las otras APIs porque simulan sus respuestas.

## Variables de entorno

| Variable | Valor local predeterminado |
|---|---|
| `PRODUCTOS_URL` | `http://localhost:8001` |
| `USUARIOS_URL` | `http://localhost:8002` |
| `PEDIDOS_URL` | `http://localhost:8003` |
| `REQUEST_TIMEOUT_SECONDS` | `5` |

## Qué falta hacer para integrarlo con el proyecto

No se modificó el `docker-compose` general. Cuando el equipo realice la integración, debe añadir un servicio equivalente a:

```yaml
ms-checkout:
  build: ../ms-checkout
  restart: unless-stopped
  environment:
    PRODUCTOS_URL: http://ms-productos:8000
    USUARIOS_URL: http://ms-usuarios:8000
    PEDIDOS_URL: http://ms-pedidos:8000
    REQUEST_TIMEOUT_SECONDS: "5"
  ports:
    - "8004:8000"
  depends_on:
    - ms-productos
    - ms-usuarios
    - ms-pedidos
```

También queda pendiente como trabajo de integración del equipo:

- Consumir al menos dos endpoints de `ms-checkout` desde el frontend.
- Exponer el servicio mediante el balanceador privado y AWS API Gateway con HTTPS.
- Añadir el servicio a las dos máquinas virtuales de producción.
- Actualizar la documentación general cuando el equipo decida hacerlo.
- Incluir el enlace final del repositorio público de GitHub.

## Estado respecto de la rúbrica

- [x] Implementado en Python con FastAPI.
- [x] No posee base de datos.
- [x] Consume `ms-productos`, `ms-usuarios` y `ms-pedidos`.
- [x] Tiene más de dos métodos REST para que el frontend pueda consumirlos.
- [x] Incluye Dockerfile.
- [x] Incluye Swagger UI y contrato OpenAPI.
- [x] Incluye pruebas unitarias del flujo principal.
- [ ] Integración en el `docker-compose` general (a cargo del equipo).
- [ ] Despliegue en AWS (a cargo del equipo).
