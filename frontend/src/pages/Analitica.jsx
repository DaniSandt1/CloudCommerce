import { useEffect, useState } from "react";
import { analiticaApi } from "../api/client";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function haceUnAnioISO() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

export default function Analitica() {
  const [ventas, setVentas] = useState([]);
  const [topClientes, setTopClientes] = useState([]);
  const [limit, setLimit] = useState(10);
  const [rango, setRango] = useState({ fecha_inicio: haceUnAnioISO(), fecha_fin: hoyISO() });
  const [pedidosRango, setPedidosRango] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([analiticaApi.ventasPorCategoria(), analiticaApi.topClientes(limit)])
      .then(([v, t]) => {
        setVentas(v);
        setTopClientes(t);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit]);

  function consultarRango(e) {
    e.preventDefault();
    setError(null);
    analiticaApi
      .pedidosPorRango(rango.fecha_inicio, rango.fecha_fin)
      .then(setPedidosRango)
      .catch((e) => setError(e.message));
  }

  return (
    <section className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-16 text-center text-sm text-zinc-500">Cargando analítica...</p>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Ventas por categoría</h2>
            {ventas.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin datos.</p>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                {ventas.map((v) => (
                  <div key={v.categoria} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-zinc-700">{v.categoria}</span>
                    <span className="font-medium text-zinc-900">S/ {v.total_vendido.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Top clientes</h2>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-zinc-100 rounded-md text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    Top {n}
                  </option>
                ))}
              </select>
            </div>
            {topClientes.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin datos.</p>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                {topClientes.map((c, i) => (
                  <div key={c.id_usuario} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div>
                      <span className="text-zinc-400 mr-2">#{i + 1}</span>
                      <span className="text-zinc-900">{c.nombre}</span>
                      <span className="text-zinc-400 ml-2 text-xs">{c.email}</span>
                    </div>
                    <span className="font-medium text-zinc-900">S/ {c.total_comprado.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Pedidos por rango de fechas</h2>
            <form onSubmit={consultarRango} className="flex flex-wrap items-end gap-2 mb-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={rango.fecha_inicio}
                  onChange={(e) => setRango({ ...rango, fecha_inicio: e.target.value })}
                  className="bg-zinc-100 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={rango.fecha_fin}
                  onChange={(e) => setRango({ ...rango, fecha_fin: e.target.value })}
                  className="bg-zinc-100 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                Consultar
              </button>
            </form>
            {pedidosRango && (
              <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 flex items-center gap-6 text-sm">
                <span>
                  <span className="text-zinc-500">Pedidos: </span>
                  <span className="font-medium text-zinc-900">{pedidosRango.cantidad_pedidos}</span>
                </span>
                <span>
                  <span className="text-zinc-500">Monto total: </span>
                  <span className="font-medium text-zinc-900">S/ {pedidosRango.monto_total.toFixed(2)}</span>
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
