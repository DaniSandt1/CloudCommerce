# ms-analitica

Microservicio analítico que ejecuta queries con **AWS Athena** sobre los datos cargados al bucket S3 por el módulo de Data Science (equivalente al ejemplo "Api Rest Consultas Analíticas" de la rúbrica).

- **Lenguaje:** Python (FastAPI)
- **Base de datos:** ninguna (consulta a Athena a través de un cliente abstraído — ver Fase A/B abajo)
- **Consultas analíticas expuestas:** ventas por categoría de producto, top clientes por monto de compra, pedidos por rango de fechas

Este microservicio se construye en **dos fases separadas**, porque el proyecto corre sobre **AWS Academy Learner Lab**: ahí no existe consola IAM ni forma de crear credenciales acotadas para otra persona — las únicas credenciales que hay son las de la sesión del lab, personales, intransferibles y con expiración de pocas horas. Para no bloquear a todo el equipo detrás de eso, el microservicio se diseñó con el cliente de datos abstraído detrás de una interfaz (`app/athena_client.py`), de forma que Fase A y Fase B nunca tocan el mismo archivo.

## Fase A — endpoints + mock (sin AWS)

**Quién:** cualquiera del equipo, sin necesitar ningún acceso a AWS. Ver issue [#4](../../../issues/4).

Se implementan los 4 endpoints (`/health` + las 3 consultas analíticas) contra `app/athena_client_mock.py`, que devuelve datos fijos con la misma forma (columnas y tipos) que tendría una respuesta real de Athena. La app corre con `ATHENA_MODE=mock` (default) y **no requiere ninguna variable de AWS** — si en algún punto hace falta una `AWS_ACCESS_KEY` para levantar el contenedor, algo está mal en esta fase.

## Fase B — conexión real a Athena (solo el dueño de la cuenta AWS Academy)

**Quién:** la persona con acceso al Learner Lab. Se hace en un issue aparte, **después** de que Fase A esté mergeada a `main`.

### Pre-requisitos

1. Fase A (issue #4) mergeada — los endpoints y la interfaz `athena_client.run_query(sql) -> list[dict]` ya existen.
2. El pipeline de `data-science/` (`ingesta-productos`, `ingesta-usuarios`, `ingesta-pedidos`) subiendo datos a `s3://cloudcommerce-datalake/`.
3. Catálogo de Glue configurado sobre esos datos (ver [`data-science/glue-catalog/`](../../data-science/glue-catalog/)) — sin tablas en Glue no hay qué consultar desde Athena.
4. Un workgroup de Athena con ubicación de resultados en S3 (ej. `s3://cloudcommerce-datalake/athena-results/`).

### Credenciales

AWS Academy Learner Lab no permite crear usuarios/roles IAM propios, así que hay dos formas válidas de darle credenciales a este microservicio (nunca hardcodeadas, nunca commiteadas):

- **Corriendo en una EC2 dentro del lab (recomendado, mismo criterio que ya usa `ingesta-productos`):** adjuntar el `LabInstanceProfile` a la instancia y dejar `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` vacíos en `.env` — boto3 toma las credenciales del rol de la instancia automáticamente.
- **Corriendo en tu laptop (para probar antes de desplegar):** copiar el bloque de credenciales temporales desde "AWS Details" del Learner Lab (`aws_access_key_id`, `aws_secret_access_key`, `aws_session_token`) a `~/.aws/credentials` o a un `.env` local **que no se commitea**. Estas credenciales expiran junto con la sesión del lab (unas pocas horas) — hay que renovarlas cada vez que se reinicia el lab.

### Implementación

1. Crear `app/athena_client_real.py` con la misma firma que el mock: `run_query(sql: str) -> list[dict]`, usando `boto3.client("athena")`:
   - `start_query_execution(QueryString=sql, QueryExecutionContext={"Database": ATHENA_DATABASE}, ResultConfiguration={"OutputLocation": ATHENA_OUTPUT_S3})`
   - Poll de `get_query_execution` hasta `SUCCEEDED` (o levantar error en `FAILED`/`CANCELLED`).
   - `get_query_results` y parsear filas a `list[dict]` con los mismos nombres de columna que usó el mock.
2. Nuevas variables de entorno: `ATHENA_DATABASE`, `ATHENA_OUTPUT_S3`, y `ATHENA_MODE=real`.
3. Probar cada uno de los 3 endpoints analíticos contra datos reales y comparar que la forma de la respuesta siga siendo la misma que en Fase A (si no coincide, es el frontend el que se rompe después).
4. Si las columnas reales del catálogo Glue no coinciden con lo que Fase A asumió en el mock, ajustar `app/queries.py` (no los endpoints).
5. Actualizar este README: mover esta sección de "pre-requisitos" a un estado de "✅ implementado", igual que ya está documentado en `ms-productos/README.md`.

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
├── requirements.txt                # incluye boto3 desde Fase A (no se toca en Fase B)
├── Dockerfile
└── .env.example
```

## Pendiente

- [ ] Fase A: endpoints + mock (issue #4)
- [ ] Fase B: cliente real de Athena (issue aparte, tras mergear Fase A)
- [ ] Repositorio público en GitHub (enlace aquí)
