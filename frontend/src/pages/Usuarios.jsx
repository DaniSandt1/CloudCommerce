import { useEffect, useMemo, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { usuariosApi } from "../api/client";
import UserList from "../components/UserList";

export default function Usuarios({ searchQuery }) {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", passwordHash: "" });

  function cargar() {
    setLoading(true);
    usuariosApi
      .listar()
      .then((data) => setUsuarios(data.content || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

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

  const filtrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [usuarios, searchQuery]);

  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-zinc-500">{usuarios.length} usuarios cargados (mostrando página actual)</p>
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
        <UserList usuarios={filtrados} />
      )}
    </section>
  );
}
