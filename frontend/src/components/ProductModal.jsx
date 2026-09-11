import { X } from "lucide-react";
import { tileGradient } from "../lib/palette";

export default function ProductModal({ producto, categoriaNombre, onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-0 md:inset-[20%] z-50 bg-white rounded-t-xl md:rounded-xl overflow-hidden md:max-h-[480px] shadow-xl">
        <div className="h-full md:flex">
          <div
            className={`relative md:w-2/5 h-[180px] md:h-full bg-gradient-to-br ${tileGradient(producto.id)} flex items-center justify-center`}
          >
            <span className="text-white/90 text-5xl font-semibold drop-shadow-sm">
              {producto.nombre?.[0]?.toUpperCase() ?? "P"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 md:w-3/5 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">{producto.nombre}</h2>
                <p className="text-xs text-zinc-500">{categoriaNombre ?? "Sin categoría"}</p>
              </div>
              <p className="text-base font-semibold text-zinc-900">S/ {producto.precio.toFixed(2)}</p>
            </div>
            <p className="text-sm text-zinc-600 flex-1">{producto.descripcion}</p>
            <div className="text-xs text-zinc-500 space-y-1 mt-3 pt-3 border-t border-zinc-100">
              <p>SKU: #{producto.id}</p>
              <p>Stock disponible: {producto.stock} unidades</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
