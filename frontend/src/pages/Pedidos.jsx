import { useEffect, useState } from "react";
import { Plus, X, Trash2, ShoppingCart } from "lucide-react";
import { pedidosApi, checkoutApi } from "../api/client";
import PedidoModal from "../components/PedidoModal";

const ESTADO_ESTILO = {
  pendiente: "bg-amber-100 text-amber-700",
  pagado: "bg-blue-100 text-blue-700",
  enviado: "bg-indigo-100 text-indigo-700",
  confirmado: "bg-blue-100 text-blue-700",
  cancelado: "bg-red-100 text-red-700",
};

const ITEM_VACIO = { id_producto: "", cantidad: "1" };

export default function Pedidos({ searchQuery }) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formUsuario, setFormUsuario] = useState("");
  const [items, setItems] = useState([{ ...ITEM_VACIO }]);
  const [resumen, setResumen] = useState(null);
  const [formError, setFormError] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Debounce: espera a que el usuario deje de escribir antes de pegarle al backend.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const idUsuarioBuscado = debouncedQuery.trim();

  function cargar() {
    if (!idUsuarioBuscado || !/^\d+$/.test(idUsuarioBuscado)) {
      setPedidos([]);
      return;
    }
    setLoading(true);
    setError(null);
    pedidosApi
      .porUsuario(idUsuarioBuscado)
      .then(setPedidos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [idUsuarioBuscado]);

  async function abrirDetalle(pedido) {
    setLoadingDetalle(true);
    try {
      const detalle = await pedidosApi.porId(pedido._id);
      setSelected(detalle);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingDetalle(false);
    }
  }

  function actualizarItem(i, campo, valor) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  }

  function agregarItem() {
    setItems((prev) => [...prev, { ...ITEM_VACIO }]);
  }

  function quitarItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function construirPayload() {
    return {
      id_usuario: Number(formUsuario),
      items: items
        .filter((it) => it.id_producto !== "")
        .map((it) => ({ id_producto: Number(it.id_producto), cantidad: Number(it.cantidad) || 1 })),
    };
  }

  async function handleVerResumen(e) {
    e.preventDefault();
    setFormError(null);
    setResumen(null);
    setVerificando(true);
    try {
      const data = await checkoutApi.resumen(construirPayload());
      setResumen(data);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setVerificando(false);
    }
  }

  async function handleConfirmar() {
    setFormError(null);
    setConfirmando(true);
    try {
      await checkoutApi.confirmar(construirPayload());
      setSuccessMsg(`Pedido creado para el usuario #${formUsuario}.`);
      setResumen(null);
      setFormUsuario("");
      setItems([{ ...ITEM_VACIO }]);
      setShowForm(false);
      if (idUsuarioBuscado === formUsuario) cargar();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {idUsuarioBuscado
            ? `${pedidos.length} pedido${pedidos.length === 1 ? "" : "s"} del usuario #${idUsuarioBuscado}`
            : "Escribe un ID de usuario en el buscador para ver sus pedidos"}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
          {showForm ? "Cancelar" : "Nuevo pedido"}
        </button>
      </div>

      {successMsg && (
        <p className="max-w-6xl mx-auto px-4 pb-2 text-sm text-emerald-600">{successMsg}</p>
      )}

      {showForm && (
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <form onSubmit={handleVerResumen} className="bg-zinc-50 rounded-lg p-4 space-y-3">
            <input
              placeholder="ID de usuario"
              type="number"
              min="1"
              value={formUsuario}
              onChange={(e) => setFormUsuario(e.target.value)}
              required
              className="w-full sm:w-48 bg-white rounded-md text-sm px-3 py-2 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="ID de producto"
                    type="number"
                    min="1"
                    value={item.id_producto}
                    onChange={(e) => actualizarItem(i, "id_producto", e.target.value)}
                    required
                    className="flex-1 bg-white rounded-md text-sm px-3 py-2 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <input
                    placeholder="Cantidad"
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => actualizarItem(i, "cantidad", e.target.value)}
                    required
                    className="w-24 bg-white rounded-md text-sm px-3 py-2 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => quitarItem(i)}
                      className="p-2 text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={agregarItem}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar producto
              </button>
              <p className="text-xs text-zinc-400">
                Busca los IDs de producto en la pestaña Productos (SKU visible en el detalle).
              </p>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={verificando}
                className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {verificando ? "Verificando..." : "Ver resumen"}
              </button>
              {resumen && (
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={confirmando}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {confirmando ? "Confirmando..." : "Confirmar compra"}
                </button>
              )}
            </div>
          </form>

          {resumen && (
            <div className="mt-3 bg-white border border-zinc-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-zinc-900 mb-2">
                Resumen para {resumen.usuario.nombre} ({resumen.usuario.email})
              </p>
              {resumen.items.map((it) => (
                <div key={it.id_producto} className="flex justify-between py-1 text-zinc-600">
                  <span>
                    {it.nombre} × {it.cantidad}{" "}
                    <span className="text-xs text-zinc-400">(stock: {it.stock_disponible})</span>
                  </span>
                  <span>S/ {it.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-zinc-100 font-semibold text-zinc-900">
                <span>Total</span>
                <span>S/ {resumen.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="max-w-6xl mx-auto px-4 text-sm text-red-600">{error}</p>}

      {!idUsuarioBuscado ? null : loading ? (
        <p className="px-4 py-16 text-center text-sm text-zinc-500">Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-zinc-500">
          Este usuario no tiene pedidos todavía.
        </p>
      ) : (
        <div className="max-w-6xl mx-auto px-4 pb-16 space-y-2">
          {pedidos.map((p) => {
            const estilo = ESTADO_ESTILO[p.estado] ?? "bg-zinc-100 text-zinc-700";
            return (
              <button
                key={p._id}
                type="button"
                onClick={() => abrirDetalle(p)}
                className="w-full flex items-center justify-between bg-white border border-zinc-100 rounded-lg px-4 py-3 text-left hover:border-zinc-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">Pedido #{p._id.slice(-8)}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(p.fecha).toLocaleDateString("es-PE")} · {p.items.length} producto
                    {p.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${estilo}`}>
                    {p.estado}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">S/ {p.total.toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {loadingDetalle && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
          <p className="text-sm text-white">Cargando pedido...</p>
        </div>
      )}

      {selected && <PedidoModal pedido={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
