"""Ingesta pull del 100% de la tabla `usuarios` (PostgreSQL de ms-usuarios) hacia S3.

Genera un archivo CSV con timestamp y lo sube al bucket S3 configurado.
No incluye password_hash (dato sensible).
"""
import csv
import io
import os
from datetime import datetime, timezone

import boto3
import psycopg
from psycopg.rows import dict_row

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "usuarios_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "usuarios_pass")
DB_NAME = os.getenv("DB_NAME", "usuarios_db")

S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_PREFIX = os.getenv("S3_PREFIX", "usuarios")


def extraer_usuarios():
    conn = psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
    )
    try:
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT u.id, u.nombre, u.email, u.fecha_registro,
                       d.calle, d.ciudad, d.pais
                FROM usuarios u
                LEFT JOIN direcciones d ON d.usuario_id = u.id
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
    filas = extraer_usuarios()
    print(f"Extraídos {len(filas)} registros (usuarios + direcciones) de PostgreSQL.")
    csv_contenido = filas_a_csv(filas)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    key = f"{S3_PREFIX}/usuarios_{timestamp}.csv"
    subir_a_s3(csv_contenido, key)


if __name__ == "__main__":
    main()
