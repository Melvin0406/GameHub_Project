// backend/src/routes/streamRoutes.js
const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para obtener todos los streams activos (pública)
router.get('/live', streamController.listActiveStreams);

// Rutas protegidas para que un streamer gestione su estado "live"
router.post('/go-live', authMiddleware, streamController.goLive);
router.post('/go-offline', authMiddleware, streamController.goOffline); // Usamos POST por consistencia, podría ser DELETE
router.get('/me/status', authMiddleware, streamController.getMyLiveStatus); // Para que el streamer sepa su estado
router.get('/info/:streamKey', streamController.getStreamInfoByKey);

module.exports = router;