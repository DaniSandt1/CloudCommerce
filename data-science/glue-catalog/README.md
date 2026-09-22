# glue-catalog

Documentación del catálogo de datos en AWS Glue (base `cloudcommerce_datalake`, tablas `productos`/`usuarios`/`pedidos`) y de las consultas/vistas en Athena.

El diagrama Entidad/Relación del catálogo, las 4 consultas SQL con join y las 2 vistas (`v_pedidos_actuales`, `v_productos_actuales`) están documentadas con evidencia en el informe del proyecto (`docs/informe/`), no en este README.

## Estado

- [x] Catálogo Glue creado y verificado
- [x] Diagrama Entidad/Relación de todas las tablas del catálogo de datos
- [x] Evidencia (capturas/SQL) de mínimo 4 consultas Athena que unan varias tablas
- [x] Definición de mínimo 2 vistas en Athena
