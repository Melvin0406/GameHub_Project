// backend/src/controllers/gameController.js
const gameService = require('../services/gameService');
const path = require('path');

exports.getAllGames = async (req, res, next) => {
    try {
        const games = await gameService.getAllGames();
        res.json(games);
    } catch (error) {
        next(error); // Pasa al manejador de errores global
    }
};

exports.getGameByIdWithMods = async (req, res, next) => {
    try {
        const gameId = req.params.gameId;
        if (isNaN(parseInt(gameId, 10))) {
             return res.status(400).json({ message: "El ID del juego debe ser un número." });
        }
        const gameDetails = await gameService.getGameDetailsWithMods(parseInt(gameId, 10));
        res.json(gameDetails);
    } catch (error) {
        next(error);
    }
};

exports.uploadMod = async (req, res, next) => {
    try {
        const gameId = req.params.gameId;
        const modDetails = req.body; // name, description, version del mod (campos de texto del form)
        const fileFromMulter = req.file; // Información del archivo subido por multer
        const userId = req.user.id; // Añadido por authMiddleware

        if (isNaN(parseInt(gameId, 10))) {
            // Si multer ya guardó el archivo, hay que limpiarlo
            if (req.file) require('fs').promises.unlink(req.file.path).catch(e => console.error("Error limpiando archivo tras gameId inválido", e));
            return res.status(400).json({ message: "El ID del juego debe ser un número." });
        }

        const result = await gameService.uploadModForGame({
            gameId: parseInt(gameId, 10),
            userId,
            modDetails,
            fileFromMulter
        });
        res.status(201).json(result);

    } catch (error) {
        // Si el archivo se subió pero el servicio lanzó un error, multer ya lo guardó temporalmente.
        // El servicio gameService.uploadModForGame se encarga de intentar limpiar el archivo temporal si falla.
        console.error("Error en uploadMod controller:", error.message);
        next(error); // Pasa al manejador de errores global
    }
};

exports.downloadModFile = async (req, res, next) => {
    try {
        const modId = req.params.modId;
        if (isNaN(parseInt(modId, 10))) {
            return res.status(400).json({ message: "El ID del mod debe ser un número." });
        }

        // Necesitaremos un método en el servicio para obtener la ruta del archivo y el nombre original
        const fileDetails = await gameService.getModFilePath(parseInt(modId, 10));
        
        if (!fileDetails || !fileDetails.absolutePath || !fileDetails.originalName) {
            const error = new Error('Archivo del mod no encontrado o ruta no disponible.');
            error.statusCode = 404;
            throw error;
        }

        // Express.js tiene un método res.download() muy útil para esto
        // Establece automáticamente los headers correctos (Content-Disposition, Content-Type)
        res.download(fileDetails.absolutePath, fileDetails.originalName, (err) => {
            if (err) {
                // Manejar errores que puedan ocurrir después de que los encabezados ya fueron enviados
                // Por ejemplo, si el archivo es borrado mientras se está transmitiendo.
                // 'next(err)' podría no funcionar bien aquí si los headers ya se enviaron.
                console.error("Error al enviar el archivo con res.download():", err);
                // Si los headers no se han enviado, puedes usar next(err)
                // Si ya se enviaron, la conexión probablemente se cortará o el cliente recibirá un archivo incompleto.
                // No necesitas hacer 'res.status().json()' aquí si res.download falla después de enviar headers.
            }
        });

    } catch (error) {
        next(error); // Pasa al manejador de errores global
    }
};

exports.deleteMod = async (req, res, next) => {
    try {
        const modId = parseInt(req.params.modId, 10);
        const requestingUserId = req.user.id; // De authMiddleware

        if (isNaN(modId)) {
            return res.status(400).json({ message: "Invalid Mod ID." });
        }

        const result = await gameService.deleteUserMod(modId, requestingUserId);
        res.json(result);
    } catch (error) {
        next(error); // Pasa al manejador de errores global
    }
};