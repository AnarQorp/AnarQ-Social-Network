/**
 * Authentication Middleware
 *
 * Express middleware for sQuid identity authentication and authorization
 */
import { Request, Response, NextFunction } from 'express';
import { SquidIdentity } from './SquidIdentityService.js';
declare global {
    namespace Express {
        interface Request {
            identity?: SquidIdentity;
            permissions?: string[];
            identityToken?: string;
        }
    }
}
export interface AuthOptions {
    required?: boolean;
    permissions?: string[];
    allowSubIdentities?: boolean;
    skipForPaths?: string[];
}
/**
 * Authentication middleware factory
 */
export declare function createAuthMiddleware(options?: AuthOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require specific permissions
 */
export declare function requirePermissions(permissions: string[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to validate flow ownership
 */
export declare function requireFlowOwnership(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware for optional authentication
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware for required authentication
 */
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware for admin operations
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware for flow operations
 */
export declare const requireFlowPermissions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=AuthMiddleware.d.ts.map