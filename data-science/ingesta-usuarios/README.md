# ingesta-usuarios

Contenedor Docker en Python que hace *pull* del 100% de los registros de las tablas `usuarios`/`direcciones` (PostgreSQL, de `ms-usuarios`), genera un CSV y lo sube al bucket S3. **Implementado para la primera entrega.**

## Cómo correr

```bash
cp .env.example .env   # completar credenciales AWS y S3_BUCKET_NAME
pip install -r requirements.txt
python ingesta.py
```

O con Docker (conectado a la misma red del `docker-compose` del backend):

```bash
docker build -t ingesta-usuarios .
docker run --rm --network docker-compose_default --env-file .env ingesta-usuarios
```

## Estado

✅ Bucket `cloudcommerce-datalake` creado y probado — ejecutado desde la EC2, sube correctamente el CSV con los 20,000 usuarios (+ direcciones) a `s3://cloudcommerce-datalake/usuarios/`.

## Pendiente

- [ ] Mover la ejecución a una MV "ingesta" dedicada (por ahora corre en la misma EC2 del backend)
