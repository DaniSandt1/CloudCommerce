# ms-pedidos

API REST de órdenes de compra del e-commerce.

- **Lenguaje:** Node.js (Express)
- **Base de datos:** MongoDB (propia, NoSQL)
- **Colección:** `pedidos` (documento con items embebidos, referencia a `id_usuario` y `id_producto`)
- **Datos de prueba:** mínimo 20,000 documentos ficticios en `pedidos`
- **Consume otro microservicio:** este microservicio debe consumir `ms-productos` y/o `ms-usuarios` (requisito: al menos 1 microservicio con BD propia debe consumir otro)
- **Expone:** creación y consulta de pedidos por usuario

## Estructura sugerida (pendiente de implementar)

```
ms-pedidos/
├── src/
├── package.json
├── Dockerfile
└── (Swagger vía swagger-jsdoc / swagger-ui-express)
```

## Estructura JSON sugerida (documentar la definitiva luego)

```json
{
  "_id": "ObjectId",
  "id_usuario": 123,
  "fecha": "2026-09-10T10:00:00Z",
  "items": [
    { "id_producto": 45, "cantidad": 2, "precio_unitario": 19.90 }
  ],
  "total": 39.80,
  "estado": "pendiente"
}
```

## Pendiente

- [ ] Definir consumo a ms-productos y/o ms-usuarios
- [ ] Implementación de endpoints
- [ ] Dockerfile
- [ ] Script de carga masiva de datos ficticios
- [ ] Documentación Swagger-UI
- [ ] Repositorio público en GitHub (enlace aquí)
