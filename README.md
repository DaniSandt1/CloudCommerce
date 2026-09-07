# CloudCommerce — Proyecto Parcial CS2032 (Ciclo 2026-2)

E-commerce simple para cumplir con los requisitos del Proyecto Parcial (Semana 3 a Semana 6).

## Integrantes del grupo

- (completar)

## Arquitectura general

```
Usuario → AWS Amplify (Frontend React) → API Gateway (https) → Balanceador de carga (privado)
                                                                        │
                        ┌───────────────┬───────────────┬──────────────┼───────────────┐
                        │               │               │              │               │
                  ms-productos    ms-usuarios      ms-pedidos     ms-checkout     ms-analitica
                   (Python)         (Java)          (Node.js)    (sin BD, consume  (Python, Athena)
                        │               │               │         a los otros 3)        │
                     MySQL         PostgreSQL        MongoDB                        Athena/Glue
                        │               │               │
                        └───────┬───────┴───────┬───────┘
                                │               │
                     (3ra MV: bases de datos, privadas)

Data Science: MV Ingesta (3 contenedores docker en Python, pull 100%) → Bucket S3 → AWS Glue (catálogo) → Athena
```

## Estructura de carpetas

- [backend/](backend/) — 5 microservicios en Docker (ver README de cada uno).
- [frontend/](frontend/) — Aplicación web (React) que consume los 5 microservicios, desplegada en AWS Amplify.
- [data-science/](data-science/) — MV de ingesta, contenedores de ingesta a S3, catálogo de datos Glue.
- [docs/](docs/) — Diagrama de arquitectura (draw.io), informe y presentación.

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
| [ms-checkout](backend/ms-checkout/) | (por definir) | Sin BD | Orquesta productos + usuarios + pedidos |
| [ms-analitica](backend/ms-analitica/) | Python | Athena (sin BD transaccional) | Consultas analíticas sobre datos en S3 |

## Estado actual

**Alcance de la primera entrega (indicación del asesor Santiago):** 2 microservicios funcionando (`ms-productos` y `ms-usuarios`) + frontend que los consuma + datos subidos a S3.

- ✅ `ms-productos` (Python/FastAPI + MySQL) — implementado
- ✅ `ms-usuarios` (Java/Spring Boot + PostgreSQL) — implementado
- ✅ `frontend` (React) consumiendo ambos — implementado
- ✅ `ingesta-productos` e `ingesta-usuarios` (Python → S3) — implementado, falta bucket S3 real en AWS
- ⏳ `ms-pedidos`, `ms-checkout`, `ms-analitica` — pendientes para la entrega final (Hito 2)

### Cómo levantar todo localmente

```bash
cd backend/docker-compose
docker compose up -d --build
docker compose exec ms-productos python -m app.seed   # carga 20,000 productos ficticios

cd ../../frontend
npm install && npm run dev
```

Ver detalles en [backend/docker-compose/README.md](backend/docker-compose/README.md) y [frontend/README.md](frontend/README.md).

## Plazos

- Hito 1 (avance 50%, exposición virtual con ACL): Sáb 12-Set 23:59h
- Hito 2 (exposición presencial + demo + informe + ppt): Dom 20-Set 23:59h — Semana 7
