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

    // async getMe() { // Si añades getMe a BaseApiService
    //     return this._request('/auth/me', 'GET', null, true);
    // }

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
}

// Crear una instancia global de la fachada para que sea fácil de usar en otras partes del frontend.
const apiService = new ApiService();

// Si usaras módulos ES6: export default apiService; o export const apiService = new ApiService();