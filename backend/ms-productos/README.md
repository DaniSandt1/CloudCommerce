# ms-productos

API REST del catálogo de productos del e-commerce. **Implementado para la primera entrega.**

- **Lenguaje:** Python (FastAPI)
- **Base de datos:** MySQL (propia)
- **Tablas (2 relacionadas):** `productos`, `categorias`
- **Endpoints:**
  - `GET /health`
  - `GET /categorias`, `POST /categorias`
  - `GET /productos`, `GET /productos?categoria_id=`, `GET /productos/{id}`
  - `POST /productos`, `PUT /productos/{id}`, `DELETE /productos/{id}` (CRUD completo)
- **Docs interactivos (Swagger/OpenAPI):** `/docs`

## Colección de Postman (demo CRUD)

[`postman/CloudCommerce-ms-productos.postman_collection.json`](postman/CloudCommerce-ms-productos.postman_collection.json) — Crear → Consultar → Editar → Eliminar (+ verificar que ya no existe), con tests automáticos en cada paso.

1. Importa el archivo en Postman.
2. En la colección → **Variables**, cambia `base_url` a `http://<ip-publica-mv-backend>:8001`.
3. Corre los 5 requests en orden (o **Run collection** para correrlos todos seguidos) — `producto_id` se guarda solo después del paso 1 y se reusa en el resto.

## Cómo correr localmente

Ver [backend/docker-compose/README.md](../docker-compose/README.md) — se levanta junto con MySQL vía `docker compose`.

Standalone (requiere MySQL corriendo y `DATABASE_URL` configurada):

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Carga masiva de datos ficticios (mínimo 20,000 registros)

```bash
python -m app.seed          # o: docker compose exec ms-productos python -m app.seed
```

## Pendiente (para la entrega final)

- [ ] Diagrama Entidad/Relación
- [ ] Consumo desde este microservicio hacia otro (o que otro lo consuma a él, p.ej. ms-pedidos)
- [ ] Despliegue en MV de producción + AWS API Gateway
- [ ] Repositorio público en GitHub (enlace aquí)
