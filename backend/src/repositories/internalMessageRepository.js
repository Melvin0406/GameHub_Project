// backend/src/repositories/internalMessageRepository.js
const db = require('../config/database');

exports.createMessage = ({ sender_user_id, recipient_user_id, subject, body }) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO internal_messages (sender_user_id, recipient_user_id, subject, body)
                     VALUES (?, ?, ?, ?)`;
        db.run(sql, [sender_user_id, recipient_user_id, subject, body], function(err) {
            if (err) {
                reject(new Error("Error al guardar el mensaje interno en la BD."));
            } else {
                resolve({ id: this.lastID, sender_user_id, recipient_user_id, subject });
            }
        });
    });
};

exports.findMessagesByRecipientId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT m.id, m.subject, m.body, m.sent_at, m.is_read, 
                   u_sender.username as sender_username, m.sender_user_id
            FROM internal_messages m
            JOIN users u_sender ON m.sender_user_id = u_sender.id
            WHERE m.recipient_user_id = ? AND m.recipient_deleted_at IS NULL
            ORDER BY m.sent_at DESC
        `;
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                reject(new Error("Error al obtener la bandeja de entrada desde la BD."));
            } else {
                resolve(rows);
            }
        });
    });
};

exports.findMessagesBySenderId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT m.id, m.subject, m.body, m.sent_at, m.is_read, 
                   u_recipient.username as recipient_username, m.recipient_user_id
            FROM internal_messages m
            JOIN users u_recipient ON m.recipient_user_id = u_recipient.id
            WHERE m.sender_user_id = ? AND m.sender_deleted_at IS NULL
            ORDER BY m.sent_at DESC
        `;
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                reject(new Error("Error al obtener mensajes enviados desde la BD."));
            } else {
                resolve(rows);
            }
        });
    });
};

exports.findMessageByIdForUser = (messageId, userId) => {
    return new Promise((resolve, reject) => {
        // Asegura que el usuario sea el remitente o el destinatario y no lo haya borrado
        const sql = `
            SELECT m.*, 
                   s.username as sender_username, 
                   r.username as recipient_username
            FROM internal_messages m
            JOIN users s ON m.sender_user_id = s.id
            JOIN users r ON m.recipient_user_id = r.id
            WHERE m.id = ? AND 
                  ((m.recipient_user_id = ? AND m.recipient_deleted_at IS NULL) OR 
                   (m.sender_user_id = ? AND m.sender_deleted_at IS NULL))
        `;
        db.get(sql, [messageId, userId, userId], (err, row) => {
            if (err) {
                reject(new Error("Error al obtener el mensaje desde la BD."));
            } else {
                resolve(row); // Puede ser undefined si no se encuentra o no tiene permiso
            }
        });
    });
};

exports.markMessageAsRead = (messageId, recipientUserId) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE internal_messages SET is_read = 1 WHERE id = ? AND recipient_user_id = ? AND is_read = 0";
        db.run(sql, [messageId, recipientUserId], function(err) {
            if (err) {
                reject(new Error("Error al marcar el mensaje como leído en la BD."));
            } else {
                resolve({ changes: this.changes }); // Devuelve el número de filas afectadas
            }
        });
    });
};

exports.markMessageAsDeletedForUser = (messageId, userId) => {
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        // Determinar si el usuario es el remitente o el destinatario para actualizar el campo correcto
        db.get("SELECT sender_user_id, recipient_user_id FROM internal_messages WHERE id = ?", [messageId], (err, message) => {
            if (err) return reject(new Error("Error al buscar el mensaje para borrar."));
            if (!message) return reject({ statusCode: 404, message: "Mensaje no encontrado." });

            let fieldToUpdate;
            if (message.sender_user_id === userId) {
                fieldToUpdate = "sender_deleted_at";
            } else if (message.recipient_user_id === userId) {
                fieldToUpdate = "recipient_deleted_at";
            } else {
                return reject({ statusCode: 403, message: "No tienes permiso para borrar este mensaje." });
            }

            const sql = `UPDATE internal_messages SET ${fieldToUpdate} = ? WHERE id = ?`;
            db.run(sql, [now, messageId], function(err) {
                if (err) {
                    reject(new Error("Error al marcar el mensaje como borrado en la BD."));
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    });
};