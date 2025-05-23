// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

const authRoutes = require('./src/routes/authRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const gameRoutes = require('./src/routes/gameRoutes');
const internalMailRoutes = require('./src/routes/internalMailRoutes');
const userRoutes = require('./src/routes/userRoutes');
const friendshipRoutes = require('./src/routes/friendshipRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const chatService = require('./src/services/chatService');
const streamRoutes = require('./src/routes/streamRoutes');

require('./src/config/database'); // Inicializa la conexión y crea tablas

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://servidor-juego.casa.local", "http://servidor-juego.cetys.local"], // O tu URL de Nginx frontend. Podrías usar también http://servidor-juego.cetys.local si es necesario
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: ["http://servidor-juego.casa.local", "http://servidor-juego.cetys.local"] // Configura CORS para Express también
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Servir archivos estáticos de la carpeta de uploads (si decides servir avatares, etc. desde aquí)
// No es necesario para los mods si se descargan vía FTP directamente.
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/internal-mail', internalMailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendshipRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/streams', streamRoutes);

app.get('/', (req, res) => {
    res.send('¡El backend de GameHub está funcionando!');
});

// --- LÓGICA DE SOCKET.IO ---
const connectedUsers = {}; // Para mapear userId a socket.id: { userId: socketId }

// Middleware de autenticación para Socket.IO
io.use((socket, next) => {
    const token = socket.handshake.auth.token; // El cliente enviará el token aquí
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded.user; // Adjunta la info del usuario al objeto socket
            next();
        } catch (err) {
            console.error("Socket Auth Error: Invalid token", err.message);
            next(new Error("Authentication error: Invalid token"));
        }
    } else {
        console.error("Socket Auth Error: No token provided");
        next(new Error("Authentication error: No token provided"));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (ID: ${socket.user.id}, Socket ID: ${socket.id})`);
    connectedUsers[socket.user.id] = socket.id; // Guarda el socket del usuario

    // Cuando un usuario envía un mensaje privado
    socket.on('private_message', async ({ recipientId, text }) => {
        console.log(`Message from ${socket.user.username} to user ID ${recipientId}: ${text}`);
        try {
            const savedMessage = await chatService.saveChatMessage({
                senderId: socket.user.id,
                recipientId: parseInt(recipientId, 10),
                messageText: text
            });
    
            // Enviar al destinatario si está conectado
            const recipientSocketId = connectedUsers[recipientId];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('new_private_message', savedMessage);
            }
            // Enviar el mensaje guardado (con ID y timestamp del servidor) de vuelta al remitente también
            socket.emit('new_private_message', savedMessage); 
    
        } catch (error) {
            console.error("Error saving/sending chat message:", error);
            socket.emit('chat_error', { message: "Failed to send message.", details: error.message });
        }
    });
    
    // (Opcional) Indicador de "está escribiendo"
    socket.on('typing_indicator', ({ recipientId, isTyping }) => {
        const recipientSocketId = connectedUsers[recipientId];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('user_typing', { senderId: socket.user.id, isTyping });
        }
    });

    // --- NUEVA LÓGICA PARA CHAT DE STREAM ---
    socket.on('join_stream_chat', (streamKey) => {
        if (!streamKey) {
            console.log(`Socket ID ${socket.id} (${socket.user.username}) intentó unirse a un chat de stream sin streamKey.`);
            return;
        }
        const roomName = `stream_${streamKey}`;
        socket.join(roomName);
        console.log(`User ${socket.user.username} (Socket ID: ${socket.id}) joined stream chat room: ${roomName}`);
        // Opcional: Notificar a la sala que alguien se unió
        // io.to(roomName).emit('user_joined_stream_chat', { username: socket.user.username });
    });

    socket.on('stream_chat_message', ({ streamKey, text }) => {
        if (!socket.user) { // Doble verificación, aunque el middleware debería haberlo prevenido
            socket.emit('chat_error', { message: "Authentication required to send messages." });
            return;
        }
        if (!streamKey || !text || text.trim() === "") {
            socket.emit('chat_error', { message: "Stream key and message text are required." });
            return;
        }

        const roomName = `stream_${streamKey}`;
        const messagePayload = {
            username: socket.user.username, // Nombre del remitente
            userId: socket.user.id,         // ID del remitente
            profileImageUrl: socket.user.profile_image_url || 'images/default_avatar.png', // Foto del remitente
            text: text,
            timestamp: new Date().toISOString(),
            streamKey: streamKey // Para que el cliente pueda filtrar si está en múltiples salas (poco probable aquí)
        };

        // Emitir el mensaje a todos en la sala de ese stream
        io.to(roomName).emit('new_stream_message', messagePayload);
        console.log(`Message in room ${roomName} from ${socket.user.username}: ${text}`);

        // NOTA: No estamos guardando los mensajes de chat de stream en la BD en este ejemplo.
        // Si quisieras guardarlos, aquí llamarías a un servicio/repositorio.
    });

    socket.on('leave_stream_chat', (streamKey) => {
        if (!streamKey) return;
        const roomName = `stream_${streamKey}`;
        socket.leave(roomName);
        console.log(`User ${socket.user.username} left stream chat room: ${roomName}`);
        // Opcional: Notificar a la sala que alguien se fue
        // io.to(roomName).emit('user_left_stream_chat', { username: socket.user.username });
    });
    // --- FIN NUEVA LÓGICA PARA CHAT DE STREAM ---

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.username} (ID: ${socket.user.id})`);
        delete connectedUsers[socket.user.id]; // Elimina al usuario de la lista de conectados
    });
});
// --- FIN LÓGICA DE SOCKET.IO ---


// Manejador de Errores Global
app.use((err, req, res, next) => {
    // ... (tu manejador de errores global existente)
    console.error("Global Error Handler Caught:", err.message, err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error.';
    res.status(statusCode).json({ status: 'error', statusCode, message });
});

const PORT = process.env.PORT || 3000;
// IMPORTANTE: Usar 'server.listen' en lugar de 'app.listen' para que Socket.IO funcione
server.listen(PORT, () => {
    console.log(`Backend server running with Socket.IO on http://localhost:${PORT}`);
    if (!process.env.FTP_MODS_ROOT_PATH) {
        console.warn("WARNING: FTP_MODS_ROOT_PATH is not set in .env. Mod upload functionality might fail.");
    }
});