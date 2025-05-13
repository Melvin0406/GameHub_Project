// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\src\controllers\authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Importa la conexión a la BD

const JWT_SECRET = process.env.JWT_SECRET;

// Registrar un nuevo usuario
exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Por favor, proporciona todos los campos (username, email, password).' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        // Verificar si el usuario o email ya existen
        const userExistsQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
        db.get(userExistsQuery, [username, email], async (err, row) => {
            if (err) {
                console.error("Error checking if user exists:", err);
                return res.status(500).json({ message: 'Error del servidor al verificar el usuario.' });
            }
            if (row) {
                if (row.username === username) {
                    return res.status(400).json({ message: 'El nombre de usuario ya existe.' });
                }
                if (row.email === email) {
                    return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
                }
            }

            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Insertar usuario en la base de datos
            const insertUserQuery = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
            db.run(insertUserQuery, [username, email, password_hash], function (err) {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.status(500).json({ message: 'Error del servidor al registrar el usuario.' });
                }
                // this.lastID contiene el ID del usuario recién insertado
                res.status(201).json({
                    message: 'Usuario registrado exitosamente.',
                    userId: this.lastID,
                    username: username
                });
            });
        });
    } catch (error) {
        console.error("Server error during signup:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Iniciar sesión de un usuario
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, proporciona email y contraseña.' });
    }

    try {
        const query = `SELECT * FROM users WHERE email = ?`;
        db.get(query, [email], async (err, user) => {
            if (err) {
                console.error("Database error during login:", err);
                return res.status(500).json({ message: 'Error del servidor al buscar el usuario.' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas (usuario no encontrado).' });
            }

            // Comparar contraseña
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta).' });
            }

            // Crear y firmar el token JWT
            const payload = {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            };

            jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '1h' }, // Token expira en 1 hora (puedes ajustarlo)
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        message: 'Inicio de sesión exitoso.',
                        token,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error("Server error during login:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};