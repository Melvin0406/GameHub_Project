// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\navigation.js

function renderNavigationBar(currentPageFileName) {
    const mainNavBarElement = document.getElementById('main-navigation-bar');
    
    if (!mainNavBarElement) {
        console.error("Error: Navigation bar element with ID 'main-navigation-bar' not found in the current page.");
        return;
    }

    const authToken = localStorage.getItem('authToken'); // Token del localStorage del DOMINIO ACTUAL
    const currentHostname = window.location.hostname; 

    let mainAppDomain = 'servidor-juego.casa.local'; 
    let streamViewingDomain = 'servidor-stream.casa.local'; // Dominio donde se ven los streams individuales

    if (currentHostname.includes('cetys.local')) {
        mainAppDomain = 'servidor-juego.cetys.local';
        streamViewingDomain = 'servidor-stream.cetys.local';
    }
    
    // URLs absolutas para los enlaces principales que residen en el mainAppDomain
    const homeUrl = `http://${mainAppDomain}/index.html`;
    const gamesUrl = `http://${mainAppDomain}/games.html`;
    const liveStreamsListUrl = `http://${mainAppDomain}/live_streams.html`; // "View Streams" apunta a la lista
    const chatUrl = `http://${mainAppDomain}/chat.html`;
    const profileUrl = `http://${mainAppDomain}/profile.html`;
    const startStreamUrl = `http://${mainAppDomain}/start_stream.html`; 

    // Lógica para la clase 'active'
    // "View Streams" se considera la sección activa si estamos en la lista de streams
    // o si estamos viendo un stream individual (que es index.html en el streamViewingDomain).
    const isViewingStreamSectionActive = 
        (currentPageFileName === 'live_streams.html') || // Cuando estamos en la página de lista de streams
        (currentHostname === streamViewingDomain && (currentPageFileName === 'index.html' || currentPageFileName === 'view_stream.html')); // Cuando estamos viendo un stream (pasando 'view_stream.html' como conceptual)


    let navHtml = `
        <a href="${homeUrl}" class="${(currentPageFileName === 'index.html' && currentHostname.startsWith('servidor-juego')) ? 'active' : ''}">Home</a>
        <a href="${gamesUrl}" class="${currentPageFileName === 'games.html' ? 'active' : ''}">Games & Mods</a>
        <a href="${liveStreamsListUrl}" class="${isViewingStreamSectionActive ? 'active' : ''}" title="View All Live Streams">View Streams</a>
    `;

    if (authToken) {
        navHtml += `<a href="${startStreamUrl}" class="${currentPageFileName === 'start_stream.html' ? 'active' : ''}">Start Stream</a>`;
        navHtml += `<a href="${chatUrl}" class="${currentPageFileName === 'chat.html' ? 'active' : ''}">Chat</a>`;
        navHtml += `<a href="${profileUrl}" class="${currentPageFileName === 'profile.html' ? 'active' : ''}">Profile</a>`;
        navHtml += `<a href="#" id="logout-link" style="color: #ff6b6b;">Logout</a>`;
    } else {
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