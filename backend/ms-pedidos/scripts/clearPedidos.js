const mongoose = require("mongoose");
const Pedido = require("../src/models/Pedido");

const main = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URL || "mongodb://localhost:27017/pedidos_db"
        );

        const resultado = await Pedido.deleteMany({});

        console.log(`Pedidos eliminados: ${resultado.deletedCount}`);

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

main();