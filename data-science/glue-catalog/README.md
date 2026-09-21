# glue-catalog

Documentación del catálogo de datos en AWS Glue (un catálogo por cada archivo cargado a S3) y de las consultas/vistas en Athena.

## Contrato actual de `pedidos`

La ingesta escribe archivos JSON Lines en `s3://<bucket>/pedidos/`: cada línea
representa un pedido y mantiene `items` anidado. La tabla Glue debe modelar
`items` como `array<struct<id_producto:bigint,cantidad:int,precio_unitario:double>>`;
después Athena puede expandirla con `CROSS JOIN UNNEST(items)`.

## Pendiente

- [ ] Diagrama Entidad/Relación de todas las tablas del catálogo de datos
- [ ] Evidencia (capturas/SQL) de mínimo 4 consultas Athena que unan varias tablas
- [ ] Definición de mínimo 2 vistas en Athena
