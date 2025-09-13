/**
 * Identity HTTP Handlers
 * Express route handlers for identity operations
 */
import { Request, Response } from 'express';
import { IdentityService } from '../types';
export declare class IdentityHandlers {
    private identityService;
    constructor(identityService: IdentityService);
    /**
     * Create new root identity
     */
    createIdentity: (req: Request, res: Response) => Promise<void>;
    /**
     * Get identity information
     */
    getIdentity: (req: Request, res: Response) => Promise<void>;
    /**
     * Create subidentity
     */
    createSubidentity: (req: Request, res: Response) => Promise<void>;
    /**
     * Submit identity verification
     */
    submitVerification: (req: Request, res: Response) => Promise<void>;
    /**
     * Get identity reputation
     */
    getReputation: (req: Request, res: Response) => Promise<void>;
    /**
     * Update identity
     */
    updateIdentity: (req: Request, res: Response) => Promise<void>;
    /**
     * Delete identity
     */
    deleteIdentity: (req: Request, res: Response) => Promise<void>;
    private createRequestContext;
    private handleError;
}
//# sourceMappingURL=identityHandlers.d.ts.map