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

## Pendiente

- [ ] Crear el bucket S3 real en AWS y configurar `S3_BUCKET_NAME`
- [ ] Ejecutar desde la MV Ingesta
