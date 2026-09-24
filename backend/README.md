# Backend — Microservicios

Los 5 microservicios que exige el enunciado están implementados y desplegados en la arquitectura final de producción. Repositorio: **https://github.com/DaniSandt1/CloudCommerce**

| Microservicio | Lenguaje | Base de datos | Estado |
|---|---|---|---|
| [ms-productos](ms-productos/) | Python (FastAPI) | MySQL | ✅ Implementado, desplegado |
| [ms-usuarios](ms-usuarios/) | Java (Spring Boot) | PostgreSQL | ✅ Implementado, desplegado |
| [ms-pedidos](ms-pedidos/) | Node.js (Express) | MongoDB | ✅ Implementado, desplegado |
| [ms-checkout](ms-checkout/) | Python (FastAPI) | Sin BD (orquesta a los otros 3) | ✅ Implementado, desplegado |
| [ms-analitica](ms-analitica/) | Python (FastAPI + boto3) | No (Athena) | ✅ Fase A y Fase B, `ATHENA_MODE=real` desplegado y verificado |

## Cómo correr localmente

Ver [docker-compose/README.md](docker-compose/) — levanta los 5 microservicios implementados junto con sus bases de datos con un solo comando (`ms-analitica` corre en modo mock localmente, sin necesitar AWS).

## Arquitectura de producción (AWS)

Desplegado según [DEPLOYMENT.md — Partes E y F](../DEPLOYMENT.md): **los 5 microservicios corren completos en las 2 MV de producción** (redundancia real, no repartidos), detrás de un balanceador de carga privado (ALB interno + VPC Link) que reparte tráfico entre ambas copias y hace failover automático si una falla. Las 3 bases de datos viven en una 3ra MV privada (no pública), compartida por las 2 copias de cada microservicio. Las llamadas internas entre microservicios (`ms-pedidos`/`ms-checkout` → `ms-productos`/`ms-usuarios`/`ms-pedidos`) pasan por el DNS del balanceador, no por una IP fija, para que el failover también aplique al tráfico interno. Todo expuesto públicamente vía AWS API Gateway (https, 5 rutas). Failover verificado en vivo: apagando una copia de `ms-productos`, el sitio sigue funcionando desde la otra.

## Pendiente (para la entrega final)

- [x] Implementar ms-pedidos, ms-checkout
- [x] Implementar ms-analitica Fase A y Fase B — `ATHENA_MODE=real` desplegado y verificado
- [x] `ms-pedidos` consume a `ms-productos` y `ms-usuarios` (requisito: al menos 1 microservicio con BD propia debe consumir otro)
- [ ] Diagrama Entidad/Relación por cada BD SQL (MySQL, PostgreSQL) — en el informe, falta captura final
- [x] Estructura JSON de la colección MongoDB (ver [ms-pedidos/README.md](ms-pedidos/))
- [x] `docker-compose` de despliegue en 2 MV de producción + balanceador privado
- [x] Documentación Swagger-UI — 5/5 APIs
- [x] Configuración de AWS API Gateway + balanceador de carga privado
- [x] Enlaces a repositorios públicos de GitHub — https://github.com/DaniSandt1/CloudCommerce
