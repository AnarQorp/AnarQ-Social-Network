"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
const errors_1 = require("../utils/errors");
const rateLimitMiddleware = async (fastify) => {
    const cache = cache_1.CacheService.getInstance();
    await cache.connect();
    const defaultOptions = {
        max: config_1.config.rateLimit.max,
        window: config_1.config.rateLimit.window,
        keyGenerator: (request) => {
            // Use identity-based rate limiting if available
            const identity = request.identity?.squidId;
            if (identity) {
                return `rate_limit:identity:${identity}`;
            }
            // Fall back to IP-based rate limiting
            return `rate_limit:ip:${request.ip}`;
        },
        skipOnError: true,
        skipSuccessfulRequests: false,
    };
    // Add rate limiting hook
    fastify.addHook('preHandler', async (request, reply) => {
        // Skip rate limiting for health checks
        const skipPaths = ['/health', '/ready', '/live', '/docs', '/documentation'];
        if (skipPaths.some(path => request.url.startsWith(path))) {
            return;
        }
        try {
            const key = defaultOptions.keyGenerator(request);
            const windowStart = Math.floor(Date.now() / defaultOptions.window) * defaultOptions.window;
            const windowKey = `${key}:${windowStart}`;
            // Get current count
            const currentCount = await cache.get(windowKey) || 0;
            // Check if limit exceeded
            if (currentCount >= defaultOptions.max) {
                // Log rate limit violation
                logger_1.logger.warn('Rate limit exceeded', {
                    key,
                    currentCount,
                    limit: defaultOptions.max,
                    window: defaultOptions.window,
                    identity: request.identity?.squidId,
                    ip: request.ip,
                    method: request.method,
                    url: request.url,
                });
                // Calculate reset time
                const resetTime = windowStart + defaultOptions.window;
                const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
                // Set rate limit headers
                reply.header('X-RateLimit-Limit', defaultOptions.max);
                reply.header('X-RateLimit-Remaining', 0);
                reply.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
                reply.header('Retry-After', retryAfter);
                throw new errors_1.QonsentError(errors_1.ErrorCodes.RATE_LIMIT_EXCEEDED, `Rate limit exceeded. Try again in ${retryAfter} seconds.`, {
                    limit: defaultOptions.max,
                    window: defaultOptions.window,
                    retryAfter,
                    resetTime,
                }, true);
            }
            // Increment counter
            const newCount = currentCount + 1;
            const ttl = Math.ceil(defaultOptions.window / 1000);
            await cache.set(windowKey, newCount, ttl);
            // Set rate limit headers
            reply.header('X-RateLimit-Limit', defaultOptions.max);
            reply.header('X-RateLimit-Remaining', Math.max(0, defaultOptions.max - newCount));
            reply.header('X-RateLimit-Reset', Math.ceil((windowStart + defaultOptions.window) / 1000));
            // Log rate limit info (debug level)
            logger_1.logger.debug('Rate limit check', {
                key,
                count: newCount,
                limit: defaultOptions.max,
                remaining: Math.max(0, defaultOptions.max - newCount),
            });
        }
        catch (error) {
            if (error instanceof errors_1.QonsentError) {
                throw error;
            }
            // If rate limiting fails and skipOnError is true, continue
            if (defaultOptions.skipOnError) {
                logger_1.logger.error('Rate limiting error, skipping', { error });
                return;
            }
            throw new errors_1.QonsentError(errors_1.ErrorCodes.INTERNAL_SERVER_ERROR, 'Rate limiting service error', { error: error instanceof Error ? error.message : 'Unknown error' }, true);
        }
    });
    // Add response hook to handle successful requests
    if (!defaultOptions.skipSuccessfulRequests) {
        fastify.addHook('onResponse', async (request, reply) => {
            // Only count successful requests if configured
            if (reply.statusCode >= 400) {
                // For failed requests, we might want to decrement the counter
                // This is optional and depends on the rate limiting strategy
                return;
            }
            // Log successful request for monitoring
            logger_1.logger.debug('Successful request processed', {
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                responseTime: reply.getResponseTime(),
                identity: request.identity?.squidId,
            });
        });
    }
    // Adaptive rate limiting based on identity reputation
    fastify.decorate('getAdaptiveRateLimit', async (request) => {
        const identity = request.identity?.squidId;
        if (!identity) {
            return defaultOptions;
        }
        try {
            // Get identity reputation (this would come from sQuid service)
            // For now, we'll use a simple mock implementation
            const reputation = await getIdentityReputation(identity);
            // Adjust rate limits based on reputation
            let multiplier = 1;
            if (reputation >= 0.8) {
                multiplier = 2; // High reputation gets 2x limit
            }
            else if (reputation >= 0.6) {
                multiplier = 1.5; // Good reputation gets 1.5x limit
            }
            else if (reputation < 0.3) {
                multiplier = 0.5; // Low reputation gets 0.5x limit
            }
            return {
                ...defaultOptions,
                max: Math.floor(defaultOptions.max * multiplier),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get adaptive rate limit', { error, identity });
            return defaultOptions;
        }
    });
    // Helper function to reset rate limit for an identity (admin function)
    fastify.decorate('resetRateLimit', async (identity) => {
        try {
            const key = `rate_limit:identity:${identity}`;
            await cache.deletePattern(`${key}:*`);
            logger_1.logger.info('Rate limit reset', { identity });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to reset rate limit', { error, identity });
            return false;
        }
    });
};
exports.rateLimitMiddleware = rateLimitMiddleware;
// Mock function to get identity reputation
async function getIdentityReputation(identity) {
    // In a real implementation, this would call the sQuid service
    // For now, return a random reputation score
    return Math.random();
}
exports.default = (0, fastify_plugin_1.default)(rateLimitMiddleware, {
    name: 'rate-limit-middleware',
});
//# sourceMappingURL=rateLimit.js.map