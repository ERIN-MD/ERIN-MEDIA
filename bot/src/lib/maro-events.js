import { EventEmitter } from 'events';

class BotEvents extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
    }
}

export const botEvents = new BotEvents();
export default botEvents;
