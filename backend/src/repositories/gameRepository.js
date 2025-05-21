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

exports.createGame = ({ name, description, cover_image_url, ftp_folder_name }) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO games (name, description, cover_image_url, ftp_folder_name)
            VALUES (?, ?, ?, ?)
        `;
        db.run(sql, [name, description, cover_image_url, ftp_folder_name], function(err) {
            if (err) {
                // Manejar error de constraint UNIQUE (para name y ftp_folder_name)
                if (err.message && err.message.includes("UNIQUE constraint failed")) {
                    let field = "name or ftp_folder_name";
                    if (err.message.includes("games.name")) field = "name";
                    if (err.message.includes("games.ftp_folder_name")) field = "ftp_folder_name";
                    return reject({ statusCode: 409, message: `Game with this ${field} already exists.` });
                }
                console.error("Error in gameRepository.createGame:", err.message);
                reject(new Error("Failed to create game in database."));
            } else {
                resolve({ 
                    id: this.lastID, 
                    name, 
                    description, 
                    cover_image_url, 
                    ftp_folder_name 
                });
            }
        });
    });
};