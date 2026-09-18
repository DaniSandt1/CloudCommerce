import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { productosApi } from "../api/client";
import CategoryChips from "../components/CategoryChips";
import ProductGrid from "../components/ProductGrid";
import ProductModal from "../components/ProductModal";

const PAGE_SIZE = 30;

const FORM_INICIAL = { nombre: "", descripcion: "", precio: "", stock: "", categoria_id: "" };

export default function Productos({ searchQuery }) {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], total_pages: 0, total_elements: 0 });
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    productosApi
      .listarCategorias()
      .then(setCategorias)
      .catch((e) => setError(e.message));
  }, []);

  // Debounce: espera a que el usuario deje de escribir antes de pegarle al backend.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Cada búsqueda o cambio de categoría nueva vuelve a la página 1.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, categoriaId]);

  function cargar() {
    setLoading(true);
    productosApi
      .listar(page, PAGE_SIZE, debouncedQuery, categoriaId || undefined)
      .then(setPageData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [page, debouncedQuery, categoriaId]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await productosApi.crear({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        precio: parseFloat(form.precio),
        stock: form.stock === "" ? 0 : parseInt(form.stock, 10),
        categoria_id: parseInt(form.categoria_id, 10),
      });
      setForm(FORM_INICIAL);
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = pageData.total_pages ?? 0;

  return (
    <section>
      <CategoryChips categorias={categorias} selectedId={categoriaId} onSelect={setCategoriaId} />

      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {pageData.total_elements ?? 0} producto{pageData.total_elements === 1 ? "" : "s"}
          {totalPages > 0 ? ` — página ${page + 1} de ${totalPages}` : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Nuevo producto"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="max-w-6xl mx-auto px-4 pb-4 flex flex-col sm:flex-row gap-2"
        >
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            className="flex-1 bg-zinc-100 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="flex-1 bg-zinc-100 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <input
            placeholder="Precio"
            type="number"
            step="0.01"
            min="0"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            required
            className="w-full sm:w-28 bg-zinc-100 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <input
            placeholder="Stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full sm:w-24 bg-zinc-100 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <select
            value={form.categoria_id}
            onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            required
            className="w-full sm:w-40 bg-zinc-100 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="" disabled>
              Categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          >
            Crear
          </button>
        </form>
      )}

      {error && <p className="max-w-6xl mx-auto px-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="px-4 py-16 text-center text-sm text-zinc-500">Cargando productos...</p>
      ) : (
        <>
          <ProductGrid productos={pageData.content ?? []} onSelect={setSelected} />

          {totalPages > 1 && (
            <div className="max-w-6xl mx-auto px-4 pb-16 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-xs text-zinc-500">
                Página {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
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
