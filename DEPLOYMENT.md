# Guía de Despliegue en AWS (AWS Academy Learner Lab)

Esta guía cubre el alcance del **avance (Hito 1)**: 2 microservicios + frontend + ingesta a S3, repartidos en **2 máquinas virtuales separadas**, tal como lo pide la rúbrica de avance:

- **Back-End**: microservicios implementados parcialmente, con al menos una base de datos conectada y consultas básicas funcionando.
- **Data Science**: máquina virtual de ingesta **configurada** (propia, separada del backend), bucket S3 creado y al menos un contenedor de ingesta funcionando con datos cargados en S3.

## Arquitectura de esta entrega

```
MV Backend (EC2 #1)                     MV Ingesta (EC2 #2)
┌─────────────────────────┐             ┌───────────────────────────┐
│ ms-productos :8001       │             │ ingesta-productos (docker)│
│ mysql-productos :3306    │◄────────────┤ ingesta-usuarios  (docker)│
│ ms-usuarios    :8002      │  DB_HOST =  │                           │
│ postgres-usuarios :5432   │  IP privada │ boto3 vía IAM role        │
└─────────────────────────┘  MV Backend  └──────────┬────────────────┘
                                                      │
                                                      ▼
                                                 Bucket S3
```

Las 2 MV deben estar en la misma VPC/subred (la default de Academy sirve) para que la MV Ingesta llegue a la MV Backend por **IP privada**, sin exponer las bases de datos a internet.

> La separación en 2 MV de *producción* + balanceador + 3ra MV de bases de datos (arquitectura final, diapositiva 8) es para el **Hito 2**. Para este avance el backend se mantiene en 1 sola MV.

## Prerrequisitos

- Cuenta de AWS Academy (Learner Lab) con la sesión iniciada ("Start Lab").
- Este repositorio clonado o accesible en GitHub.
- Docker **no** es necesario en tu máquina local — todo corre dentro de las 2 EC2. Localmente solo necesitas Node.js para correr el frontend.

---

# Parte A — MV Backend

## A.1 Lanzar la instancia EC2

En la consola de AWS → **EC2 → Launch instance**, configura:

| Campo | Valor | Por qué |
|---|---|---|
| **Name** | `cloudcommerce-backend` | Identificarla fácilmente |
| **AMI** | Ubuntu Server 26.04 LTS | Facilita instalar Docker/Git con `apt` |
| **Instance type** | `t3.medium` (2 vCPU / 4 GB RAM) | Corre 2 bases de datos + 2 apps a la vez; con `t2.micro` (1 GB RAM) se queda sin memoria, sobre todo compilando `ms-usuarios` (Maven + JDK) |
| **Key pair** | Crea una nueva (RSA, `.pem`) o usa la `vockey` de tu lab | La necesitas para SSH — descárgala, no se puede volver a descargar |
| **Network settings → Security group** | Ver tabla abajo | Para poder acceder por SSH, probar las APIs, y dejar entrar a la MV Ingesta |
| **Storage** | Sube de 8 GB (default) a **20–30 GB** | Las imágenes Docker (mysql, postgres, maven+jdk) + volúmenes de datos pesan más de lo que parece |
| **Advanced details → IAM instance profile** | `LabInstanceProfile` | Rol de tu Learner Lab (no imprescindible en esta MV, pero no hace daño) |

### Reglas del Security Group (MV Backend)

| Type | Port range | Source | Para qué |
|---|---|---|---|
| SSH | 22 | My IP (o `0.0.0.0/0` si no tienes IP fija) | Conectarte por terminal |
| Custom TCP | 8001 | `0.0.0.0/0` | Probar `ms-productos` desde tu navegador/frontend |
| Custom TCP | 8002 | `0.0.0.0/0` | Probar `ms-usuarios` desde tu navegador/frontend |
| Custom TCP | 3306 (MySQL) | **IP privada de la MV Ingesta**/32 | Que la MV Ingesta pueda leer `mysql-productos` |
| Custom TCP | 5432 (PostgreSQL) | **IP privada de la MV Ingesta**/32 | Que la MV Ingesta pueda leer `postgres-usuarios` |

⚠️ Las reglas de 3306/5432 las agregas **después** de lanzar la MV Ingesta (Parte B), cuando ya conoces su IP privada — ver paso B.4. No abras 3306/5432 a `0.0.0.0/0`: son las bases de datos, deben quedar accesibles solo desde la MV Ingesta.

⚠️ En AWS Academy Learner Lab, al terminar la sesión la instancia se **detiene** (no se borra), pero pierde la IP pública si no le asignas una **Elastic IP**. Asígnale una desde EC2 → Elastic IPs → Allocate → Associate si quieres que no cambie entre sesiones (útil para la asesoría con el ACL).

## A.2 Conectarte a la instancia

**Opción A — EC2 Instance Connect** (botón "Connect" en la consola de EC2): no necesita el `.pem`, ideal para pruebas rápidas.

**Opción B — SSH desde tu terminal:**
```bash
chmod 400 tu-key.pem
ssh -i tu-key.pem ubuntu@<ip-publica-mv-backend>
```

## A.3 Instalar Docker y Git

```bash
sudo apt update
sudo apt install -y docker.io git
sudo apt install -y docker-compose-v2
sudo usermod -aG docker $USER
```
Cierra la sesión SSH y vuelve a entrar para que el grupo `docker` tome efecto.

Verifica:
```bash
docker --version
docker compose version
```

## A.4 Clonar el repositorio

```bash
git clone https://github.com/DaniSandt1/CloudCommerce.git
cd CloudCommerce
```

## A.5 Levantar los microservicios

```bash
cd backend/docker-compose
docker compose up -d --build
```

La primera vez tarda varios minutos: descarga las imágenes de MySQL/PostgreSQL y compila `ms-usuarios` con Maven. Verifica el progreso:
```bash
docker compose ps
docker compose logs -f ms-usuarios   # Ctrl+C para salir
```
Espera a que `mysql-productos` y `postgres-usuarios` digan `healthy`, y que `ms-productos`/`ms-usuarios` digan `running`/`Up`.

### Cargar los datos ficticios (mínimo 20,000 registros)

`ms-usuarios` se auto-siembra al arrancar. `ms-productos` necesita este comando una vez:
```bash
docker compose exec ms-productos python -m app.seed
```

### Verificar que responde

