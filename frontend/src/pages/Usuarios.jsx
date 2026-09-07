import { useEffect, useState } from "react";
import { usuariosApi } from "../api/client";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", email: "", passwordHash: "" });

  function cargar() {
    setLoading(true);
    usuariosApi
      .listar()
      .then((data) => setUsuarios(data.content || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await usuariosApi.crear(form);
      setForm({ nombre: "", email: "", passwordHash: "" });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Usuarios</h2>
      <p>Consume ms-usuarios (Java/Spring Boot + PostgreSQL)</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.passwordHash}
          onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
          required
        />
        <button type="submit">Registrar</button>
      </form>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
