# ms-analitica

Microservicio analítico que ejecuta queries con **AWS Athena** sobre los datos cargados al bucket S3 por el módulo de Data Science (equivalente al ejemplo "Api Rest Consultas Analíticas" de la rúbrica).

- **Lenguaje:** Python
- **Base de datos:** ninguna (consulta directa a Athena vía boto3, usando AWS credentials)
- **Ejemplos de consulta analítica (por definir):** ventas por categoría de producto, top clientes por monto de compra, pedidos por rango de fechas

## Estructura sugerida (pendiente de implementar)

```
ms-analitica/
├── app/
├── requirements.txt (incluye boto3)
├── Dockerfile
└── (Swagger)
```

## Pendiente

- [ ] Definir consultas analíticas a exponer
- [ ] Configurar credenciales/rol AWS para Athena
- [ ] Implementación de endpoints
- [ ] Dockerfile
- [ ] Documentación Swagger-UI
- [ ] Repositorio público en GitHub (enlace aquí)
