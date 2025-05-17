// backend/src/services/internalMessageService.js
const internalMessageRepository = require('../repositories/internalMessageRepository');
const userRepository = require('../repositories/userRepository'); // Para buscar usuarios

exports.sendMessage = async ({ senderUserId, recipientUsername, subject, body }) => {
    if (!recipientUsername || !subject || !body) {
        const error = new Error('Destinatario, asunto y cuerpo son requeridos.');
        error.statusCode = 400;
        throw error;
    }

    const recipientUser = await userRepository.findUserByUsernameOrEmail(recipientUsername, recipientUsername); // Buscar por username O email
    if (!recipientUser) {
        const error = new Error(`Usuario destinatario '${recipientUsername}' no encontrado.`);
        error.statusCode = 404;
        throw error;
    }
    if (recipientUser.id === senderUserId) {
        const error = new Error('No puedes enviarte mensajes a ti mismo.');
        error.statusCode = 400;
        throw error;
    }

    return await internalMessageRepository.createMessage({
        sender_user_id: senderUserId,
        recipient_user_id: recipientUser.id,
        subject,
        body
    });
};

exports.getInboxForUser = async (userId) => {
    return await internalMessageRepository.findMessagesByRecipientId(userId);
};

exports.getSentMessagesForUser = async (userId) => {
    return await internalMessageRepository.findMessagesBySenderId(userId);
};

exports.readMessage = async (messageId, userId) => {
    const message = await internalMessageRepository.findMessageByIdForUser(messageId, userId);
    if (!message) {
        const error = new Error('Mensaje no encontrado o acceso denegado.');
        error.statusCode = 404;
        throw error;
    }

    // Si el usuario actual es el destinatario y el mensaje no está leído, marcarlo
    if (message.recipient_user_id === userId && !message.is_read) {
        await internalMessageRepository.markMessageAsRead(messageId, userId);
        message.is_read = 1; // Actualizar el objeto para la respuesta inmediata
    }
    return message;
};

exports.deleteMessageForUser = async (messageId, userId) => {
    // Primero, asegurar que el mensaje existe y el usuario tiene relación con él
    const message = await internalMessageRepository.findMessageByIdForUser(messageId, userId);
    if (!message) {
        const error = new Error('Mensaje no encontrado o no tienes permiso para esta acción.');
        error.statusCode = 404; // O 403 si se quiere ser más específico
        throw error;
    }

    const result = await internalMessageRepository.markMessageAsDeletedForUser(messageId, userId);
    if (result.changes === 0) {
        // Podría significar que ya estaba borrado para ese usuario o algo falló en la condición
        throw new Error('No se pudo borrar el mensaje o ya estaba borrado.');
    }
    return { message: "Mensaje marcado como borrado." };
};