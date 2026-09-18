const axios = require("axios");
const mongoose = require("mongoose");
const Pedido = require("../src/models/Pedido");

const PRODUCTOS_URL =
    process.env.PRODUCTOS_URL || "http://localhost:8001";

const TOTAL_PEDIDOS = 20000;
const TAMANO_LOTE = 1000;
const TOTAL_USUARIOS = 20000;

const conectarDB = async () => {
    await mongoose.connect(
        process.env.MONGODB_URL || "mongodb://localhost:27017/pedidos_db"
    );

    console.log("MongoDB conectado");
};

const obtenerProductos = async () => {
    const response = await axios.get(`${PRODUCTOS_URL}/productos`, {
        params: {
            page: 0,
            size: 20000
        }
    });

    return response.data.content;
};

const numeroAleatorio = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const elementoAleatorio = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const generarPedido = (productos) => {
    const cantidadItems = numeroAleatorio(1, 4);

    const productosSeleccionados = [];

    while (productosSeleccionados.length < cantidadItems) {
        const producto = elementoAleatorio(productos);

        if (!productosSeleccionados.some(p => p.id === producto.id)) {
            productosSeleccionados.push(producto);
        }
    }

    const items = [];
    let total = 0;

    for (const producto of productosSeleccionados) {
        const cantidad = numeroAleatorio(
            1,
            Math.min(5, producto.stock)
        );

        const subtotal = producto.precio * cantidad;

        items.push({
            id_producto: producto.id,
            cantidad: cantidad,
            precio_unitario: producto.precio
        });

        total += subtotal;
    }

    const aleatorio = Math.random();
    let estado;

    if (aleatorio < 0.10) {
        estado = "pendiente";
    } else if (aleatorio < 0.40) {
        estado = "pagado";
    } else if (aleatorio < 0.90) {
        estado = "enviado";
    } else {
        estado = "cancelado";
    }

    return {
        id_usuario: numeroAleatorio(1, TOTAL_USUARIOS),
        fecha: new Date(
            Date.now() - numeroAleatorio(0, 180) * 24 * 60 * 60 * 1000
        ),
        items,
        total: Number(total.toFixed(2)),
        estado: estado
    };
};

const seed = async () => {
    try {
        await conectarDB();

        console.log("Obteniendo productos desde ms-productos...");

        const productos = await obtenerProductos();

        console.log(`Productos obtenidos: ${productos.length}`);

        if (productos.length === 0) {
            throw new Error("No se encontraron productos");
        }

        console.log(`Generando ${TOTAL_PEDIDOS} pedidos...`);

        for (
            let inicio = 0;
            inicio < TOTAL_PEDIDOS;
            inicio += TAMANO_LOTE
        ) {
            const fin = Math.min(
                inicio + TAMANO_LOTE,
                TOTAL_PEDIDOS
            );

            const pedidos = [];

            for (let i = inicio; i < fin; i++) {
                pedidos.push(generarPedido(productos));
            }

            await Pedido.insertMany(pedidos);

            console.log(`Insertados ${fin}/${TOTAL_PEDIDOS} pedidos`);
        }

        console.log("Seed completado correctamente");

    } catch (error) {
        console.error("Error ejecutando seed:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB desconectado");
    }
};

seed();