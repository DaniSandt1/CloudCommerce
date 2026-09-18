import asyncio
from typing import Any, Dict, List

from fastapi import HTTPException

from . import services
from .schemas import CheckoutInput, CheckoutResumen, ItemResumen, UsuarioResumen


async def construir_resumen(entrada: CheckoutInput) -> CheckoutResumen:
    resultados = await asyncio.gather(
        services.obtener_usuario(entrada.id_usuario),
        *(services.obtener_producto(item.id_producto) for item in entrada.items),
    )
    usuario, *productos = resultados

    items_resumen: List[ItemResumen] = []
    for item, producto in zip(entrada.items, productos):
        if producto["stock"] < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Stock insuficiente para {producto['nombre']}: "
                    f"disponible {producto['stock']}"
                ),
            )
        subtotal = round(float(producto["precio"]) * item.cantidad, 2)
        items_resumen.append(
            ItemResumen(
                id_producto=producto["id"],
                nombre=producto["nombre"],
                cantidad=item.cantidad,
                precio_unitario=producto["precio"],
                subtotal=subtotal,
                stock_disponible=producto["stock"],
            )
        )

    return CheckoutResumen(
        usuario=UsuarioResumen(
            id=usuario["id"], nombre=usuario["nombre"], email=usuario["email"]
        ),
        items=items_resumen,
        total=round(sum(item.subtotal for item in items_resumen), 2),
    )


async def confirmar_checkout(entrada: CheckoutInput) -> Dict[str, Any]:
    resumen = await construir_resumen(entrada)
    pedido = await services.crear_pedido(entrada.model_dump())
    return {
        "mensaje": "Checkout confirmado",
        "pedido": pedido,
        "resumen": resumen.model_dump(),
    }


async def obtener_detalle_pedido(id_pedido: str) -> Dict[str, Any]:
    pedido = await services.obtener_pedido(id_pedido)
    resultados = await asyncio.gather(
        services.obtener_usuario(pedido["id_usuario"]),
        *(services.obtener_producto(item["id_producto"]) for item in pedido["items"]),
    )
    usuario, *productos = resultados
    return {
        "pedido": pedido,
        "usuario": {
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "email": usuario["email"],
        },
        "items": [
            {**item, "nombre": producto["nombre"]}
            for item, producto in zip(pedido["items"], productos)
        ],
    }
