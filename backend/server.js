// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Asegúrate que esté importado

const authRoutes = require('./src/routes/authRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const gameRoutes = require('./src/routes/gameRoutes'); // <--- NUEVA RUTA
const internalMailRoutes = require('./src/routes/internalMailRoutes');

require('./src/config/database'); // Inicializa la conexión y crea tablas

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la carpeta de uploads (si decides servir avatares, etc. desde aquí)
// No es necesario para los mods si se descargan vía FTP directamente.
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/internal-mail', internalMailRoutes);

app.get('/', (req, res) => {
    res.send('¡El backend de GameHub está funcionando!');
});

// Manejador de Errores Global (debe ir DESPUÉS de todas las rutas)
app.use((err, req, res, next) => {
    console.error("-----------------------------------------");
    console.error("Manejador de Errores Global Capturó:");
    console.error("Status Code:", err.statusCode || 500);
    console.error("Message:", err.message);
    if (err.stack) { // No mostrar stack en producción al cliente
        console.error("Stack:", err.stack);
    }
    console.error("-----------------------------------------");

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor.';

    // En desarrollo, puedes enviar más detalles, pero en producción sé más genérico
    res.status(statusCode).json({ 
        status: 'error',
        statusCode: statusCode,
        message: message,
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // Opcional
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    if (!process.env.FTP_MODS_ROOT_PATH) {
        console.warn("ADVERTENCIA: FTP_MODS_ROOT_PATH no está configurado en .env. La funcionalidad de subida de mods podría fallar.");
    }
});