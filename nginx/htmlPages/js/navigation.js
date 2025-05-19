// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\navigation.js

function renderNavigationBar(currentPageFileName) {
    // Obtener el elemento de la barra de navegación DENTRO de la función
    const mainNavBarElement = document.getElementById('main-navigation-bar'); // ID que definimos en el HTML
    
    if (!mainNavBarElement) {
        console.error("Error: Elemento con ID 'main-navigation-bar' no encontrado en la página.");
        return; // Salir si no se encuentra el contenedor de la nav
    }

    const authToken = localStorage.getItem('authToken');
    let navHtml = `
        <a href="index.html" class="${currentPageFileName === 'index.html' ? 'active' : ''}">Home</a>
        <a href="games.html" class="${currentPageFileName === 'games.html' ? 'active' : ''}">Games & Mods</a>
        <a href="view_stream.html" class="${currentPageFileName === 'view_stream.html' ? 'active' : ''}">View Stream</a>
        <a href="chat.html" class="${currentPageFileName === 'chat.html' ? 'active' : ''}">Chat</a>
        <a href="profile.html" class="${currentPageFileName === 'profile.html' ? 'active' : ''}">Profile</a>
    `;

    if (authToken) {
        // navHtml += `<a href="startStream.html" class="${currentPageFileName === 'startStream.html' ? 'active' : ''}">Start Stream</a>`;
        navHtml += `<a href="#" id="logout-link" style="color: #ff6b6b;">Logout</a>`; // Estilo directo o clase CSS
    } else {
        navHtml += `<a href="login.html" class="${currentPageFileName === 'login.html' ? 'active' : ''}">Login</a>`;
        navHtml += `<a href="signup.html" class="${currentPageFileName === 'signup.html' ? 'active' : ''}">Sign Up</a>`;
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
                // Re-renderiza la nav para mostrar Login/Signup después del alert y antes de la redirección
                renderNavigationBar(currentPageFileName); 
                window.location.href = 'login.html'; // Redirige a login después de cerrar sesión
            });
        }
    }
}