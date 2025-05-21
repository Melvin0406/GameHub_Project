// nginx/htmlPages/js/patterns/Observer.js
class Observer {
    /**
     * Método que será llamado por el Sujeto cuando haya una actualización.
     * @param {any} data - Los datos o el contexto del cambio.
     */
    update(data) {
        throw new Error("El método 'update(data)' debe ser implementado por las subclases.");
    }
}