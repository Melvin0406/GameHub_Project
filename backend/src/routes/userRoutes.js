// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para fotos de perfil (guardar en 'backend/uploads/' temporalmente)
const UPLOAD_TEMP_DIR_PROFILE_PICS = path.resolve(__dirname, '../../uploads/profile_pics_temp');
const profilePicUpload = multer({
    dest: UPLOAD_TEMP_DIR_PROFILE_PICS,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB para fotos de perfil
    fileFilter: (req, file, cb) => { // Filtro de tipo de archivo
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
    }
});

// Ruta para obtener el perfil del usuario logueado
router.get('/me', authMiddleware, userController.getMyProfile);

// Ruta para subir/actualizar la foto de perfil del usuario logueado
router.post(
    '/me/profile-picture',
    authMiddleware,
    profilePicUpload.single('profilePictureFile'), // 'profilePictureFile' es el name del input file
    userController.uploadProfilePicture
);

module.exports = router;