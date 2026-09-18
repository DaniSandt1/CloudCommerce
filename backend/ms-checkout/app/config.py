import os

PRODUCTOS_URL = os.getenv("PRODUCTOS_URL", "http://localhost:8001").rstrip("/")
USUARIOS_URL = os.getenv("USUARIOS_URL", "http://localhost:8002").rstrip("/")
PEDIDOS_URL = os.getenv("PEDIDOS_URL", "http://localhost:8003").rstrip("/")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "5"))
