"""Carga masiva de datos ficticios en la base de datos de ms-productos.

Uso:
    python -m app.seed                # inserta 20000 productos (default)
    SEED_COUNT=1000 python -m app.seed  # inserta una cantidad distinta
"""
import os
import random

from faker import Faker

from .database import Base, SessionLocal, engine
from .models import Categoria, Producto

fake = Faker("es_ES")

CATEGORIAS = [
    "Electrónica",
    "Hogar",
    "Ropa",
    "Deportes",
    "Juguetes",
    "Libros",
    "Belleza",
    "Alimentos",
]


def seed(cantidad: int = 20000) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        categorias = db.query(Categoria).all()
        if not categorias:
            categorias = [Categoria(nombre=nombre) for nombre in CATEGORIAS]
            db.add_all(categorias)
            db.commit()
            categorias = db.query(Categoria).all()

        ya_existentes = db.query(Producto).count()
        if ya_existentes >= cantidad:
            print(f"Ya existen {ya_existentes} productos, no se inserta nada más.")
            return

        faltantes = cantidad - ya_existentes
        lote = []
        for i in range(faltantes):
            lote.append(
                Producto(
                    nombre=fake.catch_phrase()[:150],
                    descripcion=fake.sentence(nb_words=10),
                    precio=round(random.uniform(5, 2000), 2),
                    stock=random.randint(0, 500),
                    categoria_id=random.choice(categorias).id,
                )
            )
            if len(lote) >= 1000:
                db.bulk_save_objects(lote)
                db.commit()
                print(f"Insertados {i + 1}/{faltantes}")
                lote = []
        if lote:
            db.bulk_save_objects(lote)
            db.commit()
        print(f"Listo. Total productos en BD: {db.query(Producto).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    seed(int(os.getenv("SEED_COUNT", "20000")))
