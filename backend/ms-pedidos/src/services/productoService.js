const axios = require("axios");

const PRODUCTOS_URL = process.env.PRODUCTOS_URL || "http://localhost:8001";

const obtenerProducto = async (idProducto) => {
    try {
        const response = await axios.get(
            `${PRODUCTOS_URL}/productos/${idProducto}`
        );

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }

        throw error;
    }
};

module.exports = {
    obtenerProducto
};