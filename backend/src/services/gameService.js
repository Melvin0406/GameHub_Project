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

exports.deleteUserMod = async (modId, requestingUserId) => {
    if (!FTP_MODS_ROOT_PATH) {
        throw new Error("FTP root path configuration is missing.");
    }

    const modToDelete = await modRepository.findModById(modId);

    if (!modToDelete) {
        const error = new Error('Mod not found.');
        error.statusCode = 404;
        throw error;
    }

    // Verificar propiedad: solo el usuario que subió el mod puede borrarlo
    if (modToDelete.user_id !== requestingUserId) {
        const error = new Error('You are not authorized to delete this mod.');
        error.statusCode = 403; // Forbidden
        throw error;
    }

    // Construir la ruta completa al archivo físico del mod
    // modToDelete.ftp_file_path es algo como "GameFolderName/modfile.zip"
    const modFilePathOnServer = path.join(FTP_MODS_ROOT_PATH, modToDelete.ftp_file_path);

    // 1. Borrar la entrada de la base de datos
    const dbResult = await modRepository.deleteModByIdAndUserId(modId, requestingUserId);

    if (dbResult.changes === 0) {
        // Esto podría pasar si hubo una condición de carrera o el mod ya no existía/pertenecía al usuario.
        // O si el findModById encontró algo pero el deleteModByIdAndUserId no por alguna razón (poco probable con la lógica actual).
        console.warn(`Attempted to delete mod (ID: ${modId}) from DB, but no rows were affected. Mod might have been already deleted or ownership mismatch.`);
        // Aún intentaremos borrar el archivo físico si existe, por si acaso.
    }
    
    // 2. Borrar el archivo físico del sistema de archivos (FTP)
    try {
        await fs.access(modFilePathOnServer); // Verificar si el archivo existe antes de intentar borrarlo
        await fs.unlink(modFilePathOnServer);
        console.log(`Successfully deleted mod file: ${modFilePathOnServer}`);
    } catch (fileError) {
        // Si el archivo no existe, fs.access lanzará un error.
        // Si fs.unlink falla por otra razón (ej. permisos), también se capturará aquí.
        console.error(`Error deleting mod file (${modFilePathOnServer}): ${fileError.message}. The database entry might have been removed.`);
        // No relanzamos el error aquí si la entrada de la BD ya se borró,
        // pero se podría considerar una lógica más compleja para manejar esta inconsistencia.
        // Si dbResult.changes > 0, el borrado de BD fue exitoso.
        if (dbResult.changes > 0 && fileError.code !== 'ENOENT') { // ENOENT = file not found (lo cual está bien si ya se borró o la BD estaba desincronizada)
             // Si la BD se borró pero el archivo no, es un problema menor que si la BD no se borró.
             // Por ahora, solo logueamos.
        } else if (dbResult.changes === 0 && fileError.code !== 'ENOENT') {
            // Si no se borró de la BD Y no se pudo borrar el archivo (y no es porque no exista)
            throw new Error(`Failed to delete mod file. Database entry may or may not have been removed.`);
        }
    }

    if (dbResult.changes === 0 && modToDelete) {
        // Si el findModById lo encontró y pertenecía al usuario, pero el delete no afectó filas,
        // y no hubo error de archivo (o el archivo no existía)
        const error = new Error('Mod found but could not be deleted from database (already deleted or ownership issue).');
        error.statusCode = 404; // O 403
        throw error;
    }


    return { message: 'Mod deleted successfully.' };
};

