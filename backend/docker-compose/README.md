# docker-compose (entorno local / demo)

Levanta los 2 microservicios de esta primera entrega junto con sus bases de datos:

- `mysql-productos` (MySQL) + `ms-productos` (FastAPI, puerto 8001)
- `postgres-usuarios` (PostgreSQL) + `ms-usuarios` (Spring Boot, puerto 8002)

## Uso

```bash
cd backend/docker-compose
docker compose up -d --build
```

- ms-productos: http://localhost:8001 (docs interactivos en http://localhost:8001/docs)
- ms-usuarios: http://localhost:8002 (swagger en http://localhost:8002/swagger-ui.html)

## Carga masiva de datos (mínimo 20,000 registros)

- **ms-usuarios** se auto-siembra al arrancar (usa `SEED_COUNT`, default 20000) gracias a `DataSeeder`.
- **ms-productos** requiere ejecutar el script una vez:

```bash
docker compose exec ms-productos python -m app.seed
```

## Notas para el despliegue final en AWS

Para la entrega final, este mismo compose se dividirá en:
- `docker-compose.mv1.yml` / `docker-compose.mv2.yml` — microservicios, repartidos entre 2 MV de producción detrás de un balanceador de carga privado.
- `docker-compose.db.yml` — bases de datos, en una 3ra MV privada (no pública).
- Exposición pública de las APIs vía AWS API Gateway (https) apuntando al balanceador.

Por ahora (primera entrega), se usa un solo compose para correr y demostrar los 2 microservicios funcionando.
