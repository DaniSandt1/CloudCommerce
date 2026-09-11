// Paleta de colores del e-commerce. No tenemos fotos de producto reales,
// así que usamos bloques de color con gradiente en vez de <img>. Cada
// producto/usuario siempre cae en el mismo color (hash estable por id),
// para que la grilla no "salte" de color entre renders.

const TILE_GRADIENTS = [
  "from-indigo-400 to-indigo-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
  "from-teal-400 to-teal-600",
  "from-orange-400 to-orange-600",
];

const AVATAR_SOLIDS = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-600",
  "bg-violet-600",
  "bg-teal-600",
  "bg-orange-500",
];

function hashSeed(seed) {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function tileGradient(seed) {
  return TILE_GRADIENTS[hashSeed(seed) % TILE_GRADIENTS.length];
}

export function avatarColor(seed) {
  return AVATAR_SOLIDS[hashSeed(seed) % AVATAR_SOLIDS.length];
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
