# Frontend — Web E-commerce

Página web (React + Vite + Tailwind CSS) que consume los microservicios del backend. **Implementado para la primera entrega:** vistas de Productos (ms-productos) y Usuarios (ms-usuarios).

## Diseño

Inspirado en el layout de `idea_frontend/` (carpeta de referencia, no forma parte del build): barra superior fija con logo, navegación en pastillas y buscador; grilla de productos estilo catálogo con modal de detalle; lista de usuarios con avatares. Como no tenemos fotos de producto reales, las imágenes se reemplazan por bloques de color con gradiente (`src/lib/palette.js`) — cada producto/usuario siempre cae en el mismo color (hash por id).

Paleta usada (clases de Tailwind, sin config custom):
- **Acento de marca:** `indigo-600` (nav activo, botones primarios, foco de inputs)
- **Base neutra:** `zinc-*` (fondo, texto, bordes) — look minimalista de catálogo
- **Placeholders de imagen:** rotación de 8 gradientes (`indigo`, `emerald`, `amber`, `rose`, `sky`, `violet`, `teal`, `orange`) para que la grilla tenga variedad visual sin fotos reales

Features:
- Buscador (filtra productos por nombre / usuarios por nombre o email, client-side sobre lo ya cargado)
- Filtro por categoría (chips) en Productos
- Modal de detalle de producto
- Alta de usuario en un panel colapsable ("+ Nuevo usuario")

## Cómo correr localmente

```bash
cd frontend
npm install
cp .env.example .env   # ajustar URLs si es necesario
npm run dev
```

Requiere que `ms-productos` (puerto 8001) y `ms-usuarios` (puerto 8002) estén corriendo — ver [backend/docker-compose](../backend/docker-compose/).

## Pendiente (para la entrega final)

- [ ] Vistas para ms-pedidos, ms-checkout y ms-analitica
- [ ] Al menos 2 métodos REST invocados por cada uno de los 5 microservicios
- [ ] Despliegue en AWS Amplify (ver issue [#1](https://github.com/DaniSandt1/CloudCommerce/issues/1) — requiere API Gateway primero)
- [ ] Repositorio público en GitHub (enlace aquí)
