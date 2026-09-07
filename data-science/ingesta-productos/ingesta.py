"""Ingesta pull del 100% de la tabla `productos` (MySQL de ms-productos) hacia S3.

Genera un archivo CSV con timestamp y lo sube al bucket S3 configurado.
"""
import csv
import io
import os
from datetime import datetime, timezone

import boto3
import pymysql

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "productos_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "productos_pass")
DB_NAME = os.getenv("DB_NAME", "productos_db")

S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_PREFIX = os.getenv("S3_PREFIX", "productos")


def extraer_productos():
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock,
                       p.categoria_id, c.nombre AS categoria_nombre, p.creado_en
                FROM productos p
                JOIN categorias c ON c.id = p.categoria_id
                """
            )
            return cursor.fetchall()
    finally:
        conn.close()


def filas_a_csv(filas):
    buffer = io.StringIO()
    if not filas:
        return buffer.getvalue()
    writer = csv.DictWriter(buffer, fieldnames=filas[0].keys())
    writer.writeheader()
    for fila in filas:
        writer.writerow(fila)
    return buffer.getvalue()


def subir_a_s3(contenido_csv: str, key: str):
    if not S3_BUCKET:
        raise RuntimeError("Falta la variable de entorno S3_BUCKET_NAME")
    s3 = boto3.client("s3")
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=contenido_csv.encode("utf-8"))
    print(f"Subido s3://{S3_BUCKET}/{key}")


def main():
    filas = extraer_productos()
    print(f"Extraídos {len(filas)} productos de MySQL.")
    csv_contenido = filas_a_csv(filas)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    key = f"{S3_PREFIX}/productos_{timestamp}.csv"
    subir_a_s3(csv_contenido, key)


if __name__ == "__main__":
    main()
