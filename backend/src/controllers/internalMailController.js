// backend/src/controllers/internalMailController.js
const internalMessageService = require('../services/internalMessageService');

exports.sendMessage = async (req, res, next) => {
    try {
        const senderUserId = req.user.id; // De authMiddleware
        const { recipientUsername, subject, body } = req.body;
        const result = await internalMessageService.sendMessage({ senderUserId, recipientUsername, subject, body });
        res.status(201).json(result);
    } catch (error) {
        next(error); // Pasa al manejador de errores global
    }
};

exports.getInbox = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const messages = await internalMessageService.getInboxForUser(userId);
        res.json(messages);
    } catch (error) {
        next(error);
    }
};

exports.getSentMessages = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const messages = await internalMessageService.getSentMessagesForUser(userId);
        res.json(messages);
    } catch (error) {
        next(error);
    }
};

exports.getMessageById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const messageId = parseInt(req.params.messageId, 10);
        if (isNaN(messageId)) return res.status(400).json({ message: "ID de mensaje inválido." });
        
        const message = await internalMessageService.readMessage(messageId, userId);
        res.json(message);
    } catch (error) {
        next(error);
    }
};

exports.deleteMessage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const messageId = parseInt(req.params.messageId, 10);
        if (isNaN(messageId)) return res.status(400).json({ message: "ID de mensaje inválido." });

        const result = await internalMessageService.deleteMessageForUser(messageId, userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};