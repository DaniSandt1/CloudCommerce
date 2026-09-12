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
| **AMI** | Ubuntu Server 22.04 LTS | Facilita instalar Docker/Git con `apt` |
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
sudo apt install -y docker.io docker-compose-plugin git
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
| **AMI** | Ubuntu Server 22.04 LTS | Igual que la MV Backend |
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
sudo apt install -y docker.io docker-compose-plugin git
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

## 6. Correr el frontend (local, apuntando a la MV Backend)

El frontend corre en tu propia máquina (no en ninguna EC2) para esta entrega — ver la sección **"¿Por qué el frontend no va en Amplify todavía?"** más abajo.

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

## ¿Por qué el frontend no va en AWS Amplify todavía?

Amplify sirve la web siempre por **HTTPS**. El backend en la MV Backend responde por **HTTP plano** (sin certificado). Si el frontend estuviera en Amplify (https) y llamara a `http://<ip-mv-backend>:8001`, el navegador bloquearía la petición por **mixed content** — el mismo "Failed to fetch" pero por otra causa, y esta vez no hay forma de arreglarlo desde el frontend.

Por eso el enunciado pide montar **AWS API Gateway** (que expone las APIs por https) delante del backend antes de desplegar en Amplify. Ese es el orden para la entrega final (Hito 2):

1. Poner API Gateway (https) delante de los microservicios repartidos en las 2 MV de producción + balanceador.
2. Actualizar `frontend/.env` para usar las URLs de API Gateway en vez de `ip:puerto` directo.
3. Recién ahí desplegar el frontend en AWS Amplify.

Para este avance, correr el frontend en `localhost` (http) contra la MV Backend (http) es válido y evita el problema de mixed content.

---

## Qué falta para la entrega final (Hito 2)

- [ ] Implementar `ms-pedidos` (Node.js + MongoDB), `ms-checkout` (sin BD) y `ms-analitica` (Athena)
- [ ] Repartir los 5 microservicios en 2 MV de producción + balanceador de carga privado
- [ ] Mover las bases de datos a una 3ra MV privada (no pública)
- [ ] AWS API Gateway (https) público delante del balanceador
- [ ] Desplegar el frontend en AWS Amplify (después del API Gateway)
- [x] MV "ingesta" dedicada para los contenedores de ingesta (`ingesta-productos`, `ingesta-usuarios`) — falta `ingesta-pedidos` cuando exista `ms-pedidos`
- [ ] AWS Glue (catálogo de datos) + diagrama E/R del catálogo
- [ ] Mínimo 4 consultas SQL + 2 vistas en Athena
- [ ] Diagrama de Arquitectura de Solución en draw.io
- [ ] Documentación Swagger-UI de las 5 APIs
- [ ] Informe y presentación finales
