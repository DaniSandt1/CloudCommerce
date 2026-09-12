# Data Science — Ingesta y Analítica

- **MV Ingesta:** máquina virtual dedicada (separada de la MV Backend) donde corren los 3 contenedores docker de ingesta. Ver [DEPLOYMENT.md](../DEPLOYMENT.md).
- **Bucket S3:** almacena los archivos (csv/json) generados por la ingesta.
- **Catálogo de datos (AWS Glue):** un catálogo por cada archivo cargado a S3.
- **Consultas (AWS Athena):** mínimo 4 consultas SQL que unan varias tablas + mínimo 2 vistas.

Los contenedores se orquestan con [docker-compose.yml](docker-compose.yml) (uno por servicio, ejecutados con `docker compose run --rm <servicio>` ya que son jobs de una sola pasada, no servicios de larga duración).

| Contenedor | Fuente | Estrategia | Destino | Estado |
|---|---|---|---|---|
| [ingesta-productos](ingesta-productos/) | MySQL de `ms-productos` (en la MV Backend) | pull 100% | S3 | Implementado |
| [ingesta-usuarios](ingesta-usuarios/) | PostgreSQL de `ms-usuarios` (en la MV Backend) | pull 100% | S3 | Implementado |
| [ingesta-pedidos](ingesta-pedidos/) | MongoDB de `ms-pedidos` | pull 100% | S3 | Pendiente (depende de que exista ms-pedidos) |

Ver también [glue-catalog/](glue-catalog/) para el diagrama Entidad/Relación del catálogo y las consultas/vistas de Athena.

## Avance (Hito 1)

- [x] Implementar `ingesta-productos` y `ingesta-usuarios` en Python
- [x] Crear el bucket S3 real en AWS y probar la subida
- [x] Separar la ingesta a su propia MV Ingesta (EC2 aparte de la MV Backend)

## Pendiente (para la entrega final)

- [ ] Implementar `ingesta-pedidos` (cuando exista ms-pedidos)
- [ ] Configurar AWS Glue (un crawler/catálogo por archivo)
- [ ] Diagrama E/R del catálogo de datos completo
- [ ] Mínimo 4 consultas SQL (join de varias tablas) + 2 vistas en Athena
- [ ] Repositorio público en GitHub (enlace aquí)
