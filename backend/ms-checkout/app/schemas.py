from typing import List

from pydantic import BaseModel, Field, field_validator


class CheckoutItemInput(BaseModel):
    id_producto: int = Field(gt=0, examples=[45])
    cantidad: int = Field(gt=0, examples=[2])


class CheckoutInput(BaseModel):
    id_usuario: int = Field(gt=0, examples=[123])
    items: List[CheckoutItemInput] = Field(min_length=1)

    @field_validator("items")
    @classmethod
    def productos_no_repetidos(cls, items: List[CheckoutItemInput]):
        ids = [item.id_producto for item in items]
        if len(ids) != len(set(ids)):
            raise ValueError("No se permiten productos repetidos")
        return items


class UsuarioResumen(BaseModel):
    id: int
    nombre: str
    email: str


class ItemResumen(BaseModel):
    id_producto: int
    nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float
    stock_disponible: int


class CheckoutResumen(BaseModel):
    usuario: UsuarioResumen
    items: List[ItemResumen]
    total: float
    moneda: str = "PEN"
