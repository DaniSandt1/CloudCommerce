export default function CategoryChips({ categorias, selectedId, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 py-3 max-w-6xl mx-auto">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
          selectedId === ""
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
        }`}
      >
        Todas
      </button>
      {categorias.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(String(c.id))}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selectedId === String(c.id)
              ? "bg-zinc-900 text-white border-zinc-900"
              : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
          }`}
        >
          {c.nombre}
        </button>
      ))}
    </div>
  );
}
