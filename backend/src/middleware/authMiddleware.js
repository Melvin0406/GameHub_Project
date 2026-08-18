// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function(req, res, next) {
    // Obtener el token del header Authorization
    const authHeader = req.header('Authorization');

    // Verificar si no hay token
    if (!authHeader) {
        return res.status(401).json({ message: 'No hay token, autorización denegada.' });
    }

    // Verificar si el token tiene el formato "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Token malformado.' });
    }

    const token = parts[1];

    try {
        // Verificar el token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Añadir el payload decodificado (que incluye el usuario) al objeto request
        req.user = decoded.user; // Asumiendo que el payload del token es { user: { id, username, email } }
        next(); // Pasa al siguiente middleware o controlador
    } catch (err) {
        console.error('Error en middleware de autenticación:', err.message);
        res.status(401).json({ message: 'Token no es válido.' });
    }
};