from typing import Optional

from sqlalchemy.orm import Session

from . import models, schemas


def get_categorias(db: Session):
    return db.query(models.Categoria).all()


def create_categoria(db: Session, categoria: schemas.CategoriaCreate):
    db_categoria = models.Categoria(nombre=categoria.nombre)
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria


def get_productos(
    db: Session, skip: int = 0, limit: int = 50, categoria_id: Optional[int] = None
):
    query = db.query(models.Producto)
    if categoria_id is not None:
        query = query.filter(models.Producto.categoria_id == categoria_id)
    return query.offset(skip).limit(limit).all()


def get_producto(db: Session, producto_id: int):
    return db.query(models.Producto).filter(models.Producto.id == producto_id).first()


def create_producto(db: Session, producto: schemas.ProductoCreate):
    db_producto = models.Producto(**producto.model_dump())
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto


def count_productos(db: Session) -> int:
    return db.query(models.Producto).count()