Desde la propia EC2:
```bash
curl localhost:8001/health   # {"status":"ok","total_productos":20000}
curl localhost:8002/health   # {"status":"ok","total_usuarios":20000}
```
Desde tu navegador:
```
http://<ip-publica-mv-backend>:8001/docs             # Swagger de ms-productos
http://<ip-publica-mv-backend>:8002/swagger-ui.html  # Swagger de ms-usuarios
```

## A.6 Anota la IP privada de esta MV

La necesitas en la Parte B (`DB_HOST` de la ingesta):

```bash
curl -s http://169.254.169.254/latest/meta-data/local-ipv4; echo
```
O en la consola: EC2 → Instances → `cloudcommerce-backend` → columna **Private IPv4 address**.

---

# Parte B — MV Ingesta

## B.1 Lanzar la instancia EC2

**EC2 → Launch instance**:

| Campo | Valor | Por qué |
|---|---|---|
| **Name** | `cloudcommerce-ingesta` | Identificarla fácilmente |
| **AMI** | Ubuntu Server 26.04 LTS | Igual que la MV Backend |
| **Instance type** | `t2.micro` o `t3.micro` | Solo corre 2 scripts de ingesta cortos, no necesita mucha RAM |
| **Key pair** | La misma que la MV Backend (o una nueva) | Para SSH |
| **Network settings → VPC/subred** | **La misma VPC y subred que la MV Backend** | Para que se alcancen por IP privada |
| **Network settings → Security group** | Ver tabla abajo | |
| **Storage** | 8-10 GB (default) | Solo imágenes Python pequeñas |
| **Advanced details → IAM instance profile** | `LabInstanceProfile` | **Obligatorio** — da permisos de S3 sin manejar credenciales a mano |

### Reglas del Security Group (MV Ingesta)

| Type | Port range | Source | Para qué |
|---|---|---|---|
| SSH | 22 | My IP (o `0.0.0.0/0`) | Conectarte por terminal |

No necesita puertos de entrada adicionales: solo hace conexiones salientes hacia la MV Backend (3306/5432) y hacia S3 (443), que están permitidas por defecto.

## B.2 Conectarte a la instancia

```bash
ssh -i tu-key.pem ubuntu@<ip-publica-mv-ingesta>
```

## B.3 Instalar Docker y Git

```bash
sudo apt update
sudo apt install -y docker.io git
sudo apt install -y docker-compose-v2
sudo usermod -aG docker $USER
```
Cierra la sesión SSH y vuelve a entrar.

## B.4 Habilitar el acceso a las bases de datos de la MV Backend

1. Anota la **IP privada de esta MV Ingesta**:
   ```bash
   curl -s http://169.254.169.254/latest/meta-data/local-ipv4; echo
   ```
2. Ve a la consola → EC2 → Security Groups → el grupo de `cloudcommerce-backend` → **Edit inbound rules** → agrega las 2 reglas de la tabla del paso A.1 (3306 y 5432) usando esta IP privada `/32` como *source*.

## B.5 Clonar el repositorio

```bash
git clone https://github.com/DaniSandt1/CloudCommerce.git
cd CloudCommerce/data-science
```

## B.6 Crear el bucket S3

Consola: **S3 → Create bucket** → nombre único globalmente (ej. `cloudcommerce-datalake-tunombre123`), misma región que tus EC2 (normalmente `us-east-1` en Academy).

O por CLI desde esta misma MV (ya tiene permisos por el `LabInstanceProfile`):
```bash
aws s3 mb s3://cloudcommerce-datalake --region us-east-1
```

## B.7 Configurar y correr los contenedores de ingesta

```bash
cd ingesta-productos
cp .env.example .env
nano .env
```
Completa:
```
DB_HOST=<ip-privada-mv-backend>   # del paso A.6
DB_PORT=3306
DB_USER=productos_user
DB_PASSWORD=productos_pass
DB_NAME=productos_db

S3_BUCKET_NAME=cloudcommerce-datalake
S3_PREFIX=productos

AWS_DEFAULT_REGION=us-east-1
```
**Deja vacías** `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` — el contenedor toma las credenciales del rol IAM de la instancia automáticamente vía el servicio de metadata (accesible desde Docker en modo bridge por defecto).

Repite para usuarios:
```bash
cd ../ingesta-usuarios
cp .env.example .env
nano .env
```
```
DB_HOST=<ip-privada-mv-backend>
DB_PORT=5432
DB_USER=usuarios_user
DB_PASSWORD=usuarios_pass
DB_NAME=usuarios_db

S3_BUCKET_NAME=cloudcommerce-datalake
S3_PREFIX=usuarios

AWS_DEFAULT_REGION=us-east-1
```

Ahora, desde `data-science/` (un nivel arriba), construye y corre ambos contenedores:
```bash
cd ..   # data-science/
docker compose build
docker compose run --rm ingesta-productos
docker compose run --rm ingesta-usuarios
```
Cada corrida imprime `Extraídos N productos...` / `Extraídos N registros...` y `Subido s3://...`.

## B.8 Verificar

```bash
aws s3 ls s3://cloudcommerce-datalake/productos/
aws s3 ls s3://cloudcommerce-datalake/usuarios/
```
Deberías ver un `.csv` en cada carpeta (también visible desde la consola de S3 — sirve como captura para el informe/asesoría).

---

## Desarrollo local del frontend (opcional, para iterar rápido)

Antes de montar Amplify, puedes seguir corriendo el frontend en tu laptop apuntando directo a la MV Backend — útil mientras desarrollas, aunque para la entrega real el frontend vive en Amplify (Parte D).

```bash
cd frontend
cp .env.example .env
```
Edita `.env` y reemplaza `localhost` por la **IP pública** de la MV Backend:
```
VITE_PRODUCTOS_API_URL=http://<ip-publica-mv-backend>:8001
VITE_USUARIOS_API_URL=http://<ip-publica-mv-backend>:8002
```
```bash
npm install
npm run dev
```

Abre la URL que te indique (normalmente `http://localhost:5173`) **en una ventana de navegador normal** (Chrome/Edge/Firefox) — no en la vista previa integrada de tu editor (VS Code "Simple Browser"), porque su webview sandboxeado puede bloquear los `fetch` y mostrar "Failed to fetch" aunque el backend esté perfectamente accesible.

Esto solo funciona en `http://localhost` porque ahí no hay mixed content (localhost es http, la MV Backend es http). El sitio en Amplify (https) no puede llamar directo al `ip:puerto` de la MV Backend por esa misma razón — ver Parte C.

---

# Parte C — API Gateway (exponer el backend por HTTPS)

