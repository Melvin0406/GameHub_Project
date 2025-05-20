// backend/src/controllers/chatController.js
const chatService = require('../services/chatService');

exports.getChatHistory = async (req, res, next) => {
    try {
        const currentUserId = req.user.id; // De authMiddleware
        const friendId = parseInt(req.params.friendId, 10);

        if (isNaN(friendId)) {
            return res.status(400).json({ message: "Invalid friend ID." });
        }

        const history = await chatService.getConversationHistory(currentUserId, friendId);
        res.json(history);
    } catch (error) {
        next(error);
    }
};