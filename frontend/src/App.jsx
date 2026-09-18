import { useState } from "react";
import TopBar from "./components/TopBar";
import Productos from "./pages/Productos";
import Usuarios from "./pages/Usuarios";
import Pedidos from "./pages/Pedidos";

export default function App() {
  const [tab, setTab] = useState("productos");
  const [searchQuery, setSearchQuery] = useState("");

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setSearchQuery("");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopBar
        activeTab={tab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={
          tab === "productos"
            ? "Buscar productos..."
            : tab === "usuarios"
            ? "Buscar usuarios..."
            : "ID de usuario..."
        }
      />

      <div className="pt-4">
        {tab === "productos" && <Productos searchQuery={searchQuery} />}
        {tab === "usuarios" && <Usuarios searchQuery={searchQuery} />}
        {tab === "pedidos" && <Pedidos searchQuery={searchQuery} />}
      </div>
    </div>
  );
}
