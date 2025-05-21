// nginx/htmlPages/js/patterns/Subject.js
class Subject {
    constructor() {
        this._observers = [];
    }

    addObserver(observer) {
        if (observer && typeof observer.update === 'function') {
            this._observers.push(observer);
        } else {
            console.error("Intento de añadir un observador inválido:", observer);
        }
    }

    removeObserver(observer) {
        this._observers = this._observers.filter(obs => obs !== observer);
    }

    notifyObservers(data) {
        if (this._observers && this._observers.length > 0) {
            this._observers.forEach(observer => {
                try {
                    observer.update(data);
                } catch (error) {
                    console.error("Error al actualizar un observador:", observer, error);
                }
            });
        }
    }
}