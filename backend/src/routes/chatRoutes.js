// backend/src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Proteger todas las rutas de chat

// Obtener historial de chat con un amigo específico
router.get('/history/:friendId', chatController.getChatHistory);

module.exports = router;