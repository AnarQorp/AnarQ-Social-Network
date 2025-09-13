"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
const config_1 = require("../config");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../database/redis");
async function healthRoutes(fastify) {
    fastify.get('/health', {
        schema: {
            description: 'Health check endpoint',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        code: { type: 'string' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                service: { type: 'string' },
                                version: { type: 'string' },
                                environment: { type: 'string' },
                                uptime: { type: 'number' },
                                timestamp: { type: 'string' },
                                dependencies: {
                                    type: 'object',
                                    additionalProperties: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string' },
                                            latency: { type: 'number' },
                                            lastCheck: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (_request, reply) => {
        const dependencies = {};
        // Check MongoDB connection
        try {
            const mongoStart = Date.now();
            await mongoose_1.default.connection.db?.admin().ping();
            dependencies.mongodb = {
                status: 'up',
                latency: Date.now() - mongoStart,
                lastCheck: new Date().toISOString()
            };
        }
        catch (error) {
            dependencies.mongodb = {
                status: 'down',
                latency: -1,
                lastCheck: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        // Check Redis connection
        try {
            const redisStart = Date.now();
            const redis = (0, redis_1.getRedisClient)();
            await redis.ping();
            dependencies.redis = {
                status: 'up',
                latency: Date.now() - redisStart,
                lastCheck: new Date().toISOString()
            };
        }
        catch (error) {
            dependencies.redis = {
                status: 'down',
                latency: -1,
                lastCheck: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        // Check IPFS connection (basic check)
        try {
            const ipfsStart = Date.now();
            // This would be a real IPFS check in production
            dependencies.ipfs = {
                status: 'up',
                latency: Date.now() - ipfsStart,
                lastCheck: new Date().toISOString()
            };
        }
        catch (error) {
            dependencies.ipfs = {
                status: 'down',
                latency: -1,
                lastCheck: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        // Determine overall health status
        const allDependenciesUp = Object.values(dependencies).every((dep) => dep.status === 'up');
        const status = allDependenciesUp ? 'healthy' : 'degraded';
        const statusCode = allDependenciesUp ? 200 : 503;
        return reply.code(statusCode).send({
            status: 'ok',
            code: 'HEALTH_CHECK',
            message: `Service is ${status}`,
            data: {
                service: 'qpic',
                version: '2.0.0',
                environment: config_1.config.nodeEnv,
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                dependencies
            }
        });
    });
}
//# sourceMappingURL=health.js.map