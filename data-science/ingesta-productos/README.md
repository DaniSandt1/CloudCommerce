# ingesta-productos

Contenedor Docker en Python que hace *pull* del 100% de los registros de la tabla `productos` (MySQL, de `ms-productos`), genera un CSV y lo sube al bucket S3. **Implementado para la primera entrega.**

## Cómo correr

```bash
cp .env.example .env   # completar credenciales AWS y S3_BUCKET_NAME
pip install -r requirements.txt
python ingesta.py
```

O con Docker (conectado a la misma red del `docker-compose` del backend):

```bash
docker build -t ingesta-productos .
docker run --rm --network docker-compose_default --env-file .env ingesta-productos
```

## Estado

✅ Bucket `cloudcommerce-datalake` creado y probado — ejecutado desde la EC2, sube correctamente el CSV con los 20,000 productos a `s3://cloudcommerce-datalake/productos/`.

## Pendiente

- [ ] Mover la ejecución a una MV "ingesta" dedicada (por ahora corre en la misma EC2 del backend)
