# Frontend — Web E-commerce

Página web (React + Vite + Tailwind CSS) que consume los 5 microservicios del backend: Productos (`ms-productos`), Usuarios (`ms-usuarios`), Pedidos (`ms-pedidos`, con el flujo de compra pasando por `ms-checkout`) y Analítica (`ms-analitica`).

## Diseño

Inspirado en el layout de `idea_frontend/` (carpeta de referencia, no forma parte del build): barra superior fija con logo, navegación en pastillas y buscador; grilla de productos estilo catálogo con modal de detalle; lista de usuarios con avatares. Como no tenemos fotos de producto reales, las imágenes se reemplazan por bloques de color con gradiente (`src/lib/palette.js`) — cada producto/usuario siempre cae en el mismo color (hash por id).

Paleta usada (clases de Tailwind, sin config custom):
- **Acento de marca:** `indigo-600` (nav activo, botones primarios, foco de inputs)
- **Base neutra:** `zinc-*` (fondo, texto, bordes) — look minimalista de catálogo
- **Placeholders de imagen:** rotación de 8 gradientes (`indigo`, `emerald`, `amber`, `rose`, `sky`, `violet`, `teal`, `orange`) para que la grilla tenga variedad visual sin fotos reales

Features:
- **Productos:** paginado y búsqueda server-side por nombre, filtro por categoría (chips), modal de detalle, alta de producto ("+ Nuevo producto").
- **Usuarios:** paginado y búsqueda server-side por nombre/email, alta de usuario ("+ Nuevo usuario").
- **Pedidos:** busca los pedidos de un usuario por su ID (usa el mismo buscador de la barra superior), detalle de cada pedido en modal, y un flujo de **"Nuevo pedido"** que arma un carrito simple (ID de producto + cantidad) y lo procesa vía `ms-checkout` — primero `POST /checkout/resumen` para previsualizar precios/stock, luego `POST /checkout/confirmar` para crear el pedido de verdad (que a su vez lo persiste en `ms-pedidos`).
- **Analítica:** ventas por categoría, top clientes por monto comprado (con selector de cuántos mostrar) y consulta de pedidos por rango de fechas — sin buscador propio (se oculta en esta pestaña).

## Cómo correr localmente

```bash
cd frontend
npm install
cp .env.example .env   # ajustar URLs si es necesario
npm run dev
```

Requiere `ms-productos` (8001), `ms-usuarios` (8002), `ms-pedidos` (8003), `ms-checkout` (8004) y `ms-analitica` (8005) corriendo — ver [backend/docker-compose](../backend/docker-compose/).

## Métodos REST invocados por microservicio

- `ms-productos`: `GET /productos`, `GET /categorias`, `POST /productos`
- `ms-usuarios`: `GET /usuarios`, `POST /usuarios`
- `ms-pedidos`: `GET /usuarios/{id}/pedidos`, `GET /pedidos/{id}`
- `ms-checkout`: `POST /checkout/resumen`, `POST /checkout/confirmar`
- `ms-analitica`: `GET /analitica/ventas-por-categoria`, `GET /analitica/top-clientes`, `GET /analitica/pedidos-por-rango`

## Pendiente (para la entrega final)

- [ ] Despliegue en AWS Amplify (agregar `VITE_ANALITICA_API_URL` a las variables de entorno)
- [ ] Repositorio público en GitHub (enlace aquí)
