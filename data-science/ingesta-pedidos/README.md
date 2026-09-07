# ingesta-pedidos

Contenedor Docker en Python que hace *pull* del 100% de los documentos de la colección `pedidos` (MongoDB, de `ms-pedidos`) y genera un archivo csv/json cargado al bucket S3.

## Pendiente

- [ ] Script de extracción (conexión MongoDB)
- [ ] Generación de archivo csv/json
- [ ] Carga a S3 (boto3)
- [ ] Dockerfile
