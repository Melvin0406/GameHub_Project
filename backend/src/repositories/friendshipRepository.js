// backend/src/repositories/friendshipRepository.js
const db = require('../config/database');

// Create a new friend request
exports.createRequest = (requesterId, addresseeId) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')";
        db.run(sql, [requesterId, addresseeId], function(err) {
            if (err) {
                // Handle unique constraint violation (duplicate request)
                if (err.message.includes('UNIQUE constraint failed')) {
                    return reject({ statusCode: 409, message: "Friend request already sent or exists." });
                }
                console.error("Error in friendshipRepository.createRequest:", err.message);
                return reject(new Error("Failed to send friend request (database error)."));
            }
            resolve({ id: this.lastID, requester_id: requesterId, addressee_id: addresseeId, status: 'pending' });
        });
    });
};

// Find a specific friendship/request by user IDs (in either direction for some checks)
exports.findFriendshipBetweenUsers = (userId1, userId2) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM friendships 
            WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
        `;
        db.get(sql, [userId1, userId2, userId2, userId1], (err, row) => {
            if (err) reject(new Error("Error finding friendship."));
            else resolve(row);
        });
    });
};

// Update the status of a friend request (e.g., to 'accepted' or 'declined')
exports.updateRequestStatus = (requesterId, addresseeId, newStatus) => {
    return new Promise((resolve, reject) => {
        const acceptedAtClause = newStatus === 'accepted' ? ", accepted_at = CURRENT_TIMESTAMP" : "";
        const sql = `UPDATE friendships SET status = ? ${acceptedAtClause} WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'`;
        db.run(sql, [newStatus, requesterId, addresseeId], function(err) {
            if (err) reject(new Error("Failed to update friend request status."));
            else if (this.changes === 0) reject({ statusCode: 404, message: "Pending friend request not found or already actioned." });
            else resolve({ changes: this.changes });
        });
    });
};

// Get all accepted friends for a user
exports.findAcceptedFriendsByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                f.id as friendship_id,
                f.status,
                f.requested_at,
                f.accepted_at,
                CASE
                    WHEN f.requester_id = ? THEN u_addressee.id
                    ELSE u_requester.id
                END as friend_id,
                CASE
                    WHEN f.requester_id = ? THEN u_addressee.username
                    ELSE u_requester.username
                END as friend_username,
                CASE
                    WHEN f.requester_id = ? THEN u_addressee.profile_image_url
                    ELSE u_requester.profile_image_url
                END as friend_profile_image_url
            FROM friendships f
            LEFT JOIN users u_requester ON f.requester_id = u_requester.id
            LEFT JOIN users u_addressee ON f.addressee_id = u_addressee.id
            WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'accepted'
        `;
        db.all(sql, [userId, userId, userId, userId, userId], (err, rows) => {
            if (err) reject(new Error("Error fetching accepted friends."));
            else resolve(rows);
        });
    });
};

// Get pending friend requests received by a user
exports.findPendingRequestsForUser = (addresseeId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT f.id as friendship_id, f.requester_id, u.username as requester_username, u.profile_image_url as requester_profile_image_url, f.requested_at
            FROM friendships f
            JOIN users u ON f.requester_id = u.id
            WHERE f.addressee_id = ? AND f.status = 'pending'
            ORDER BY f.requested_at DESC
        `;
        db.all(sql, [addresseeId], (err, rows) => {
            if (err) reject(new Error("Error fetching pending friend requests."));
            else resolve(rows);
        });
    });
};

// Remove a friendship (unfriend) or decline/cancel a request
exports.deleteFriendship = (userId1, userId2) => {
    return new Promise((resolve, reject) => {
        const sql = `
            DELETE FROM friendships 
            WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
        `;
        db.run(sql, [userId1, userId2, userId2, userId1], function(err) {
            if (err) reject(new Error("Failed to delete friendship."));
            else if (this.changes === 0) reject({ statusCode: 404, message: "Friendship not found." });
            else resolve({ changes: this.changes });
        });
    });
};