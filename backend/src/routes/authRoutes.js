// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\src\routes\authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para registrar un nuevo usuario
// POST /api/auth/signup
router.post('/signup', authController.signup);

// Ruta para iniciar sesión
// POST /api/auth/login
router.post('/login', authController.login);

// (Opcional) Podrías añadir más rutas aquí en el futuro, como /logout o /me
// router.get('/me', authMiddleware.protect, authController.getMe); // Ejemplo con middleware

module.exports = router;