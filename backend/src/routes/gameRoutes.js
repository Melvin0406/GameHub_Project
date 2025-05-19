// backend/src/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware'); // Reutilizamos el middleware de autenticación
const multer = require('multer');
const path = require('path');

// Configuración de Multer para guardar archivos temporalmente en una carpeta 'uploads/'
// Esta carpeta debe estar en la raíz de 'backend/' y DEBE estar en .gitignore
const UPLOAD_TEMP_DIR = path.resolve(__dirname, '../../uploads'); 
const upload = multer({ 
    dest: UPLOAD_TEMP_DIR,
    limits: { fileSize: 100 * 1024 * 1024 } // Límite de 100MB por archivo (ajusta según necesidad)
}); 

// Rutas públicas
router.get('/', gameController.getAllGames); // Listar todos los juegos
router.get('/:gameId', gameController.getGameByIdWithMods); // Detalles de un juego y sus mods

// Ruta protegida para subir un mod a un juego específico
// authMiddleware: asegura que el usuario esté logueado
// upload.single('modFile'): procesa un único archivo que venga en el campo 'modFile' del formulario FormData
router.post(
    '/:gameId/mods', 
    authMiddleware, 
    upload.single('modFile'), // 'modFile' debe ser el nombre del campo <input type="file" name="modFile"> en el HTML
    gameController.uploadMod
);

// NUEVA RUTA para descargar un mod por su ID
// Usamos :modId como parámetro. No necesita autenticación para descargar por ahora
router.get('/mods/download/:modId', gameController.downloadModFile);

module.exports = router;

// authMiddleware para asegurar que el usuario esté logueado y para obtener req.user.id
router.delete('/mods/:modId', authMiddleware, gameController.deleteMod);

module.exports = router;