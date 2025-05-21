class AuthManager extends Subject {
    constructor() {
    super(); // Llama al constructor de Subject para inicializar this.\_observers
    if (AuthManager.\_instance) {
    return AuthManager.\_instance;
    }
    AuthManager.\_instance = this;
    
    this.currentUser = null;
    this.authToken = null;
    this._loadStateFromLocalStorage();
    
    }
    
    _loadStateFromLocalStorage() {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUserGameHub');
    if (token && userStr) {
    try {
    this.authToken = token;
    this.currentUser = JSON.parse(userStr);
    console.log("AuthManager: Estado cargado desde localStorage", this.currentUser);
    } catch (e) {
    console.error("AuthManager: Error parseando currentUserGameHub desde localStorage", e);
    this._clearAuthData(); // Limpiar si está corrupto
    }
    } else {
    this._clearAuthData(); // Asegurar estado limpio si no hay token o usuario
    }
    // Notificar a los observadores del estado inicial (incluso si es null)
    // Esto es importante para que la UI se renderice correctamente al cargar la página
    this.notifyObservers(this.getAuthState());
    }
    
    login(userData, token) {
    console.log("AuthManager: User logged in", userData);
    this.currentUser = userData;
    this.authToken = token;
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUserGameHub', JSON.stringify(userData));
    this.notifyObservers(this.getAuthState());
    }
    
    logout() {
    console.log("AuthManager: User logged out");
    this._clearAuthData();
    this.notifyObservers(this.getAuthState());
    }
    
    _clearAuthData() {
    this.currentUser = null;
    this.authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserGameHub');
    }
    
    getAuthState() {
    return {
    isLoggedIn: !!this.authToken,
    currentUser: this.currentUser,
    authToken: this.authToken
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
    
    // Instancia Singleton
    const authManager = new AuthManager();
    // Si usas módulos ES6: export default authManager;
    // Para scripts globales, 'authManager' estará disponible.