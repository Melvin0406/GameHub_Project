// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\server.js
require('dotenv').config(); // Carga las variables de entorno desde .env al inicio
const express = require('express');
const cors = require('cors');
const path = require('path'); // Módulo path para manejar rutas de archivos

// Importa las rutas de autenticación
const authRoutes = require('./src/routes/authRoutes');

// (Opcional) Importa la conexión a la BD para asegurar que se inicialice.
// Esto es útil si quieres que la conexión se establezca y la tabla se cree al iniciar el servidor.
require('./src/config/database');

const app = express();

// Middlewares
app.use(cors()); // Habilita CORS para todas las rutas y orígenes
app.use(express.json()); // Permite al servidor aceptar y parsear JSON en los cuerpos de las peticiones
app.use(express.urlencoded({ extended: true })); // Permite parsear datos de formularios URL-encoded

// Rutas de la API
app.use('/api/auth', authRoutes); // Monta las rutas de autenticación bajo el prefijo /api/auth

// Ruta de prueba básica
app.get('/', (req, res) => {
    res.send('¡El backend de GameHub está funcionando!');
});

// Definir el puerto
const PORT = process.env.PORT || 3000; // Usa el puerto definido en .env o 3000 por defecto

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});