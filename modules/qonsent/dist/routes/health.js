"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const database_1 = require("../utils/database");
const eventBus_1 = require("../utils/eventBus");
const cache_1 = require("../utils/cache");
const SquidClient_1 = require("../clients/SquidClient");
const logger_1 = require("../utils/logger");
const healthRoutes = async (fastify) => {
    const eventBus = eventBus_1.EventBus.getInstance();
    const cache = cache_1.CacheService.getInstance();
    const squidClient = new SquidClient_1.SquidClient();
    // Health check endpoint
    fastify.get('/health', {
        schema: {
            tags: ['System'],
            summary: 'Health check',
            description: 'Check the health status of the Qonsent service and its dependencies',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                        timestamp: { type: 'string', format: 'date-time' },
                        version: { type: 'string' },
                        uptime: { type: 'number' },
                        dependencies: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['up', 'down', 'degraded'] },
                                    latency: { type: 'number' },
                                    lastCheck: { type: 'string', format: 'date-time' },
                                    error: { type: 'string' },
                                },
                            },
                        },
                        metrics: {
                            type: 'object',
                            properties: {
                                requestCount: { type: 'number' },
                                errorRate: { type: 'number' },
                                avgResponseTime: { type: 'number' },
                                cacheHitRate: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        try {
            // Check database status
            const dbStatus = (0, database_1.getDatabaseStatus)();
            const dbLatency = await measureLatency(async () => {
                // Simple database ping
                const mongoose = await Promise.resolve().then(() => __importStar(require('mongoose')));
                if (mongoose.connection.db) {
                    await mongoose.connection.db.admin().ping();
                }
            });
            // Check event bus status
            const eventBusStatus = eventBus.getStatus();
            const eventBusLatency = await measureLatency(async () => {
                // Simple event bus ping
                if (eventBus.isConnected()) {
                    return Promise.resolve();
                }
                throw new Error('Event bus not connected');
            });
            // Check cache status
            const cacheStatus = cache.getStatus();
            const cacheLatency = await measureLatency(async () => {
                await cache.ping();
            });
            // Check sQuid service
            const squidLatency = await measureLatency(async () => {
                await squidClient.verifyIdentity('health-check');
            });
            // Collect dependency statuses
            const dependencies = {
                mongodb: {
                    status: dbStatus.connected ? 'up' : 'down',
                    latency: dbLatency.duration,
                    lastCheck: timestamp,
                    ...(dbLatency.error && { error: dbLatency.error }),
                },
                redis: {
                    status: cacheStatus.connected ? 'up' : 'down',
                    latency: cacheLatency.duration,
                    lastCheck: timestamp,
                    ...(cacheLatency.error && { error: cacheLatency.error }),
                },
                eventBus: {
                    status: eventBusStatus.connected ? 'up' : 'down',
                    latency: eventBusLatency.duration,
                    lastCheck: timestamp,
                    ...(eventBusLatency.error && { error: eventBusLatency.error }),
                },
                squid: {
                    status: squidLatency.error ? 'down' : 'up',
                    latency: squidLatency.duration,
                    lastCheck: timestamp,
                    ...(squidLatency.error && { error: squidLatency.error }),
                },
            };
            // Determine overall health status
            const downServices = Object.values(dependencies).filter(dep => dep.status === 'down').length;
            const degradedServices = Object.values(dependencies).filter(dep => dep.status === 'degraded').length;
            let overallStatus;
            if (downServices === 0 && degradedServices === 0) {
                overallStatus = 'healthy';
            }
            else if (downServices === 0) {
                overallStatus = 'degraded';
            }
            else {
                overallStatus = 'unhealthy';
            }
            // Get metrics (these would come from a metrics store in production)
            const metrics = {
                requestCount: 0, // Would be tracked by middleware
                errorRate: 0, // Would be calculated from error metrics
                avgResponseTime: Date.now() - startTime,
                cacheHitRate: 0, // Would be tracked by cache service
            };
            const healthStatus = {
                status: overallStatus,
                timestamp,
                version: '2.0.0',
                uptime: process.uptime(),
                dependencies,
                metrics,
            };
            // Set appropriate HTTP status code
            const statusCode = overallStatus === 'healthy' ? 200 :
                overallStatus === 'degraded' ? 200 : 503;
            reply.code(statusCode);
            return healthStatus;
        }
        catch (error) {
            logger_1.logger.error('Health check failed', { error });
            const healthStatus = {
                status: 'unhealthy',
                timestamp,
                version: '2.0.0',
                uptime: process.uptime(),
                dependencies: {},
                metrics: {
                    requestCount: 0,
                    errorRate: 1,
                    avgResponseTime: Date.now() - startTime,
                    cacheHitRate: 0,
                },
            };
            reply.code(503);
            return healthStatus;
        }
    });
    // Readiness probe endpoint
    fastify.get('/ready', {
        schema: {
            tags: ['System'],
            summary: 'Readiness check',
            description: 'Check if the service is ready to accept requests',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        ready: { type: 'boolean' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                503: {
                    type: 'object',
                    properties: {
                        ready: { type: 'boolean' },
                        timestamp: { type: 'string', format: 'date-time' },
                        reason: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const timestamp = new Date().toISOString();
        try {
            // Check critical dependencies
            const dbStatus = (0, database_1.getDatabaseStatus)();
            const eventBusStatus = eventBus.getStatus();
            if (!dbStatus.connected) {
                reply.code(503);
                return {
                    ready: false,
                    timestamp,
                    reason: 'Database not connected',
                };
            }
            if (!eventBusStatus.connected) {
                reply.code(503);
                return {
                    ready: false,
                    timestamp,
                    reason: 'Event bus not connected',
                };
            }
            return {
                ready: true,
                timestamp,
            };
        }
        catch (error) {
            logger_1.logger.error('Readiness check failed', { error });
            reply.code(503);
            return {
                ready: false,
                timestamp,
                reason: 'Service initialization error',
            };
        }
    });
    // Liveness probe endpoint
    fastify.get('/live', {
        schema: {
            tags: ['System'],
            summary: 'Liveness check',
            description: 'Check if the service is alive and responsive',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        alive: { type: 'boolean' },
                        timestamp: { type: 'string', format: 'date-time' },
                        uptime: { type: 'number' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return {
            alive: true,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    });
};
exports.healthRoutes = healthRoutes;
// Helper function to measure operation latency
async function measureLatency(operation) {
    const startTime = Date.now();
    try {
        const result = await operation();
        return {
            duration: Date.now() - startTime,
            result,
        };
    }
    catch (error) {
        return {
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
//# sourceMappingURL=health.js.map