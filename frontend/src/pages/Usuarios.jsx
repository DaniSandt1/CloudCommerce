import { useEffect, useState } from "react";
import { UserPlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { usuariosApi } from "../api/client";
import UserList from "../components/UserList";

const PAGE_SIZE = 20;

export default function Usuarios({ searchQuery }) {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", passwordHash: "" });

  // Debounce: espera a que el usuario deje de escribir antes de pegarle al backend.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Cada búsqueda nueva vuelve a la página 1.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery]);

  function cargar() {
    setLoading(true);
    usuariosApi
      .listar(page, PAGE_SIZE, debouncedQuery)
      .then(setPageData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [page, debouncedQuery]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await usuariosApi.crear(form);
      setForm({ nombre: "", email: "", passwordHash: "" });
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = pageData.totalPages ?? 0;

  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {pageData.totalElements ?? 0} usuario{pageData.totalElements === 1 ? "" : "s"}
          {totalPages > 0 ? ` — página ${page + 1} de ${totalPages}` : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Nuevo usuario"}
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
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="flex-1 bg-zinc-100 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <input
            placeholder="Password"
            type="password"
            value={form.passwordHash}
            onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
            required
            className="flex-1 bg-zinc-100 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          >
            Registrar
          </button>
        </form>
      )}

      {error && <p className="max-w-6xl mx-auto px-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="px-4 py-16 text-center text-sm text-zinc-500">Cargando usuarios...</p>
      ) : (
        <>
          <UserList usuarios={pageData.content ?? []} />

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
    </section>
  );
}
