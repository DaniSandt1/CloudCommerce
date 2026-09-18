const axios = require("axios");

const USUARIOS_URL = process.env.USUARIOS_URL || "http://localhost:8002";

const obtenerUsuario = async (idUsuario) => {
    try {
        const response = await axios.get(
            `${USUARIOS_URL}/usuarios/${idUsuario}`
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
    obtenerUsuario
};