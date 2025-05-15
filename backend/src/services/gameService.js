// backend/src/services/gameService.js
const gameRepository = require('../repositories/gameRepository');
const modRepository = require('../repositories/modRepository');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const FTP_MODS_ROOT_PATH = process.env.FTP_MODS_ROOT_PATH;

if (!FTP_MODS_ROOT_PATH) {
    console.error("CONFIGURACIÓN CRÍTICA FALTANTE: FTP_MODS_ROOT_PATH no está definido en el archivo .env. El servidor de mods no funcionará correctamente.");
}

exports.getAllGames = async () => {
    // Podríamos añadir lógica aquí si fuera necesario, como verificar si las carpetas FTP existen,
    // pero por ahora, el repositorio es suficiente.
    return await gameRepository.findAllGames();
};

exports.getGameDetailsWithMods = async (gameId) => {
    const game = await gameRepository.findGameById(gameId);
    if (!game) {
        const error = new Error('Juego no encontrado.');
        error.statusCode = 404;
        throw error;
    }

    const mods = await modRepository.findModsByGameId(gameId);
    // El frontend construirá los enlaces FTP completos.
    // El backend solo necesita proveer game.ftp_folder_name y mod.file_name
    return { ...game, mods };
};

exports.uploadModForGame = async ({ gameId, userId, modDetails, fileFromMulter }) => {
    if (!FTP_MODS_ROOT_PATH) {
        const error = new Error("La configuración del servidor FTP (ruta raíz) no está completa. Contacta al administrador.");
        error.statusCode = 500; // Internal Server Error
        throw error;
    }
    if (!fileFromMulter) {
        const error = new Error('No se proporcionó ningún archivo para el mod.');
        error.statusCode = 400; // Bad Request
        throw error;
    }

    const game = await gameRepository.findGameById(gameId);
    if (!game || !game.ftp_folder_name) {
        const error = new Error('Juego no encontrado o no tiene una carpeta FTP configurada.');
        error.statusCode = 404;
        // Limpiar el archivo temporal subido por multer si el juego no es válido
        try { await fs.unlink(fileFromMulter.path); } catch (e) { console.warn("No se pudo limpiar el archivo temporal:", fileFromMulter.path); }
        throw error;
    }

    // Ruta completa al directorio de mods para este juego en el servidor
    const gameModDirectoryOnServer = path.join(FTP_MODS_ROOT_PATH, game.ftp_folder_name);
    // Ruta completa al archivo del mod en el servidor
    const finalModPathOnServer = path.join(gameModDirectoryOnServer, fileFromMulter.originalname);

    try {
        // Asegurar que el directorio del juego exista en el FTP (o la ruta del sistema de archivos)
        await fs.mkdir(gameModDirectoryOnServer, { recursive: true });

        // Mover el archivo subido (temporalmente por multer) a la ubicación final
        await fs.rename(fileFromMulter.path, finalModPathOnServer);

    } catch (diskError) {
        console.error("Error al guardar el archivo del mod en el disco:", diskError);
        try { await fs.unlink(fileFromMulter.path); } catch (e) { /* no hacer nada si falla la limpieza */ }
        const serviceError = new Error("Error del servidor al procesar y guardar el archivo del mod.");
        serviceError.statusCode = 500;
        throw serviceError;
    }

    // Guardar metadatos del mod en la base de datos
    const modDataForDb = {
        game_id: parseInt(gameId, 10),
        user_id: userId,
        name: modDetails.name || path.parse(fileFromMulter.originalname).name,
        description: modDetails.description || '',
        version: modDetails.version || '1.0',
        file_name: fileFromMulter.originalname,
        ftp_file_path: path.join(game.ftp_folder_name, fileFromMulter.originalname), // Ruta relativa para la BD
        file_size: fileFromMulter.size 
    };

    try {
        const newMod = await modRepository.createMod(modDataForDb);
        return { message: 'Mod subido y registrado exitosamente.', mod: newMod };
    } catch (dbError) {
        console.error("Error al guardar el mod en la BD, intentando revertir archivo físico:", dbError);
        try {
            await fs.unlink(finalModPathOnServer); // Borra el archivo movido
            console.log("Archivo físico del mod borrado debido a error en BD:", finalModPathOnServer);
        } catch (cleanupError) {
            console.error("Error crítico: No se pudo guardar en BD ni borrar el archivo físico del mod:", cleanupError);
        }
        const serviceError = new Error("Error al registrar el mod en la base de datos. La subida del archivo fue revertida.");
        serviceError.statusCode = 500;
        throw serviceError;
    }
};

exports.getModFilePath = async (modId) => {
    if (!FTP_MODS_ROOT_PATH) {
        throw new Error("La configuración del servidor FTP (ruta raíz) no está completa.");
    }

    // Para obtener el mod, necesitamos su game_id para construir la ruta completa correctamente
    // O, si guardamos la ruta completa en la tabla mods, es más directo.
    // En nuestra tabla 'mods', 'ftp_file_path' es 'NombreCarpetaJuego/nombre_archivo.ext'
    
    // Vamos a buscar el mod directamente por su ID.
    // El modRepository.findModByIdAndGameId no es el adecuado aquí si solo tenemos modId.
    // Necesitamos un modRepository.findModById(modId)
    
    // Asumamos que creamos o modificamos findModById en modRepository para que devuelva
    // también game.ftp_folder_name o que mod.ftp_file_path sea suficiente.
    // Por ahora, vamos a crear modRepository.findModById(modId)

    const mod = await modRepository.findModById(modId); // Necesitaremos añadir este método al repositorio

    if (!mod || !mod.ftp_file_path || !mod.file_name) {
        const error = new Error('Metadatos del mod no encontrados o incompletos.');
        error.statusCode = 404;
        throw error;
    }

    // mod.ftp_file_path ya es la ruta relativa desde FTP_MODS_ROOT_PATH
    // Ej: "EpicGame/super_mod_v1.zip"
    const absolutePath = path.join(FTP_MODS_ROOT_PATH, mod.ftp_file_path);

    // Verificar si el archivo existe físicamente antes de intentar servirlo
    try {
        await fs.access(absolutePath, fs.constants.F_OK | fs.constants.R_OK);
    } catch (fileAccessError) {
        console.error("Error de acceso al archivo del mod:", absolutePath, fileAccessError);
        const error = new Error('El archivo del mod no existe o no se puede acceder a él en el servidor.');
        error.statusCode = 404;
        throw error;
    }

    return {
        absolutePath: absolutePath,
        originalName: mod.file_name // El nombre con el que se descargará
    };
};