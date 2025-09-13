/**
 * sQuid Identity Service
 *
 * Provides comprehensive identity authentication and validation
 * Integrates with the sQuid identity system for secure operations
 */
export interface SquidIdentity {
    id: string;
    type: 'user' | 'service' | 'dao' | 'sub-identity';
    parentId?: string;
    publicKey: string;
    permissions: string[];
    metadata: {
        name?: string;
        description?: string;
        createdAt: string;
        lastActive?: string;
        reputation?: number;
        daoSubnet?: string;
    };
    signature?: string;
}
export interface IdentityToken {
    identity: string;
    signature: string;
    timestamp: string;
    expiresAt: string;
    permissions: string[];
    nonce: string;
}
export interface IdentityValidationResult {
    valid: boolean;
    identity?: SquidIdentity;
    errors: string[];
    warnings: string[];
    permissions: string[];
    metadata: Record<string, any>;
}
export interface SubIdentitySignature {
    parentIdentity: string;
    subIdentity: string;
    operation: string;
    payload: any;
    signature: string;
    timestamp: string;
}
/**
 * sQuid Identity Service for authentication and authorization
 */
export declare class SquidIdentityService {
    private identityCache;
    private tokenCache;
    private readonly CACHE_TTL;
    /**
     * Validate an identity token
     */
    validateIdentityToken(token: string): Promise<IdentityValidationResult>;
    /**
     * Get identity details by ID
     */
    getIdentity(identityId: string): Promise<SquidIdentity | null>;
    /**
     * Validate sub-identity signature for step execution
     */
    validateSubIdentitySignature(signature: SubIdentitySignature): Promise<boolean>;
    /**
     * Check if identity has required permissions
     */
    hasPermissions(identityId: string, requiredPermissions: string[]): Promise<boolean>;
    /**
     * Validate flow ownership
     */
    validateFlowOwnership(flowOwnerId: string, requestingIdentityId: string): Promise<boolean>;
    /**
     * Create identity token for authentication
     */
    createIdentityToken(identityId: string, permissions: string[], expirationMinutes?: number): Promise<string | null>;
    /**
     * Refresh identity cache
     */
    refreshIdentityCache(identityId: string): Promise<void>;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    private parseIdentityToken;
    private encodeIdentityToken;
    private validateTokenSignature;
    private generateNonce;
    private createMockIdentity;
    private mockValidateSignature;
    private mockSignToken;
    private mockValidateTokenSignature;
}
export declare const squidIdentityService: SquidIdentityService;
//# sourceMappingURL=SquidIdentityService.d.ts.map