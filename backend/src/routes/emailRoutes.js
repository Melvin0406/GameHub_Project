// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\src\routes\emailRoutes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware para proteger la ruta

// Ruta para enviar un correo
// POST /api/email/send
// Esta ruta está protegida, solo usuarios autenticados pueden acceder.
router.post('/send', authMiddleware, emailController.sendEmail);

module.exports = router;