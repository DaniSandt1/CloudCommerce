# Backend — Microservicios

Los 4 microservicios que exige el enunciado con base de datos/consumo (falta solo `ms-analitica`) ya están implementados y desplegados en la arquitectura final de producción.

| Microservicio | Lenguaje | Base de datos | Estado |
|---|---|---|---|
| [ms-productos](ms-productos/) | Python (FastAPI) | MySQL | ✅ Implementado, desplegado |
| [ms-usuarios](ms-usuarios/) | Java (Spring Boot) | PostgreSQL | ✅ Implementado, desplegado |
| [ms-pedidos](ms-pedidos/) | Node.js (Express) | MongoDB | ✅ Implementado, desplegado |
| [ms-checkout](ms-checkout/) | Python (FastAPI) | Sin BD (orquesta a los otros 3) | ✅ Implementado, desplegado |
| [ms-analitica](ms-analitica/) | Python | No (Athena) | ⏳ Fase A pendiente ([#4](https://github.com/DaniSandt1/CloudCommerce/issues/4)) |

## Cómo correr localmente

Ver [docker-compose/README.md](docker-compose/) — levanta los 4 microservicios implementados junto con sus bases de datos con un solo comando.

## Arquitectura de producción (AWS)

Desplegado según [DEPLOYMENT.md — Parte E](../DEPLOYMENT.md): 2 MV de producción (`ms-productos`+`ms-usuarios` en una, `ms-pedidos`+`ms-checkout` en la otra) detrás de un balanceador de carga privado (ALB interno + VPC Link), con las 3 bases de datos en una 3ra MV privada (no pública), y todo expuesto públicamente vía AWS API Gateway (https).

## Pendiente (para la entrega final)

- [x] Implementar ms-pedidos, ms-checkout
- [ ] Implementar ms-analitica Fase A ([#4](https://github.com/DaniSandt1/CloudCommerce/issues/4)) y Fase B
- [x] `ms-pedidos` consume a `ms-productos` y `ms-usuarios` (requisito: al menos 1 microservicio con BD propia debe consumir otro)
- [ ] Diagrama Entidad/Relación por cada BD SQL (MySQL, PostgreSQL)
- [x] Estructura JSON de la colección MongoDB (ver [ms-pedidos/README.md](ms-pedidos/))
- [x] `docker-compose` de despliegue en 2 MV de producción + balanceador privado
- [x] Documentación Swagger-UI — 4/5 APIs (falta `ms-analitica`)
- [x] Configuración de AWS API Gateway + balanceador de carga privado
- [x] Enlaces a repositorios públicos de GitHub (este mismo repo)
