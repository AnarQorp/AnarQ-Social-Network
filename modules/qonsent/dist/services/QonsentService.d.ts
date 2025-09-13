import { PermissionGrant, PermissionCheck } from '../types';
export interface CheckPermissionParams {
    resource: string;
    identity: string;
    action: string;
    context?: Record<string, any>;
}
export interface GrantPermissionParams {
    resource: string;
    identity: string;
    permissions: string[];
    expiresAt?: Date;
    conditions?: Record<string, any>;
    grantedBy: string;
}
export interface RevokePermissionParams {
    resource: string;
    identity: string;
    permissions?: string[];
    revokedBy: string;
    reason?: string;
}
export declare class QonsentService {
    private eventBus;
    private cache;
    private audit;
    private policyEngine;
    constructor();
    /**
     * Check if an identity has permission to perform an action on a resource
     */
    checkPermission(params: CheckPermissionParams): Promise<PermissionCheck>;
    /**
     * Grant permissions to an identity for a resource
     */
    grantPermission(params: GrantPermissionParams): Promise<PermissionGrant>;
    /**
     * Revoke permissions from an identity for a resource
     */
    revokePermission(params: RevokePermissionParams): Promise<void>;
    /**
     * List permissions for a resource or identity
     */
    listPermissions(params: {
        resource?: string;
        identity?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        grants: PermissionGrant[];
        total: number;
    }>;
}
//# sourceMappingURL=QonsentService.d.ts.map