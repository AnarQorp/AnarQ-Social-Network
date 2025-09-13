/**
 * sQuid Identity Service
 *
 * Provides comprehensive identity authentication and validation
 * Integrates with the sQuid identity system for secure operations
 */
import { ecosystemIntegration } from '../services/EcosystemIntegration.js';
/**
 * sQuid Identity Service for authentication and authorization
 */
export class SquidIdentityService {
    identityCache = new Map();
    tokenCache = new Map();
    CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    /**
     * Validate an identity token
     */
    async validateIdentityToken(token) {
        try {
            // Check cache first
            const cached = this.tokenCache.get(token);
            if (cached && Date.now() < cached.expiresAt) {
                const identity = await this.getIdentity(cached.token.identity);
                if (identity) {
                    return {
                        valid: true,
                        identity,
                        errors: [],
                        warnings: [],
                        permissions: cached.token.permissions,
                        metadata: { cached: true }
                    };
                }
            }
            // Parse and validate token
            const parsedToken = this.parseIdentityToken(token);
            if (!parsedToken) {
                return {
                    valid: false,
                    errors: ['Invalid token format'],
                    warnings: [],
                    permissions: [],
                    metadata: {}
                };
            }
            // Check expiration
            if (Date.now() > new Date(parsedToken.expiresAt).getTime()) {
                return {
                    valid: false,
                    errors: ['Token expired'],
                    warnings: [],
                    permissions: [],
                    metadata: { expiredAt: parsedToken.expiresAt }
                };
            }
            // Validate signature through sQuid service
            const signatureValid = await this.validateTokenSignature(parsedToken);
            if (!signatureValid) {
                return {
                    valid: false,
                    errors: ['Invalid token signature'],
                    warnings: [],
                    permissions: [],
                    metadata: {}
                };
            }
            // Get full identity details
            const identity = await this.getIdentity(parsedToken.identity);
            if (!identity) {
                return {
                    valid: false,
                    errors: ['Identity not found'],
                    warnings: [],
                    permissions: [],
                    metadata: {}
                };
            }
            // Cache the validated token
            this.tokenCache.set(token, {
                token: parsedToken,
                expiresAt: Date.now() + this.CACHE_TTL
            });
            return {
                valid: true,
                identity,
                errors: [],
                warnings: [],
                permissions: parsedToken.permissions,
                metadata: { validated: true }
            };
        }
        catch (error) {
            console.error('[SquidIdentity] Token validation error:', error);
            return {
                valid: false,
                errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
                warnings: [],
                permissions: [],
                metadata: {}
            };
        }
    }
    /**
     * Get identity details by ID
     */
    async getIdentity(identityId) {
        try {
            // Check cache first
            const cached = this.identityCache.get(identityId);
            if (cached && Date.now() < cached.expiresAt) {
                return cached.identity;
            }
            // Get identity from sQuid service through ecosystem integration
            const squidService = ecosystemIntegration.getService('squid');
            if (!squidService) {
                console.warn('[SquidIdentity] sQuid service not available');
                return this.createMockIdentity(identityId); // For development
            }
            const identity = await squidService.getIdentity(identityId);
            if (!identity) {
                return null;
            }
            // Cache the identity
            this.identityCache.set(identityId, {
                identity,
                expiresAt: Date.now() + this.CACHE_TTL
            });
            return identity;
        }
        catch (error) {
            console.error('[SquidIdentity] Get identity error:', error);
            return null;
        }
    }
    /**
     * Validate sub-identity signature for step execution
     */
    async validateSubIdentitySignature(signature) {
        try {
            // Get parent identity
            const parentIdentity = await this.getIdentity(signature.parentIdentity);
            if (!parentIdentity) {
                console.error('[SquidIdentity] Parent identity not found:', signature.parentIdentity);
                return false;
            }
            // Get sub-identity
            const subIdentity = await this.getIdentity(signature.subIdentity);
            if (!subIdentity || subIdentity.parentId !== signature.parentIdentity) {
                console.error('[SquidIdentity] Invalid sub-identity relationship');
                return false;
            }
            // Validate signature through sQuid service
            const squidService = ecosystemIntegration.getService('squid');
            if (!squidService) {
                console.warn('[SquidIdentity] sQuid service not available, using mock validation');
                return this.mockValidateSignature(signature);
            }
            const isValid = await squidService.validateSubIdentitySignature({
                parentPublicKey: parentIdentity.publicKey,
                subPublicKey: subIdentity.publicKey,
                operation: signature.operation,
                payload: signature.payload,
                signature: signature.signature,
                timestamp: signature.timestamp
            });
            return isValid;
        }
        catch (error) {
            console.error('[SquidIdentity] Sub-identity signature validation error:', error);
            return false;
        }
    }
    /**
     * Check if identity has required permissions
     */
    async hasPermissions(identityId, requiredPermissions) {
        try {
            const identity = await this.getIdentity(identityId);
            if (!identity) {
                return false;
            }
            // Check if identity has all required permissions
            return requiredPermissions.every(permission => identity.permissions.includes(permission) ||
                identity.permissions.includes('*') || // Wildcard permission
                identity.permissions.includes(permission.split(':')[0] + ':*') // Namespace wildcard
            );
        }
        catch (error) {
            console.error('[SquidIdentity] Permission check error:', error);
            return false;
        }
    }
    /**
     * Validate flow ownership
     */
    async validateFlowOwnership(flowOwnerId, requestingIdentityId) {
        try {
            // Owner can always access their own flows
            if (flowOwnerId === requestingIdentityId) {
                return true;
            }
            // Check if requesting identity is a sub-identity of the owner
            const requestingIdentity = await this.getIdentity(requestingIdentityId);
            if (requestingIdentity && requestingIdentity.parentId === flowOwnerId) {
                return true;
            }
            // Check if requesting identity has admin permissions
            const hasAdminPermission = await this.hasPermissions(requestingIdentityId, ['flow:admin', 'admin:*']);
            if (hasAdminPermission) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('[SquidIdentity] Flow ownership validation error:', error);
            return false;
        }
    }
    /**
     * Create identity token for authentication
     */
    async createIdentityToken(identityId, permissions, expirationMinutes = 60) {
        try {
            const identity = await this.getIdentity(identityId);
            if (!identity) {
                return null;
            }
            const now = new Date();
            const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);
            const token = {
                identity: identityId,
                signature: '', // Will be filled by signing
                timestamp: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                permissions,
                nonce: this.generateNonce()
            };
            // Sign token through sQuid service
            const squidService = ecosystemIntegration.getService('squid');
            if (!squidService) {
                console.warn('[SquidIdentity] sQuid service not available, using mock signing');
                token.signature = this.mockSignToken(token);
            }
            else {
                token.signature = await squidService.signToken(token, identity.publicKey);
            }
            // Encode token
            return this.encodeIdentityToken(token);
        }
        catch (error) {
            console.error('[SquidIdentity] Token creation error:', error);
            return null;
        }
    }
    /**
     * Refresh identity cache
     */
    async refreshIdentityCache(identityId) {
        this.identityCache.delete(identityId);
        await this.getIdentity(identityId);
    }
    /**
     * Clear all caches
     */
    clearCaches() {
        this.identityCache.clear();
        this.tokenCache.clear();
    }
    // Private helper methods
    parseIdentityToken(token) {
        try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            return JSON.parse(decoded);
        }
        catch (error) {
            console.error('[SquidIdentity] Token parsing error:', error);
            return null;
        }
    }
    encodeIdentityToken(token) {
        const encoded = JSON.stringify(token);
        return Buffer.from(encoded, 'utf-8').toString('base64');
    }
    async validateTokenSignature(token) {
        try {
            const squidService = ecosystemIntegration.getService('squid');
            if (!squidService) {
                return this.mockValidateTokenSignature(token);
            }
            return await squidService.validateTokenSignature(token);
        }
        catch (error) {
            console.error('[SquidIdentity] Token signature validation error:', error);
            return false;
        }
    }
    generateNonce() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
    // Mock methods for development (when sQuid service is not available)
    createMockIdentity(identityId) {
        return {
            id: identityId,
            type: identityId.includes('dao') ? 'dao' : 'user',
            publicKey: `mock-public-key-${identityId}`,
            permissions: ['flow:create', 'flow:execute', 'flow:read'],
            metadata: {
                name: `Mock Identity ${identityId}`,
                description: 'Mock identity for development',
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                reputation: 100
            }
        };
    }
    mockValidateSignature(signature) {
        // Simple mock validation - in production this would use cryptographic verification
        return signature.signature.length > 0 &&
            signature.parentIdentity.length > 0 &&
            signature.subIdentity.length > 0;
    }
    mockSignToken(token) {
        // Simple mock signing - in production this would use cryptographic signing
        return `mock-signature-${token.identity}-${token.nonce}`;
    }
    mockValidateTokenSignature(token) {
        // Simple mock validation - in production this would use cryptographic verification
        return token.signature.startsWith('mock-signature-') &&
            token.signature.includes(token.identity);
    }
}
// Export singleton instance
export const squidIdentityService = new SquidIdentityService();
//# sourceMappingURL=SquidIdentityService.js.map