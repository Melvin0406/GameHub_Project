// backend/src/routes/internalMailRoutes.js
const express = require('express');
const router = express.Router();
const internalMailController = require('../controllers/internalMailController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas de mensajería interna requieren autenticación
router.use(authMiddleware);

router.post('/send', internalMailController.sendMessage);
router.get('/inbox', internalMailController.getInbox);
router.get('/sent', internalMailController.getSentMessages);
router.get('/:messageId', internalMailController.getMessageById); // También marca como leído
router.put('/:messageId/delete', internalMailController.deleteMessage); // Usar PUT o DELETE para marcar como borrado

module.exports = router;