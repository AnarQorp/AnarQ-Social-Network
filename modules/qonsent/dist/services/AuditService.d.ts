export interface PermissionCheckAuditParams {
    checkId: string;
    resource: string;
    identity: string;
    action: string;
    result: 'ALLOWED' | 'DENIED' | 'ERROR';
    reason: string;
    responseTime: number;
    context?: Record<string, any>;
    cacheHit?: boolean;
}
export interface PermissionGrantAuditParams {
    grantId: string;
    resource: string;
    identity: string;
    permissions: string[];
    grantedBy: string;
    expiresAt?: Date;
    conditions?: Record<string, any>;
}
export interface PermissionRevocationAuditParams {
    resource: string;
    identity: string;
    revokedPermissions: string[];
    revokedBy: string;
    reason?: string;
}
export declare class AuditService {
    private eventBus;
    constructor();
    /**
     * Log a permission check event
     */
    logPermissionCheck(params: PermissionCheckAuditParams): Promise<void>;
    /**
     * Log a permission grant event
     */
    logPermissionGrant(params: PermissionGrantAuditParams): Promise<void>;
    /**
     * Log a permission revocation event
     */
    logPermissionRevocation(params: PermissionRevocationAuditParams): Promise<void>;
    /**
     * Log a security event
     */
    logSecurityEvent(params: {
        eventType: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        identity?: string;
        resource?: string;
        details: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    /**
     * Log a policy operation event
     */
    logPolicyOperation(params: {
        operation: 'CREATE' | 'UPDATE' | 'DELETE';
        policyId: string;
        policyName: string;
        performedBy: string;
        details?: Record<string, any>;
    }): Promise<void>;
    /**
     * Send audit event to Qerberos audit system
     */
    private sendToAuditSystem;
    /**
     * Publish audit event to event bus
     */
    private publishAuditEvent;
    /**
     * Publish security event to event bus
     */
    private publishSecurityEvent;
    /**
     * Extract resource type from resource identifier
     */
    private extractResourceType;
}
//# sourceMappingURL=AuditService.d.ts.map