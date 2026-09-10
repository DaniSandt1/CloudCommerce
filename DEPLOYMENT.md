# Guía de Despliegue en AWS (AWS Academy Learner Lab)

Esta guía cubre todo lo necesario para levantar el backend en una instancia EC2, correr el frontend contra ella, y subir los datos a S3 — el alcance de la **primera entrega** (2 microservicios + frontend + ingesta a S3). Pensada para que cualquiera que clone este repo pueda reproducirlo sin depender de configuración previa.

## Prerrequisitos

- Cuenta de AWS Academy (Learner Lab) con la sesión iniciada ("Start Lab").
- Este repositorio clonado o accesible en GitHub.
- Docker **no** es necesario en tu máquina local para esta parte — todo el backend corre dentro de la instancia EC2. Localmente solo necesitas Node.js para correr el frontend.

---

## 1. Lanzar la instancia EC2

En la consola de AWS → **EC2 → Launch instance**, configura:

| Campo | Valor | Por qué |
|---|---|---|
| **Name** | `cloudcommerce-backend` | Identificarla fácilmente |
| **AMI** | Ubuntu Server 22.04 LTS | Facilita instalar Docker/Git con `apt` |
| **Instance type** | `t3.medium` (2 vCPU / 4 GB RAM) | Corre 2 bases de datos + 2 apps a la vez; con `t2.micro` (1 GB RAM) se queda sin memoria, sobre todo compilando `ms-usuarios` (Maven + JDK) |
| **Key pair** | Crea una nueva (RSA, `.pem`) o usa la `vockey` de tu lab | La necesitas para SSH — descárgala, no se puede volver a descargar |
| **Network settings → Security group** | Ver tabla abajo | Para poder acceder por SSH y probar las APIs desde tu navegador |
| **Storage** | Sube de 8 GB (default) a **20–30 GB** | Las imágenes Docker (mysql, postgres, maven+jdk) + volúmenes de datos pesan más de lo que parece |
| **Advanced details → IAM instance profile** | `LabInstanceProfile` (el rol que trae tu Learner Lab) | Da permisos de S3/Glue a la instancia sin tener que manejar credenciales a mano — lo necesitarás en el paso de ingesta a S3 |

### Reglas del Security Group

| Type | Port range | Source | Para qué |
|---|---|---|---|
| SSH | 22 | My IP (o `0.0.0.0/0` si no tienes IP fija) | Conectarte por terminal |
| Custom TCP | 8001 | `0.0.0.0/0` | Probar `ms-productos` desde tu navegador/frontend |
| Custom TCP | 8002 | `0.0.0.0/0` | Probar `ms-usuarios` desde tu navegador/frontend |

⚠️ En AWS Academy Learner Lab, al terminar la sesión la instancia se **detiene** (no se borra), pero pierde la IP pública si no le asignas una **Elastic IP**. Si quieres que la IP no cambie entre sesiones (útil para la asesoría con el ACL), asígnale una Elastic IP desde EC2 → Elastic IPs → Allocate → Associate.

---

## 2. Conectarte a la instancia

**Opción A — EC2 Instance Connect** (desde el navegador, botón "Connect" en la consola de EC2): no necesita el `.pem`, ideal para pruebas rápidas.

**Opción B — SSH desde tu terminal:**
```bash
chmod 400 tu-key.pem
ssh -i tu-key.pem ubuntu@<ip-publica-de-la-instancia>
```

---

## Reinicio rápido (ya con todo instalado)

Si ya hiciste los pasos 1-7 una vez (Docker, repo clonado, microservicios corriendo, ingesta a S3), retomar el trabajo en una sesión nueva es mucho más corto:

1. **Prender la EC2** (si estaba detenida): AWS Console → EC2 → **Start instance**. Espera ~30-60 seg y copia la **Public IPv4** actual.
2. **Conectarte** por SSH (paso 2) o EC2 Instance Connect.
3. **Verificar que los contenedores ya están arriba** — como el `docker-compose.yml` tiene `restart: unless-stopped`, Docker los vuelve a levantar solos apenas arranca el daemon junto con la instancia:
   ```bash
   docker ps
   ```
   Si ya ves `ms-productos`, `ms-usuarios`, `mysql-productos` y `postgres-usuarios` corriendo, no hace falta nada más. Si no aparecen:
   ```bash
   cd ~/CloudCommerce/backend/docker-compose
   docker compose up -d      # sin --build, las imágenes ya existen
   ```
   Confirma con `curl localhost:8001/health` y `curl localhost:8002/health`.
