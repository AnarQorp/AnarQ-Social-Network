/**
 * Authentication Middleware
 * Handles sQuid identity authentication and authorization
 */
import { Request, Response, NextFunction } from 'express';
import { IdentityService } from '../types';
export interface AuthenticatedRequest extends Request {
    identity?: any;
    isAuthenticated?: boolean;
}
export declare class AuthMiddleware {
    private identityService;
    constructor(identityService: IdentityService);
    /**
     * Verify sQuid identity authentication
     */
    verifyIdentity: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Optional authentication middleware
     */
    optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Require specific verification level
     */
    requireVerificationLevel: (minLevel: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require minimum reputation
     */
    requireReputation: (minReputation: number) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    /**
     * Require identity ownership
     */
    requireIdentityOwnership: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    private verifySignature;
    private createMockSignature;
}
//# sourceMappingURL=authMiddleware.d.ts.map