Amplify sirve siempre por HTTPS. Si el frontend en Amplify llamara directo a `http://<ip-mv-backend>:8001`, el navegador bloquearía la petición por **mixed content**. API Gateway pone una URL HTTPS pública delante de cada microservicio, sin tocar una sola línea de código del backend — es la pieza que el enunciado pide investigar e implementar.

## C.1 Crear la HTTP API

Consola AWS → **API Gateway → Create API → HTTP API → Build**.
- Name: `cloudcommerce-api`
- En el paso "Integrations" del wizard, dale **Next** sin agregar nada — las integraciones se configuran después, por ruta.
- Termina el wizard con **Create**. HTTP APIs se auto-despliegan al stage `$default`, no necesitas un paso de "Deploy" manual.

## C.2 Habilitar CORS a nivel de API Gateway

En tu API → **CORS → Configure**:
- Access-Control-Allow-Origin: `*` (para el avance; restríngelo al dominio de Amplify cuando lo tengas, en la entrega final)
- Access-Control-Allow-Headers: `*`
- Access-Control-Allow-Methods: `GET, POST, OPTIONS`

Con esto API Gateway responde el preflight `OPTIONS` él mismo, sin reenviarlo al backend.

## C.3 Ruta e integración hacia `ms-productos`

En tu API → **Routes → Create**:
- Method: `ANY`, Path: `/productos-api/{proxy+}`
- **Attach integration → Create and attach an integration**:
  - Integration type: `HTTP`
  - Integration URL: `http://<ip-publica-mv-backend>:8001/{proxy}`
  - Method: `ANY`

## C.4 Ruta e integración hacia `ms-usuarios`

Repite en **Routes → Create**:
- Method: `ANY`, Path: `/usuarios-api/{proxy+}`
- Integration type: `HTTP`, Integration URL: `http://<ip-publica-mv-backend>:8002/{proxy}`, Method: `ANY`

## C.5 Obtener la Invoke URL

En tu API → pantalla principal, copia la **Invoke URL** (algo como `https://abc123xyz.execute-api.us-east-1.amazonaws.com`). Tus dos URLs finales son:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/productos-api
https://abc123xyz.execute-api.us-east-1.amazonaws.com/usuarios-api
```

## C.6 Verificar

Desde tu laptop (fuera de la EC2, esto ya es HTTPS público):
```bash
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/productos-api/health
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/usuarios-api/health
```
Ambos deben responder igual que los `curl localhost:8001/health` / `:8002/health` de la Parte A.

⚠️ Si la MV Backend no tiene **Elastic IP** (paso A.1), su IP pública cambia al reiniciarla — y con eso la Integration URL de C.3/C.4 queda apuntando a una IP vieja. Asígnale una Elastic IP ahora si no lo hiciste; si la IP cambia, edita la Integration URL en **API Gateway → Routes → (la ruta) → Integration details**.

---

# Parte D — AWS Amplify (Frontend)

## D.1 El repo ya está en GitHub

Amplify se conecta directo al repo — no necesitas subir nada manualmente, solo tener el último `git push` hecho (ver [D.4](#d4-variables-de-entorno) para las URLs de API Gateway que vas a necesitar del paso C.5).

## D.2 Crear la app en Amplify

Consola AWS → **AWS Amplify → New app → Host web app**.
- Elige **GitHub** → autoriza a AWS Amplify sobre tu cuenta/org de GitHub si te lo pide.
- Selecciona el repositorio `CloudCommerce` y la rama `main`.

## D.3 Configurar como monorepo (el frontend vive en `frontend/`)

En el paso de configuración de build, activa **"Monorepo"** (o "This repository contains multiple apps" según la versión de consola) y pon:
- **App root directory**: `frontend`

En modo Monorepo, Amplify exige el build spec con la clave `applications:` (uno por sub-app) y lo busca en la **raíz del repo**, no dentro de `frontend/` — por eso está commiteado como [`amplify.yml`](amplify.yml) en la raíz, no dentro de `frontend/`. Si la consola te propone un spec propio sin la clave `applications`, vas a ver el error `CustomerError: Monorepo spec provided without "applications" key` al compilar — bórralo y pega este en **App settings → Build settings → Edit**:
```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

## D.4 Variables de entorno

En el mismo asistente (o después en **App settings → Environment variables**), agrega, con las URLs del paso C.5:
```
VITE_PRODUCTOS_API_URL = https://abc123xyz.execute-api.us-east-1.amazonaws.com/productos-api
VITE_USUARIOS_API_URL  = https://abc123xyz.execute-api.us-east-1.amazonaws.com/usuarios-api
```
Vite solo incrusta variables `VITE_*` **en tiempo de build** — si las cambias después, tienes que redeployar (Amplify Console → tu app → **Redeploy this version**, o hacer un nuevo commit/push).

## D.5 Deploy

**Save and deploy**. Amplify clona el repo, instala dependencias, corre `npm run build` y publica el contenido de `dist/`. Tarda 2-5 minutos la primera vez. Al terminar te da una URL del tipo:
```
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

## D.6 Verificar

Abre esa URL en el navegador y confirma que carga productos y usuarios (Network tab → peticiones a `execute-api.amazonaws.com`, código 200, `Type: json`). Cada `git push` a `main` dispara un redeploy automático de Amplify — no hace falta repetir estos pasos, solo D.4 si cambian las URLs de API Gateway.

---

# Parte E — Arquitectura de Producción Final (Hito 2)

> ✅ **Ejecutada y verificada en producción.** Esta sección queda como referencia/repetible (por ejemplo, si el AWS Academy Lab se reinicia y hay que rearmar todo desde cero) — no es solo un plan.

Esto reemplaza la MV Backend única de las Partes A-C por lo que pide el enunciado: **2 Máquinas Virtuales de Producción** (los 4 microservicios repartidos) + **balanceador de carga privado** + **3ra Máquina Virtual solo para las bases de datos, privada** (no pública). API Gateway pasa a apuntar al balanceador, no directo a una EC2.

```
                          Internet
                             │
                    API Gateway (https, público)
                             │
                    VPC Link (privado)
                             │
              Balanceador de carga interno (ALB, sin IP pública)
                 ┌───────────┴────────────┐
        MV Producción 1              MV Producción 2
        (cloudcommerce-backend)      (cloudcommerce-prod2)
        ├─ ms-productos :8001        ├─ ms-pedidos  :8003
        └─ ms-usuarios  :8002        └─ ms-checkout :8004
                 │                            │
                 └──────────┬─────────────────┘
                             │ (privado)
                    MV BD (cloudcommerce-bd, privada)
                    ├─ mysql-productos :3306
                    ├─ postgres-usuarios :5432
                    └─ mongo-pedidos :27017
