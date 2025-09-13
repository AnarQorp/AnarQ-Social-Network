/**
 * Qonsent Validation Layer for Universal Validation Pipeline
 *
 * Integrates with Qonsent service for dynamic permissions validation,
 * real-time permission checking, and consent expiration handling.
 */
import { ValidationResult, ValidationContext } from './UniversalValidationPipeline.js';
export interface QonsentValidationConfig {
    endpoint: string;
    timeout: number;
    retryAttempts: number;
    cachePermissions: boolean;
    permissionCacheTtl: number;
    strictMode: boolean;
}
export interface Permission {
    id: string;
    resource: string;
    action: string;
    scope: string[];
    conditions?: Record<string, any>;
    expiresAt?: string;
    grantedBy: string;
    grantedAt: string;
}
export interface ConsentRecord {
    id: string;
    userId: string;
    permissions: Permission[];
    consentType: 'explicit' | 'implicit' | 'delegated';
    status: 'active' | 'expired' | 'revoked' | 'pending';
    expiresAt?: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface PermissionRequest {
    userId: string;
    resource: string;
    action: string;
    context: ValidationContext;
    scope?: string[];
    conditions?: Record<string, any>;
}
export interface PermissionCheckResult {
    granted: boolean;
    permission?: Permission;
    reason: string;
    expiresAt?: string;
    requiresRenewal: boolean;
    consentRecord?: ConsentRecord;
}
export interface QonsentValidationResult extends ValidationResult {
    details: {
        permissionsChecked: number;
        permissionsGranted: number;
        permissionsDenied: number;
        expiredPermissions: number;
        renewalRequired: boolean;
        consentStatus?: 'valid' | 'expired' | 'revoked' | 'missing';
        error?: string;
    };
}
/**
 * Qonsent Validation Layer
 * Provides permission validation for the Universal Validation Pipeline
 */
export declare class QonsentValidationLayer {
    private qonsentService;
    private config;
    private permissionCache;
    constructor(config?: Partial<QonsentValidationConfig>);
    /**
     * Validate permissions for data access/operations
     */
    validatePermissions(data: any, context: ValidationContext): Promise<QonsentValidationResult>;
    /**
     * Check permission with caching
     */
    private checkPermissionWithCache;
    /**
     * Renew expired permission
     */
    renewPermission(permissionId: string, userId: string): Promise<Permission>;
    /**
     * Revoke permission
     */
    revokePermission(permissionId: string, userId: string): Promise<void>;
    /**
     * Get consent record for user
     */
    getConsentRecord(userId: string): Promise<ConsentRecord | null>;
    /**
     * Extract permission requests from data
     */
    private extractPermissionRequests;
    /**
     * Extract primary user ID from context
     */
    private extractPrimaryUserId;
    /**
     * Generate cache key for permission request
     */
    private generatePermissionCacheKey;
    /**
     * Clear permission cache for a user
     */
    private clearUserPermissionCache;
    /**
     * Determine consent status from consent record
     */
    private determineConsentStatus;
    /**
     * Start cache cleanup interval
     */
    private startCacheCleanup;
    /**
     * Get validation layer configuration for Universal Validation Pipeline
     */
    getValidationLayer(): {
        layerId: string;
        name: string;
        description: string;
        priority: number;
        required: boolean;
        timeout: number;
    };
    /**
     * Get validator function for Universal Validation Pipeline
     */
    getValidator(): (data: any, context: ValidationContext) => Promise<ValidationResult>;
    /**
     * Get current configuration
     */
    getConfig(): QonsentValidationConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<QonsentValidationConfig>): void;
    /**
     * Clear all permission cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStatistics(): {
        size: number;
        hitRate: number;
    };
}
export declare const qonsentValidationLayer: QonsentValidationLayer;
//# sourceMappingURL=QonsentValidationLayer.d.ts.map