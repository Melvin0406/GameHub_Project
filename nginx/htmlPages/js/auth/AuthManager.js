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
    
            // Limpiar authToken de la URL visible, pero conservar otros params como 'key'
            const newSearchParams = new URLSearchParams();
            if (keyFromUrl) newSearchParams.set('key', keyFromUrl);
    
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
      console.log("[AuthManager] _loadState: Attempting to load token from localStorage. Found:", token ? "Exists" : "Null");

      if (token) {
          this.authToken = token; // Establecer el token si existe
          const userStr = localStorage.getItem('currentUserGameHub');
          if (userStr) {
              try {
                  this.currentUser = JSON.parse(userStr);
                  console.log("[AuthManager] _loadState: currentUserGameHub also loaded from localStorage for user:", this.currentUser.username);
              } catch (e) {
                  console.warn("[AuthManager] _loadState: currentUserGameHub in localStorage was malformed. Clearing it.");
                  this.currentUser = null; 
                  localStorage.removeItem('currentUserGameHub');
              }
          } else {
              // No hay datos de usuario en localStorage, pero tenemos un token.
              // currentUser permanecerá null hasta que se obtenga del backend (ej. con getMyProfile).
              this.currentUser = null;
              console.log("[AuthManager] _loadState: Token found, but no currentUserGameHub in localStorage.");
          }
      } else {
          // No hay token, así que definitivamente no estamos logueados en este origen.
          this._clearAuthDataInternal(); 
      }
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
      console.log("[AuthManager] Auth data cleared from internal state and localStorage.");
    }
  
    getAuthState() {
      return {
        isLoggedIn: !!this.authToken,
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
  
    setCurrentUser(userData) {
      if (this.authToken) { // Solo actualizar si seguimos considerando que hay una sesión activa (token existe)
          this.currentUser = userData;
          localStorage.setItem('currentUserGameHub', JSON.stringify(userData));
          this.notifyObservers(this.getAuthState()); // Notificar que currentUser ha cambiado
          console.log("AuthManager: currentUser data updated and observers notified.", userData);
      } else {
          console.warn("AuthManager: Attempted to set currentUser, but no authToken present. User remains logged out.");
      }
  }
  
    isUserLoggedIn() {
      return !!this.authToken && !!this.currentUser;
    }
  }
  
  // Instancia Singleton global.
  // Este script se carga una vez, creando la única instancia de AuthManager.
  const authManager = new AuthManager();
  