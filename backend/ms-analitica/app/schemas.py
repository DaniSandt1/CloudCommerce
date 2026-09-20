from pydantic import BaseModel, Field


class VentaPorCategoria(BaseModel):
    categoria: str
    total_vendido: float = Field(ge=0)


class TopCliente(BaseModel):
    id_usuario: int
    nombre: str
    email: str
    total_comprado: float = Field(ge=0)


class PedidosPorRango(BaseModel):
    cantidad_pedidos: int = Field(ge=0)
    monto_total: float = Field(ge=0)