```

**Antes de empezar:** anota la IP privada de `cloudcommerce-backend` (ya la tienes de la Parte A.6) y la de `cloudcommerce-ingesta` — las vas a necesitar para varios pasos.

## E.1 Lanzar la MV BD (3ra instancia, privada)

**EC2 → Launch instance**:

| Campo | Valor |
|---|---|
| **Name** | `cloudcommerce-bd` |
| **AMI** | Ubuntu Server 26.04 LTS |
| **Instance type** | `t3.medium` (corre las 3 bases de datos a la vez) |
| **Key pair** | La misma que usas para las demás |
| **Network settings → VPC/subred** | La **misma VPC y subred** que `cloudcommerce-backend` |
| **Advanced details → IAM instance profile** | Déjalo vacío (no necesita S3) |

### Security Group de `cloudcommerce-bd` (100% privado, sin `0.0.0.0/0`)

| Type | Port | Source | Para qué |
|---|---|---|---|
| SSH | 22 | My IP | Para administrarla |
| Custom TCP | 3306 | IP privada `cloudcommerce-backend`/32 | `ms-productos` (MySQL) |
| Custom TCP | 5432 | IP privada `cloudcommerce-backend`/32 | `ms-usuarios` (PostgreSQL) |
| Custom TCP | 27017 | IP privada `cloudcommerce-prod2` (Mongo, la agregas en E.2) | `ms-pedidos` |
| Custom TCP | 3306, 5432, 27017 | IP privada `cloudcommerce-ingesta`/32 | Para que la ingesta siga leyendo (agrega las 3, una regla por puerto) |

**No le asignes IP pública** al lanzarla (o si Academy te la da igual, no la uses para nada — todo el tráfico real entra por IP privada).

Conéctate por **EC2 Instance Connect** (no necesita IP pública) o por SSH saltando desde `cloudcommerce-backend` (`ssh -J ubuntu@<ip-publica-backend> ubuntu@<ip-privada-bd>`).

## E.2 Lanzar la MV Producción 2 (`ms-pedidos` + `ms-checkout`)

**EC2 → Launch instance**:

| Campo | Valor |
|---|---|
| **Name** | `cloudcommerce-prod2` |
| **AMI** | Ubuntu Server 26.04 LTS |
| **Instance type** | `t3.small` (2 apps livianas, sin BD local) |
| **Network settings → VPC/subred** | La misma VPC/subred que las otras 2 |
| **Storage** | 15-20 GB |

### Security Group de `cloudcommerce-prod2`

| Type | Port | Source | Para qué |
|---|---|---|---|
| SSH | 22 | My IP | Administrarla |
| Custom TCP | 8003 | Security Group del balanceador (lo creas en E.6, vuelve a esta regla después) | `ms-pedidos` |
| Custom TCP | 8004 | Security Group del balanceador | `ms-checkout` |

⚠️ **No abras 8003/8004 a `0.0.0.0/0`** — solo el balanceador debe poder llegar, por eso el *source* es su Security Group (lo agregas en E.6, esta regla queda pendiente hasta entonces; mientras tanto usa temporalmente tu IP para poder probar por tu cuenta).

Instala Docker/Git igual que en la Parte A.3, clona el repo (A.4), y anota su **IP privada** (A.6) — la necesitas para el Security Group de `cloudcommerce-bd` (E.1) y para que `cloudcommerce-backend` reciba llamadas de vuelta si alguna vez hiciera falta.

## E.3 Reconfigurar `cloudcommerce-backend` como MV Producción 1 (solo productos + usuarios)

Por SSH en `cloudcommerce-backend`:

```bash
cd ~/CloudCommerce/backend/docker-compose
docker compose down          # baja TODO, incluidas las BD de esta VM
git pull                     # trae el docker-compose.yml con ms-pedidos/ms-checkout (rama mergeada)
```

Edita `docker-compose.yml` en esta EC2 para que **solo** levante `ms-productos` y `ms-usuarios`, apuntando a la nueva `cloudcommerce-bd` en vez de a los contenedores locales de MySQL/Postgres:

```bash
nano docker-compose.yml
```
- Borra los servicios `mysql-productos`, `postgres-usuarios`, `mongodb-pedidos`, `ms-pedidos`, `ms-checkout` (y sus volúmenes) de este archivo — esos ya no viven aquí.
- Cambia las variables de `ms-productos`/`ms-usuarios` para que apunten a la IP privada de `cloudcommerce-bd`:
```yaml
  ms-productos:
    build: ../ms-productos
    environment:
      DATABASE_URL: mysql+pymysql://productos_user:productos_pass@<IP-PRIVADA-cloudcommerce-bd>:3306/productos_db
    ports:
      - "8001:8000"

  ms-usuarios:
    build: ../ms-usuarios
    environment:
      DATABASE_URL: jdbc:postgresql://<IP-PRIVADA-cloudcommerce-bd>:5432/usuarios_db
      DATABASE_USER: usuarios_user
      DATABASE_PASSWORD: usuarios_pass
    ports:
      - "8002:8000"
```

```bash
docker compose up -d --build
```

## E.4 Levantar las bases de datos en la MV BD

En `cloudcommerce-bd` (por SSH), instala Docker/Git (Parte A.3) y clona el repo (A.4) — lo necesitas para construir las imágenes de sembrado de este paso, aunque las apps en sí no vivan en esta VM.

Crea un `docker-compose.yml` solo con las 3 bases de datos:

```bash
mkdir -p ~/db && cd ~/db
nano docker-compose.yml
```
```yaml
services:
  mysql-productos:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_pass
      MYSQL_DATABASE: productos_db
      MYSQL_USER: productos_user
      MYSQL_PASSWORD: productos_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_productos_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot_pass"]
      interval: 10s
      timeout: 5s
      retries: 10

  postgres-usuarios:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: usuarios_db
      POSTGRES_USER: usuarios_user
      POSTGRES_PASSWORD: usuarios_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_usuarios_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U usuarios_user -d usuarios_db"]
      interval: 10s
      timeout: 5s
      retries: 10

  mongodb-pedidos:
    image: mongo:7
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_pedidos_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  mysql_productos_data:
  postgres_usuarios_data:
  mongodb_pedidos_data:
