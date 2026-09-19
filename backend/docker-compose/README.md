# docker-compose (entorno local / demo)

Levanta los 4 microservicios implementados junto con sus bases de datos:

- `mysql-productos` (MySQL) + `ms-productos` (FastAPI, puerto 8001)
- `postgres-usuarios` (PostgreSQL) + `ms-usuarios` (Spring Boot, puerto 8002)
- `mongo-pedidos` (MongoDB) + `ms-pedidos` (Express, puerto 8003) — consume a `ms-productos` y `ms-usuarios`
- `ms-checkout` (FastAPI, puerto 8004, sin BD propia) — orquesta a los otros 3

## Uso

```bash
cd backend/docker-compose
docker compose up -d --build
```

- ms-productos: http://localhost:8001 (docs interactivos en http://localhost:8001/docs)
- ms-usuarios: http://localhost:8002 (swagger en http://localhost:8002/swagger-ui.html)
- ms-pedidos: http://localhost:8003 (docs en http://localhost:8003/docs)
- ms-checkout: http://localhost:8004 (docs en http://localhost:8004/docs)

## Carga masiva de datos (mínimo 20,000 registros)

- **ms-usuarios** se auto-siembra al arrancar (usa `SEED_COUNT`, default 20000) gracias a `DataSeeder`.
- **ms-productos** y **ms-pedidos** requieren ejecutar el script una vez cada uno:

```bash
docker compose exec ms-productos python -m app.seed
docker compose exec ms-pedidos node scripts/seedPedidos.js
```

`ms-checkout` no tiene datos propios que sembrar (no tiene base de datos).

## Despliegue final en AWS

Ya implementado — ver [DEPLOYMENT.md — Parte E](../../DEPLOYMENT.md). En producción, este único `docker-compose.yml` de acá (pensado para desarrollo local) se reparte en:
- **MV Producción 1** (`cloudcommerce-backend`): `ms-productos` + `ms-usuarios`.
- **MV Producción 2** (`cloudcommerce-prod2`): `ms-pedidos` + `ms-checkout`.
- **MV BD** (`cloudcommerce-bd`, privada): las 3 bases de datos.
- Balanceador de carga privado (ALB interno) + VPC Link delante de las 2 MV de producción.
- AWS API Gateway (https) público, apuntando al balanceador vía el VPC Link.

Localmente (este archivo) todo sigue en un solo compose para desarrollar rápido — no hace falta replicar la separación de VMs en tu máquina.