exports.updateUserModDetails = async (modId, requestingUserId, modDetails) => {
    const { name, description, version } = modDetails;

    if (!name) { // El nombre del mod es usualmente requerido
        const error = new Error('Mod name is required.');
        error.statusCode = 400;
        throw error;
    }

    // Primero, verificamos si el mod existe y pertenece al usuario (opcional, ya que el UPDATE lo hará, pero bueno para un mensaje 403/404 más claro)
    const existingMod = await modRepository.findModById(modId); // Asumiendo que findModById devuelve user_id
    if (!existingMod) {
        const error = new Error('Mod not found.');
        error.statusCode = 404;
        throw error;
    }

    if (existingMod.user_id !== requestingUserId) {
        const error = new Error('You are not authorized to edit this mod.');
        error.statusCode = 403; // Forbidden
        throw error;
    }

    const result = await modRepository.updateModDetails(modId, requestingUserId, { name, description, version });
    
    // modRepository.updateModDetails ya rechaza si this.changes es 0 con un statusCode 404.
    // Si llega aquí, significa que se actualizó al menos una fila.
    
    // Devolver el mod actualizado (opcional, pero útil para el frontend)
    const updatedMod = await modRepository.findModById(modId); // Volver a fetchear para obtener la data actualizada
    return { message: 'Mod details updated successfully.', mod: updatedMod };
};

exports.getRecentMods = async (limit = 5) => {
    const mods = await modRepository.findRecentMods(limit);
    // Puedes procesar los mods aquí si es necesario antes de enviarlos
    return mods;
};

// Función para sanitizar nombres de carpeta (simple ejemplo)
function sanitizeFolderName(name) {
    return name.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/__+/g, '_');
}

exports.createGameEntry = async ({ name, description, cover_image_url, ftp_folder_name_suggestion }) => {
    if (!name || !ftp_folder_name_suggestion) {
        const error = new Error('Game name and FTP folder name suggestion are required.');
        error.statusCode = 400;
        throw error;
    }
    if (!FTP_MODS_ROOT_PATH) {
        throw new Error("FTP root path configuration is missing. Cannot create game folder.");
    }

    const sanitizedFolderName = sanitizeFolderName(ftp_folder_name_suggestion);
    if (!sanitizedFolderName) {
         const error = new Error('FTP folder name is invalid after sanitization.');
         error.statusCode = 400;
         throw error;
    }

    // La ruta completa al directorio de mods para este nuevo juego
    const gameModDirectoryOnServer = path.join(FTP_MODS_ROOT_PATH, sanitizedFolderName);

    // 1. Intentar crear la carpeta en el sistema de archivos (que es tu FTP)
    try {
        await fs.mkdir(gameModDirectoryOnServer, { recursive: false }); // No recursivo para asegurar que FTP_MODS_ROOT_PATH exista
        console.log(`Directory created for game: ${gameModDirectoryOnServer}`);
    } catch (diskError) {
        if (diskError.code === 'EEXIST') { // La carpeta ya existe
            console.warn(`FTP folder '${sanitizedFolderName}' already exists. Proceeding to add to DB if not present.`);
            // Podrías decidir si esto es un error o no. Si la carpeta existe pero no el juego en BD,
            // podría ser un intento de re-añadir. Por ahora, permitimos continuar si es EEXIST.
        } else {
            console.error("Error creating game directory on FTP/disk:", diskError);
            throw new Error("Server error: Could not create directory for game mods.");
        }
    }

    // 2. Intentar crear la entrada en la base de datos
    try {
        const newGame = await gameRepository.createGame({
            name,
            description: description || '',
            cover_image_url: cover_image_url || '',
            ftp_folder_name: sanitizedFolderName // Usar el nombre sanitizado
        });
        return { message: 'Game created successfully.', game: newGame };
    } catch (dbError) {
        // Si falla la inserción en BD (ej. nombre de juego ya existe, pero la carpeta se creó)
        // Podríamos intentar borrar la carpeta creada, pero esto puede complicar la lógica de reintentos.
        // Por ahora, si la carpeta se creó y la BD falla, la carpeta queda.
        console.error("Error saving game to DB after creating folder (if it was new):", dbError.message);
        // Re-lanzar el error de la BD (que ya tiene statusCode si es de constraint)
        if (dbError.statusCode) throw dbError; 
        throw new Error("Failed to save game to database.");
    }
};