4. **Frontend** (en tu laptop): si la IP pública cambió, actualiza `frontend/.env` con la IP nueva; si no cambió, solo corre `npm run dev`.

### 💡 Sugerencia: asígnale una Elastic IP para no repetir el paso del `.env`

Sin Elastic IP, la IP pública de la EC2 cambia cada vez que la detienes y la vuelves a prender, obligándote a editar `frontend/.env` (y, si ya montaste el API Gateway del paso 8, también sus integraciones) en cada sesión.

**EC2 → Elastic IPs → Allocate Elastic IP address → Allocate** → luego **Actions → Associate Elastic IP address** → selecciona tu instancia.

Con la Elastic IP asociada, la IP queda fija entre inicios/detenciones y configuras `frontend/.env` (y el API Gateway) una sola vez.

---

## 3. Instalar Docker y Git

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
```
Cierra la sesión SSH y vuelve a entrar para que el grupo `docker` tome efecto (evita tener que usar `sudo` en cada comando docker).

Verifica:
```bash
docker --version
docker compose version
```

---

## 4. Clonar el repositorio

```bash
git clone https://github.com/<tu-usuario>/CloudCommerce.git
cd CloudCommerce
```

---

## 5. Levantar los microservicios

```bash
cd backend/docker-compose
docker compose up -d --build
```

La primera vez tarda varios minutos: descarga las imágenes de MySQL/PostgreSQL y compila `ms-usuarios` con Maven dentro del Dockerfile. Verifica el progreso:
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
Desde tu navegador (con la IP pública de la instancia):
```
http://<ip-publica-ec2>:8001/docs             # Swagger de ms-productos
http://<ip-publica-ec2>:8002/swagger-ui.html  # Swagger de ms-usuarios
```

---

## 6. Correr el frontend (local, apuntando a la EC2)

El frontend corre en tu propia máquina (no en la EC2) para esta entrega — ver la sección **"¿Por qué el frontend no va en Amplify todavía?"** más abajo.

```bash
cd frontend
cp .env.example .env
```
Edita `.env` y reemplaza `localhost` por la IP pública de tu EC2:
```
VITE_PRODUCTOS_API_URL=http://<ip-publica-ec2>:8001
VITE_USUARIOS_API_URL=http://<ip-publica-ec2>:8002
```
```bash
npm install
npm run dev
```

Abre la URL que te indique (normalmente `http://localhost:5173`) **en una ventana de navegador normal** (Chrome/Edge/Firefox) — no en la vista previa integrada de tu editor (VS Code "Simple Browser"), porque su webview sandboxeado puede bloquear los `fetch` y mostrar "Failed to fetch" aunque el backend esté perfectamente accesible.

---

## 7. Crear el bucket S3 y subir los datos (ingesta)

### 7.1 Crear el bucket

Consola: **S3 → Create bucket** → nombre único globalmente (ej. `cloudcommerce-datalake-tunombre123`), misma región que tu EC2 (normalmente `us-east-1` en Academy).

O por CLI desde la EC2 (ya tiene permisos por el `LabInstanceProfile`):
```bash
aws s3 mb s3://cloudcommerce-datalake-tunombre123 --region us-east-1
```

### 7.2 Correr las ingestas

Se ejecutan **directo en la EC2** (no dentro de Docker), para que tomen las credenciales del rol IAM automáticamente vía el servicio de metadata de la instancia, y usando los puertos de las bases de datos ya publicados al host (3306 y 5432).

```bash
sudo apt install -y python3-pip python3-venv

cd ~/CloudCommerce/data-science/ingesta-productos
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env
```
Deja en el `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=productos_user
DB_PASSWORD=productos_pass
DB_NAME=productos_db

S3_BUCKET_NAME=cloudcommerce-datalake-tunombre123
S3_PREFIX=productos

AWS_DEFAULT_REGION=us-east-1
```
**Borra o deja vacías** las líneas `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — al correr en la EC2, boto3 toma las credenciales del rol IAM automáticamente.

```bash
export $(grep -v '^#' .env | xargs)
python ingesta.py
deactivate
```

Repite lo mismo para usuarios:
```bash
cd ~/CloudCommerce/data-science/ingesta-usuarios
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env
```
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuarios_user
DB_PASSWORD=usuarios_pass
DB_NAME=usuarios_db

S3_BUCKET_NAME=cloudcommerce-datalake-tunombre123
S3_PREFIX=usuarios

AWS_DEFAULT_REGION=us-east-1
```
```bash
export $(grep -v '^#' .env | xargs)
python ingesta.py
```

