// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\navigation.js

function renderNavigationBar(currentPageFileName) {
    const mainNavBarElement = document.getElementById('main-navigation-bar');
    
    if (!mainNavBarElement) {
        console.error("Error: Navigation bar element with ID 'main-navigation-bar' not found.");
        return;
    }

    const authToken = localStorage.getItem('authToken');
    const currentHostname = window.location.hostname; 

    let mainAppDomain = 'servidor-juego.casa.local'; 
    let streamDomain = 'servidor-stream.casa.local'; 

    if (currentHostname.includes('cetys.local')) {
        mainAppDomain = 'servidor-juego.cetys.local';
        streamDomain = 'servidor-stream.cetys.local';
    }
    
    // URLs absolutas para los enlaces principales
    const homeUrl = `http://${mainAppDomain}/index.html`;
    const gamesUrl = `http://${mainAppDomain}/games.html`;
    const chatUrl = `http://${mainAppDomain}/chat.html`;
    const profileUrl = `http://${mainAppDomain}/profile.html`;
    const startStreamUrl = `http://${mainAppDomain}/start_stream.html`; // <<< NUEVA URL

    const viewStreamPageUrl = `http://${streamDomain}/`; 

    const isStreamPageActive = (currentPageFileName === 'view_stream.html') || 
                               (currentHostname === streamDomain && (currentPageFileName === 'index.html' || currentPageFileName === ''));

    // Construir el HTML de la navegación
    // El orden de los enlaces puede ser el que prefieras
    let navHtml = `
        <a href="${homeUrl}" class="${currentPageFileName === 'index.html' && currentHostname.startsWith('servidor-juego') ? 'active' : ''}">Home</a>
        <a href="${gamesUrl}" class="${currentPageFileName === 'games.html' ? 'active' : ''}">Games & Mods</a>
        <a href="${viewStreamPageUrl}" class="${isStreamPageActive ? 'active' : ''}" title="Go to Live Stream Page">View Stream</a>
    `;

    if (authToken) {
        // Enlaces solo para usuarios logueados
        navHtml += `<a href="${startStreamUrl}" class="${currentPageFileName === 'start_stream.html' ? 'active' : ''}">Start Stream</a>`; // <<< ENLACE AÑADIDO
        navHtml += `<a href="${chatUrl}" class="${currentPageFileName === 'chat.html' ? 'active' : ''}">Chat</a>`;
        navHtml += `<a href="${profileUrl}" class="${currentPageFileName === 'profile.html' ? 'active' : ''}">Profile</a>`;
        navHtml += `<a href="#" id="logout-link" style="color: #ff6b6b;">Logout</a>`;
    } else {
        // Enlaces para usuarios no logueados (Chat y Profile no se muestran o redirigen con authGuard)
        // View Stream y Games & Mods pueden ser públicos.
        const loginUrl = `http://${mainAppDomain}/login.html`;
        const signupUrl = `http://${mainAppDomain}/signup.html`;
        navHtml += `<a href="${loginUrl}" class="${currentPageFileName === 'login.html' ? 'active' : ''}">Login</a>`;
        navHtml += `<a href="${signupUrl}" class="${currentPageFileName === 'signup.html' ? 'active' : ''}">Sign Up</a>`;
    }
    mainNavBarElement.innerHTML = navHtml;

    if (authToken) {
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUserGameHub'); 
                alert("You have been logged out.");
                
                const currentPageAfterLogout = window.location.pathname.split('/').pop() || 'index.html';
                renderNavigationBar(currentPageAfterLogout); 
                window.location.href = `http://${mainAppDomain}/login.html`; 
            });
        }
    }
}