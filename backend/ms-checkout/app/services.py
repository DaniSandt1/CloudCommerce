from typing import Any, Dict

import httpx

from . import config


class DependencyNotFoundError(Exception):
    """Un recurso no existe en uno de los microservicios dependientes."""


class DependencyUnavailableError(Exception):
    """No fue posible comunicarse correctamente con una dependencia."""


async def _request(method: str, url: str, **kwargs) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.request(method, url, **kwargs)
            if response.status_code == 404:
                raise DependencyNotFoundError(f"Recurso no encontrado al consultar {url}")
            response.raise_for_status()
            return response.json()
    except DependencyNotFoundError:
        raise
    except (httpx.HTTPError, ValueError) as exc:
        raise DependencyUnavailableError(f"Error comunicándose con {url}") from exc


async def obtener_usuario(id_usuario: int) -> Dict[str, Any]:
    return await _request("GET", f"{config.USUARIOS_URL}/usuarios/{id_usuario}")


async def obtener_producto(id_producto: int) -> Dict[str, Any]:
    return await _request("GET", f"{config.PRODUCTOS_URL}/productos/{id_producto}")


async def crear_pedido(payload: Dict[str, Any]) -> Dict[str, Any]:
    return await _request("POST", f"{config.PEDIDOS_URL}/pedidos", json=payload)


async def obtener_pedido(id_pedido: str) -> Dict[str, Any]:
    return await _request("GET", f"{config.PEDIDOS_URL}/pedidos/{id_pedido}")
