// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\ApiService.js
// Este archivo DEBE incluirse DESPUÉS de BaseApiService.js en tu HTML

class ApiService extends BaseApiService {
    constructor(baseUrl = '/api') {
        super(baseUrl); // Llama al constructor de la clase BaseApiService
    }

    // Implementación de los métodos "abstractos"
    // Cada uno de estos métodos es una operación simplificada de la fachada.

    async login(email, password) {
        // Usa el método _request heredado de BaseApiService
        return this._request('/auth/login', 'POST', { email, password }, false);
    }

    async signup(username, email, password) {
        return this._request('/auth/signup', 'POST', { username, email, password }, false);
    }

    async sendEmail(to, subject, text) {
        return this._request('/email/send', 'POST', { to, subject, text }, true); // true porque requiere autenticación
    }

    // Nuevos métodos para juegos y mods
    async getAllGames() {
        return this._request('/games', 'GET', null, false); // No requiere autenticación para listar juegos
    }

    async getGameDetails(gameId) {
        return this._request(`/games/${gameId}`, 'GET', null, false); // No requiere autenticación para ver detalles/mods
    }

    async uploadMod(gameId, formData) {
        return this._uploadRequest(`/games/${gameId}/mods`, formData, true);
    }

    async getInternalInbox() {
        return this._request('/internal-mail/inbox', 'GET', null, true);
    }

    async getInternalSentMessages() {
        return this._request('/internal-mail/sent', 'GET', null, true);
    }

    async getInternalMessageById(messageId) {
        return this._request(`/internal-mail/${messageId}`, 'GET', null, true);
    }

    async sendInternalMessage(recipientUsername, subject, body) {
        return this._request('/internal-mail/send', 'POST', { recipientUsername, subject, body }, true);
    }

    async deleteInternalMessage(messageId) {
        // Asumiendo que el backend espera un PUT para el borrado suave
        return this._request(`/internal-mail/${messageId}/delete`, 'PUT', null, true);
    }

    async getMyProfile() {
        return this._request('/users/me', 'GET', null, true);
    }

    async uploadProfilePicture(formData) {
        // Usaremos el _uploadRequest que maneja FormData sin 'Content-Type: application/json'
        return this._uploadRequest('/users/me/profile-picture', formData, true);
    }

    async deleteMod(modId) {
        // El método _request ya maneja el token si requiresAuth es true
        return this._request(`/games/mods/${modId}`, 'DELETE', null, true); 
    }

    async updateModDetails(modId, modData) { // modData será un objeto { name, description, version }
        return this._request(`/games/mods/${modId}`, 'PUT', modData, true);
    }

    async searchUsers(searchTerm) {
        return this._request(`/friends/search-users?q=${encodeURIComponent(searchTerm)}`, 'GET', null, true);
    }

    // (Podrías añadir aquí los otros métodos para amigos que faltan, como sendFriendRequest, acceptFriendRequest, etc.)
    async sendFriendRequest(username) {
        return this._request(`/friends/request/${username}`, 'POST', null, true);
    }

    async acceptFriendRequest(requesterId) {
        return this._request(`/friends/accept/${requesterId}`, 'PUT', null, true);
    }

    async declineOrRemoveFriend(otherUserId) {
        return this._request(`/friends/remove/${otherUserId}`, 'DELETE', null, true);
    }

    async getFriends() {
        return this._request('/friends', 'GET', null, true);
    }

    async getPendingFriendRequests() {
        return this._request('/friends/pending', 'GET', null, true);
    }
}

// Crear una instancia global de la fachada para que sea fácil de usar en otras partes del frontend.
const apiService = new ApiService();