### 7.3 Verificar

```bash
aws s3 ls s3://cloudcommerce-datalake-tunombre123/productos/
aws s3 ls s3://cloudcommerce-datalake-tunombre123/usuarios/
```
Deberías ver un `.csv` en cada carpeta (también visible desde la consola de S3 — sirve como captura para el informe).

---

## Troubleshooting

### "Failed to fetch" en el frontend

Sigue este orden:

1. **¿El contenedor está arriba?**
   ```bash
   docker compose ps
   ```
   Si `ms-productos`/`ms-usuarios` no dice `running`/`healthy`, revisa sus logs:
   ```bash
   docker compose logs --tail=100 ms-usuarios
   ```
   (Spring Boot puede tardar unos minutos en levantar la primera vez.)

2. **¿Responde dentro de la EC2?**
   ```bash
   curl -v localhost:8001/health
   curl -v localhost:8002/health
   ```
   Si esto falla, el problema es el contenedor (paso 1). Si funciona, sigue al punto 3.

3. **¿Responde desde afuera?** Desde tu laptop:
   ```bash
   curl -v http://<ip-publica-ec2>:8001/health
   curl -v http://<ip-publica-ec2>:8002/health
   ```
   Si da timeout/connection refused aquí pero funcionó en el paso 2, **falta abrir el puerto correspondiente en el Security Group** (causa más común).

4. **¿El `.env` del frontend apunta bien?**
   ```bash
   cat frontend/.env
   ```
   Debe usar la IP pública de la EC2 (no `localhost`) y el puerto correcto para cada servicio. Si lo editaste, **reinicia** `npm run dev` — Vite solo lee `.env` al arrancar.

5. **¿Estás viendo la app en la vista previa del editor?** Ábrela en una ventana de navegador real (ver sección 6) — el webview de VS Code puede bloquear los `fetch` aunque todo lo demás esté bien.

### `mvn`/build de `ms-usuarios` muy lento o falla por memoria

Usa `t3.medium` o superior (mínimo 4 GB RAM). Con menos memoria, la compilación de Maven dentro del `docker compose up --build` puede colgarse o el contenedor puede reiniciarse en loop.

---

## ¿Por qué el frontend no va en AWS Amplify todavía?

Amplify sirve la web siempre por **HTTPS**. El backend en la EC2 responde por **HTTP plano** (sin certificado). Si el frontend estuviera en Amplify (https) y llamara a `http://<ip-ec2>:8001`, el navegador bloquearía la petición por **mixed content** — el mismo "Failed to fetch" pero por otra causa, y esta vez no hay forma de arreglarlo desde el frontend.

Por eso el enunciado pide montar **AWS API Gateway** (que expone las APIs por https) delante del backend antes de desplegar en Amplify. Ese es el orden para la entrega final (Hito 2):

1. Poner API Gateway (https) delante de los microservicios en la EC2.
2. Actualizar `frontend/.env` para usar las URLs de API Gateway en vez de `ip:puerto` directo.
3. Recién ahí desplegar el frontend en AWS Amplify.

Para esta primera entrega, correr el frontend en `localhost` (http) contra la EC2 (http) es válido y evita el problema de mixed content.

---

## Qué falta para la entrega final (Hito 2)

- [ ] Implementar `ms-pedidos` (Node.js + MongoDB), `ms-checkout` (sin BD) y `ms-analitica` (Athena)
- [ ] Repartir los 5 microservicios en 2 MV de producción + balanceador de carga privado
- [ ] Mover las bases de datos a una 3ra MV privada (no pública)
- [ ] AWS API Gateway (https) público delante del balanceador
- [ ] Desplegar el frontend en AWS Amplify (después del API Gateway)
- [ ] MV "ingesta" dedicada para los 3 contenedores de ingesta
- [ ] AWS Glue (catálogo de datos) + diagrama E/R del catálogo
- [ ] Mínimo 4 consultas SQL + 2 vistas en Athena
- [ ] Diagrama de Arquitectura de Solución en draw.io
- [ ] Documentación Swagger-UI de las 5 APIs
- [ ] Informe y presentación finales
