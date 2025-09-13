/**
 * Threshold Signature Service
 *
 * Manages DAO validator sets and threshold signatures for critical operations
 */
import { EventEmitter } from 'events';
export interface ValidatorKeyPair {
    validatorId: string;
    publicKey: string;
    privateKeyShare: string;
    keyIndex: number;
    threshold: number;
    totalValidators: number;
    createdAt: string;
    expiresAt?: string;
}
export interface ThresholdSignatureScheme {
    scheme: 'BLS' | 'Dilithium' | 'ECDSA';
    threshold: number;
    totalValidators: number;
    publicKeys: string[];
    aggregatePublicKey: string;
    parameters: {
        curve?: string;
        securityLevel?: number;
        hashFunction: string;
    };
}
export interface SignatureShare {
    validatorId: string;
    keyIndex: number;
    signature: string;
    message: string;
    messageHash: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface ThresholdSignature {
    id: string;
    daoSubnet: string;
    message: string;
    messageHash: string;
    scheme: ThresholdSignatureScheme;
    shares: SignatureShare[];
    aggregatedSignature?: string;
    status: 'collecting' | 'complete' | 'failed' | 'expired';
    requiredShares: number;
    collectedShares: number;
    createdAt: string;
    completedAt?: string;
    expiresAt: string;
    purpose: 'step_commit' | 'policy_update' | 'validator_change' | 'resource_allocation' | 'custom';
    metadata: {
        stepId?: string;
        executionId?: string;
        proposalId?: string;
        initiatedBy: string;
        criticalOperation: boolean;
    };
}
export interface ValidatorSet {
    daoSubnet: string;
    validators: ValidatorInfo[];
    scheme: ThresholdSignatureScheme;
    epoch: number;
    activeFrom: string;
    activeUntil?: string;
    rotationPolicy: {
        rotationInterval: number;
        maxValidatorAge: number;
        minValidators: number;
        maxValidators: number;
    };
}
export interface ValidatorInfo {
    validatorId: string;
    publicKey: string;
    weight: number;
    role: 'primary' | 'backup' | 'observer';
    status: 'active' | 'inactive' | 'compromised' | 'rotating';
    joinedAt: string;
    lastActivity: string;
    reputation: number;
    slashingHistory: SlashingEvent[];
}
export interface SlashingEvent {
    id: string;
    validatorId: string;
    reason: 'double_signing' | 'unavailability' | 'malicious_behavior' | 'key_compromise';
    severity: 'warning' | 'minor' | 'major' | 'critical';
    penalty: number;
    evidence: string;
    reportedBy: string;
    reportedAt: string;
    resolved: boolean;
    resolvedAt?: string;
}
export interface CriticalOperation {
    id: string;
    type: 'payment' | 'governance_vote' | 'validator_change' | 'policy_update' | 'resource_transfer';
    daoSubnet: string;
    description: string;
    data: any;
    requiredSignatures: number;
    collectedSignatures: number;
    signatures: ThresholdSignature[];
    status: 'pending' | 'signed' | 'executed' | 'failed' | 'expired';
    initiatedBy: string;
    initiatedAt: string;
    deadline: string;
    byzantineFaultTolerant: boolean;
}
export declare class ThresholdSignatureService extends EventEmitter {
    private validatorSetsCache;
    private signatureRequestsCache;
    private criticalOperationsCache;
    private validatorKeysCache;
    private cacheExpiry;
    constructor();
    /**
     * Initialize validator set for DAO subnet
     */
    initializeValidatorSet(daoSubnet: string, validators: string[], // Validator identity IDs
    scheme?: 'BLS' | 'Dilithium' | 'ECDSA', threshold?: number): Promise<ValidatorSet>;
    /**
     * Request threshold signature for critical operation
     */
    requestThresholdSignature(daoSubnet: string, message: string, purpose: ThresholdSignature['purpose'], metadata: ThresholdSignature['metadata'], expirationMinutes?: number): Promise<string>;
    /**
     * Submit signature share from validator
     */
    submitSignatureShare(signatureId: string, validatorId: string, signature: string, metadata?: Record<string, any>): Promise<boolean>;
    /**
     * Create critical operation requiring Byzantine fault tolerance
     */
    createCriticalOperation(type: CriticalOperation['type'], daoSubnet: string, description: string, data: any, initiatedBy: string, deadlineMinutes?: number): Promise<string>;
    /**
     * Get validator set for DAO subnet
     */
    getValidatorSet(daoSubnet: string): Promise<ValidatorSet | null>;
    /**
     * Get signature request status
     */
    getSignatureRequest(signatureId: string): Promise<ThresholdSignature | null>;
    /**
     * Get critical operation status
     */
    getCriticalOperation(operationId: string): Promise<CriticalOperation | null>;
    /**
     * Rotate validator set
     */
    rotateValidatorSet(daoSubnet: string, newValidators: string[], rotatedBy: string): Promise<boolean>;
    private setupEventHandlers;
    private initializeDefaultSchemes;
    private generateValidatorKeys;
    private generateAggregatePublicKey;
    private getSchemeParameters;
    private hashMessage;
    private verifySignatureShare;
    private aggregateSignature;
    private recordSlashingEvent;
    private calculateSlashingPenalty;
    private checkExpiredSignatures;
    private checkValidatorRotation;
    private updateValidatorReputations;
    private hashString;
    private generateEventId;
}
export declare const thresholdSignatureService: ThresholdSignatureService;
//# sourceMappingURL=ThresholdSignatureService.d.ts.map