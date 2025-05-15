// backend/src/controllers/authController.js (Refactorizado)
const authService = require('../services/authService');

exports.signup = async (req, res, next) => { // 'next' es para el manejo de errores centralizado
    try {
        const { username, email, password } = req.body;
        const result = await authService.registerUser({ username, email, password });
        res.status(201).json(result);
    } catch (error) {
        // Si no tienes un manejador de errores global, lo manejas aquí
        // O puedes pasar el error a un manejador global con next(error)
        console.error("Error en signup controller:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message || 'Error interno del servidor.' });
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser({ email, password });
        res.json(result);
    } catch (error) {
        console.error("Error en login controller:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message || 'Error interno del servidor.' });
    }
};