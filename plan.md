# Plan de implementacion: ms-analitica - Fase A

## Objetivo

Implementar `backend/ms-analitica` como un microservicio REST en Python con
FastAPI. La Fase A debe exponer consultas analiticas contra un cliente de
Athena abstraido, usando datos mock por defecto y sin realizar ninguna llamada
a AWS.

La Fase B, que conectara con Athena, Glue y S3 reales mediante credenciales de
AWS Academy, queda fuera de este plan y se implementara en otro issue.

## Precondiciones

1. Confirmar que los cambios de `ms-pedidos` (#2) y `ms-checkout` (#3) estan
   disponibles en `main`.
2. Crear la rama de trabajo desde `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/ms-analitica
   ```

3. Revisar los contratos actuales antes de escribir SQL o fijar datos mock:
   - `ms-pedidos/src/models/Pedido.js`: `id_usuario`, `fecha`, `items`,
     `total` y `estado`; cada item contiene `id_producto`, `cantidad` y
     `precio_unitario`.
   - `data-science/ingesta-pedidos/ingesta.py`: exporta los pedidos como un
     array JSON, conserva `items` embebidos y convierte `fecha` a ISO 8601.
   - `data-science/ingesta-productos/ingesta.py`: exporta CSV con `id`,
     `categoria_id` y `categoria_nombre`; no exporta una tabla independiente
     de categorias.
   - `data-science/ingesta-usuarios/ingesta.py`: exporta CSV con `id`,
     `nombre` y `email`, entre otras columnas.
4. Consultar `data-science/glue-catalog/README.md` y registrar que el
   catalogo Glue todavia no define tablas ni tipos finales. Usar las columnas
   de las ingestas como contrato provisional y dejar las suposiciones de
   nombres de tabla y tratamiento del JSON aisladas en `queries.py`. La
   ingesta actual escribe un array JSON exterior por archivo: para ejecutar
   el SQL real, la Fase B debera exponer una fila por pedido en Glue o adaptar
   `queries.py` a la representacion finalmente catalogada. Un snapshot vacio
   (`[]`) tampoco produce filas para descubrir su ruta con `MAX("$path")`;
   Fase B necesitara metadatos de snapshots o una tabla normalizada para
   evitar reutilizar pedidos de un archivo anterior.

## Estructura a crear

```text
backend/ms-analitica/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── athena_client.py
│   ├── athena_client_mock.py
│   ├── queries.py
│   └── schemas.py
├── postman/
│   └── CloudCommerce-ms-analitica.postman_collection.json
├── .env.example
├── Dockerfile
├── README.md
└── requirements.txt
```

## Implementacion

### 1. Dependencias y configuracion

- Crear `requirements.txt` con FastAPI, Uvicorn, Pydantic y `boto3`.
- Incluir `boto3` desde la Fase A para conservar el contrato esperado por la
  futura implementacion real.
- Crear `.env.example` con solo:

  ```env
  ATHENA_MODE=mock
  ```

- No agregar AWS keys, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_SESSION_TOKEN` ni variables de Glue/S3.

### 2. Interfaz del cliente de datos

- En `app/athena_client.py`, definir la funcion publica:

  ```python
  run_query(sql: str) -> list[dict]
  ```

- Leer `ATHENA_MODE`, usando `mock` como valor predeterminado.
- En modo `mock`, delegar en `athena_client_mock.run_query`.
- Definir el selector de modo para que `ATHENA_MODE=real` delegue en
  `athena_client_real.run_query` cuando ese modulo se agregue en Fase B;
  mantener el import diferido para que el modo mock funcione sin el modulo
  real. Si se selecciona `real` antes de Fase B, devolver un error de
  configuracion claro. Rechazar tambien modos desconocidos.
- Mantener a los endpoints desacoplados de la implementacion concreta.

### 3. Queries SQL

Crear `app/queries.py` con funciones que devuelvan el SQL que se ejecutaria en
Athena:

- `ventas_por_categoria()`:
  - seleccionar el snapshot mas reciente de pedidos; para productos usar la
    ultima version disponible por `id`, pues un producto eliminado aun puede
    figurar en pedidos historicos;
  - desanidar `pedidos.items` para obtener `id_producto`, `cantidad` y
    `precio_unitario` por item;
  - unir `id_producto` con `productos.id` y usar el `categoria_nombre`
    exportado en el CSV de productos;
  - calcular `SUM(cantidad * precio_unitario)`;
  - agrupar y ordenar por categoria.
- `top_clientes(limit)`:
  - seleccionar el snapshot mas reciente de pedidos y la ultima version
    disponible de cada usuario; deduplicar `usuarios` por `id` antes de unir:
    el CSV de ingesta
    contiene una fila por direccion y puede repetir `id`, `nombre` y `email`;
  - unir `pedidos.id_usuario` con el conjunto unico de `usuarios.id`;
  - agrupar por usuario y calcular el monto total comprado con `pedidos.total`;
  - ordenar de mayor a menor;
  - aplicar el limite validado.
- `pedidos_por_rango(fecha_inicio, fecha_fin)`:
  - filtrar por `pedidos.fecha`, exportada como texto ISO 8601, convirtiendola
    a fecha en Athena;
  - devolver cantidad de pedidos y monto total.

Las funciones deben escapar o parametrizar cuidadosamente los valores que se
incorporen al SQL. El SQL se construye aunque en modo mock no se ejecute contra
Athena. Los nombres de tabla y la representacion que Glue asigne al array JSON
siguen pendientes; documentar esos supuestos en `queries.py` para revisarlos
en Fase B cuando exista el catalogo. No declarar verificado el SQL en Athena
durante Fase A.

### 4. Datos mock

- Crear `app/athena_client_mock.py` con datos fijos y deterministas.
- Modelar filas de resultados agregados con los alias de salida del SQL:
  - ventas: `categoria`, `total_vendido`;
  - clientes: `id_usuario`, `nombre`, `email`, `total_comprado`;
  - pedidos por rango: `cantidad_pedidos`, `monto_total`.
- Derivar las filas mock de ejemplos coherentes con los campos de pedidos,
  productos y usuarios exportados por las ingestas. Los alias de salida son
  el contrato del API; los nombres definitivos de Glue aun no estan fijados.
- Cubrir varias categorias y clientes para que `limit` pueda probarse.
- Usar montos numericos estables y serializables como JSON.
- Hacer que el mock pueda distinguir la consulta solicitada sin que los
  endpoints conozcan detalles de su implementacion. La solucion puede usar
  marcadores o una clasificacion interna de SQL, siempre que conserve la
  interfaz `run_query(sql)`.

### 5. Schemas y endpoints

Crear `app/schemas.py` con modelos Pydantic para:

- `VentaPorCategoria`:
  - `categoria: str`;
  - `total_vendido: float`.
- `TopCliente`:
  - identificador y datos del cliente;
  - `total_comprado: float`.
- `PedidosPorRango`:
  - `cantidad_pedidos: int`;
  - `monto_total: float`.

En `app/main.py`, montar:

- `GET /health` -> `200` y estado del servicio.
- `GET /analitica/ventas-por-categoria` -> lista de ventas agrupadas.
- `GET /analitica/top-clientes?limit=10` -> lista limitada de clientes.
- `GET /analitica/pedidos-por-rango?fecha_inicio=&fecha_fin=` -> resumen del
  rango indicado.

Validaciones:

- `limit` debe ser entero positivo y tener un maximo razonable.
- `fecha_inicio` y `fecha_fin` deben ser fechas ISO `YYYY-MM-DD`.
- Rechazar un rango donde `fecha_inicio` sea posterior a `fecha_fin` con `422`.
- Cada endpoint debe construir su SQL mediante `queries.py`, llamar a
  `athena_client.run_query(sql)` y convertir el resultado al schema de salida.
- Los errores del cliente deben producir respuestas HTTP claras, sin exponer
  secretos ni detalles innecesarios.

### 6. Docker y Compose

- Crear el `Dockerfile` siguiendo el patron de los microservicios Python:
  imagen Python slim, instalacion de requirements, copia de `app` y arranque
  con Uvicorn en `0.0.0.0:8000`.
- Agregar `ms-analitica` a
  `backend/docker-compose/docker-compose.yml`:
  - build: `../ms-analitica`;
  - puerto host `8005:8000`;
  - `ATHENA_MODE=mock`;
  - sin variables de AWS;
  - sin dependencia de bases de datos ni de otros microservicios.
- Confirmar que el servicio pueda iniciar aunque no existan credenciales AWS.

### 7. Postman y documentacion

- Crear la coleccion Postman con requests para los cuatro endpoints.
- Incluir ejemplos para:
  - ventas por categoria;
  - top de clientes con `limit=5`;
  - pedidos entre `2026-01-01` y `2026-12-31`;
  - health.
- Actualizar `backend/ms-analitica/README.md`:
  - endpoints reales de Fase A;
  - puerto local `8005`;
  - forma de ejecutar con Docker Compose;
  - ejemplos de respuestas;
  - variable `ATHENA_MODE=mock`;
  - aclaracion de que no se necesitan credenciales AWS.
- No modificar ni eliminar la seccion existente de Fase B; solo ajustar
  referencias de estructura o estado que hayan quedado desactualizadas.

## Verificacion

### Pruebas de codigo

- Agregar pruebas unitarias para:
  - seleccion del modo mock;
  - forma y contenido basico de las filas mock;
  - generacion de cada SQL;
  - validacion de `limit`;
  - validacion de fechas y rangos invertidos;
  - respuestas de los cuatro endpoints.
- Ejecutar las pruebas sin AWS y sin depender de otros microservicios.

### Pruebas con Docker

Desde `backend/docker-compose`:

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:8005/health
curl http://localhost:8005/analitica/ventas-por-categoria
curl "http://localhost:8005/analitica/top-clientes?limit=5"
curl "http://localhost:8005/analitica/pedidos-por-rango?fecha_inicio=2026-01-01&fecha_fin=2026-12-31"
```

Comprobar tambien:

- `http://localhost:8005/docs` carga Swagger UI.
- Los tres endpoints analiticos responden `200` con la forma definida.
- `top-clientes?limit=5` devuelve cinco elementos.
- No aparecen errores de AWS en los logs.
- El contenedor arranca sin ningun `.env` con credenciales.
- No hay keys AWS en ningun archivo nuevo o modificado.

## Criterios de aceptacion

- [x] La rama se crea desde `main` despues de verificar #2 y #3.
- [x] `ms-analitica` arranca con `ATHENA_MODE=mock` por defecto.
- [x] `GET /health` responde `200`.
- [x] Ventas por categoria responde una lista con `categoria` y
      `total_vendido`.
- [x] Top clientes acepta `limit` y devuelve la cantidad solicitada.
- [x] Pedidos por rango valida fechas y devuelve cantidad y monto total.
- [x] Cada endpoint genera SQL y lo envia por la interfaz del cliente.
- [x] Docker Compose expone el servicio en el puerto `8005`.
- [x] Swagger documenta los cuatro endpoints.
- [x] Existe la coleccion de Postman.
- [x] README y `.env.example` estan actualizados.
- [x] No se usan credenciales ni llamadas reales a AWS.
- [x] Pruebas locales y verificaciones Docker completadas.

## Cierre

1. Revisar diff y confirmar que los cambios son aditivos.
2. Ejecutar las pruebas y el smoke test con Docker.
3. Confirmar que no hay secretos en el diff.
4. Crear un commit descriptivo, por ejemplo:

   ```text
   Implementar ms-analitica Fase A con cliente mock de Athena
   ```

5. Publicar la rama y abrir un Pull Request hacia `main` si el flujo del
   equipo lo requiere.