```
⚠️ A diferencia del `docker-compose.yml` original del repo (donde `mongodb-pedidos` no publica el puerto al host porque `ms-pedidos` lo alcanza por red interna de Compose, en la misma VM), **aquí sí hace falta `ports: "27017:27017"`** — `ms-pedidos` va a vivir en otra VM (`cloudcommerce-prod2`) y necesita llegar por IP:puerto real, no por nombre de servicio.

```bash
docker compose up -d
docker compose ps   # las 3 deben decir "healthy" y mostrar 0.0.0.0:puerto->puerto en PORTS
```

**Sembrado — sin tocar `cloudcommerce-backend`:** usa contenedores sueltos, construidos desde el código del repo, que se conectan a `localhost` de esta misma VM (los 3 puertos ya están publicados al host por el `docker-compose.yml` de arriba) y se descartan al terminar:

```bash
cd ~/CloudCommerce/backend/ms-productos
docker build -t seed-productos .
docker run --rm --network host \
  -e DATABASE_URL="mysql+pymysql://productos_user:productos_pass@localhost:3306/productos_db" \
  seed-productos python -m app.seed
```

```bash
cd ~/CloudCommerce/backend/ms-usuarios
docker build -t seed-usuarios .
docker run --rm --network host \
  -e DATABASE_URL="jdbc:postgresql://localhost:5432/usuarios_db" \
  -e DATABASE_USER=usuarios_user \
  -e DATABASE_PASSWORD=usuarios_pass \
  -e SEED_COUNT=20000 \
  seed-usuarios
```
Este segundo levanta el server completo de Spring Boot (no hay forma de correr *solo* el seeder) — el `DataSeeder` corre apenas arranca; espera a ver en el log algo como `Sembrados 20000 usuarios` (o que dejen de aparecer líneas nuevas ~30-60s) y luego `Ctrl+C` para pararlo. No hace falta que quede corriendo aquí — el server real de `ms-usuarios` va a vivir en `cloudcommerce-backend` (Parte E.3).

Mongo no necesita este paso todavía — se siembra directo desde `cloudcommerce-prod2` en E.5, apuntando ya a esta VM.

Verifica antes de seguir:
```bash
docker run --rm --network host -e DATABASE_URL="mysql+pymysql://productos_user:productos_pass@localhost:3306/productos_db" seed-productos python -c "from app.database import SessionLocal; from app.models import Producto; print(SessionLocal().query(Producto).count())"
```
Debe imprimir `20000` (o más, si ya insertaste antes).

## E.5 Levantar `ms-pedidos` + `ms-checkout` en la MV Producción 2

Por SSH en `cloudcommerce-prod2`, crea su propio `docker-compose.yml` (solo estos 2 servicios, sin bases de datos):

```yaml
services:
  ms-pedidos:
    build: ../ms-pedidos
    restart: unless-stopped
    environment:
      MONGODB_URL: mongodb://<IP-PRIVADA-cloudcommerce-bd>:27017/pedidos_db
      PRODUCTOS_URL: http://<IP-PRIVADA-cloudcommerce-backend>:8001
      USUARIOS_URL: http://<IP-PRIVADA-cloudcommerce-backend>:8002
    ports:
      - "8003:8000"

  ms-checkout:
    build: ../ms-checkout
    restart: unless-stopped
    environment:
      PRODUCTOS_URL: http://<IP-PRIVADA-cloudcommerce-backend>:8001
      USUARIOS_URL: http://<IP-PRIVADA-cloudcommerce-backend>:8002
      PEDIDOS_URL: http://localhost:8003
    ports:
      - "8004:8000"
```

⚠️ Nota el cambio: como `ms-productos`/`ms-usuarios` ya no están en la misma red de Docker Compose que `ms-pedidos`/`ms-checkout` (están en otra VM), las URLs pasan de `http://ms-productos:8000` (nombre del servicio) a `http://<IP-privada>:8001` (host:puerto real). También hace falta abrir en el Security Group de `cloudcommerce-backend` los puertos 8001/8002 con *source* = IP privada de `cloudcommerce-prod2`/32, además de la regla que ya tiene para el balanceador.

```bash
docker compose up -d --build
docker compose exec ms-pedidos node scripts/seedPedidos.js
```

## E.6 Crear el Balanceador de Carga interno (privado)

**Consola AWS → EC2 → Load Balancers → Create load balancer → Application Load Balancer**:

- **Name:** `cloudcommerce-lb`
- **Scheme:** **Internal** (esto es lo que lo hace privado — no le asigna IP pública)
- **VPC / subredes:** las mismas 3 subredes donde están tus EC2 (necesitas al menos 2 subredes de la misma VPC por requisito de ALB)
- **Security group:** crea uno nuevo, `sg-balanceador`, sin reglas de entrada desde `0.0.0.0/0` — luego permite que **API Gateway le llegue vía VPC Link** (E.7 se encarga del lado de red; el SG del balanceador debe permitir entrada en 8001-8004 desde el SG que use el VPC Link, o más simple: desde el CIDR de la VPC).

**Listeners y Target Groups** (repite 4 veces, uno por microservicio):

| Listener port | Target group | Target | Health check path |
|---|---|---|---|
| 8001 | `tg-productos` | `cloudcommerce-backend` : 8001 | `/health` |
| 8002 | `tg-usuarios` | `cloudcommerce-backend` : 8002 | `/health` |
| 8003 | `tg-pedidos` | `cloudcommerce-prod2` : 8003 | `/health` |
| 8004 | `tg-checkout` | `cloudcommerce-prod2` : 8004 | `/health` |

Para cada uno: **Target groups → Create target group** (tipo *Instances*, protocolo HTTP, el puerto correspondiente, health check `/health`) → registra la instancia correspondiente en ese puerto → luego en el ALB agrega un **Listener** en ese mismo puerto que reenvíe a ese target group.

Verifica que los 4 target groups queden **Healthy** antes de seguir (Target Groups → cada uno → pestaña Targets).

Ahora sí vuelve a los Security Groups de `cloudcommerce-backend` y `cloudcommerce-prod2` (E.2/E.3) y cambia el *source* de las reglas 8001-8004 a `sg-balanceador` (el Security Group del ALB), quitando cualquier acceso directo desde tu IP que hayas dejado para probar.

## E.7 Crear un VPC Link (para que API Gateway llegue al balanceador privado)

API Gateway vive fuera de tu VPC — necesita un **VPC Link** para alcanzar un ALB interno.

