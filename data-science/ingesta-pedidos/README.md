# ingesta-pedidos

Contenedor Docker en Python que hace *pull* del 100% de los documentos de la colección `pedidos` (MongoDB, de `ms-pedidos`), genera un JSON y lo sube al bucket S3. **Implementado.**

## Cómo correr

Corre como contenedor Docker en la **MV Ingesta** (EC2 separada). `MONGODB_URI` debe apuntar a la IP privada de la MV BD, no a `localhost` ni al nombre de un contenedor — ver [DEPLOYMENT.md](../../DEPLOYMENT.md).

```bash
cp .env.example .env   # completar MONGODB_URI (IP privada MV BD) y S3_BUCKET_NAME
cd ..                  # data-science/
docker compose build ingesta-pedidos
docker compose run --rm ingesta-pedidos
```

Las credenciales AWS se toman del rol IAM de la instancia (`LabInstanceProfile`) — deja vacíos `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` en `.env`.

## Formato de salida

A diferencia de `ingesta-productos`/`ingesta-usuarios` (CSV, tablas relacionales), acá se sube un **JSON** (array de documentos) porque `pedidos` tiene `items` embebidos — aplanarlo a CSV perdería esa estructura. El enunciado permite explícitamente csv o json.

## Estado

✅ Sube correctamente el JSON con los pedidos a `s3://cloudcommerce-datalake/pedidos/`.
