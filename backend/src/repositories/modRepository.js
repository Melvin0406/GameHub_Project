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
                m.id, m.game_id, m.user_id, m.name, m.description, m.version, 
                m.file_name, m.ftp_file_path, m.upload_date, 
                m.download_count, m.file_size,
                u.username as uploaded_by_username -- Este ya lo teníamos
            FROM mods m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `;
        db.get(sql, [modId], (err, row) => {
            if (err) {
                console.error("Error en modRepository.findModById:", err.message);
                reject(new Error("Error fetching mod from database."));
            } else {
                resolve(row);
            }
        });
    });
};

exports.deleteModByIdAndUserId = (modId, userId) => {
    return new Promise((resolve, reject) => {
        // Solo borra si el modId y el userId coinciden
        const sql = "DELETE FROM mods WHERE id = ? AND user_id = ?";
        db.run(sql, [modId, userId], function(err) {
            if (err) {
                console.error("Error en modRepository.deleteModByIdAndUserId:", err.message);
                reject(new Error("Error deleting mod from database."));
            } else {
                resolve({ changes: this.changes }); // 'changes' indica el número de filas borradas
            }
        });
    });
};

exports.updateModDetails = (modId, userId, { name, description, version }) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE mods 
            SET name = ?, description = ?, version = ?
            WHERE id = ? AND user_id = ? 
        `;
        // El orden de los parámetros debe coincidir con los '?'
        db.run(sql, [name, description, version, modId, userId], function(err) {
            if (err) {
                console.error("Error en modRepository.updateModDetails:", err.message);
                reject(new Error("Error updating mod details in database."));
            } else {
                if (this.changes === 0) {
                    // Esto puede significar que el mod no se encontró con ese ID y user_id,
                    // o que los datos enviados eran idénticos a los existentes.
                    // Para ser más precisos, podríamos hacer un SELECT previo, pero por ahora está bien.
                    reject({ statusCode: 404, message: "Mod not found for this user, or no changes were made."});
                } else {
                    resolve({ changes: this.changes });
                }
            }
        });
    });
};

exports.findRecentMods = (limit = 5) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                m.id, m.name as mod_name, m.description as mod_description, 
                m.file_name, m.upload_date, 
                g.id as game_id, g.name as game_name, g.ftp_folder_name as game_ftp_folder_name,
                u.username as uploaded_by_username
            FROM mods m
            JOIN games g ON m.game_id = g.id
            LEFT JOIN users u ON m.user_id = u.id
            ORDER BY m.upload_date DESC
            LIMIT ?
        `;
        db.all(sql, [limit], (err, rows) => {
            if (err) {
                console.error("Error in modRepository.findRecentMods:", err.message);
                reject(new Error("Error fetching recent mods from database."));
            } else {
                resolve(rows);
            }
        });
    });
};