**API Gateway → VPC Links → Create**:
- **Name:** `cloudcommerce-vpclink`
- **VPC Link for:** HTTP API
- **Subnets:** las mismas donde vive el balanceador
- **Security group:** el mismo `sg-balanceador` (o uno que tenga acceso a él)

Tarda unos minutos en pasar a estado **Available**.

## E.8 Actualizar las rutas de API Gateway

En tu API (`cloudcommerce-api`, la misma de la Parte C):

**Para las rutas existentes** (`/productos-api/{proxy+}`, `/usuarios-api/{proxy+}`): entra a cada una → **Integration details → Edit** → cambia:
- **Integration type:** `Private`
- **Integration target:** el ARN del listener/target group correspondiente del ALB, o el DNS del ALB según el asistente
- **VPC Link:** `cloudcommerce-vpclink`

**Rutas nuevas** (una por microservicio nuevo):
- `ANY /pedidos-api/{proxy+}` → integración privada vía `cloudcommerce-vpclink` → apunta al listener 8003 del balanceador
- `ANY /checkout-api/{proxy+}` → integración privada vía `cloudcommerce-vpclink` → apunta al listener 8004 del balanceador

Habilita CORS en estas 2 rutas nuevas igual que en C.2.

## E.9 Actualizar Amplify

**App settings → Environment variables**, agrega:
```
VITE_PEDIDOS_API_URL  = https://<api-id>.execute-api.us-east-1.amazonaws.com/pedidos-api
VITE_CHECKOUT_API_URL = https://<api-id>.execute-api.us-east-1.amazonaws.com/checkout-api
```
**Redeploy this version** (o haz un commit/push cualquiera a `main`).

## E.10 Actualizar la ingesta (la BD se mudó de VM)

En `cloudcommerce-ingesta`, actualiza `DB_HOST` en `.env` de `ingesta-productos` e `ingesta-usuarios` a la **IP privada de `cloudcommerce-bd`** (ya no la de `cloudcommerce-backend`), y vuelve a correrlos. `ingesta-pedidos` (si aún no existe, es trabajo pendiente aparte) también apuntaría ahí, a Mongo.

## E.11 Verificar todo end-to-end

```bash
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/productos-api/health
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/usuarios-api/health
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/pedidos-api/health
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/checkout-api/health
```
Los 4 deben responder 200. Luego abre tu URL de Amplify y prueba las 3 pestañas (Productos, Usuarios, Pedidos) igual que en local.

---

# Parte F — Migración a redundancia real (ambas VM con los 5 microservicios)

> ✅ **Ejecutada y verificada en producción**, incluyendo prueba real de failover.

La Parte E reparte los 5 microservicios entre las 2 MV de producción (cada uno vive en una sola VM). Esta parte los **redunda**: cada una de las 2 MV de producción termina con una copia completa de los 5, y el balanceador reparte/hace failover entre ambas. Es posible sin duplicar datos porque las 3 bases de datos ya viven centralizadas en la 3ra MV (`cloudcommerce-bd`) desde la Parte E — ambas copias de cada microservicio apuntan a la misma base.

```
Balanceador (5 listeners, cada uno con 2 targets: uno por VM)
        │
        ├── MV Producción 1 (cloudcommerce-backend): los 5 microservicios
        └── MV Producción 2 (cloudcommerce-prod2):   los 5 microservicios
                    │                                        │
                    └──────────────── IP privada ────────────┘
                                       │
                          3ra MV: bases de datos (cloudcommerce-bd)
```

## F.1 Desplegar los 5 microservicios en ambas VM

En **cada** VM de producción (`cloudcommerce-backend` y `cloudcommerce-prod2`), reemplaza el `docker-compose.yml` por el mismo archivo completo con los 5 servicios, todos apuntando a `cloudcommerce-bd` (usa su IP privada) y comunicándose entre sí **por nombre de servicio de Docker** (se ajusta a URL del balanceador en el paso F.4):

```bash
cd ~/CloudCommerce
git pull   # o `git checkout -- backend/docker-compose/docker-compose.yml && git pull` si se queja de cambios locales
cd backend/docker-compose
rm docker-compose.yml
nano docker-compose.yml
```
```yaml
services:
  ms-productos:
    build: ../ms-productos
    restart: unless-stopped
    environment:
      DATABASE_URL: mysql+pymysql://productos_user:productos_pass@<IP-PRIVADA-cloudcommerce-bd>:3306/productos_db
    ports:
      - "8001:8000"

  ms-usuarios:
    build: ../ms-usuarios
    restart: unless-stopped
    environment:
      DATABASE_URL: jdbc:postgresql://<IP-PRIVADA-cloudcommerce-bd>:5432/usuarios_db
      DATABASE_USER: usuarios_user
      DATABASE_PASSWORD: usuarios_pass
    ports:
      - "8002:8000"

  ms-pedidos:
    build: ../ms-pedidos
    restart: unless-stopped
    environment:
      MONGODB_URL: mongodb://<IP-PRIVADA-cloudcommerce-bd>:27017/pedidos_db
      PRODUCTOS_URL: http://ms-productos:8000
      USUARIOS_URL: http://ms-usuarios:8000
    ports:
      - "8003:8000"

  ms-checkout:
    build: ../ms-checkout
    restart: unless-stopped
    environment:
      PRODUCTOS_URL: http://ms-productos:8000
      USUARIOS_URL: http://ms-usuarios:8000
      PEDIDOS_URL: http://ms-pedidos:8000
    ports:
      - "8004:8000"

  ms-analitica:
    build: ../ms-analitica
    restart: unless-stopped
    environment:
      ATHENA_MODE: real
      ATHENA_DATABASE: cloudcommerce_datalake
      ATHENA_OUTPUT_S3: s3://cloudcommerce-datalake/athena-results/
      AWS_DEFAULT_REGION: us-east-1
    ports:
      - "8005:8000"
```
```bash
docker compose up -d --build
```

⚠️ Si la VM no tiene el rol IAM `LabInstanceProfile` (necesario para `ms-analitica`), asígnalo: **EC2 → Instances → (la instancia) → Actions → Security → Modify IAM role**.

Verifica los 5 en cada VM (`curl localhost:8001/health` ... `:8005/analitica/ventas-por-categoria`).

## F.2 Security Groups — permitir la "otra mitad"

Cada VM ahora corre servicios que antes no tenía, así que necesita permisos que antes no necesitaba:

- **`cloudcommerce-bd`**: agrega reglas para que **ambas** VM de producción lleguen a los 3 puertos de BD (3306, 5432, 27017) — antes cada puerto solo lo tenía habilitado una de las 2 VM.
- **Security Group de `cloudcommerce-backend`**: agrega 8003, 8004, 8005 con *source* = `sg-balanceador` (antes solo tenía 8001/8002).
- **Security Group de `cloudcommerce-prod2`**: agrega 8001, 8002 con *source* = `sg-balanceador` (antes solo tenía 8003/8004/8005).

Verifica con una llamada real (no solo `/health`, que en algunos servicios no prueba la BD) — por ejemplo `curl localhost:8003/usuarios/1/pedidos` en la VM que antes no tenía Mongo.

## F.3 Registrar el 2do target en cada Target Group

**EC2 → Target Groups** → cada uno de los 5 (`tg-productos`, `tg-usuarios`, `tg-pedidos`, `tg-checkout`, `tg-analitica`) → **Register targets** → agrega la instancia que le faltaba, mismo puerto. Cada grupo debe quedar con **2 de 2 `Healthy`**.

## F.4 Apuntar las llamadas internas al balanceador, no a la copia local

Con el paso F.1, `ms-pedidos`/`ms-checkout` le hablan a la copia **local** de `ms-productos`/`ms-usuarios` (incluso port 8000, dentro de la misma red de docker compose) — si esa copia local se cae, no aprovechan la otra VM. Cambia eso al DNS interno del balanceador (**EC2 → Load Balancers → `cloudcommerce-lb`** → copia el "Nombre de DNS"):

En **ambas** VM, edita `docker-compose.yml`:
```yaml
  ms-pedidos:
    environment:
      MONGODB_URL: mongodb://<IP-PRIVADA-cloudcommerce-bd>:27017/pedidos_db
      PRODUCTOS_URL: http://<DNS-DEL-BALANCEADOR>:8001
      USUARIOS_URL: http://<DNS-DEL-BALANCEADOR>:8002

  ms-checkout:
    environment:
      PRODUCTOS_URL: http://<DNS-DEL-BALANCEADOR>:8001
      USUARIOS_URL: http://<DNS-DEL-BALANCEADOR>:8002
      PEDIDOS_URL: http://<DNS-DEL-BALANCEADOR>:8003
```
```bash
docker compose up -d --build ms-pedidos ms-checkout
```

Verifica que una llamada que dispara comunicación interna real siga funcionando, por ejemplo:
```bash
curl -X POST localhost:8004/checkout/resumen \
  -H "Content-Type: application/json" \
  -d '{"id_usuario":1,"items":[{"id_producto":3914,"cantidad":1}]}'
```

## F.5 Probar el failover de verdad

En una de las 2 VM:
```bash
docker compose stop ms-productos
```
Desde tu laptop, contra la URL pública de API Gateway (no la EC2):
```bash
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/productos-api/health
```
Debe seguir respondiendo `200 OK` — el balanceador enruta a la copia sana de la otra VM. Repite un par de veces para confirmar, y vuelve a levantar el contenedor:
```bash
docker compose start ms-productos
```

---

## Reinicio rápido (ya con todo instalado)

Si ya hiciste los pasos de las Partes A y B una vez, retomar el trabajo en una sesión nueva es corto. **Prende primero la MV Backend**, luego la MV Ingesta (necesitas su IP para el frontend y, si cambió, para reconfigurar `.env` de la ingesta).

### MV Backend
1. AWS Console → EC2 → **Start instance** (`cloudcommerce-backend`). Espera ~30-60 seg y copia la **Public IPv4** actual.
2. Conéctate por SSH o EC2 Instance Connect.
3. Verifica que los contenedores ya están arriba (`restart: unless-stopped` los revive solos):
   ```bash
   docker ps
   ```
   Si no aparecen `ms-productos`, `ms-usuarios`, `mysql-productos`, `postgres-usuarios`:
   ```bash
   cd ~/CloudCommerce/backend/docker-compose
   docker compose up -d      # sin --build, las imágenes ya existen
   ```
   Confirma con `curl localhost:8001/health` y `curl localhost:8002/health`.

### MV Ingesta
1. AWS Console → EC2 → **Start instance** (`cloudcommerce-ingesta`).
2. Si la **IP privada de la MV Backend cambió**, actualiza `DB_HOST` en `data-science/ingesta-productos/.env` y `data-science/ingesta-usuarios/.env`, y la regla del Security Group del paso B.4.
3. Vuelve a correr la ingesta cuando quieras refrescar los datos en S3:
   ```bash
   cd ~/CloudCommerce/data-science
   docker compose run --rm ingesta-productos
   docker compose run --rm ingesta-usuarios
   ```

### Frontend (en tu laptop)
Si la IP pública de la MV Backend cambió, actualiza `frontend/.env`; si no, solo `npm run dev`.

### 💡 Sugerencia: Elastic IP para no repetir el paso del `.env`

Sin Elastic IP, la IP pública de una EC2 cambia cada vez que la detienes y la vuelves a prender. Asígnale una Elastic IP a la **MV Backend** (EC2 → Elastic IPs → Allocate → Associate) para no tener que editar `frontend/.env` en cada sesión. Las IPs **privadas** normalmente sí se mantienen fijas mientras no borres la instancia, así que `DB_HOST` en la ingesta rara vez necesita cambiar.

---

## Troubleshooting

### "Failed to fetch" en el frontend

Sigue este orden:

1. **¿El contenedor está arriba?** (en la MV Backend)
   ```bash
   docker compose ps
   ```
   Si `ms-productos`/`ms-usuarios` no dice `running`/`healthy`, revisa sus logs:
   ```bash
   docker compose logs --tail=100 ms-usuarios
   ```
   (Spring Boot puede tardar unos minutos en levantar la primera vez.)

2. **¿Responde dentro de la MV Backend?**
   ```bash
   curl -v localhost:8001/health
   curl -v localhost:8002/health
   ```
   Si esto falla, el problema es el contenedor (paso 1). Si funciona, sigue al punto 3.

3. **¿Responde desde afuera?** Desde tu laptop:
   ```bash
   curl -v http://<ip-publica-mv-backend>:8001/health
   curl -v http://<ip-publica-mv-backend>:8002/health
   ```
   Si da timeout/connection refused aquí pero funcionó en el paso 2, **falta abrir el puerto correspondiente en el Security Group de la MV Backend** (causa más común).

