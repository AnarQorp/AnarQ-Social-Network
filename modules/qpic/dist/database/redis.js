"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
exports.getRedisClient = getRedisClient;
const redis_1 = require("redis");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
let redisClient;
async function connectRedis() {
    try {
        redisClient = (0, redis_1.createClient)({
            url: config_1.config.redisUrl,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500)
            }
        });
        redisClient.on('error', (error) => {
            logger_1.logger.error('Redis connection error:', error);
        });
        redisClient.on('connect', () => {
            logger_1.logger.info('Connected to Redis');
        });
        redisClient.on('disconnect', () => {
            logger_1.logger.warn('Redis disconnected');
        });
        await redisClient.connect();
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}
async function disconnectRedis() {
    try {
        if (redisClient) {
            await redisClient.disconnect();
            logger_1.logger.info('Disconnected from Redis');
        }
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from Redis:', error);
        throw error;
    }
}
function getRedisClient() {
    if (!redisClient) {
        throw new Error('Redis client not initialized');
    }
    return redisClient;
}
//# sourceMappingURL=redis.js.map