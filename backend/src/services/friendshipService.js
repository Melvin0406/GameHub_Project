// backend/src/services/friendshipService.js
const friendshipRepository = require('../repositories/friendshipRepository');
const userRepository = require('../repositories/userRepository'); // To find users by username

exports.sendFriendRequest = async (requesterId, addresseeUsername) => {
    const addressee = await userRepository.findUserByExactUsername(addresseeUsername);
    if (!addressee) {
        throw { statusCode: 404, message: `User '${addresseeUsername}' not found.` };
    }
    if (requesterId === addressee.id) {
        throw { statusCode: 400, message: "You cannot send a friend request to yourself." };
    }

    // Check if a friendship/request already exists in either direction
    const existingFriendship = await friendshipRepository.findFriendshipBetweenUsers(requesterId, addressee.id);
    if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
            throw { statusCode: 409, message: `You are already friends with ${addresseeUsername}.` };
        } else if (existingFriendship.status === 'pending') {
            // If current user is the addressee of an existing pending request, they should accept it, not send a new one.
            if (existingFriendship.addressee_id === requesterId) {
                 throw { statusCode: 409, message: `${addresseeUsername} has already sent you a friend request. Please respond to it.` };
            }
            // If current user already sent a pending request.
            throw { statusCode: 409, message: `Friend request to ${addresseeUsername} is already pending.` };
        }
        // Potentially handle other statuses like 'declined' or 'blocked' if you want different logic
    }

    return await friendshipRepository.createRequest(requesterId, addressee.id);
};

exports.acceptFriendRequest = async (requesterId, addresseeId /* current user accepting */) => {
    // The addresseeId is the ID of the user who is accepting the request (the current logged-in user)
    // The requesterId is the ID of the user who sent the request (passed in the URL or body)
    return await friendshipRepository.updateRequestStatus(requesterId, addresseeId, 'accepted');
};

exports.declineOrCancelFriendRequest = async (user1Id, user2Id /* current user initiating */) => {
    // This can be used by addressee to decline, or requester to cancel
    // Or to unfriend if they are already friends
    const friendship = await friendshipRepository.findFriendshipBetweenUsers(user1Id, user2Id);
    if (!friendship) {
        throw { statusCode: 404, message: "Friendship or request not found."};
    }
    // More specific checks can be added based on who is user1Id and user2Id relative to 'current user initiating'
    return await friendshipRepository.deleteFriendship(user1Id, user2Id);
};

exports.listFriends = async (userId) => {
    return await friendshipRepository.findAcceptedFriendsByUserId(userId);
};

exports.listPendingRequests = async (userId) => {
    return await friendshipRepository.findPendingRequestsForUser(userId);
};