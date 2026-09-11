import { avatarColor, initials } from "../lib/palette";

export default function UserList({ usuarios }) {
  if (usuarios.length === 0) {
    return <p className="text-center text-sm text-zinc-500 py-16">No se encontraron usuarios.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {usuarios.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors"
        >
          <span
            className={`flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-semibold shrink-0 ${avatarColor(
              u.id
            )}`}
          >
            {initials(u.nombre)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">{u.nombre}</p>
            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
