// backend/src/services/userService.js
const userRepository = require('../repositories/userRepository');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Para PUBLIC_URL_BASE

// Define dónde se guardarán las imágenes de perfil y cómo se accederá a ellas públicamente
const PROFILE_PICS_STORAGE_DIR = path.resolve(__dirname, '../../public/profile_pics');
const PROFILE_PICS_PUBLIC_PATH = '/profile_pics'; // Cómo se accederá desde el navegador (después del host:puerto)

exports.getUserProfile = async (userId) => {
    const user = await userRepository.findUserById(userId);
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    // No devolvemos el password_hash
    return { id: user.id, username: user.username, email: user.email, profile_image_url: user.profile_image_url };
};

exports.setProfilePicture = async (userId, fileFromMulter) => {
    if (!fileFromMulter) {
        const error = new Error('No profile picture file provided.');
        error.statusCode = 400;
        throw error;
    }

    // Validar tipo de archivo (opcional pero recomendado)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(fileFromMulter.mimetype)) {
        await fs.unlink(fileFromMulter.path); // Borrar archivo temporal no válido
        const error = new Error('Invalid file type. Only JPG, PNG, GIF are allowed.');
        error.statusCode = 400;
        throw error;
    }

    // Crear un nombre de archivo único o predecible (ej. userId.extension)
    const fileExtension = path.extname(fileFromMulter.originalname);
    const newFileName = `user_${userId}${fileExtension}`; // Ej: user_1.jpg
    const permanentFilePath = path.join(PROFILE_PICS_STORAGE_DIR, newFileName);

    try {
        // Asegurar que el directorio de profile_pics exista
        await fs.mkdir(PROFILE_PICS_STORAGE_DIR, { recursive: true });

        // Mover el archivo subido a la ubicación permanente
        await fs.rename(fileFromMulter.path, permanentFilePath);

    } catch (diskError) {
        console.error("Error saving profile picture to disk:", diskError);
        try { await fs.unlink(fileFromMulter.path); } catch (e) { /* no-op */ }
        throw new Error("Server error processing profile picture file.");
    }

    // Construir la URL pública para la imagen
    const publicImageUrl = `${PROFILE_PICS_PUBLIC_PATH}/${newFileName}`;

    // Actualizar la base de datos
    await userRepository.updateProfileImageUrl(userId, publicImageUrl);

    return { message: 'Profile picture updated successfully.', profile_image_url: publicImageUrl };
};

exports.getUserStreamInfo = async (userId) => {
    const user = await userRepository.findUserById(userId); // Ya selecciona stream_key
    if (!user || !user.stream_key) {
        const error = new Error('Stream information not found or stream key not set for user.');
        error.statusCode = 404;
        throw error;
    }
    // La URL RTMP base (el usuario añade su stream_key al final en OBS)
    // Asumimos que usas la aplicación 'hls' de tu nginx-rtmp para HLS output.
    // Si usas 'live' para que la gente transmita y luego Nginx lo convierte a HLS, ajusta esto.
    const rtmpBaseUrl = `rtmp://${process.env.STREAM_DOMAIN || 'servidor-stream.casa.local'}/hls`; 
    // Nota: STREAM_DOMAIN podría ser una variable en .env si quieres que sea configurable.
    // Si tus dos dominios (casa y cetys) son fijos, puedes hardcodear uno o añadir lógica.
    // Por simplicidad, usaremos servidor-stream.casa.local como default si no está en .env.

    return {
        rtmp_url: rtmpBaseUrl, // A esta URL el usuario añade /STREAM_KEY en OBS
        stream_key: user.stream_key
    };
};