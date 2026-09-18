const express = require("express");
const connectDB = require("./config/database");
const Pedido = require("./models/Pedido");

const { obtenerProducto } = require("./services/productoService");
const { obtenerUsuario } = require("./services/usuarioService");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

app.use(express.json());

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "MS Pedidos API",
            version: "1.0.0",
            description: "API REST para la gestión de pedidos del e-commerce"
        },
        servers: [
            {
                url: "http://localhost:8000"
            }
        ]
    },
    apis: ["./src/app.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica el estado de ms-pedidos
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente
 */
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "ms-pedidos"
    });
});

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Crea un nuevo pedido
 *     tags:
 *       - Pedidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *               - items
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 123
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_producto
 *                     - cantidad
 *                   properties:
 *                     id_producto:
 *                       type: integer
 *                       example: 45
 *                     cantidad:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *     responses:
 *       201:
 *         description: Pedido creado correctamente
 *       400:
 *         description: Datos del pedido inválidos
 *       404:
 *         description: Usuario o producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
app.post("/pedidos", async (req, res) => {
    try {
        const { id_usuario, items } = req.body;

        if (!id_usuario) {
            return res.status(400).json({
                error: "id_usuario es obligatorio"
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                error: "El pedido debe tener al menos un producto"
            });
        }


        const usuario = await obtenerUsuario(id_usuario);

        if (!usuario) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const itemsPedido = [];
        let total = 0;


        for (const item of items) {
            const producto = await obtenerProducto(item.id_producto);

            if (!producto) {
                return res.status(404).json({
                    error: `Producto ${item.id_producto} no encontrado`
                });
            }

            const subtotal = producto.precio * item.cantidad;

            itemsPedido.push({
                id_producto: producto.id,
                cantidad: item.cantidad,
                precio_unitario: producto.precio
            });

            total += subtotal;
        }

        const pedido = new Pedido({
            id_usuario,
            items: itemsPedido,
            total: Number(total.toFixed(2)),
            estado: "pendiente"
        });

        const pedidoGuardado = await pedido.save();

        res.status(201).json(pedidoGuardado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error creando el pedido"
        });
    }
});

/**
 * @swagger
 * /pedidos/{id}:
 *   get:
 *     summary: Obtiene un pedido por su ID
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del pedido
 *         example: 6aace2867a580d45af946812
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       400:
 *         description: ID de pedido inválido
 *       404:
 *         description: Pedido no encontrado
 */
app.get("/pedidos/:id", async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({
                error: "Pedido no encontrado"
            });
        }

        res.json(pedido);
    } catch (error) {
        res.status(400).json({
            error: "ID de pedido inválido"
        });
    }
});

/**
 * @swagger
 * /usuarios/{id_usuario}/pedidos:
 *   get:
 *     summary: Obtiene todos los pedidos de un usuario
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *         example: 123
 *     responses:
 *       200:
 *         description: Lista de pedidos del usuario
 *       500:
 *         description: Error interno del servidor
 */
app.get("/usuarios/:id_usuario/pedidos", async (req, res) => {
    try {
        const pedidos = await Pedido.find({
            id_usuario: Number(req.params.id_usuario)
        });

        res.json(pedidos);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

const PORT = 8000;

connectDB();

app.listen(PORT, () => {
    console.log(`ms-pedidos ejecutándose en el puerto ${PORT}`);
});