# ms-analitica

Microservicio analítico que ejecuta queries con **AWS Athena** sobre los datos cargados al bucket S3 por el módulo de Data Science (equivalente al ejemplo "Api Rest Consultas Analíticas" de la rúbrica).

- **Lenguaje:** Python (FastAPI)
- **Base de datos:** ninguna (consulta a Athena a través de un cliente abstraído — ver Fase A/B abajo)
- **Consultas analíticas expuestas:** ventas por categoría de producto, top clientes por monto de compra, pedidos por rango de fechas

Este microservicio se construye en **dos fases separadas**, porque el proyecto corre sobre **AWS Academy Learner Lab**: ahí no existe consola IAM ni forma de crear credenciales acotadas para otra persona — las únicas credenciales que hay son las de la sesión del lab, personales, intransferibles y con expiración de pocas horas. Para no bloquear a todo el equipo detrás de eso, el microservicio se diseñó con el cliente de datos abstraído detrás de una interfaz (`app/athena_client.py`), de forma que Fase A y Fase B nunca tocan el mismo archivo.

## Fase A — endpoints + mock (sin AWS)

**Quién:** cualquiera del equipo, sin necesitar ningún acceso a AWS. Ver issue [#4](../../../issues/4).

Se implementan los 4 endpoints (`/health` + las 3 consultas analíticas) contra `app/athena_client_mock.py`, que devuelve datos fijos con la misma forma (columnas y tipos) que tendría una respuesta real de Athena. La app corre con `ATHENA_MODE=mock` (default) y **no requiere ninguna variable de AWS** — si en algún punto hace falta una `AWS_ACCESS_KEY` para levantar el contenedor, algo está mal en esta fase.

### Ejecutar localmente

Desde `backend/docker-compose`:

```bash
docker compose up -d --build
```

Para levantar solo este servicio: `docker compose up -d --build ms-analitica`.

`ms-analitica` queda disponible en `http://localhost:8005`. Su contenedor no
depende de las bases de datos ni de los otros microservicios. `ATHENA_MODE=mock`
es el valor predeterminado; `.env.example` no contiene credenciales AWS.

### Endpoints de Fase A

| Metodo | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | `{"status":"ok","service":"ms-analitica"}` |
| GET | `/analitica/ventas-por-categoria` | Lista de `{"categoria":"Tecnologia","total_vendido":1110.0}` |
| GET | `/analitica/top-clientes?limit=10` | Lista de `{"id_usuario":101,"nombre":"Ana Torres","email":"ana@example.com","total_comprado":610.0}` |
| GET | `/analitica/pedidos-por-rango?fecha_inicio=2026-01-01&fecha_fin=2026-12-31` | `{"cantidad_pedidos":6,"monto_total":1640.0}` |

`limit` acepta valores de 1 a 100 (predeterminado: 10). Las fechas deben ser
`YYYY-MM-DD`, son inclusivas y `fecha_inicio` no puede ser posterior a
`fecha_fin`; entradas invalidas responden `422`. Un rango sin pedidos devuelve
`{"cantidad_pedidos":0,"monto_total":0.0}`. Los montos mock incluyen los
pedidos sin filtrar por `estado`, igual que las consultas SQL de esta fase.

Swagger UI: `http://localhost:8005/docs`. La coleccion de Postman esta en
[`postman/CloudCommerce-ms-analitica.postman_collection.json`](postman/CloudCommerce-ms-analitica.postman_collection.json).

Las consultas usan como referencia los campos exportados por las ingestas y
asumen las tablas `pedidos`, `productos` y `usuarios`. El catalogo Glue aun no
esta definido: el exportador actual de pedidos escribe un array JSON exterior
por archivo, mientras que el SQL de `queries.py` presupone una fila catalogada
por pedido. Antes de ejecutar ese SQL en Athena, la Fase B debera resolver esa
representacion en Glue o adaptar `queries.py`. Tambien debera identificar el
ultimo snapshot incluso si contiene `[]`: un archivo sin filas no aparece en
`MAX("$path")` y podria hacer que se reutilicen pedidos antiguos. Ninguna ruta
de Fase A hace llamadas a AWS.

## Fase B — conexión real a Athena

**✅ Implementada, desplegada y verificada.** `ms-analitica` corre con `ATHENA_MODE=real` en `cloudcommerce-prod2`, consultando el catálogo Glue `cloudcommerce_datalake` (tablas `productos`/`usuarios`/`pedidos` — **sin** prefijo, tal como las espera `app/queries.py`). Los 3 endpoints responden con datos reales de los 20,000 pedidos, coincidiendo con lo consultado directo en el editor de Athena.

### Pre-requisitos (todos cumplidos)

1. ✅ Fase A mergeada — los endpoints y la interfaz `athena_client.run_query(sql) -> list[dict]` ya existían.
2. ✅ El pipeline de `data-science/` (`ingesta-productos`, `ingesta-usuarios`, `ingesta-pedidos`) sube a `s3://cloudcommerce-datalake/`. `ingesta-pedidos` sube **NDJSON** (un documento por línea, sin array envolvente) — imprescindible para que el crawler exponga cada pedido como una fila y `CROSS JOIN UNNEST(items)` funcione en Athena.
3. ✅ Catálogo de Glue configurado (`cloudcommerce_datalake`, database + crawler sobre los 3 prefijos de S3) — ver [`data-science/glue-catalog/`](../../data-science/glue-catalog/).
4. ✅ Workgroup `primary` de Athena con resultados en `s3://cloudcommerce-datalake/athena-results/`.

### Credenciales

AWS Academy Learner Lab no permite crear usuarios/roles IAM propios, así que hay dos formas válidas de darle credenciales a este microservicio (nunca hardcodeadas, nunca commiteadas):

- **Corriendo en una EC2 dentro del lab (recomendado, mismo criterio que ya usa `ingesta-productos`):** adjuntar el `LabInstanceProfile` a la instancia y dejar `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` vacíos en `.env` — boto3 toma las credenciales del rol de la instancia automáticamente.
- **Corriendo en tu laptop (para probar antes de desplegar):** copiar el bloque de credenciales temporales desde "AWS Details" del Learner Lab (`aws_access_key_id`, `aws_secret_access_key`, `aws_session_token`) a `~/.aws/credentials` o a un `.env` local **que no se commitea**. Estas credenciales expiran junto con la sesión del lab (unas pocas horas) — hay que renovarlas cada vez que se reinicia el lab.

### Cómo está activado

En la EC2 donde corre `ms-analitica` (`cloudcommerce-prod2`, ver [DEPLOYMENT.md](../../DEPLOYMENT.md)):

```yaml
# docker-compose.yml de esa VM, servicio ms-analitica:
environment:
  ATHENA_MODE: real
  ATHENA_DATABASE: cloudcommerce_datalake
  ATHENA_OUTPUT_S3: s3://cloudcommerce-datalake/athena-results/
  AWS_DEFAULT_REGION: us-east-1
```
```bash
docker compose up -d --build ms-analitica
curl localhost:8005/analitica/ventas-por-categoria
```

### Problemas encontrados al activarlo (por si el lab se reinicia y hay que rehacerlo)

1. **`NoRegionError`** — boto3 no infiere la región dentro del contenedor. Hace falta `AWS_DEFAULT_REGION=us-east-1` explícito en el `environment` del compose.
2. **`NoCredentialsError`** — `cloudcommerce-prod2` no tenía ningún rol IAM asociado (a diferencia de `cloudcommerce-ingesta`, que sí lo tenía desde el principio). Arreglo: **EC2 → Instances → `cloudcommerce-prod2` → Actions → Security → Modify IAM role → `LabInstanceProfile`** (no requiere detener la instancia, solo reiniciar el contenedor después).
3. **`TABLE_NOT_FOUND`** — el crawler de Glue se corrió con table prefix `raw_`, pero `app/queries.py` espera los nombres de tabla sin prefijo (`productos`, `usuarios`, `pedidos`). Se resolvió borrando las tablas `raw_*` y volviendo a correr el crawler sin prefijo.

Si las columnas reales del catálogo no coinciden con lo que asumió `app/queries.py`, ajustar ahí (no los endpoints ni los schemas).

## Estructura

```
ms-analitica/
├── app/
│   ├── main.py                    # FastAPI app, 4 endpoints
│   ├── athena_client.py           # interfaz run_query(sql), elige mock/real según ATHENA_MODE
│   ├── athena_client_mock.py      # Fase A
│   ├── athena_client_real.py      # Fase B (boto3)
│   ├── queries.py                 # SQL de cada endpoint
│   └── schemas.py
├── postman/
│   └── CloudCommerce-ms-analitica.postman_collection.json
├── requirements.txt                # incluye boto3 desde Fase A (no se toca en Fase B)
├── Dockerfile
└── .env.example
```

## Pendiente

- [x] Fase A: endpoints + mock (issue #4)
- [x] Fase B: cliente real de Athena, desplegado en `cloudcommerce-prod2` con `ATHENA_MODE=real` y **verificado contra datos reales** (20,000 pedidos, montos y top clientes coinciden con lo consultado directo en Athena)
- [ ] Repositorio público en GitHub (enlace aquí)
