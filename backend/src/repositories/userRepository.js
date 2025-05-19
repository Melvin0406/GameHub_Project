// backend/src/repositories/userRepository.js
const db = require('../config/database'); // Tu conexión a SQLite

exports.findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE email = ?";
        db.get(sql, [email], (err, row) => {
            if (err) {
                console.error("Error en userRepository.findUserByEmail:", err.message);
                reject(new Error("Error al buscar usuario por email.")); // Error genérico para el servicio
            } else {
                resolve(row); // Devuelve la fila completa o undefined si no se encuentra
            }
        });
    });
};

exports.findUserByUsernameOrEmail = (username, email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
        db.get(sql, [username, email], (err, row) => {
            if (err) {
                console.error("Error en userRepository.findUserByUsernameOrEmail:", err.message);
                reject(new Error("Error al verificar existencia de usuario."));
            } else {
                resolve(row);
            }
        });
    });
};

exports.createUser = (username, email, passwordHash) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        // 'this' dentro de la callback de db.run se refiere al statement
        db.run(sql, [username, email, passwordHash], function(err) {
            if (err) {
                console.error("Error en userRepository.createUser:", err.message);
                reject(new Error("Error al crear el usuario."));
            } else {
                // Devolvemos el ID del nuevo usuario y sus datos (sin el hash)
                resolve({ id: this.lastID, username, email });
            }
        });
    });
};

exports.findUserById = (id) => { // Necesario para el endpoint /me
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, username, email, profile_image_url FROM users WHERE id = ?";
        db.get(sql, [id], (err, row) => {
            if (err) reject(new Error("Error fetching user by ID."));
            else resolve(row);
        });
    });
};

exports.updateProfileImageUrl = (userId, imageUrl) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE users SET profile_image_url = ? WHERE id = ?";
        db.run(sql, [imageUrl, userId], function(err) {
            if (err) {
                console.error("Error in userRepository.updateProfileImageUrl:", err.message);
                reject(new Error("Error updating profile image URL in database."));
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
};

exports.searchUsersByUsername = (searchTerm, excludeUserId) => {
    return new Promise((resolve, reject) => {
        // Use LIKE for partial matching, exclude the current user
        const sql = "SELECT id, username, profile_image_url FROM users WHERE username LIKE ? AND id != ?";
        db.all(sql, [`%${searchTerm}%`, excludeUserId], (err, rows) => {
            if (err) reject(new Error("Error searching users."));
            else resolve(rows);
        });
    });
};

exports.findUserByExactUsername = (username) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id, username, email, profile_image_url FROM users WHERE username = ?";
        db.get(sql, [username], (err, row) => {
            if (err) {
                console.error("Error in userRepository.findUserByExactUsername:", err.message);
                reject(new Error("Error fetching user by exact username from database."));
            } else {
                resolve(row); // Devuelve la fila del usuario o undefined si no se encuentra
            }
        });
    });
};