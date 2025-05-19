// backend/src/routes/friendshipRoutes.js
const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const authMiddleware = require('../middleware/authMiddleware');

// All friendship routes require authentication
router.use(authMiddleware);

// Search users to add as friends (moved from userRoutes for clarity)
router.get('/search-users', friendshipController.searchUsers); 

// Send a friend request to a user (by their username)
router.post('/request/:username', friendshipController.sendRequest);

// Accept a friend request from a user (by their ID)
router.put('/accept/:userId', friendshipController.acceptRequest);

// Decline a friend request OR cancel a sent request OR unfriend (by other user's ID)
router.delete('/remove/:userId', friendshipController.declineOrCancelRequest); 

// List all accepted friends for the current user
router.get('/', friendshipController.getFriends);

// List all pending friend requests received by the current user
router.get('/pending', friendshipController.getPendingRequests);


module.exports = router;