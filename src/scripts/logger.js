const LOGGER_ENABLED = false;

class Logger {

    #name = '';

    constructor(name) {
        this.#name = name;
    }

    log(message) {
        if (!LOGGER_ENABLED) {
            return;
        }

        console.log(this.#formLogMessage(message));
    }

    error(message) {
        if (!LOGGER_ENABLED) {
            return;
        }

        console.error(this.#formLogMessage(message));
    }

    #formLogMessage(message) {
        const dateString = new Date().toLocaleString();
        return `[${this.#name}][${dateString}] => [${message}]`;
    }

}