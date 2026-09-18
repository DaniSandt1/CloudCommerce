# ms-pedidos

API REST de órdenes de compra del e-commerce.

* **Lenguaje:** Node.js (Express)
* **Base de datos:** MongoDB (propia, NoSQL)
* **Colección:** `pedidos` (documento con items embebidos, referencia a `id_usuario` y `id_producto`)
* **Datos de prueba:** 20,000 documentos ficticios en `pedidos`
* **Consume otros microservicios:** `ms-productos` y `ms-usuarios`
* **Expone:** creación y consulta de pedidos por usuario
* **Documentación:** Swagger / OpenAPI

## Estructura del proyecto

```text
ms-pedidos/
├── src/
│   ├── app.js
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   └── Pedido.js
│   └── services/
│       ├── productoService.js
│       └── usuarioService.js
├── scripts/
│   ├── seedPedidos.js
│   ├── countPedidos.js
│   └── clearPedidos.js
├── package.json
├── package-lock.json
├── Dockerfile
└── README.md
```

## Estructura JSON

```json
{
  "_id": "ObjectId",
  "id_usuario": 123,
  "fecha": "2026-09-10T10:00:00Z",
  "items": [
    {
      "id_producto": 45,
      "cantidad": 2,
      "precio_unitario": 19.90
    }
  ],
  "total": 39.80,
  "estado": "pendiente"
}
```

## Endpoints

* `GET /health`
* `POST /pedidos`
* `GET /pedidos/{id}`
* `GET /usuarios/{id_usuario}/pedidos`

### Crear un pedido

`POST /pedidos`

Ejemplo:

```json
{
  "id_usuario": 11962,
  "items": [
    {
      "id_producto": 45,
      "cantidad": 2
    },
    {
      "id_producto": 46,
      "cantidad": 1
    }
  ]
}
```

Al crear un pedido:

1. Se valida que el usuario exista mediante `ms-usuarios`.
2. Se valida que los productos existan mediante `ms-productos`.
3. Se obtienen los precios de los productos.
4. Se calcula el total del pedido.
5. Se guarda el pedido en MongoDB.
6. El pedido se crea con estado `pendiente`.

### Consultar un pedido

`GET /pedidos/{id}`

Permite consultar un pedido específico mediante su ID.

### Consultar pedidos por usuario

`GET /usuarios/{id_usuario}/pedidos`

Permite consultar todos los pedidos asociados a un usuario.

## Comunicación con otros microservicios

`ms-pedidos` consume los siguientes microservicios:

* **ms-usuarios:** valida que el usuario asociado al pedido exista.
* **ms-productos:** valida que los productos existan y obtiene sus precios.

Cuando se ejecuta mediante Docker Compose, la comunicación interna se realiza mediante los nombres de los servicios:

```text
ms-usuarios:8000
ms-productos:8000
```

## Cómo correr con Docker Compose

El microservicio se ejecuta junto con MongoDB, `ms-productos` y `ms-usuarios` mediante Docker Compose.

Desde la carpeta:

```text
backend/docker-compose
```

ejecutar:

```bash
docker compose up -d --build
```

Verificar que los servicios estén funcionando:

```bash
docker compose ps
```

`ms-pedidos` queda disponible en:

```text
http://localhost:8003
```

## Carga masiva de datos ficticios

El proyecto incluye un script para generar los 20,000 pedidos ficticios requeridos.

Para ejecutar la carga masiva:

```bash
docker compose run --rm ms-pedidos node scripts/seedPedidos.js
```

El script:

* Obtiene los productos desde `ms-productos`.
* Genera 20,000 pedidos.
* Utiliza usuarios entre `1` y `20,000`.
* Utiliza productos existentes.
* Obtiene los precios reales desde `ms-productos`.
* Genera entre 1 y 4 productos por pedido.
* Genera cantidades entre 1 y 5 unidades.
* Calcula el total de cada pedido.
* Genera fechas de los últimos 180 días.
* Distribuye los pedidos entre los estados `pendiente`, `pagado`, `enviado` y `cancelado`.
* Inserta los pedidos en lotes de 1,000.

Al finalizar correctamente, se muestra:

```text
Insertados 20000/20000 pedidos
Seed completado correctamente
MongoDB desconectado
```

Para verificar la cantidad de pedidos almacenados:

```bash
docker compose exec ms-pedidos node scripts/countPedidos.js
```

Resultado esperado:

```text
Cantidad de pedidos: 20000
```

El script también muestra el pedido más reciente almacenado.

## Limpiar pedidos

Para eliminar todos los pedidos de la colección:

```bash
docker compose exec ms-pedidos node scripts/clearPedidos.js
```

**Advertencia:** este comando elimina todos los documentos de la colección `pedidos`.

Después de limpiar los datos, se pueden volver a generar los 20,000 pedidos ejecutando nuevamente el script de carga masiva:

```bash
docker compose run --rm ms-pedidos node scripts/seedPedidos.js
```

## Swagger / OpenAPI

La API cuenta con documentación interactiva mediante Swagger.

```text
http://localhost:8003/docs
```

Desde Swagger se pueden consultar y probar los endpoints de `ms-pedidos`.

## Estado de implementación

* [x] Definir consumo de `ms-productos`
* [x] Definir consumo de `ms-usuarios`
* [x] Implementación de endpoints
* [x] Modelo de datos en MongoDB
* [x] Dockerfile
* [x] Integración con Docker Compose
* [x] Script de carga masiva de datos ficticios
* [x] 20,000 pedidos generados
* [x] Script para contar pedidos
* [x] Script para limpiar pedidos
* [x] Documentación Swagger / OpenAPI
* [ ] Despliegue en MV de producción
* [ ] AWS API Gateway
* [ ] Repositorio público en GitHub (enlace aquí)
