// backend/src/repositories/modRepository.js
const db = require('../config/database');

exports.findModsByGameId = (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                m.id, m.game_id, m.user_id, m.name, m.description, m.version, 
                m.file_name, m.ftp_file_path, m.upload_date, 
                m.download_count, m.file_size, u.username as uploaded_by_username
            FROM mods m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.game_id = ?
            ORDER BY m.upload_date DESC
        `;
        db.all(sql, [gameId], (err, rows) => {
            if (err) {
                console.error("Error en modRepository.findModsByGameId:", err.message);
                reject(new Error("Error al obtener los mods para el juego desde la base de datos."));
            } else {
                resolve(rows);
            }
        });
    });
};

exports.findModByIdAndGameId = (modId, gameId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM mods WHERE id = ? AND game_id = ?";
        db.get(sql, [modId, gameId], (err, row) => {
            if (err) {
                console.error("Error en modRepository.findModByIdAndGameId:", err.message);
                reject(new Error("Error al obtener el mod específico desde la base de datos."));
            } else {
                resolve(row);
            }
        });
    });
};

exports.createMod = ({ game_id, user_id, name, description, version, file_name, ftp_file_path, file_size }) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO mods (game_id, user_id, name, description, version, file_name, ftp_file_path, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(sql, [game_id, user_id, name, description, version, file_name, ftp_file_path, file_size], function(err) {
            if (err) {
                console.error("Error en modRepository.createMod:", err.message);
                reject(new Error("Error al registrar el mod en la base de datos."));
            } else {
                resolve({ 
                    id: this.lastID, 
                    name, 
                    file_name, 
                    ftp_file_path,
                    game_id,
                    user_id,
                    description,
                    version,
                    file_size
                });
            }
        });
    });
};

exports.findModById = (modId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                m.*, 
                g.ftp_folder_name as game_ftp_folder_name 
            FROM mods m
            JOIN games g ON m.game_id = g.id
            WHERE m.id = ?
        `;
        // Devolvemos g.ftp_folder_name por si lo necesitamos para construir la ruta,
        // aunque si mod.ftp_file_path ya es 'NombreCarpetaJuego/nombre_archivo.ext',
        // no sería estrictamente necesario aquí. Pero es buena información tener.
        // Modificamos la tabla mods para que ftp_file_path sea la ruta relativa COMPLETA
        // desde FTP_MODS_ROOT_PATH, ej: 'EpicGame/mod.zip'
        db.get(sql, [modId], (err, row) => {
            if (err) {
                console.error("Error en modRepository.findModById:", err.message);
                reject(new Error("Error al obtener el mod desde la base de datos."));
            } else {
                resolve(row);
            }
        });
    });
};