"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
exports.connectEventBus = connectEventBus;
const events_1 = require("events");
const redis_1 = require("redis");
const config_1 = require("../config");
const logger_1 = require("./logger");
class EventBus extends events_1.EventEmitter {
    constructor() {
        super();
        this.redisClient = null;
        this.connected = false;
        this.setMaxListeners(100); // Increase max listeners for high-throughput scenarios
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            if (config_1.config.eventBus.type === 'redis') {
                await this.connectRedis();
            }
            else if (config_1.config.eventBus.type === 'mock') {
                await this.connectMock();
            }
            this.connected = true;
            logger_1.logger.info('Event bus connected successfully', { type: config_1.config.eventBus.type });
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to event bus:', error);
            throw error;
        }
    }
    async connectRedis() {
        this.redisClient = (0, redis_1.createClient)({
            url: config_1.config.eventBus.url,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger_1.logger.error('Redis reconnection failed after 10 attempts');
                        return false;
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
        });
        this.redisClient.on('error', (error) => {
            logger_1.logger.error('Redis client error:', error);
            this.connected = false;
        });
        this.redisClient.on('connect', () => {
            logger_1.logger.debug('Redis client connected');
        });
        this.redisClient.on('ready', () => {
            logger_1.logger.debug('Redis client ready');
            this.connected = true;
        });
        this.redisClient.on('end', () => {
            logger_1.logger.warn('Redis client connection ended');
            this.connected = false;
        });
        await this.redisClient.connect();
    }
    async connectMock() {
        // Mock connection for development/testing
        logger_1.logger.debug('Using mock event bus');
        this.connected = true;
    }
    async disconnect() {
        if (!this.connected) {
            return;
        }
        try {
            if (this.redisClient) {
                await this.redisClient.quit();
                this.redisClient = null;
            }
            this.connected = false;
            logger_1.logger.info('Event bus disconnected');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from event bus:', error);
            throw error;
        }
    }
    async publish(topic, payload) {
        try {
            logger_1.logger.debug('Publishing event', { topic, eventId: payload.eventId });
            // Validate event payload
            this.validateEventPayload(payload);
            if (config_1.config.eventBus.type === 'redis' && this.redisClient) {
                await this.publishToRedis(topic, payload);
            }
            else {
                await this.publishToMock(topic, payload);
            }
            // Emit locally for any local subscribers
            this.emit(topic, payload);
            this.emit('*', { topic, payload });
            logger_1.logger.debug('Event published successfully', { topic, eventId: payload.eventId });
        }
        catch (error) {
            logger_1.logger.error('Failed to publish event', { error, topic, eventId: payload.eventId });
            throw error;
        }
    }
    async publishToRedis(topic, payload) {
        if (!this.redisClient) {
            throw new Error('Redis client not connected');
        }
        const message = JSON.stringify(payload);
        await this.redisClient.publish(topic, message);
    }
    async publishToMock(topic, payload) {
        // Mock publishing - just log the event
        logger_1.logger.debug('Mock event published', { topic, payload });
    }
    async subscribe(pattern, callback) {
        try {
            logger_1.logger.debug('Subscribing to event pattern', { pattern });
            if (config_1.config.eventBus.type === 'redis' && this.redisClient) {
                await this.subscribeToRedis(pattern, callback);
            }
            else {
                await this.subscribeToMock(pattern, callback);
            }
            logger_1.logger.debug('Subscribed to event pattern successfully', { pattern });
        }
        catch (error) {
            logger_1.logger.error('Failed to subscribe to event pattern', { error, pattern });
            throw error;
        }
    }
    async subscribeToRedis(pattern, callback) {
        if (!this.redisClient) {
            throw new Error('Redis client not connected');
        }
        const subscriber = this.redisClient.duplicate();
        await subscriber.connect();
        if (pattern.includes('*')) {
            await subscriber.pSubscribe(pattern, (message, channel) => {
                try {
                    const payload = JSON.parse(message);
                    callback(payload);
                }
                catch (error) {
                    logger_1.logger.error('Failed to parse event message', { error, message, channel });
                }
            });
        }
        else {
            await subscriber.subscribe(pattern, (message, channel) => {
                try {
                    const payload = JSON.parse(message);
                    callback(payload);
                }
                catch (error) {
                    logger_1.logger.error('Failed to parse event message', { error, message, channel });
                }
            });
        }
    }
    async subscribeToMock(pattern, callback) {
        // Mock subscription - use local EventEmitter
        if (pattern.includes('*')) {
            this.on('*', ({ topic, payload }) => {
                if (this.matchesPattern(topic, pattern)) {
                    callback(payload);
                }
            });
        }
        else {
            this.on(pattern, callback);
        }
    }
    matchesPattern(topic, pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(topic);
    }
    validateEventPayload(payload) {
        if (!payload.eventId) {
            throw new Error('Event payload must have an eventId');
        }
        if (!payload.timestamp) {
            throw new Error('Event payload must have a timestamp');
        }
        if (!payload.source) {
            throw new Error('Event payload must have a source');
        }
        if (!payload.type) {
            throw new Error('Event payload must have a type');
        }
        if (!payload.data) {
            throw new Error('Event payload must have data');
        }
        // Validate event type format
        const eventTypePattern = /^q\.[a-z]+\.[a-z]+\.v\d+$/;
        if (!eventTypePattern.test(payload.type)) {
            throw new Error(`Invalid event type format: ${payload.type}`);
        }
    }
    isConnected() {
        return this.connected;
    }
    getStatus() {
        return {
            connected: this.connected,
            type: config_1.config.eventBus.type,
            url: config_1.config.eventBus.type === 'redis' ? config_1.config.eventBus.url : undefined,
        };
    }
}
exports.EventBus = EventBus;
// Export singleton instance
exports.eventBus = EventBus.getInstance();
// Connect on module load
async function connectEventBus() {
    await exports.eventBus.connect();
}
//# sourceMappingURL=eventBus.js.map