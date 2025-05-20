// backend/src/services/chatService.js
const chatMessageRepository = require('../repositories/chatMessageRepository');

exports.saveChatMessage = async ({ senderId, recipientId, messageText }) => {
    if (!messageText || messageText.trim() === "") {
        throw new Error("Message text cannot be empty.");
    }
    // Podrías añadir más validaciones aquí (longitud del mensaje, etc.)
    return await chatMessageRepository.saveMessage({ senderId, recipientId, messageText });
};

exports.getConversationHistory = async (currentUserId, friendId) => {
    // Por ahora, simple. Podrías añadir lógica de paginación aquí si el repo no la maneja.
    return await chatMessageRepository.getChatHistory(currentUserId, friendId);
};