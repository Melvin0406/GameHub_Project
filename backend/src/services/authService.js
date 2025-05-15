// backend/src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository'); // Usamos el repositorio
const JWT_SECRET = process.env.JWT_SECRET;

exports.registerUser = async ({ username, email, password }) => {
    // 1. Validación de lógica de negocio y datos de entrada
    if (!username || !email || !password) {
        // Lanzamos un error que el controlador puede atrapar y convertir en respuesta HTTP
        const error = new Error('Nombre de usuario, email y contraseña son requeridos.');
        error.statusCode = 400; // Código de estado HTTP sugerido
        throw error;
    }
    if (password.length < 6) {
        const error = new Error('La contraseña debe tener al menos 6 caracteres.');
        error.statusCode = 400;
        throw error;
    }

    // 2. Lógica de negocio: Verificar si el usuario ya existe (usando el repositorio)
    const existingUser = await userRepository.findUserByUsernameOrEmail(username, email);
    if (existingUser) {
        let message = '';
        if (existingUser.username === username) message = 'El nombre de usuario ya existe.';
        else if (existingUser.email === email) message = 'El correo electrónico ya está registrado.';

        const error = new Error(message);
        error.statusCode = 409; // 409 Conflict es apropiado aquí
        throw error;
    }

    // 3. Lógica de negocio: Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Lógica de negocio: Crear usuario (usando el repositorio)
    const newUser = await userRepository.createUser(username, email, passwordHash);

    // 5. Devolver resultado para el controlador
    return { 
        message: 'Usuario registrado exitosamente.', 
        user: { id: newUser.id, username: newUser.username, email: newUser.email } 
    };
};

exports.loginUser = async ({ email, password }) => {
    if (!email || !password) {
        const error = new Error('Email y contraseña son requeridos.');
        error.statusCode = 400;
        throw error;
    }

    const user = await userRepository.findUserByEmail(email);
    if (!user) {
        const error = new Error('Credenciales inválidas.');
        error.statusCode = 401; // Unauthorized
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        const error = new Error('Credenciales inválidas.');
        error.statusCode = 401;
        throw error;
    }

    const payload = {
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    return {
        message: 'Inicio de sesión exitoso.',
        token,
        user: { id: user.id, username: user.username, email: user.email }
    };
};