/**
 * WASM Egress Controls and Capability Tokens
 *
 * Implements host shims for Q-module calls with deny-by-default policy,
 * per-step capability tokens (expiring, DAO-approved), and argument-bounded
 * capability tokens signed by DAO policy
 */
import { EventEmitter } from 'events';
export interface CapabilityToken {
    tokenId: string;
    sandboxId: string;
    executionId: string;
    stepId: string;
    capability: string;
    permissions: Permission[];
    constraints: TokenConstraints;
    metadata: {
        issuedBy: string;
        daoSubnet: string;
        daoApproved: boolean;
        approvalSignature?: string;
        issuedAt: string;
        expiresAt: string;
        maxUsage: number;
        currentUsage: number;
    };
    signature: string;
    status: 'active' | 'expired' | 'revoked' | 'exhausted';
}
export interface Permission {
    resource: string;
    actions: string[];
    conditions?: PermissionCondition[];
}
export interface PermissionCondition {
    type: 'argument-bound' | 'rate-limit' | 'time-window' | 'resource-limit';
    parameters: Record<string, any>;
}
export interface TokenConstraints {
    argumentBounds?: ArgumentBound[];
    rateLimits?: RateLimit[];
    resourceLimits?: ResourceLimit[];
    networkRestrictions?: NetworkRestriction[];
    timeWindows?: TimeWindow[];
}
export interface ArgumentBound {
    argumentIndex: number;
    argumentName: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    constraints: {
        minLength?: number;
        maxLength?: number;
        minValue?: number;
        maxValue?: number;
        allowedValues?: any[];
        pattern?: string;
        required?: boolean;
    };
}
export interface RateLimit {
    operation: string;
    maxRequests: number;
    windowMs: number;
    currentCount: number;
    windowStart: number;
}
export interface ResourceLimit {
    resource: 'memory' | 'cpu' | 'disk' | 'network';
    maxUsage: number;
    currentUsage: number;
}
export interface NetworkRestriction {
    allowedHosts: string[];
    allowedPorts: number[];
    allowedProtocols: string[];
    maxConnections: number;
    currentConnections: number;
}
export interface TimeWindow {
    startTime: string;
    endTime: string;
    timezone?: string;
}
export interface HostShim {
    shimId: string;
    moduleName: string;
    functionName: string;
    requiredCapability: string;
    implementation: (args: any[], token: CapabilityToken) => Promise<any>;
    denyByDefault: boolean;
    auditLog: boolean;
}
export interface EgressRequest {
    requestId: string;
    sandboxId: string;
    tokenId: string;
    moduleName: string;
    functionName: string;
    arguments: any[];
    timestamp: string;
    approved: boolean;
    reason?: string;
}
export interface DAOPolicy {
    policyId: string;
    daoSubnet: string;
    version: string;
    capabilities: {
        [capability: string]: {
            allowed: boolean;
            constraints: TokenConstraints;
            approvalRequired: boolean;
            maxDuration: number;
        };
    };
    signature: string;
    issuedAt: string;
    expiresAt: string;
}
/**
 * Capability Token Manager with Egress Controls
 */
export declare class CapabilityTokenManager extends EventEmitter {
    private tokens;
    private hostShims;
    private daoPolicies;
    private egressRequests;
    private rateLimitTracking;
    private isRunning;
    private readonly DEFAULT_SHIMS;
    constructor();
    /**
     * Start capability token manager
     */
    start(): Promise<void>;
    /**
     * Stop capability token manager
     */
    stop(): Promise<void>;
    /**
     * Issue capability token
     */
    issueToken(sandboxId: string, executionId: string, stepId: string, capability: string, permissions: Permission[], constraints: TokenConstraints, daoSubnet: string, durationMs?: number): Promise<string>;
    /**
     * Validate and use capability token
     */
    useToken(tokenId: string, moduleName: string, functionName: string, args: any[]): Promise<{
        allowed: boolean;
        reason?: string;
        result?: any;
    }>;
    /**
     * Revoke capability token
     */
    revokeToken(tokenId: string, reason: string): Promise<void>;
    /**
     * Register host shim
     */
    registerHostShim(moduleName: string, functionName: string, requiredCapability: string, implementation: (args: any[], token: CapabilityToken) => Promise<any>, options?: {
        denyByDefault?: boolean;
        auditLog?: boolean;
    }): void;
    /**
     * Update DAO policy
     */
    updateDAOPolicy(policy: DAOPolicy): Promise<void>;
    /**
     * Get active tokens
     */
    getActiveTokens(sandboxId?: string): CapabilityToken[];
    /**
     * Get egress requests
     */
    getEgressRequests(sandboxId?: string): EgressRequest[];
    private setupDefaultShims;
    private createDefaultImplementation;
    private validateConstraints;
    private validateArgumentBound;
    private checkRateLimit;
    private updateRateLimit;
    private mergeConstraints;
    private startTokenCleanup;
    private cleanupExpiredTokens;
    private signToken;
    private verifyPolicySignature;
    private generateTokenId;
    private generateRequestId;
    private generateShimId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const capabilityTokenManager: CapabilityTokenManager;
//# sourceMappingURL=CapabilityTokenManager.d.ts.map