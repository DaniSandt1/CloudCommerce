from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import Base, SessionLocal, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ms-productos",
    description="Microservicio de catálogo de productos del e-commerce (CloudCommerce).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def root():
    return {"service": "ms-productos", "status": "ok"}


@app.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)):
    return {"status": "ok", "total_productos": crud.count_productos(db)}


@app.get("/categorias", response_model=List[schemas.Categoria], tags=["categorias"])
def listar_categorias(db: Session = Depends(get_db)):
    return crud.get_categorias(db)


@app.post("/categorias", response_model=schemas.Categoria, tags=["categorias"])
def crear_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    return crud.create_categoria(db, categoria)


@app.get("/productos", response_model=List[schemas.Producto], tags=["productos"])
def listar_productos(
    skip: int = 0,
    limit: int = 50,
    categoria_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return crud.get_productos(db, skip=skip, limit=limit, categoria_id=categoria_id)


@app.get("/productos/{producto_id}", response_model=schemas.Producto, tags=["productos"])
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    db_producto = crud.get_producto(db, producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_producto


@app.post("/productos", response_model=schemas.Producto, tags=["productos"])
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    return crud.create_producto(db, producto)
