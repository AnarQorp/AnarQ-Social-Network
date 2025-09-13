/**
 * Flow Ownership and Permissions Service
 *
 * Manages flow ownership, sharing, and identity-based access controls
 */
import { EventEmitter } from 'events';
import { FlowDefinition } from '../models/FlowDefinition.js';
export interface FlowOwnership {
    flowId: string;
    owner: string;
    created: string;
    lastModified: string;
    transferHistory: FlowTransfer[];
}
export interface FlowTransfer {
    id: string;
    fromOwner: string;
    toOwner: string;
    timestamp: string;
    reason: string;
    signature: string;
}
export interface FlowPermission {
    flowId: string;
    grantedTo: string;
    permission: FlowPermissionType;
    grantedBy: string;
    grantedAt: string;
    expiresAt?: string;
    conditions?: FlowPermissionCondition[];
}
export type FlowPermissionType = 'read' | 'execute' | 'modify' | 'share' | 'transfer' | 'delete' | 'admin';
export interface FlowPermissionCondition {
    type: 'time_range' | 'execution_limit' | 'dao_subnet' | 'custom';
    value: any;
    metadata?: Record<string, any>;
}
export interface FlowAccessRequest {
    id: string;
    flowId: string;
    requestedBy: string;
    requestedPermissions: FlowPermissionType[];
    reason: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'denied' | 'expired';
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
}
export interface FlowSharingPolicy {
    flowId: string;
    owner: string;
    visibility: 'private' | 'dao' | 'public' | 'whitelist';
    autoApprove: FlowPermissionType[];
    requireApproval: FlowPermissionType[];
    daoSubnet?: string;
    whitelist?: string[];
    blacklist?: string[];
    defaultExpiration?: string;
}
export declare class FlowOwnershipService extends EventEmitter {
    private ownershipCache;
    private permissionsCache;
    private sharingPoliciesCache;
    private accessRequestsCache;
    private cacheExpiry;
    constructor();
    /**
     * Register flow ownership
     */
    registerFlowOwnership(flowId: string, owner: string, flowDefinition?: FlowDefinition): Promise<FlowOwnership>;
    /**
     * Transfer flow ownership
     */
    transferFlowOwnership(flowId: string, currentOwner: string, newOwner: string, reason: string, signature: string): Promise<boolean>;
    /**
     * Grant permission to identity
     */
    grantPermission(flowId: string, grantedBy: string, grantedTo: string, permission: FlowPermissionType, expiresAt?: string, conditions?: FlowPermissionCondition[]): Promise<boolean>;
    /**
     * Revoke permission from identity
     */
    revokePermission(flowId: string, revokedBy: string, revokedFrom: string, permission: FlowPermissionType): Promise<boolean>;
    /**
     * Check if identity has specific permission for flow
     */
    hasPermission(identityId: string, flowId: string, permission: FlowPermissionType, context?: {
        daoSubnet?: string;
        executionContext?: any;
    }): Promise<boolean>;
    /**
     * Check if identity is flow owner
     */
    isFlowOwner(flowId: string, identityId: string): Promise<boolean>;
    /**
     * Get flow ownership information
     */
    getFlowOwnership(flowId: string): Promise<FlowOwnership | null>;
    /**
     * Get flow permissions
     */
    getFlowPermissions(flowId: string): Promise<FlowPermission[]>;
    /**
     * Request access to flow
     */
    requestAccess(flowId: string, requestedBy: string, requestedPermissions: FlowPermissionType[], reason: string): Promise<string | null>;
    /**
     * Review access request
     */
    reviewAccessRequest(requestId: string, decision: 'approved' | 'denied', reviewedBy: string, reviewNotes?: string): Promise<boolean>;
    /**
     * Update sharing policy
     */
    updateSharingPolicy(flowId: string, updatedBy: string, policy: Partial<FlowSharingPolicy>): Promise<boolean>;
    /**
     * Get flows owned by identity
     */
    getOwnedFlows(identityId: string): Promise<string[]>;
    /**
     * Get flows accessible by identity
     */
    getAccessibleFlows(identityId: string, permission?: FlowPermissionType): Promise<string[]>;
    /**
     * Clean up expired permissions and requests
     */
    cleanupExpired(): Promise<void>;
    private setupEventHandlers;
    private evaluateConditions;
    private evaluateTimeRange;
    private calculateExpiration;
    private generateEventId;
}
export declare const flowOwnershipService: FlowOwnershipService;
//# sourceMappingURL=FlowOwnershipService.d.ts.map