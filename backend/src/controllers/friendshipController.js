// backend/src/controllers/friendshipController.js
const friendshipService = require('../services/friendshipService');
const userRepository = require('../repositories/userRepository'); // For searching users

exports.sendRequest = async (req, res, next) => {
    try {
        const requesterId = req.user.id; // From authMiddleware
        const addresseeUsername = req.params.username; // Assuming username is in URL param
        
        if (!addresseeUsername) {
            return res.status(400).json({ message: "Addressee username is required." });
        }

        const result = await friendshipService.sendFriendRequest(requesterId, addresseeUsername);
        res.status(201).json({ message: `Friend request sent to ${addresseeUsername}.`, ...result });
    } catch (error) {
        next(error);
    }
};

exports.acceptRequest = async (req, res, next) => {
    try {
        const addresseeId = req.user.id; // Current user accepting the request
        const requesterId = parseInt(req.params.userId, 10); // ID of the user who sent the request

        if (isNaN(requesterId)) {
            return res.status(400).json({ message: "Invalid requester ID." });
        }

        await friendshipService.acceptFriendRequest(requesterId, addresseeId);
        res.json({ message: "Friend request accepted." });
    } catch (error) {
        next(error);
    }
};

exports.declineOrCancelRequest = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = parseInt(req.params.userId, 10); // ID of the other user in the friendship/request

        if (isNaN(otherUserId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }
        
        await friendshipService.declineOrCancelFriendRequest(currentUserId, otherUserId);
        res.json({ message: "Friendship/request removed or declined." });
    } catch (error) {
        next(error);
    }
};

exports.getFriends = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const friends = await friendshipService.listFriends(userId);
        res.json(friends);
    } catch (error) {
        next(error);
    }
};

exports.getPendingRequests = async (req, res, next) => {
    try {
        const userId = req.user.id; // User checking their received pending requests
        const requests = await friendshipService.listPendingRequests(userId);
        res.json(requests);
    } catch (error) {
        next(error);
    }
};

// Endpoint to search users (useful for finding users to add as friends)
exports.searchUsers = async (req, res, next) => {
    try {
        const searchTerm = req.query.q; // e.g., /api/users/search?q=kevin
        const currentUserId = req.user.id;

        if (!searchTerm || searchTerm.trim().length < 2) { // Minimum 2 chars to search
            return res.status(400).json({ message: "Search term must be at least 2 characters." });
        }
        // Modify userRepository to have a search function that excludes current user
        // and potentially existing friends/pending requests.
        // For now, a simple search by username:
        const users = await userRepository.searchUsersByUsername(searchTerm.trim(), currentUserId);
        res.json(users);
    } catch (error) {
        next(error);
    }
};