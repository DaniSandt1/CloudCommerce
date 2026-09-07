import { useEffect, useState } from "react";
import { productosApi } from "../api/client";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productosApi
      .listarCategorias()
      .then(setCategorias)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    productosApi
      .listar(categoriaId || undefined)
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [categoriaId]);

  return (
    <section>
      <h2>Catálogo de productos</h2>
      <p>Consume ms-productos (Python/FastAPI + MySQL)</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <label>
        Filtrar por categoría:{" "}
        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nombre}</td>
                <td>S/ {p.precio}</td>
                <td>{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
