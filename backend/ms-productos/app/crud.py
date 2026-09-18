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


def _filtrar_productos(db: Session, categoria_id: Optional[int], q: Optional[str]):
    query = db.query(models.Producto)
    if categoria_id is not None:
        query = query.filter(models.Producto.categoria_id == categoria_id)
    if q:
        query = query.filter(models.Producto.nombre.ilike(f"%{q}%"))
    return query


def get_productos(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    categoria_id: Optional[int] = None,
    q: Optional[str] = None,
):
    query = _filtrar_productos(db, categoria_id, q)
    return query.order_by(models.Producto.id.desc()).offset(skip).limit(limit).all()


def count_productos_filtrados(
    db: Session, categoria_id: Optional[int] = None, q: Optional[str] = None
) -> int:
    return _filtrar_productos(db, categoria_id, q).count()


def get_producto(db: Session, producto_id: int):
    return db.query(models.Producto).filter(models.Producto.id == producto_id).first()


def create_producto(db: Session, producto: schemas.ProductoCreate):
    db_producto = models.Producto(**producto.model_dump())
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto


def update_producto(db: Session, producto_id: int, producto: schemas.ProductoCreate):
    db_producto = get_producto(db, producto_id)
    if db_producto is None:
        return None
    for campo, valor in producto.model_dump().items():
        setattr(db_producto, campo, valor)
    db.commit()
    db.refresh(db_producto)
    return db_producto


def delete_producto(db: Session, producto_id: int) -> bool:
    db_producto = get_producto(db, producto_id)
    if db_producto is None:
        return False
    db.delete(db_producto)
    db.commit()
    return True


def count_productos(db: Session) -> int:
    return db.query(models.Producto).count()
