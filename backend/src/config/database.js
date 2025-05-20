// C:\Users\kevin\Documents\GitHub\GameHub_Project\backend\src\config\database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });


// Usa la ruta definida en .env o un valor por defecto si no está definida
const DATABASE_FILE = process.env.DATABASE_PATH || './default_database.sqlite';

// Conectar a la base de datos SQLite (se creará si no existe)
// Usamos path.resolve para asegurar que la ruta a la BD sea correcta desde la raíz del backend
const dbPath = path.resolve(__dirname, '../../', DATABASE_FILE);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        console.error('Attempted to open at path:', dbPath);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        initializeDatabaseTables(); // Llamamos a una función que crea todas las tablas
    }
});

function initializeDatabaseTables() {
    db.serialize(() => {
        // Crear la tabla de usuarios
        createUsersTable();
        // Aquí puedes llamar a otras funciones para crear más tablas si es necesario

        // Crear tabla de juegos
        const createGamesTableSql = `
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                cover_image_url TEXT,         -- URL a una imagen de portada (relativa al frontend o absoluta)
                ftp_folder_name TEXT UNIQUE NOT NULL -- Nombre de la carpeta única para este juego dentro de FTP_MODS_ROOT_PATH
            )
        `;
        db.run(createGamesTableSql, (err) => {
            if (err) console.error('Error creating games table:', err.message);
        });
        
        // Crear tabla de mods
        const createModsTableSql = `
            CREATE TABLE IF NOT EXISTS mods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,       -- Quién lo subió
                name TEXT NOT NULL,             -- Nombre del mod (dado por el usuario)
                description TEXT,
                version TEXT,                   -- Versión del mod (ej. "1.0", "2.1b")
                file_name TEXT NOT NULL,        -- Nombre original del archivo subido (ej. "super_mod_v1.zip")
                ftp_file_path TEXT NOT NULL,    -- Ruta RELATIVA dentro de FTP_MODS_ROOT_PATH donde se guarda el archivo
                                                -- ej. "EpicGame/super_mod_v1.zip"
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                download_count INTEGER DEFAULT 0,
                file_size INTEGER,              -- Tamaño del archivo en bytes
                FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL 
                                                -- Si el usuario se borra, el mod queda pero el user_id es NULL
            )
        `;
        db.run(createModsTableSql, (err) => {
            if (err) console.error('Error creating mods table:', err.message);
        });

        // Crear tabla de mensajes internos (si la tenías del intento anterior, si no, puedes omitirla)
        const createInternalMessagesTableSql = `
            CREATE TABLE IF NOT EXISTS internal_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_user_id INTEGER NOT NULL,
                recipient_user_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT 0,
                sender_deleted_at TIMESTAMP NULL,
                recipient_deleted_at TIMESTAMP NULL,
                FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;
        db.run(createInternalMessagesTableSql, (err) => {
            if (err) console.error('Error creating internal_messages table:', err.message);
        });

        const createFriendshipsTableSql = `
            CREATE TABLE IF NOT EXISTS friendships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                requester_id INTEGER NOT NULL, -- User who sent the request
                addressee_id INTEGER NOT NULL, -- User who received the request
                status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'declined', 'blocked')),
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP NULL,
                UNIQUE (requester_id, addressee_id), -- Prevent duplicate requests in one direction
                FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (addressee_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;
        db.run(createFriendshipsTableSql, (err) => {
            if (err) console.error('Error creating friendships table:', err.message);
        });

        const createChatMessagesTableSql = `
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                recipient_id INTEGER NOT NULL,
                message_text TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT 0, -- Podría ser útil si el destinatario no está online
                FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;
        db.run(createChatMessagesTableSql, (err) => {
            if (err) console.error('Error creating chat_messages table:', err.message);
        });

        const createLiveStreamsTableSql = `
            CREATE TABLE IF NOT EXISTS live_streams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL, -- Solo un stream activo por usuario
                stream_key TEXT NOT NULL,        -- La clave de stream del usuario
                title TEXT,
                game_name TEXT,                  -- Nombre del juego que está streameando
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (stream_key) REFERENCES users (stream_key) ON DELETE CASCADE -- Opcional: si quieres asegurar consistencia
            )
        `;
        db.run(createLiveStreamsTableSql, (err) => {
            if (err) console.error('Error creating live_streams table:', err.message);
        });
    });
}

// Función para crear la tabla de usuarios si no existe
function createUsersTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                profile_image_url TEXT,
                stream_key TEXT UNIQUE,
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