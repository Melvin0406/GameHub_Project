// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\src\config\database.js
const sqlite3 = require('sqlite3').verbose();
// Carga variables desde el .env en la raíz de la carpeta 'backend/'
// Si database.js está en src/config/, y .env está en backend/, la ruta es '../../.env'
// Si .env está en backend/ Y database.js está en backend/src/config, entonces path: '../../.env' está bien
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });


// Usa la ruta definida en .env o un valor por defecto si no está definida
const DATABASE_FILE = process.env.DATABASE_PATH || './default_database.sqlite';

// Conectar a la base de datos SQLite (se creará si no existe)
// Usamos path.resolve para asegurar que la ruta a la BD sea correcta desde la raíz del backend
const dbPath = require('path').resolve(__dirname, '../../', DATABASE_FILE);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        console.error('Attempted to open at path:', dbPath);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        createUsersTable(); // Llama a la función para crear la tabla
    }
});

// Función para crear la tabla de usuarios si no existe
function createUsersTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            // console.log('Users table created or already exists.'); // Comentado para menos verbosidad
        }
    });
}

module.exports = db; // Exporta la instancia de la base de datos