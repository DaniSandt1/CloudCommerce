from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CategoriaBase(BaseModel):
    nombre: str


class CategoriaCreate(CategoriaBase):
    pass


class Categoria(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int = 0
    categoria_id: int


class ProductoCreate(ProductoBase):
    pass


class Producto(ProductoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    creado_en: Optional[datetime] = None
