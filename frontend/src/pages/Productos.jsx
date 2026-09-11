import { useEffect, useMemo, useState } from "react";
import { productosApi } from "../api/client";
import CategoryChips from "../components/CategoryChips";
import ProductGrid from "../components/ProductGrid";
import ProductModal from "../components/ProductModal";

export default function Productos({ searchQuery }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [selected, setSelected] = useState(null);
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

  const filtrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [productos, searchQuery]);

  return (
    <section>
      <CategoryChips categorias={categorias} selectedId={categoriaId} onSelect={setCategoriaId} />

      {error && <p className="px-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="px-4 py-16 text-center text-sm text-zinc-500">Cargando productos...</p>
      ) : (
        <ProductGrid productos={filtrados} onSelect={setSelected} />
      )}

      {selected && (
        <ProductModal
          producto={selected}
          categoriaNombre={categorias.find((c) => c.id === selected.categoria_id)?.nombre}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
