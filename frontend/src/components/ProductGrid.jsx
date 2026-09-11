import { tileGradient } from "../lib/palette";

export default function ProductGrid({ productos, onSelect }) {
  if (productos.length === 0) {
    return <p className="text-center text-sm text-zinc-500 py-16">No se encontraron productos.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-4 max-w-6xl mx-auto pb-16">
      {productos.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p)}
          className="group text-left cursor-pointer"
        >
          <div
            className={`aspect-[4/5] rounded-lg overflow-hidden bg-gradient-to-br ${tileGradient(p.id)}
              flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]`}
          >
            <span className="text-white/90 text-2xl font-semibold drop-shadow-sm">
              {p.nombre?.[0]?.toUpperCase() ?? "P"}
            </span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <h3 className="text-xs font-medium text-zinc-900 truncate">{p.nombre}</h3>
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-zinc-900">S/ {p.precio.toFixed(2)}</p>
              <p className="text-[10px] text-zinc-400">Stock: {p.stock}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
