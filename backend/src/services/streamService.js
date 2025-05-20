// backend/src/services/streamService.js
const liveStreamRepository = require('../repositories/liveStreamRepository');
const userRepository = require('../repositories/userRepository'); // Para obtener la stream_key del usuario

exports.goLive = async (userId, { title, gameName }) => {
    const user = await userRepository.findUserById(userId); // Asegúrate que este método devuelva stream_key
    if (!user || !user.stream_key) {
        throw { statusCode: 404, message: "User or stream key not found. Cannot go live." };
    }

    // Verificar si ya está en vivo para evitar duplicados (aunque la BD tiene UNIQUE constraint)
    const existingLiveStream = await liveStreamRepository.findLiveStreamByUserId(userId);
    if (existingLiveStream) {
        // Opcional: Podrías actualizar el título/juego si ya está en vivo
        // throw { statusCode: 409, message: "You are already live. Go offline first to update details." };
        console.log(`User ${userId} is already live. Updating title/game if provided.`);
        // Por ahora, simplemente no hacemos nada o podrías implementar una actualización aquí.
        // Para evitar la complejidad, la restricción UNIQUE de la BD manejará el intento de re-insertar.
    }

    return await liveStreamRepository.addLiveStream({
        userId,
        streamKey: user.stream_key,
        title: title || `${user.username}'s Stream`, // Título por defecto
        gameName: gameName || "Not Specified" // Juego por defecto
    });
};

exports.goOffline = async (userId) => {
    const result = await liveStreamRepository.removeLiveStreamByUserId(userId);
    if (result.changes === 0) {
        // Esto puede pasar si el usuario intenta ir offline pero no estaba marcado como live.
        // No necesariamente un error, pero es bueno saberlo.
        console.log(`User ${userId} tried to go offline but was not found in live_streams.`);
        // throw { statusCode: 404, message: "You were not marked as live." };
        return { message: "User was not marked as live or already offline."};
    }
    return { message: "Successfully marked as offline." };
};

exports.getActiveStreams = async () => {
    return await liveStreamRepository.getAllActiveStreams();
};

exports.getLiveStreamStatusByUserId = async (userId) => {
    const stream = await liveStreamRepository.findLiveStreamByUserId(userId);
    return { isLive: !!stream, streamDetails: stream || null };
};