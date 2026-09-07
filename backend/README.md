# Backend — Microservicios

Para la entrega final serán 5 microservicios. **Para la primera entrega (próxima semana) solo se necesitan 2 funcionando**, según indicación del asesor.

| Microservicio | Lenguaje | Base de datos | Estado |
|---|---|---|---|
| [ms-productos](ms-productos/) | Python (FastAPI) | MySQL | ✅ Implementado (1ra entrega) |
| [ms-usuarios](ms-usuarios/) | Java (Spring Boot) | PostgreSQL | ✅ Implementado (1ra entrega) |
| [ms-pedidos](ms-pedidos/) | Node.js (Express) | MongoDB | Pendiente (entrega final) |
| [ms-checkout](ms-checkout/) | Por definir | No | Pendiente (entrega final) |
| [ms-analitica](ms-analitica/) | Python | No (Athena) | Pendiente (entrega final) |

## Cómo correr los 2 microservicios de esta entrega

Ver [docker-compose/README.md](docker-compose/) — levanta `ms-productos` + MySQL y `ms-usuarios` + PostgreSQL con un solo comando.

## Pendiente (para la entrega final)

- [ ] Implementar ms-pedidos, ms-checkout, ms-analitica
- [ ] Definir cuál microservicio con BD propia consume a otro (requisito: al menos 1)
- [ ] Diagrama Entidad/Relación por cada BD SQL (MySQL, PostgreSQL)
- [ ] Estructura JSON de la colección MongoDB
- [ ] `docker-compose` de despliegue en 2 MV de producción + balanceador privado
- [ ] Documentación Swagger-UI de las 5 APIs
- [ ] Configuración de AWS API Gateway + balanceador de carga privado
- [ ] Enlaces a repositorios públicos de GitHub
