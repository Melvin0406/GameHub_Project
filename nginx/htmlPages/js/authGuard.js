// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\authGuard.js
(function() {
    const authToken = localStorage.getItem('authToken');
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const publicPages = ['login.html', 'signup.html']; // Páginas que NO requieren autenticación

    // Si NO hay token Y la página actual NO es una página pública
    if (!authToken && !publicPages.includes(currentPage)) {
        console.log(`AuthGuard: No token found on protected page (${currentPage}). Redirecting to login.`);
        
        // Guardar la URL a la que se intentaba acceder para redirigir después del login
        const intendedDestination = window.location.pathname + window.location.search;
        localStorage.setItem('loginRedirect', intendedDestination);
        
        window.location.href = 'login.html'; // Asegúrate que login.html esté en la misma ruta relativa
    }
})();