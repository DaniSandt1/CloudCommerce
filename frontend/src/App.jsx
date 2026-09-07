import { useState } from "react";
import Productos from "./pages/Productos";
import Usuarios from "./pages/Usuarios";

export default function App() {
  const [tab, setTab] = useState("productos");

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>CloudCommerce</h1>
      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("productos")} disabled={tab === "productos"}>
          Productos
        </button>{" "}
        <button onClick={() => setTab("usuarios")} disabled={tab === "usuarios"}>
          Usuarios
        </button>
      </nav>

      {tab === "productos" ? <Productos /> : <Usuarios />}
    </main>
  );
}
