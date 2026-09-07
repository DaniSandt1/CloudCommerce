# Frontend — Web E-commerce

Página web (React + Vite) que consume los microservicios del backend. **Implementado para la primera entrega:** vistas de Productos (ms-productos) y Usuarios (ms-usuarios).

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
- [ ] Despliegue en AWS Amplify
- [ ] Repositorio público en GitHub (enlace aquí)
