import { EventEmitter } from 'events';

const sseEmitter = new EventEmitter();
sseEmitter.setMaxListeners(200);

export default sseEmitter;
