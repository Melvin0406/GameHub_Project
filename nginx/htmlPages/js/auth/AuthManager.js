// nginx/htmlPages/js/auth/AuthManager.js
// Requiere que Subject.js (js/patterns/Subject.js) esté cargado primero.

class AuthManager extends Subject {
    static processTokenFromUrlAndStore() {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('authToken');
        const keyFromUrl = urlParams.get('key'); // Conservar la stream key
    
        if (tokenFromUrl) {
            console.log("AuthManager (static): Token found in URL, storing to localStorage for this origin.");
            localStorage.setItem('authToken', tokenFromUrl);
            // Opcional: Si el token contiene info del usuario, podrías guardarla aquí también,
            // pero es más seguro que AuthManager la obtenga con /api/users/me después.
            // Por ahora, solo guardamos el token. AuthManager._loadStateFromLocalStorageOnInit lo usará.
    
            // Limpiar authToken de la URL visible, pero conservar otros params como 'key'
            const newSearchParams = new URLSearchParams();
            if (keyFromUrl) newSearchParams.set('key', keyFromUrl);
            // Añade aquí otros parámetros que quieras conservar si los hubiera
            // urlParams.forEach((value, keyParam) => {
            //    if (keyParam !== 'authToken') newSearchParams.set(keyParam, value);
            // });
    
            const newRelativePath = window.location.pathname + (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
            history.replaceState(null, '', newRelativePath);
            return true; // Indica que se procesó un token
        }
        return false; // No se procesó token de la URL
    }
    
    constructor() {
        // Primero, procesar token de URL si existe y guardarlo en localStorage
        // para que _loadStateFromLocalStorageOnInit lo pueda leer.
        AuthManager.processTokenFromUrlAndStore(); 
    
        super(); 
        if (AuthManager._instance) {
            return AuthManager._instance;
        }
        AuthManager._instance = this;
    
        this.currentUser = null;
        this.authToken = null;
        this._loadStateFromLocalStorageOnInit();
    }
  
    _loadStateFromLocalStorageOnInit() {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('currentUserGameHub');
  
      if (token && userStr) {
        try {
          this.authToken = token;
          this.currentUser = JSON.parse(userStr);
          console.log(
            "AuthManager Initialized: State loaded from localStorage for user:",
            this.currentUser.username
          );
        } catch (e) {
          console.error(
            "AuthManager Initialized: Error parsing currentUserGameHub from localStorage. Clearing auth data.",
            e
          );
          this._clearAuthDataInternal(); // Limpiar si los datos están corruptos
        }
      } else {
        this._clearAuthDataInternal(); // Asegurar estado limpio si no hay token o usuario
      }
  
      // NO notificamos aquí directamente. La notificación inicial puede venir de
      // un script global o cuando los observadores se registran y piden el estado.
      // O, podríamos tener un método 'initializeUI' que los observadores llaman.
      // Por ahora, dejaremos que los observadores pidan el estado al registrarse.
    }
  
    // Este método puede ser llamado por los observadores después de registrarse
    // o por un script principal después de que todos los observadores estén listos.
    notifyInitialState() {
      console.log("AuthManager: Notifying initial state to observers.");
      this.notifyObservers(this.getAuthState());
    }
  
    login(userData, token) {
      if (!userData || !token) {
        console.error("AuthManager: Login attempt with invalid data.");
        return;
      }
  
      console.log("AuthManager: User logged in -", userData.username);
      this.currentUser = userData;
      this.authToken = token;
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUserGameHub', JSON.stringify(userData));
      this.notifyObservers(this.getAuthState());
    }
  
    logout() {
      const username = this.currentUser ? this.currentUser.username : 'User';
      console.log(`AuthManager: ${username} logged out.`);
      this._clearAuthDataInternal();
      // Notificar a los observadores que el estado ha cambiado a "no logueado"
      this.notifyObservers(this.getAuthState());
    }
  
    // Método interno para limpiar datos sin notificar (la notificación la hace logout)
    _clearAuthDataInternal() {
      this.currentUser = null;
      this.authToken = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUserGameHub');
    }
  
    getAuthState() {
      return {
        isLoggedIn: !!this.authToken && !!this.currentUser,
        currentUser: this.currentUser,
        authToken: this.authToken, // Aunque los observadores raramente necesitarán el token en sí
      };
    }
  
    getToken() {
      return this.authToken;
    }
  
    getCurrentUser() {
      return this.currentUser;
    }
  
    isUserLoggedIn() {
      return !!this.authToken && !!this.currentUser;
    }
  }
  
  // Instancia Singleton global.
  // Este script se carga una vez, creando la única instancia de AuthManager.
  const authManager = new AuthManager();
  