4. **¿El `.env` del frontend apunta bien?**
   ```bash
   cat frontend/.env
   ```
   Debe usar la IP pública de la MV Backend (no `localhost`) y el puerto correcto para cada servicio. Si lo editaste, **reinicia** `npm run dev` — Vite solo lee `.env` al arrancar.

5. **¿Estás viendo la app en la vista previa del editor?** Ábrela en una ventana de navegador real — el webview de VS Code puede bloquear los `fetch` aunque todo lo demás esté bien.

### La ingesta falla con timeout/connection refused al conectar a la BD

- Confirma que **ambas MV están en la misma VPC/subred** (si usaste la VPC default de Academy para las dos, ya lo están).
- Confirma que el Security Group de la **MV Backend** tiene las reglas de entrada 3306 y 5432 con source = IP privada de la MV Ingesta (paso B.4), no la IP pública.
- Confirma que `DB_HOST` en el `.env` de cada ingesta es la IP **privada** de la MV Backend, y que no cambió tras un reinicio de esa instancia.
- Prueba conectividad cruda desde la MV Ingesta: `nc -zv <ip-privada-mv-backend> 3306` y `... 5432`.

### La ingesta falla al subir a S3 (credenciales)

- Verifica que la MV Ingesta tenga el **IAM instance profile** `LabInstanceProfile` asociado (EC2 → Instances → selecciona la instancia → Actions → Security → Modify IAM role, si falta).
- Confirma que `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` estén **vacíos** en el `.env` (si tienen un valor viejo/inválido, boto3 los usa en vez del rol).
- Prueba desde la MV Ingesta (fuera de Docker): `aws sts get-caller-identity` — debe responder con el rol del lab, no un error.

### `mvn`/build de `ms-usuarios` muy lento o falla por memoria

Usa `t3.medium` o superior (mínimo 4 GB RAM) para la **MV Backend**. Con menos memoria, la compilación de Maven dentro del `docker compose up --build` puede colgarse o el contenedor puede reiniciarse en loop.

---

## Troubleshooting de API Gateway / Amplify

### "There was an issue setting up your repository" / 403 "Resource not accessible by integration"

Amplify no pudo crear el webhook en GitHub — falta permiso de **Admin** sobre el repo para la cuenta/App que estás usando para conectar. Revisa que la cuenta de GitHub sea dueña o Admin del repo, y que la GitHub App "AWS Amplify" tenga acceso concedido a `CloudCommerce` (github.com/settings/installations → AWS Amplify → Configure → Repository access).

### `CustomerError: Monorepo spec provided without "applications" key`

Pasa cuando `AMPLIFY_MONOREPO_APP_ROOT` está seteado (modo Monorepo activado) pero el build spec que Amplify está usando no tiene la clave `applications:`. Ve a **App settings → Build settings → Edit** y pega el YAML del paso D.3 (con `applications:` y `appRoot: frontend`) — no el spec de una sola app que la consola pudo haber generado por default.

### El frontend en Amplify no carga datos (pero local sí)

1. **Revisa las variables de entorno en Amplify** (App settings → Environment variables) — deben ser las URLs de API Gateway (`.../productos-api`, `.../usuarios-api`), no `ip:puerto` directo.
2. Si acabas de cambiarlas, **redeploya** — Vite las incrusta en build time, no en runtime.
3. **DevTools → Network** en el sitio de Amplify: si las peticiones a `execute-api.amazonaws.com` dan error 5xx, el problema está entre API Gateway y la MV Backend (ver punto 4). Si ni siquiera aparecen, revisa que el `.env`/variables tengan la URL bien escrita.
4. `curl` las URLs de API Gateway (paso C.6) directo — si fallan ahí también, casi siempre es la **Integration URL apuntando a una IP pública vieja** de la MV Backend (se detiene/enciende sin Elastic IP). Actualízala en API Gateway → Routes → Integration details.

---

## Qué falta para la entrega final (Hito 2)

- [x] Implementar `ms-pedidos` (Node.js + MongoDB) y `ms-checkout` (sin BD) — PR [#5](https://github.com/DaniSandt1/CloudCommerce/pull/5)
- [x] Implementar `ms-analitica` Fase A (mock) y Fase B (`ATHENA_MODE=real`, desplegado en `cloudcommerce-prod2` y verificado contra los 20,000 pedidos reales) — issue [#4](https://github.com/DaniSandt1/CloudCommerce/issues/4)
- [x] AWS API Gateway (https) público delante del backend — las 5 rutas (productos/usuarios/pedidos/checkout/analitica)
- [x] Desplegar el frontend en AWS Amplify — con las pestañas Productos, Usuarios, Pedidos y Analítica
- [x] Desplegar los 5 microservicios en 2 MV de producción + balanceador de carga privado — **Parte E ejecutada**, luego **migrado a redundancia real en la Parte F**: los 5 microservicios corren completos en `cloudcommerce-backend` **y** `cloudcommerce-prod2`, cada Target Group con 2 targets sanos, failover probado en vivo
- [x] Mover las bases de datos a una 3ra MV privada (no pública) — `cloudcommerce-bd`, sin IP pública en uso, solo accesible por IP privada desde ambas MV de producción y la de ingesta
- [x] Apuntar el API Gateway al balanceador de carga vía VPC Link — las 5 rutas usan integración `Private` a través de `cloudcommerce-vpclink`
- [x] Rutas de API Gateway + variables de Amplify para `ms-pedidos`/`ms-checkout`/`ms-analitica`
- [x] MV "ingesta" dedicada para los contenedores de ingesta — los 3 (`ingesta-productos`, `ingesta-usuarios`, `ingesta-pedidos`)
- [x] AWS Glue (catálogo de datos, base `cloudcommerce_datalake`) + diagrama E/R del catálogo — evidencia en el informe
- [x] Mínimo 4 consultas SQL + 2 vistas en Athena — evidencia en el informe
- [x] Diagrama de Arquitectura de Solución en draw.io — [arquitectura.drawio](docs/diagrama-arquitectura/arquitectura.drawio), con ambas MV corriendo los 5 microservicios (redundancia), y diagramas E/R en [er_ecommerce.drawio](docs/diagrama-arquitectura/er_ecommerce.drawio)
- [x] Documentación Swagger-UI — 5/5 APIs (`ms-productos` `/docs`, `ms-usuarios` `/swagger-ui.html`, `ms-pedidos` `/docs`, `ms-checkout` `/docs`, `ms-analitica` `/docs`)
- [x] Informe y presentación finales — informe en [docs/informe/](docs/informe/), presentación en [Canva](https://canva.link/3yddmf71wzvmqpe)
