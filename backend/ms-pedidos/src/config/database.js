const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URL || "mongodb://localhost:27017/pedidos_db"
        );
        console.log("MongoDB conectado");
    } catch (error) {
        console.error("Error conectando a MongoDB:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;