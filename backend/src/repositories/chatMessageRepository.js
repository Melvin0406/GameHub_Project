// backend/src/repositories/chatMessageRepository.js
const db = require('../config/database');

exports.saveMessage = ({ senderId, recipientId, messageText }) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO chat_messages (sender_id, recipient_id, message_text) VALUES (?, ?, ?)";
        db.run(sql, [senderId, recipientId, messageText], function(err) {
            if (err) {
                console.error("Error saving chat message to DB:", err.message);
                reject(new Error("Failed to save chat message."));
            } else {
                // Obtener el mensaje recién guardado para devolverlo con timestamp, etc.
                db.get("SELECT cm.*, u_sender.username as sender_username FROM chat_messages cm JOIN users u_sender ON cm.sender_id = u_sender.id WHERE cm.id = ?", [this.lastID], (err, row) => {
                    if (err) reject(new Error("Failed to retrieve saved chat message."));
                    else resolve(row);
                });
            }
        });
    });
};

exports.getChatHistory = (userId1, userId2, limit = 50, offset = 0) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT cm.*, u_sender.username as sender_username 
            FROM chat_messages cm
            JOIN users u_sender ON cm.sender_id = u_sender.id
            WHERE (cm.sender_id = ? AND cm.recipient_id = ?) OR (cm.sender_id = ? AND cm.recipient_id = ?)
            ORDER BY cm.timestamp DESC
            LIMIT ? OFFSET ?
        `;
        // Los mensajes se obtienen en orden descendente (más nuevos primero)
        // El frontend los invertirá si es necesario para mostrar los más viejos arriba.
        db.all(sql, [userId1, userId2, userId2, userId1, limit, offset], (err, rows) => {
            if (err) {
                console.error("Error fetching chat history from DB:", err.message);
                reject(new Error("Failed to fetch chat history."));
            } else {
                resolve(rows.reverse()); // Invertir para que los más viejos estén primero en el array
            }
        });
    });
};