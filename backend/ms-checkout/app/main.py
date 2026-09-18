from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import checkout, services
from .schemas import CheckoutInput, CheckoutResumen

app = FastAPI(
    title="ms-checkout",
    description=(
        "Microservicio sin base de datos que orquesta ms-productos, "
        "ms-usuarios y ms-pedidos."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(services.DependencyNotFoundError)
async def dependency_not_found_handler(
    request: Request, exc: services.DependencyNotFoundError
):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(services.DependencyUnavailableError)
async def dependency_unavailable_handler(
    request: Request, exc: services.DependencyUnavailableError
):
    return JSONResponse(status_code=502, content={"detail": str(exc)})


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "ms-checkout", "database": "none"}


@app.post(
    "/checkout/resumen",
    response_model=CheckoutResumen,
    tags=["checkout"],
    summary="Valida y calcula el checkout sin crear un pedido",
)
async def resumen(entrada: CheckoutInput):
    return await checkout.construir_resumen(entrada)


@app.post(
    "/checkout/confirmar",
    status_code=201,
    tags=["checkout"],
    summary="Valida el checkout y crea el pedido mediante ms-pedidos",
)
async def confirmar(entrada: CheckoutInput):
    return await checkout.confirmar_checkout(entrada)


@app.get(
    "/checkout/pedidos/{id_pedido}",
    tags=["checkout"],
    summary="Obtiene un pedido enriquecido con usuario y productos",
)
async def detalle_pedido(id_pedido: str):
    return await checkout.obtener_detalle_pedido(id_pedido)
