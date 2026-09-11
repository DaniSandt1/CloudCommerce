import { useEffect, useRef, useState } from "react";
import { Package, Search, X } from "lucide-react";

const TABS = [
  { id: "productos", label: "Productos" },
  { id: "usuarios", label: "Usuarios" },
];

export default function TopBar({ activeTab, onTabChange, searchQuery, onSearchChange, searchPlaceholder }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div
      className={`sticky top-0 z-40 bg-white border-b border-zinc-200 transition-shadow ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4 h-14 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white">
            <Package className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-zinc-900">CloudCommerce</span>
        </div>

        <nav className="flex-1 flex items-center justify-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`bg-zinc-100 rounded-md text-sm px-3 py-1.5 text-zinc-800 placeholder:text-zinc-400
                focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200 overflow-hidden
                ${isSearchOpen ? "w-40 sm:w-56 opacity-100 mr-1" : "w-0 opacity-0 pointer-events-none"}`}
            />
            {isSearchOpen && searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 p-0.5 hover:bg-zinc-200 rounded-full text-zinc-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen((v) => !v);
              if (isSearchOpen) onSearchChange("");
            }}
            className={`p-1.5 rounded-md transition-colors text-zinc-700 ${
              isSearchOpen ? "bg-zinc-100" : "hover:bg-zinc-100"
            }`}
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
