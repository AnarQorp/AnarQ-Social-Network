"use strict";
/**
 * Rate Limiting Middleware
 * Implements rate limiting and anti-abuse protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMiddleware = void 0;
class RateLimitMiddleware {
    constructor() {
        this.stores = new Map();
        /**
         * Create rate limiter for identity creation
         */
        this.identityCreation = this.createRateLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 5,
            message: 'Too many identity creation attempts. Limit: 5 per hour.'
        });
        /**
         * Create rate limiter for verification submission
         */
        this.verificationSubmission = this.createRateLimiter({
            windowMs: 24 * 60 * 60 * 1000, // 24 hours
            maxRequests: 3,
            message: 'Too many verification submissions. Limit: 3 per day.'
        });
        /**
         * Create rate limiter for reputation queries
         */
        this.reputationQueries = this.createRateLimiter({
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100,
            message: 'Too many reputation queries. Limit: 100 per minute.'
        });
        /**
         * Create rate limiter for general API calls
         */
        this.generalApi = this.createRateLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 1000,
            message: 'Too many API requests. Limit: 1000 per hour.'
        });
        /**
         * Adaptive rate limiter based on reputation
         */
        this.adaptiveRateLimit = (baseConfig) => {
            return (req, res, next) => {
                const identity = req.identity;
                let config = { ...baseConfig };
                if (identity) {
                    // Adjust limits based on reputation
                    const reputation = identity.reputation || 0;
                    const multiplier = this.getReputationMultiplier(reputation);
                    config.maxRequests = Math.floor(config.maxRequests * multiplier);
                }
                const rateLimiter = this.createRateLimiter(config);
                rateLimiter(req, res, next);
            };
        };
        // Clean up expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    createRateLimiter(config) {
        const storeName = `${config.windowMs}_${config.maxRequests}`;
        if (!this.stores.has(storeName)) {
            this.stores.set(storeName, {});
        }
        return (req, res, next) => {
            const store = this.stores.get(storeName);
            const identifier = this.getIdentifier(req);
            const now = Date.now();
            // Get or create rate limit entry
            let entry = store[identifier];
            if (!entry) {
                entry = {
                    count: 0,
                    resetTime: now + config.windowMs,
                    firstRequest: now
                };
                store[identifier] = entry;
            }
            // Reset if window has expired
            if (now > entry.resetTime) {
                entry.count = 0;
                entry.resetTime = now + config.windowMs;
                entry.firstRequest = now;
            }
            // Check if limit exceeded
            if (entry.count >= config.maxRequests) {
                const resetIn = Math.ceil((entry.resetTime - now) / 1000);
                res.status(429).json({
                    status: 'error',
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: config.message,
                    details: {
                        limit: config.maxRequests,
                        windowMs: config.windowMs,
                        resetIn: resetIn
                    },
                    timestamp: new Date(),
                    retryable: true
                });
                return;
            }
            // Increment counter
            entry.count++;
            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': (config.maxRequests - entry.count).toString(),
                'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
            });
            next();
        };
    }
    getIdentifier(req) {
        // Use identity ID if authenticated, otherwise use IP
        if (req.isAuthenticated && req.identity) {
            return `identity:${req.identity.did}`;
        }
        return `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    }
    getReputationMultiplier(reputation) {
        // Higher reputation gets higher rate limits
        if (reputation >= 800)
            return 2.0; // Authority: 2x limit
        if (reputation >= 600)
            return 1.5; // Expert: 1.5x limit
        if (reputation >= 300)
            return 1.2; // Trusted: 1.2x limit
        if (reputation >= 100)
            return 1.0; // Normal: 1x limit
        return 0.5; // Low reputation: 0.5x limit
    }
    cleanup() {
        const now = Date.now();
        for (const [storeName, store] of this.stores.entries()) {
            for (const [identifier, entry] of Object.entries(store)) {
                if (now > entry.resetTime + 60000) { // Clean up entries 1 minute after expiry
                    delete store[identifier];
                }
            }
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
exports.RateLimitMiddleware = RateLimitMiddleware;
//# sourceMappingURL=rateLimitMiddleware.js.map