const mongoose = require("mongoose");
const Pedido = require("../src/models/Pedido");

const main = async () => {
    await mongoose.connect(
        process.env.MONGODB_URL || "mongodb://localhost:27017/pedidos_db"
    );

    const cantidad = await Pedido.countDocuments();

    console.log(`Cantidad de pedidos: ${cantidad}`);

    const pedido = await Pedido.findOne()
        .sort({ fecha: -1 })
        .lean();

    console.log("\nPedido más reciente:");
    console.log(JSON.stringify(pedido, null, 2));

    await mongoose.connection.close();
};

main();