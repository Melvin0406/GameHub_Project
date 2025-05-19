// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\BaseApiService.js

class BaseApiService {
    constructor(baseUrl = '/api') {
        if (this.constructor === BaseApiService) {
            throw new Error("La clase abstracta 'BaseApiService' no puede ser instanciada directamente.");
        }
        this.baseUrl = baseUrl;
    }

    async _request(endpoint, method = 'GET', body = null, requiresAuth = false) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (requiresAuth) {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error('BaseApiService: Token de autenticación no encontrado para ruta protegida.');
                // Podrías manejar la redirección al login aquí globalmente o lanzar un error específico.
                const authError = new Error('Autenticación requerida. Por favor, inicia sesión.');
                authError.requiresLogin = true;
                throw authError;
            }
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json(); // Intenta parsear JSON siempre

            if (!response.ok) {
                const errorMessage = data.message || `Error HTTP ${response.status} al acceder a ${url}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = data; 
                throw error;
            }
            return data;
        } catch (error) {
            if (error.status || error.requiresLogin) { // Si ya es un error estructurado por nosotros
                throw error;
            } else { // Error de red o de parseo de fetch
                console.error(`BaseApiService: Error de red o parseo para ${method} ${url}:`, error);
                const networkError = new Error('Error de comunicación con el servidor. Intenta de nuevo más tarde.');
                networkError.isNetworkError = true;
                throw networkError;
            }
        }
    }

    async _uploadRequest(endpoint, formData, requiresAuth = true) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {}; // NO Content-Type para FormData, el navegador lo pone
    
        if (requiresAuth) {
            const token = localStorage.getItem('authToken');
            if (!token) { /* ... manejo de error de token ... */ throw new Error('Autenticación requerida.'); }
            headers['Authorization'] = `Bearer ${token}`;
        }
    
        const config = {
            method: 'POST',
            headers: headers,
            body: formData,
        };
    
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) { /* ... manejo de error ... */ throw new Error(data.message || 'Error en subida'); }
            return data;
        } catch (error) { /* ... manejo de error ... */ throw error; }
    }

    // Métodos "abstractos" que las subclases DEBEN implementar.
    // Representan la "interfaz" que la fachada debe cumplir.
    async login(email, password) {
        throw new Error("Método 'login' debe ser implementado por la subclase.");
    }

    async signup(username, email, password) {
        throw new Error("Método 'signup' debe ser implementado por la subclase.");
    }

    async sendEmail(to, subject, text) {
        throw new Error("Método 'sendEmail' debe ser implementado por la subclase.");
    }
}