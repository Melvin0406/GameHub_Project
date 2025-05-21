// nginx/htmlPages/js/navigation.js
// Requiere que Observer.js (js/patterns/Observer.js) y AuthManager.js (js/auth/AuthManager.js)
// estén cargados primero, y que 'authManager' sea la instancia global de AuthManager.

class NavigationUIObserver extends Observer {
    constructor(navElementId = 'main-navigation-bar') {
        super();
        this.navElementId = navElementId;
        this.mainNavBarElement = document.getElementById(this.navElementId);
    }

    /**
     * Método llamado por AuthManager cuando el estado de autenticación cambia.
     * @param {object} authState - El objeto devuelto por authManager.getAuthState()
     * Ej: { isLoggedIn: boolean, currentUser: object|null, authToken: string|null }
     */
    update(authState) {
        if (!this.mainNavBarElement) {
            console.error(`NavigationUIObserver: Element with ID '${this.navElementId}' not found.`);
            return;
        }

        console.log("NavigationUIObserver: Auth state update received, re-rendering navigation.", authState);

        const isLoggedIn = authState.isLoggedIn;
        const currentPageFileName = window.location.pathname.split('/').pop() || 'index.html';
        const currentHostname = window.location.hostname;

        let mainAppDomain = 'servidor-juego.casa.local';
        let streamViewingDomain = 'servidor-stream.casa.local';

        if (currentHostname.includes('cetys.local')) {
            mainAppDomain = 'servidor-juego.cetys.local';
            streamViewingDomain = 'servidor-stream.cetys.local';
        }

        const homeUrl = `http://${mainAppDomain}/index.html`;
        const gamesUrl = `http://${mainAppDomain}/games.html`;
        const liveStreamsListUrl = `http://${mainAppDomain}/live_streams.html`;
        const chatUrl = `http://${mainAppDomain}/chat.html`;
        const profileUrl = `http://${mainAppDomain}/profile.html`;
        const startStreamUrl = `http://${mainAppDomain}/start_stream.html`;

        const isViewingStreamSectionActive =
            (currentPageFileName === 'live_streams.html') ||
            (currentHostname === streamViewingDomain &&
                (currentPageFileName === 'index.html' || currentPageFileName === 'view_stream.html'));

        let navHtml = `
            <a href="${homeUrl}" class="${(currentPageFileName === 'index.html' && currentHostname.startsWith('servidor-juego')) ? 'active' : ''}">Home</a>
            <a href="${gamesUrl}" class="${currentPageFileName === 'games.html' ? 'active' : ''}">Games & Mods</a>
            <a href="${liveStreamsListUrl}" class="${isViewingStreamSectionActive ? 'active' : ''}" title="View All Live Streams">View Streams</a>
        `;

        if (isLoggedIn) {
            // Este token solo se usaría si fuera necesario incrustarlo en un enlace específico.
            let streamPageLinkWithToken = `http://${streamViewingDomain}/`;
            if (authState.authToken && currentHostname.startsWith('servidor-juego')) {
                streamPageLinkWithToken += `?authToken=${encodeURIComponent(authState.authToken)}`;
            }

            navHtml += `
                <a href="${startStreamUrl}" class="${currentPageFileName === 'start_stream.html' ? 'active' : ''}">Start Stream</a>
                <a href="${chatUrl}" class="${currentPageFileName === 'chat.html' ? 'active' : ''}">Chat</a>
                <a href="${profileUrl}" class="${currentPageFileName === 'profile.html' ? 'active' : ''}">Profile</a>
                <a href="#" id="logout-link-nav" style="color: #ff6b6b;">Logout</a>
            `;
        } else {
            const loginUrl = `http://${mainAppDomain}/login.html`;
            const signupUrl = `http://${mainAppDomain}/signup.html`;
            navHtml += `
                <a href="${loginUrl}" class="${currentPageFileName === 'login.html' ? 'active' : ''}">Login</a>
                <a href="${signupUrl}" class="${currentPageFileName === 'signup.html' ? 'active' : ''}">Sign Up</a>
            `;
        }

        this.mainNavBarElement.innerHTML = navHtml;

        // Asignar el listener de logout si está logueado
        if (isLoggedIn) {
            const logoutLink = document.getElementById('logout-link-nav');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof authManager !== 'undefined' && typeof authManager.logout === 'function') {
                        authManager.logout();
                        window.location.href = `http://${mainAppDomain}/login.html`;
                    } else {
                        console.error("AuthManager no está disponible para el logout.");
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('currentUserGameHub');
                        alert("You have been logged out (fallback).");
                        window.location.href = `http://${mainAppDomain}/login.html`;
                    }
                });
            }
        }
    }
}

// Función de inicialización que se llamará desde cada página HTML
function initializeNavigation() {
    if (typeof AuthManager === 'undefined' || typeof authManager === 'undefined') {
        console.error("AuthManager no está disponible. La navegación no puede observar el estado de autenticación.");
        const navElement = document.getElementById('main-navigation-bar');
        if (navElement) {
            navElement.innerHTML = "<p style='color:red'>Navigation Error: AuthManager missing.</p>";
        }
        return;
    }

    // Crear y registrar el observador de la UI de navegación
    const navUIObserver = new NavigationUIObserver('main-navigation-bar');
    authManager.addObserver(navUIObserver);
}