/**
 * DAO-Approved Code Template System
 *
 * Implements code template validation, whitelisting, DAO governance workflow,
 * and template versioning with security scanning
 */
import { EventEmitter } from 'events';
export interface CodeTemplate {
    templateId: string;
    name: string;
    version: string;
    description: string;
    category: 'utility' | 'integration' | 'computation' | 'data-processing' | 'custom';
    author: string;
    daoSubnet: string;
    code: {
        wasmModule?: Uint8Array;
        sourceCode?: string;
        language: 'wasm' | 'assemblyscript' | 'rust' | 'c' | 'javascript';
    };
    metadata: {
        capabilities: string[];
        requiredPermissions: string[];
        resourceRequirements: {
            maxMemoryMB: number;
            maxCpuTimeMs: number;
            maxExecutionTimeMs: number;
        };
        dependencies: string[];
        tags: string[];
    };
    approval: {
        status: 'pending' | 'approved' | 'rejected' | 'deprecated';
        approvedBy?: string[];
        rejectedBy?: string[];
        approvalDate?: string;
        rejectionReason?: string;
        votes: TemplateVote[];
        requiredVotes: number;
    };
    security: {
        scanResults: SecurityScanResult[];
        riskScore: number;
        vulnerabilities: SecurityVulnerability[];
        lastScanned: string;
    };
    usage: {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        lastUsed?: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface TemplateVote {
    voteId: string;
    voter: string;
    vote: 'approve' | 'reject' | 'abstain';
    reason?: string;
    timestamp: string;
    signature: string;
    weight: number;
}
export interface SecurityScanResult {
    scanId: string;
    scanType: 'static-analysis' | 'dynamic-analysis' | 'dependency-check' | 'vulnerability-scan';
    score: number;
    issues: SecurityIssue[];
    recommendations: string[];
    scannedAt: string;
    scannerVersion: string;
}
export interface SecurityIssue {
    issueId: string;
    type: 'buffer-overflow' | 'memory-leak' | 'unsafe-operation' | 'malicious-code' | 'dependency-vulnerability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: {
        file?: string;
        line?: number;
        function?: string;
    };
    cwe?: string;
    cvss?: number;
    mitigation?: string;
    falsePositive?: boolean;
}
export interface SecurityVulnerability {
    vulnerabilityId: string;
    cve?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedVersions: string[];
    patchAvailable: boolean;
    patchVersion?: string;
    discoveredAt: string;
}
export interface TemplateSubmission {
    submissionId: string;
    templateId: string;
    submitter: string;
    daoSubnet: string;
    submittedAt: string;
    reviewDeadline: string;
    reviewers: string[];
    status: 'submitted' | 'under-review' | 'approved' | 'rejected' | 'withdrawn';
}
export interface DAOGovernanceConfig {
    requiredApprovals: number;
    reviewPeriodDays: number;
    enableQuadraticVoting: boolean;
    minSecurityScore: number;
    maxRiskScore: number;
    autoApproveThreshold?: number;
    autoRejectThreshold?: number;
}
/**
 * DAO Code Template Manager
 */
export declare class DAOCodeTemplateManager extends EventEmitter {
    private templates;
    private submissions;
    private whitelistedTemplates;
    private deprecatedTemplates;
    private readonly governanceConfig;
    private isRunning;
    constructor(config?: Partial<DAOGovernanceConfig>);
    /**
     * Start template manager
     */
    start(): Promise<void>;
    /**
     * Stop template manager
     */
    stop(): Promise<void>;
    /**
     * Submit template for DAO approval
     */
    submitTemplate(templateData: Omit<CodeTemplate, 'templateId' | 'approval' | 'security' | 'usage' | 'createdAt' | 'updatedAt'>, submitter: string): Promise<string>;
    /**
     * Vote on template approval
     */
    voteOnTemplate(templateId: string, voter: string, vote: 'approve' | 'reject' | 'abstain', weight?: number, reason?: string): Promise<void>;
    /**
     * Get template by ID
     */
    getTemplate(templateId: string): CodeTemplate | undefined;
    /**
     * Get approved templates
     */
    getApprovedTemplates(daoSubnet?: string): CodeTemplate[];
    /**
     * Get whitelisted templates
     */
    getWhitelistedTemplates(): string[];
    /**
     * Check if template is approved and whitelisted
     */
    isTemplateApproved(templateId: string): boolean;
    /**
     * Update template usage statistics
     */
    updateTemplateUsage(templateId: string, success: boolean, executionTimeMs: number): Promise<void>;
    /**
     * Deprecate template
     */
    deprecateTemplate(templateId: string, reason: string, deprecatedBy: string): Promise<void>;
    /**
     * Get template statistics
     */
    getTemplateStatistics(): {
        total: number;
        byStatus: Record<string, number>;
        byCategory: Record<string, number>;
        byDAO: Record<string, number>;
    };
    private setupEventHandlers;
    private loadExistingData;
    private startPeriodicTasks;
    private performSecurityScan;
    private performStaticAnalysis;
    private performDependencyCheck;
    private performVulnerabilityScan;
    private calculateRiskScore;
    private checkAutoDecision;
    private checkApprovalThreshold;
    private checkExpiredReviews;
    private performPeriodicSecurityScans;
    private signVote;
    private generateTemplateId;
    private generateSubmissionId;
    private generateVoteId;
    private generateScanId;
    private generateIssueId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const daoCodeTemplateManager: DAOCodeTemplateManager;
//# sourceMappingURL=DAOCodeTemplateManager.d.ts.map