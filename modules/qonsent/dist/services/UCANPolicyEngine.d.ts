import { Policy, PermissionCheck } from '../types';
export interface UCANCapability {
    with: string;
    can: string;
    nb?: Record<string, any>;
}
export interface UCANPolicy {
    iss: string;
    aud: string;
    att: UCANCapability[];
    exp?: number;
    nbf?: number;
    prf?: string[];
}
export interface PolicyCheckParams {
    resource: string;
    identity: string;
    action: string;
    context?: Record<string, any>;
}
export declare class UCANPolicyEngine {
    /**
     * Check permission using UCAN policies
     */
    checkPermission(params: PolicyCheckParams): Promise<PermissionCheck>;
    /**
     * Find policies that might apply to the resource and identity
     */
    private findApplicablePolicies;
    /**
     * Evaluate a single policy against the request
     */
    private evaluatePolicy;
    /**
     * Evaluate a single rule within a policy
     */
    private evaluateRule;
    /**
     * Check if a value matches a pattern (supports wildcards)
     */
    private matchesPattern;
    /**
     * Check if an action is allowed by the rule's actions
     */
    private matchesAction;
    /**
     * Evaluate conditions/caveats
     */
    private evaluateConditions;
    /**
     * Convert resource pattern to regex
     */
    private resourceToRegex;
    /**
     * Create a new UCAN policy
     */
    createPolicy(params: {
        name: string;
        description?: string;
        scope: 'global' | 'dao' | 'resource';
        rules: any[];
        createdBy: string;
        expiresAt?: Date;
    }): Promise<Policy>;
    /**
     * Update an existing policy
     */
    updatePolicy(policyId: string, updates: Partial<Policy>, updatedBy: string): Promise<Policy>;
    /**
     * Delete a policy
     */
    deletePolicy(policyId: string, deletedBy: string): Promise<void>;
}
//# sourceMappingURL=UCANPolicyEngine.d.ts.map