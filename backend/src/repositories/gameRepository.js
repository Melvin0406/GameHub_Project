// backend/src/repositories/gameRepository.js
const db = require('../config/database');

exports.findAllGames = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, name, description, cover_image_url, ftp_folder_name FROM games ORDER BY name COLLATE NOCASE";
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Error en gameRepository.findAllGames:", err.message);
                reject(new Error("Error al obtener la lista de juegos desde la base de datos."));
            } else {
                resolve(rows);
            }
        });
    });
};

exports.findGameById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, name, description, cover_image_url, ftp_folder_name FROM games WHERE id = ?";
        db.get(sql, [id], (err, row) => {
            if (err) {
                console.error("Error en gameRepository.findGameById:", err.message);
                reject(new Error("Error al obtener el juego desde la base de datos."));
            } else {
                resolve(row);
            }
        });
    });
};

// En el futuro, podrías añadir:
// exports.createGame = (gameData) => { /* ... */ };
// exports.updateGame = (id, gameData) => { /* ... */ };
// exports.deleteGame = (id) => { /* ... */ };