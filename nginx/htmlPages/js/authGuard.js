// authGuard.js
(function() { // Usamos una IIFE (Immediately Invoked Function Expression) para no contaminar el scope global
    const authToken = localStorage.getItem('authToken');

    // Lista de páginas que NO requieren login o son las páginas de autenticación mismas
    const publicPages = ['login.html', 'signup.html'];
    const currentPage = window.location.pathname.split('/').pop(); // Obtiene el nombre del archivo actual

    if (!authToken && !publicPages.includes(currentPage)) {
        // Guardar la página actual para redirigir después del login (opcional)
        const redirectTo = window.location.pathname + window.location.search;
        localStorage.setItem('loginRedirect', redirectTo); // Guardamos a dónde quería ir

        // Redirigir a login.html
        window.location.href = 'login.html';
    }
})();