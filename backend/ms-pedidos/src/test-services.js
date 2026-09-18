const { obtenerProducto } = require("./services/productoService");
const { obtenerUsuario } = require("./services/usuarioService");

const probarServicios = async () => {
    try {
        const producto = await obtenerProducto(45);
        console.log("Producto encontrado:");
        console.log(producto);

        const usuario = await obtenerUsuario(123);
        console.log("Usuario encontrado:");
        console.log(usuario);
    } catch (error) {
        console.error("Error:", error.message);
    }
};

probarServicios();