/**
 * Rate Limiting Middleware
 * Implements rate limiting and anti-abuse protection
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export declare class RateLimitMiddleware {
    private stores;
    private cleanupInterval;
    constructor();
    /**
     * Create rate limiter for identity creation
     */
    identityCreation: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Create rate limiter for verification submission
     */
    verificationSubmission: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Create rate limiter for reputation queries
     */
    reputationQueries: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Create rate limiter for general API calls
     */
    generalApi: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Adaptive rate limiter based on reputation
     */
    adaptiveRateLimit: (baseConfig: RateLimitConfig) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    private createRateLimiter;
    private getIdentifier;
    private getReputationMultiplier;
    private cleanup;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=rateLimitMiddleware.d.ts.map