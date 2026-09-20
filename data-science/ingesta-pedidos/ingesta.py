"""Ingesta pull del 100% de la colección `pedidos` (MongoDB de ms-pedidos) hacia S3.

Genera un archivo NDJSON (un documento JSON por línea, sin array envolvente)
con timestamp y lo sube al bucket S3 configurado. NDJSON en vez de un array
JSON es lo que permite que un crawler de AWS Glue / Athena lea cada pedido
como una fila independiente de la tabla, en vez de todo el archivo como una
sola fila.
"""
import json
import os
from datetime import datetime, timezone

import boto3
from pymongo import MongoClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/pedidos_db")

S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_PREFIX = os.getenv("S3_PREFIX", "pedidos")


def extraer_pedidos():
    client = MongoClient(MONGODB_URI)
    try:
        db = client.get_default_database()
        documentos = list(db.pedidos.find())
        for doc in documentos:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("fecha"), datetime):
                doc["fecha"] = doc["fecha"].isoformat()
        return documentos
    finally:
        client.close()


def subir_a_s3(contenido_json: str, key: str):
    if not S3_BUCKET:
        raise RuntimeError("Falta la variable de entorno S3_BUCKET_NAME")
    s3 = boto3.client("s3")
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=contenido_json.encode("utf-8"))
    print(f"Subido s3://{S3_BUCKET}/{key}")


def main():
    documentos = extraer_pedidos()
    print(f"Extraídos {len(documentos)} pedidos de MongoDB.")
    contenido = "\n".join(json.dumps(doc, ensure_ascii=False) for doc in documentos)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    key = f"{S3_PREFIX}/pedidos_{timestamp}.json"
    subir_a_s3(contenido, key)


if __name__ == "__main__":
    main()
