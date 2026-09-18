const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        id_producto: {
            type: Number,
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            min: 1
        },
        precio_unitario: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
);

const pedidoSchema = new mongoose.Schema({
    id_usuario: {
        type: Number,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    items: {
        type: [itemSchema],
        required: true,
        validate: {
            validator: function (items) {
                return items.length > 0;
            },
            message: "El pedido debe tener al menos un producto"
        }
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    estado: {
        type: String,
        enum: ["pendiente", "pagado", "enviado", "cancelado"],
        default: "pendiente"
    }
});

module.exports = mongoose.model("Pedido", pedidoSchema);