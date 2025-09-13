/**
 * DAO Subnet Isolation and Governance Service
 *
 * Manages DAO subnet isolation, governance policies, and multi-tenant execution
 */
import { EventEmitter } from 'events';
import { ExecutionContext } from '../models/FlowDefinition.js';
export interface DAOSubnet {
    id: string;
    name: string;
    description: string;
    governanceContract: string;
    validators: DAOValidator[];
    policies: DAOPolicy[];
    resourceLimits: DAOResourceLimits;
    isolation: DAOIsolationConfig;
    metadata: {
        created: string;
        lastUpdated: string;
        memberCount: number;
        activeFlows: number;
        totalExecutions: number;
    };
}
export interface DAOValidator {
    identityId: string;
    publicKey: string;
    weight: number;
    role: 'admin' | 'validator' | 'observer';
    addedAt: string;
    addedBy: string;
    active: boolean;
}
export interface DAOPolicy {
    id: string;
    type: 'execution' | 'resource' | 'access' | 'validation' | 'custom';
    name: string;
    description: string;
    rules: DAOPolicyRule[];
    enforcement: 'strict' | 'advisory' | 'disabled';
    version: string;
    createdAt: string;
    createdBy: string;
    approvedBy: string[];
    signature: string;
}
export interface DAOPolicyRule {
    condition: string;
    action: 'allow' | 'deny' | 'require_approval' | 'throttle' | 'custom';
    parameters?: Record<string, any>;
    message?: string;
}
export interface DAOResourceLimits {
    maxConcurrentExecutions: number;
    maxExecutionTime: number;
    maxMemoryPerExecution: number;
    maxCpuPerExecution: number;
    maxStoragePerFlow: number;
    maxNetworkBandwidth: number;
    dailyExecutionLimit: number;
    monthlyResourceBudget: number;
}
export interface DAOIsolationConfig {
    networkIsolation: boolean;
    storageIsolation: boolean;
    computeIsolation: boolean;
    dataEncryption: boolean;
    auditLogging: boolean;
    crossSubnetAccess: 'none' | 'read-only' | 'approved-only' | 'full';
    allowedExternalDomains: string[];
    blockedExternalDomains: string[];
}
export interface DAOGovernanceProposal {
    id: string;
    daoSubnet: string;
    type: 'policy_update' | 'validator_add' | 'validator_remove' | 'resource_limit' | 'custom';
    title: string;
    description: string;
    proposedBy: string;
    proposedAt: string;
    votingEndsAt: string;
    status: 'draft' | 'voting' | 'approved' | 'rejected' | 'executed';
    votes: DAOVote[];
    requiredQuorum: number;
    requiredMajority: number;
    executionData?: any;
}
export interface DAOVote {
    validator: string;
    vote: 'approve' | 'reject' | 'abstain';
    weight: number;
    votedAt: string;
    signature: string;
    reason?: string;
}
export interface DAOExecutionContext extends ExecutionContext {
    daoSubnet: string;
    isolationLevel: 'strict' | 'standard' | 'relaxed';
    resourceAllocation: {
        cpu: number;
        memory: number;
        storage: number;
        network: number;
    };
    governanceApprovals: string[];
    policyValidations: DAOPolicyValidation[];
}
export interface DAOPolicyValidation {
    policyId: string;
    policyType: string;
    result: 'pass' | 'fail' | 'warning';
    message: string;
    enforcementAction?: string;
}
export declare class DAOSubnetService extends EventEmitter {
    private subnetsCache;
    private policiesCache;
    private proposalsCache;
    private resourceUsageCache;
    private cacheExpiry;
    constructor();
    /**
     * Register new DAO subnet
     */
    registerDAOSubnet(subnetData: Partial<DAOSubnet>, createdBy: string): Promise<DAOSubnet>;
    /**
     * Get DAO subnet information
     */
    getDAOSubnet(subnetId: string): Promise<DAOSubnet | null>;
    /**
     * Validate execution against DAO policies
     */
    validateDAOExecution(flowId: string, executionContext: DAOExecutionContext): Promise<DAOPolicyValidation[]>;
    /**
     * Check resource allocation for execution
     */
    allocateResources(daoSubnet: string, requestedResources: Partial<DAOExecutionContext['resourceAllocation']>): Promise<{
        allocated: boolean;
        allocation?: any;
        reason?: string;
    }>;
    /**
     * Release allocated resources
     */
    releaseResources(daoSubnet: string, releasedResources: Partial<DAOExecutionContext['resourceAllocation']>): Promise<void>;
    /**
     * Add validator to DAO subnet
     */
    addValidator(daoSubnet: string, validatorData: Omit<DAOValidator, 'addedAt' | 'addedBy'>, addedBy: string): Promise<boolean>;
    /**
     * Create governance proposal
     */
    createProposal(daoSubnet: string, proposalData: Omit<DAOGovernanceProposal, 'id' | 'proposedAt' | 'status' | 'votes'>, proposedBy: string): Promise<string | null>;
    /**
     * Vote on governance proposal
     */
    voteOnProposal(proposalId: string, vote: Omit<DAOVote, 'votedAt' | 'weight'>, voter: string): Promise<boolean>;
    /**
     * List DAO subnets accessible by identity
     */
    listAccessibleSubnets(identityId: string): Promise<DAOSubnet[]>;
    private setupEventHandlers;
    private initializeDefaultSubnets;
    private createDefaultPolicies;
    private getDefaultResourceLimits;
    private getDefaultIsolationConfig;
    private evaluatePolicy;
    private evaluateCondition;
    private checkProposalResolution;
    private executeProposal;
    private executePolicyUpdate;
    private executeValidatorAdd;
    private executeValidatorRemove;
    private executeResourceLimitUpdate;
    private cleanupExpiredProposals;
    private updateResourceMetrics;
    private generateEventId;
}
export declare const daoSubnetService: DAOSubnetService;
//# sourceMappingURL=DAOSubnetService.d.ts.map