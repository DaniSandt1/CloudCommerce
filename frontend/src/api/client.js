const PRODUCTOS_API_URL = import.meta.env.VITE_PRODUCTOS_API_URL || "http://localhost:8001";
const USUARIOS_API_URL = import.meta.env.VITE_USUARIOS_API_URL || "http://localhost:8002";

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Error ${res.status} en ${url}`);
  }
  return res.json();
}

export const productosApi = {
  listar: (categoriaId) => {
    const query = categoriaId ? `?categoria_id=${categoriaId}` : "";
    return request(`${PRODUCTOS_API_URL}/productos${query}`);
  },
  listarCategorias: () => request(`${PRODUCTOS_API_URL}/categorias`),
  crear: (producto) =>
    request(`${PRODUCTOS_API_URL}/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto),
    }),
};

export const usuariosApi = {
  listar: (page = 0, size = 20, q = "") => {
    const params = new URLSearchParams({ page, size });
    if (q) params.set("q", q);
    return request(`${USUARIOS_API_URL}/usuarios?${params.toString()}`);
  },
  crear: (usuario) =>
    request(`${USUARIOS_API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    }),
};
