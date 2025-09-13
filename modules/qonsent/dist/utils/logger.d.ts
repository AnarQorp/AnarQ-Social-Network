import pino from 'pino';
export declare const logger: import("pino").Logger<never>;
export declare function createRequestLogger(requestId: string, traceId?: string): pino.Logger<never>;
export declare const loggerHelpers: {
    logPermissionCheck: (params: {
        checkId: string;
        resource: string;
        identity: string;
        action: string;
        result: "ALLOWED" | "DENIED" | "ERROR";
        reason: string;
        responseTime: number;
        cacheHit?: boolean;
    }) => void;
    logPermissionGrant: (params: {
        grantId: string;
        resource: string;
        identity: string;
        permissions: string[];
        grantedBy: string;
        expiresAt?: Date;
    }) => void;
    logPermissionRevocation: (params: {
        resource: string;
        identity: string;
        revokedPermissions: string[];
        revokedBy: string;
        reason?: string;
    }) => void;
    logPolicyOperation: (params: {
        operation: "CREATE" | "UPDATE" | "DELETE";
        policyId: string;
        policyName: string;
        performedBy: string;
    }) => void;
    logSecurityEvent: (params: {
        eventType: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        identity?: string;
        resource?: string;
        details: Record<string, any>;
    }) => void;
    logServiceHealth: (params: {
        service: string;
        status: "UP" | "DOWN" | "DEGRADED";
        latency?: number;
        error?: string;
    }) => void;
    logPerformanceMetric: (params: {
        operation: string;
        duration: number;
        success: boolean;
        metadata?: Record<string, any>;
    }) => void;
};
//# sourceMappingURL=logger.d.ts.map