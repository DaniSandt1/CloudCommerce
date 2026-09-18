import { X } from "lucide-react";

const ESTADO_ESTILO = {
  pendiente: "bg-amber-100 text-amber-700",
  pagado: "bg-blue-100 text-blue-700",
  enviado: "bg-indigo-100 text-indigo-700",
  confirmado: "bg-blue-100 text-blue-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function PedidoModal({ pedido, onClose }) {
  const estiloEstado = ESTADO_ESTILO[pedido.estado] ?? "bg-zinc-100 text-zinc-700";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-0 md:inset-[15%] z-50 bg-white rounded-t-xl md:rounded-xl overflow-hidden md:max-h-[520px] shadow-xl flex flex-col">
        <div className="flex items-start justify-between p-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Pedido #{pedido._id?.slice(-8)}</h2>
            <p className="text-xs text-zinc-500">
              Usuario #{pedido.id_usuario} · {new Date(pedido.fecha).toLocaleString("es-PE")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${estiloEstado}`}>
              {pedido.estado}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {pedido.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-50 last:border-0">
              <div>
                <p className="text-zinc-900">{item.nombre_producto ?? `Producto #${item.id_producto}`}</p>
                <p className="text-xs text-zinc-500">
                  {item.cantidad} × S/ {item.precio_unitario?.toFixed(2)}
                </p>
              </div>
              <p className="font-medium text-zinc-900">
                S/ {(item.precio_unitario * item.cantidad).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-sm text-zinc-600">Total</span>
          <span className="text-base font-semibold text-zinc-900">S/ {pedido.total?.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}
