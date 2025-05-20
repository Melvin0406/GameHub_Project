// backend/src/repositories/liveStreamRepository.js
const db = require('../config/database');

exports.addLiveStream = ({ userId, streamKey, title, gameName }) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO live_streams (user_id, stream_key, title, game_name)
            VALUES (?, ?, ?, ?)
        `;
        db.run(sql, [userId, streamKey, title, gameName], function(err) {
            if (err) {
                // Manejar error de UNIQUE constraint si el usuario ya está en vivo
                if (err.message && err.message.includes("UNIQUE constraint failed: live_streams.user_id")) {
                    return reject({ statusCode: 409, message: "User is already marked as live." });
                }
                console.error("Error in liveStreamRepository.addLiveStream:", err.message);
                reject(new Error("Failed to add live stream to database."));
            } else {
                resolve({ id: this.lastID, userId, streamKey, title, gameName });
            }
        });
    });
};

exports.removeLiveStreamByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM live_streams WHERE user_id = ?";
        db.run(sql, [userId], function(err) {
            if (err) {
                console.error("Error in liveStreamRepository.removeLiveStreamByUserId:", err.message);
                reject(new Error("Failed to remove live stream from database."));
            } else {
                resolve({ changes: this.changes }); // changes = 0 si no se encontró
            }
        });
    });
};

exports.findLiveStreamByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM live_streams WHERE user_id = ?";
        db.get(sql, [userId], (err, row) => {
            if (err) reject(new Error("Error fetching live stream by user ID."));
            else resolve(row);
        });
    });
};

exports.getAllActiveStreams = () => {
    return new Promise((resolve, reject) => {
        // Unir con la tabla users para obtener el nombre de usuario y foto de perfil
        const sql = `
            SELECT 
                ls.stream_key, ls.title, ls.game_name, ls.started_at,
                u.username, u.profile_image_url
            FROM live_streams ls
            JOIN users u ON ls.user_id = u.id
            ORDER BY ls.started_at DESC 
        `;
        // Podrías añadir un LIMIT aquí si esperas muchos streams
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Error in liveStreamRepository.getAllActiveStreams:", err.message);
                reject(new Error("Failed to fetch active streams from database."));
            } else {
                resolve(rows);
            }
        });
    });
};

exports.findActiveStreamByStreamKey = (streamKey) => {
    return new Promise((resolve, reject) => {
        // Unimos con users para obtener también el username del streamer
        const sql = `
            SELECT 
                ls.title, ls.game_name, ls.started_at, ls.user_id,
                u.username as streamer_username, u.profile_image_url as streamer_profile_image_url 
            FROM live_streams ls
            JOIN users u ON ls.user_id = u.id
            WHERE ls.stream_key = ?
        `;
        db.get(sql, [streamKey], (err, row) => {
            if (err) {
                console.error("Error in liveStreamRepository.findActiveStreamByStreamKey:", err.message);
                reject(new Error("Error fetching active stream by stream key."));
            } else {
                resolve(row); // Devuelve la fila del stream o undefined si no está activo
            }
        });
    });
};