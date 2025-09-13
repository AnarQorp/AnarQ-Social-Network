"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("redis");
const config_1 = require("../config");
const logger_1 = require("./logger");
class CacheService {
    constructor() {
        this.redisClient = null;
        this.connected = false;
        this.memoryCache = new Map();
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            if (config_1.config.isDevelopment && config_1.config.cache.url.includes('localhost')) {
                await this.connectRedis();
            }
            else {
                // Fallback to memory cache if Redis is not available
                logger_1.logger.info('Using memory cache as fallback');
                this.connected = true;
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to connect to Redis, using memory cache', { error });
            this.connected = true; // Still mark as connected to use memory cache
        }
    }
    async connectRedis() {
        this.redisClient = (0, redis_1.createClient)({
            url: config_1.config.cache.url,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        logger_1.logger.error('Redis cache reconnection failed after 5 attempts');
                        return false;
                    }
                    return Math.min(retries * 100, 1000);
                },
            },
        });
        this.redisClient.on('error', (error) => {
            logger_1.logger.error('Redis cache client error:', error);
            this.connected = false;
        });
        this.redisClient.on('connect', () => {
            logger_1.logger.debug('Redis cache client connected');
        });
        this.redisClient.on('ready', () => {
            logger_1.logger.debug('Redis cache client ready');
            this.connected = true;
        });
        this.redisClient.on('end', () => {
            logger_1.logger.warn('Redis cache client connection ended');
            this.connected = false;
        });
        await this.redisClient.connect();
        logger_1.logger.info('Connected to Redis cache');
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
            this.memoryCache.clear();
            this.connected = false;
            logger_1.logger.info('Cache service disconnected');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from cache:', error);
            throw error;
        }
    }
    async get(key) {
        try {
            if (this.redisClient) {
                const value = await this.redisClient.get(key);
                if (value) {
                    return JSON.parse(value);
                }
            }
            else {
                // Use memory cache
                const cached = this.memoryCache.get(key);
                if (cached && cached.expiresAt > Date.now()) {
                    return cached.value;
                }
                else if (cached) {
                    // Remove expired entry
                    this.memoryCache.delete(key);
                }
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', { error, key });
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            const ttl = ttlSeconds || config_1.config.cache.ttl;
            if (this.redisClient) {
                await this.redisClient.setEx(key, ttl, JSON.stringify(value));
            }
            else {
                // Use memory cache
                this.memoryCache.set(key, {
                    value,
                    expiresAt: Date.now() + (ttl * 1000),
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Cache set error', { error, key });
            // Don't throw - cache failures shouldn't break the application
        }
    }
    async delete(key) {
        try {
            if (this.redisClient) {
                await this.redisClient.del(key);
            }
            else {
                this.memoryCache.delete(key);
            }
        }
        catch (error) {
            logger_1.logger.error('Cache delete error', { error, key });
            // Don't throw - cache failures shouldn't break the application
        }
    }
    async exists(key) {
        try {
            if (this.redisClient) {
                const result = await this.redisClient.exists(key);
                return result === 1;
            }
            else {
                const cached = this.memoryCache.get(key);
                return cached !== undefined && cached.expiresAt > Date.now();
            }
        }
        catch (error) {
            logger_1.logger.error('Cache exists error', { error, key });
            return false;
        }
    }
    async clear() {
        try {
            if (this.redisClient) {
                await this.redisClient.flushDb();
            }
            else {
                this.memoryCache.clear();
            }
        }
        catch (error) {
            logger_1.logger.error('Cache clear error', { error });
            // Don't throw - cache failures shouldn't break the application
        }
    }
    async ping() {
        if (this.redisClient) {
            await this.redisClient.ping();
        }
        // Memory cache is always available
    }
    // Batch operations
    async mget(keys) {
        try {
            if (this.redisClient) {
                const values = await this.redisClient.mGet(keys);
                return values.map(value => value ? JSON.parse(value) : null);
            }
            else {
                return keys.map(key => {
                    const cached = this.memoryCache.get(key);
                    if (cached && cached.expiresAt > Date.now()) {
                        return cached.value;
                    }
                    return null;
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Cache mget error', { error, keys });
            return keys.map(() => null);
        }
    }
    async mset(keyValuePairs) {
        try {
            if (this.redisClient) {
                const pipeline = this.redisClient.multi();
                for (const { key, value, ttl } of keyValuePairs) {
                    const ttlSeconds = ttl || config_1.config.cache.ttl;
                    pipeline.setEx(key, ttlSeconds, JSON.stringify(value));
                }
                await pipeline.exec();
            }
            else {
                for (const { key, value, ttl } of keyValuePairs) {
                    const ttlSeconds = ttl || config_1.config.cache.ttl;
                    this.memoryCache.set(key, {
                        value,
                        expiresAt: Date.now() + (ttlSeconds * 1000),
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Cache mset error', { error, keyValuePairs: keyValuePairs.length });
            // Don't throw - cache failures shouldn't break the application
        }
    }
    // Pattern-based operations
    async deletePattern(pattern) {
        try {
            if (this.redisClient) {
                const keys = await this.redisClient.keys(pattern);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            }
            else {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                const keysToDelete = Array.from(this.memoryCache.keys()).filter(key => regex.test(key));
                keysToDelete.forEach(key => this.memoryCache.delete(key));
            }
        }
        catch (error) {
            logger_1.logger.error('Cache delete pattern error', { error, pattern });
            // Don't throw - cache failures shouldn't break the application
        }
    }
    // Cache statistics
    getStats() {
        return {
            connected: this.connected,
            type: this.redisClient ? 'redis' : 'memory',
            size: this.redisClient ? undefined : this.memoryCache.size,
        };
    }
    getStatus() {
        return {
            connected: this.connected,
            type: this.redisClient ? 'redis' : 'memory',
            url: this.redisClient ? config_1.config.cache.url : undefined,
        };
    }
    // Cleanup expired entries from memory cache
    cleanupMemoryCache() {
        const now = Date.now();
        for (const [key, cached] of this.memoryCache.entries()) {
            if (cached.expiresAt <= now) {
                this.memoryCache.delete(key);
            }
        }
    }
    // Start periodic cleanup for memory cache
    startCleanup() {
        if (!this.redisClient) {
            setInterval(() => {
                this.cleanupMemoryCache();
            }, 60000); // Cleanup every minute
        }
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=cache.js.map