# ms-usuarios

API REST de registro y datos de clientes del e-commerce. **Implementado para la primera entrega.**

- **Lenguaje:** Java (Spring Boot 3)
- **Base de datos:** PostgreSQL (propia)
- **Tablas (2 relacionadas):** `usuarios`, `direcciones`
- **Endpoints:**
  - `GET /health`
  - `GET /usuarios` (paginado `page`/`size`, búsqueda `q` por nombre o email), `GET /usuarios/{id}`
  - `POST /usuarios`, `PUT /usuarios/{id}`, `DELETE /usuarios/{id}` (CRUD completo)
  - `GET /usuarios/{id}/direcciones`, `POST /usuarios/{id}/direcciones`
- **Docs interactivos (Swagger/OpenAPI):** `/swagger-ui.html`

## Cómo correr localmente

Ver [backend/docker-compose/README.md](../docker-compose/README.md) — se levanta junto con PostgreSQL vía `docker compose`.

Standalone (requiere PostgreSQL corriendo y variables `DATABASE_URL`/`DATABASE_USER`/`DATABASE_PASSWORD`):

```bash
mvn spring-boot:run
```

## Carga masiva de datos ficticios (mínimo 20,000 registros)

Se ejecuta automáticamente al arrancar la aplicación (`DataSeeder`), controlado por `SEED_COUNT` (default 20000). Solo siembra si la tabla está vacía.

## Pendiente (para la entrega final)

- [x] Diagrama Entidad/Relación — [er_ecommerce.drawio](../../docs/diagrama-arquitectura/er_ecommerce.drawio)
- [ ] Despliegue en MV de producción + AWS API Gateway
- [ ] Repositorio público en GitHub (enlace aquí)
