// backend/src/controllers/userController.js
const userService = require('../services/userService');

exports.getMyProfile = async (req, res, next) => {
    try {
        // req.user.id es añadido por authMiddleware
        const userProfile = await userService.getUserProfile(req.user.id);
        res.json(userProfile);
    } catch (error) {
        next(error);
    }
};

exports.uploadProfilePicture = async (req, res, next) => {
    try {
        const userId = req.user.id; // De authMiddleware
        const fileFromMulter = req.file; // De multer middleware

        const result = await userService.setProfilePicture(userId, fileFromMulter);
        res.status(200).json(result);
    } catch (error) {
        // Si el servicio lanza un error porque el archivo no se subió, multer ya lo guardó temporalmente.
        // El servicio userService.setProfilePicture se encarga de intentar limpiar el archivo.
        next(error);
    }
};