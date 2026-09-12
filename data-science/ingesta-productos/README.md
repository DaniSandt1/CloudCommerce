# ingesta-productos

Contenedor Docker en Python que hace *pull* del 100% de los registros de la tabla `productos` (MySQL, de `ms-productos`), genera un CSV y lo sube al bucket S3. **Implementado para la primera entrega.**

## Cómo correr

Corre como contenedor Docker en la **MV Ingesta** (EC2 separada de la MV Backend). `DB_HOST` debe apuntar a la IP privada de la MV Backend, no a `localhost` ni al nombre de un contenedor — ver [DEPLOYMENT.md](../../DEPLOYMENT.md).

```bash
cp .env.example .env   # completar DB_HOST (IP privada MV Backend) y S3_BUCKET_NAME
cd ..                  # data-science/
docker compose build ingesta-productos
docker compose run --rm ingesta-productos
```

Las credenciales AWS se toman del rol IAM de la instancia (`LabInstanceProfile`) — deja vacíos `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` en `.env`.

## Estado

✅ Bucket `cloudcommerce-datalake` creado y probado — sube correctamente el CSV con los 20,000 productos a `s3://cloudcommerce-datalake/productos/`.
✅ Separado a su propia MV Ingesta (ya no corre en la misma EC2 del backend).
