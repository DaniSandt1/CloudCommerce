# CloudCommerce — Proyecto Parcial CS2032 (Ciclo 2026-2)

E-commerce simple para cumplir con los requisitos del Proyecto Parcial (Semana 3 a Semana 6).

## Integrantes del grupo

- Daniel Guillermo Sandoval Toro
- Jose Ernesto Guerrero Cueva
- Ian Jesus Rodríguez Santayana
- Vannia Fatima Curay Mauricio
- Mia Wood De la Fuente Chavez

Repositorio: **https://github.com/DaniSandt1/CloudCommerce**

## Arquitectura general

Los 5 microservicios corren **redundados** en las 2 MV de producción (no repartidos) — cada VM tiene una copia completa de los 5, y el balanceador reparte/hace failover entre ambas. Las llamadas internas entre microservicios también pasan por el balanceador (no por IP fija), así el failover aplica de punta a punta.

```
Usuario → AWS Amplify (Frontend React) → API Gateway (https) → VPC Link → Balanceador de carga (privado, ALB)
                                                                                        │
                                        ┌───────────────────────────────┬──────────────┴──────────────┬───────────────────────────────┐
                                        │                                 │                               │
                              MV Producción 1                                                    MV Producción 2
                          (cloudcommerce-backend)                                            (cloudcommerce-prod2)
                    ms-productos · ms-usuarios · ms-pedidos ·                          ms-productos · ms-usuarios · ms-pedidos ·
                       ms-checkout · ms-analitica  (los 5)                                ms-checkout · ms-analitica  (los 5)
                                        │                                                                 │
                                        └──────────────────────────┬──────────────────────────────────────┘
                                                                    │  (IP privada)
                                                         3ra MV: bases de datos (privada)
                                                    MySQL · PostgreSQL · MongoDB (cloudcommerce-bd)
                                                                    │
                                                         Athena consulta el data lake en S3

Data Science: MV Ingesta (3 contenedores docker en Python, pull 100%) → Bucket S3 → AWS Glue (catálogo) → Athena
```

## Estructura de carpetas

- [backend/](backend/) — 5 microservicios en Docker (ver README de cada uno).
- [frontend/](frontend/) — Aplicación web (React) que consume los 5 microservicios, desplegada en AWS Amplify.
- [data-science/](data-science/) — MV de ingesta, contenedores de ingesta a S3, catálogo de datos Glue.
- [docs/](docs/) — Diagrama de arquitectura (draw.io), informe y presentación.
- [DEPLOYMENT.md](DEPLOYMENT.md) — cómo desplegar todo en AWS desde cero (EC2, Docker, S3), con troubleshooting.

## Mapeo a la rúbrica

| Ítem | Puntos | Carpeta |
|---|---|---|
| Backend: Microservicios | 7 | `backend/` |
| Frontend: Web | 3 | `frontend/` |
| Data Science | 5 | `data-science/` |
| Diagrama de Arquitectura | 1 | `docs/diagrama-arquitectura/` |
| Exposición presencial | 1 | `docs/presentacion/` |
| Exposición virtual con ACL | 3 | — |

## Diseño de microservicios (dominio: E-commerce)

| Microservicio | Lenguaje | Base de datos | Rol |
|---|---|---|---|
| [ms-productos](backend/ms-productos/) | Python (FastAPI) | MySQL | CRUD de catálogo de productos |
| [ms-usuarios](backend/ms-usuarios/) | Java (Spring Boot) | PostgreSQL | Registro/login de clientes |
| [ms-pedidos](backend/ms-pedidos/) | Node.js (Express) | MongoDB | Órdenes de compra |
| [ms-checkout](backend/ms-checkout/) | Python (FastAPI) | Sin BD | Orquesta productos + usuarios + pedidos |
| [ms-analitica](backend/ms-analitica/) | Python | Athena (sin BD transaccional) | Consultas analíticas sobre datos en S3 |

## Estado actual

**Avance (Hito 1): COMPLETO ✅.** **Arquitectura de producción final (Hito 2): DESPLEGADA Y VERIFICADA ✅** — los 5 microservicios que exige el enunciado están implementados y corriendo en AWS con la arquitectura final: 2 MV de producción + balanceador de carga privado + 3ra MV de bases de datos, todo detrás de API Gateway y con el frontend en Amplify.

- ✅ `ms-productos` (Python/FastAPI + MySQL) — 20,000 productos, CRUD completo, paginado/búsqueda
- ✅ `ms-usuarios` (Java/Spring Boot + PostgreSQL) — 20,000 usuarios, CRUD completo, paginado/búsqueda
- ✅ `ms-pedidos` (Node.js/Express + MongoDB) — 20,000 pedidos, consume `ms-productos`/`ms-usuarios`
- ✅ `ms-checkout` (Python/FastAPI, sin BD) — orquesta `ms-productos`+`ms-usuarios`+`ms-pedidos` para el flujo de compra
- ✅ `ms-analitica` (Python/FastAPI + boto3/Athena) — Fase A y Fase B completas, `ATHENA_MODE=real` desplegado en `cloudcommerce-prod2`, verificado contra los 20,000 pedidos reales
- ✅ `frontend` (React) — pestañas Productos, Usuarios, Pedidos y Analítica, desplegado en AWS Amplify
- ✅ `ingesta-productos`, `ingesta-usuarios` e `ingesta-pedidos` (Python → S3) — los 3 contenedores requeridos, corriendo en su propia **MV Ingesta**, bucket `cloudcommerce-datalake`
- ✅ **Arquitectura final con redundancia real**: los 5 microservicios corren completos en **ambas** MV de producción (no repartidos), apuntando a la misma 3ra MV privada de bases de datos; cada uno de los 5 Target Groups del balanceador tiene 2 targets sanos (uno por VM); las llamadas internas entre microservicios también pasan por el balanceador (no por IP fija). Failover probado en vivo: al apagar una copia de `ms-productos`, el sitio siguió funcionando desde la otra — ver [DEPLOYMENT.md, Partes E y F](DEPLOYMENT.md)
- ✅ AWS Glue (catálogo `cloudcommerce_datalake`, 3 tablas) + mínimo 4 consultas SQL con join + 2 vistas en Athena — evidencia en el informe
- ⏳ Diagrama de Arquitectura de Solución en draw.io (actualizar `ms-analitica` de pendiente a desplegado), informe y presentación finales — en curso

### Cómo correrlo (AWS + local)

Guía paso a paso completa (lanzar las 4 MV, Docker, seed de datos, balanceador, API Gateway, Amplify, troubleshooting): **[DEPLOYMENT.md](DEPLOYMENT.md)**.

Desarrollo local rápido (los 4 microservicios en un solo `docker-compose`, sin AWS):
```bash
cd backend/docker-compose
docker compose up -d --build
docker compose exec ms-productos python -m app.seed      # carga 20,000 productos ficticios
docker compose exec ms-pedidos node scripts/seedPedidos.js  # carga 20,000 pedidos ficticios
```
```bash
cd frontend
npm install && npm run dev
```

Ver también [backend/docker-compose/README.md](backend/docker-compose/README.md) y [frontend/README.md](frontend/README.md).

## Plazos

- Hito 1 (avance 50%, exposición virtual con ACL): Sáb 12-Set 23:59h
- Hito 2 (exposición presencial + demo + informe + ppt): Dom 20-Set 23:59h — Semana 7
