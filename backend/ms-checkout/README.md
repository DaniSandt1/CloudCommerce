# ms-checkout

Microservicio **sin base de datos propia**. Orquesta la información de otros microservicios para armar el resumen de compra (equivalente al ejemplo "Api Rest Historias Clínicas" de la rúbrica).

- **Lenguaje:** por definir (Python o Node.js, a elección del equipo)
- **Base de datos:** ninguna
- **Consume:** `ms-productos` (datos/stock del producto), `ms-usuarios` (datos del cliente), `ms-pedidos` (registrar/consultar el pedido)
- **Expone:** endpoint que arma el resumen de checkout combinando las respuestas de los 3 microservicios

## Estructura sugerida (pendiente de implementar)

```
ms-checkout/
├── app/ (o src/)
├── Dockerfile
└── (Swagger)
```

## Pendiente

- [ ] Elegir lenguaje/framework
- [ ] Definir contrato de consumo a los 3 microservicios
- [ ] Implementación de endpoints
- [ ] Dockerfile
- [ ] Documentación Swagger-UI
- [ ] Repositorio público en GitHub (enlace aquí)
