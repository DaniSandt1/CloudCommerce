const PRODUCTOS_API_URL = import.meta.env.VITE_PRODUCTOS_API_URL || "http://localhost:8001";
const USUARIOS_API_URL = import.meta.env.VITE_USUARIOS_API_URL || "http://localhost:8002";
const PEDIDOS_API_URL = import.meta.env.VITE_PEDIDOS_API_URL || "http://localhost:8003";
const CHECKOUT_API_URL = import.meta.env.VITE_CHECKOUT_API_URL || "http://localhost:8004";

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail || body?.error;
    throw new Error(detail || `Error ${res.status} en ${url}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function postJSON(url, payload) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export const productosApi = {
  listar: (page = 0, size = 30, q = "", categoriaId) => {
    const params = new URLSearchParams({ page, size });
    if (q) params.set("q", q);
    if (categoriaId) params.set("categoria_id", categoriaId);
    return request(`${PRODUCTOS_API_URL}/productos?${params.toString()}`);
  },
  listarCategorias: () => request(`${PRODUCTOS_API_URL}/categorias`),
  crear: (producto) => postJSON(`${PRODUCTOS_API_URL}/productos`, producto),
};

export const usuariosApi = {
  listar: (page = 0, size = 20, q = "") => {
    const params = new URLSearchParams({ page, size });
    if (q) params.set("q", q);
    return request(`${USUARIOS_API_URL}/usuarios?${params.toString()}`);
  },
  crear: (usuario) => postJSON(`${USUARIOS_API_URL}/usuarios`, usuario),
};

export const pedidosApi = {
  porUsuario: (idUsuario) => request(`${PEDIDOS_API_URL}/usuarios/${idUsuario}/pedidos`),
  porId: (id) => request(`${PEDIDOS_API_URL}/pedidos/${id}`),
};

export const checkoutApi = {
  resumen: (payload) => postJSON(`${CHECKOUT_API_URL}/checkout/resumen`, payload),
  confirmar: (payload) => postJSON(`${CHECKOUT_API_URL}/checkout/confirmar`, payload),
};
