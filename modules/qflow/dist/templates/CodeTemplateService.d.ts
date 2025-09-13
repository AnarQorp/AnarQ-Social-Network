/**
 * Code Template Service
 *
 * Manages DAO-approved code templates and whitelisting for secure execution
 */
import { EventEmitter } from 'events';
export interface CodeTemplate {
    id: string;
    name: string;
    description: string;
    category: 'utility' | 'integration' | 'transformation' | 'validation' | 'custom';
    language: 'javascript' | 'typescript' | 'python' | 'wasm' | 'custom';
    version: string;
    code: string;
    entryPoint: string;
    parameters: TemplateParameter[];
    dependencies: string[];
    resourceRequirements: {
        cpu: number;
        memory: number;
        timeout: number;
        networkAccess: boolean;
        fileSystemAccess: boolean;
    };
    security: {
        sandboxed: boolean;
        allowedAPIs: string[];
        blockedAPIs: string[];
        maxExecutionTime: number;
        memoryLimit: number;
    };
    metadata: {
        author: string;
        created: string;
        lastModified: string;
        tags: string[];
        documentation: string;
        examples: TemplateExample[];
    };
    approval: {
        status: 'pending' | 'approved' | 'rejected' | 'deprecated';
        approvedBy: string[];
        rejectedBy: string[];
        approvalDate?: string;
        rejectionReason?: string;
        expiresAt?: string;
    };
}
export interface TemplateParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    defaultValue?: any;
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        enum?: any[];
    };
}
export interface TemplateExample {
    name: string;
    description: string;
    input: Record<string, any>;
    expectedOutput: any;
}
export interface DAOTemplateWhitelist {
    daoSubnet: string;
    whitelistedTemplates: string[];
    blacklistedTemplates: string[];
    approvalPolicy: {
        requiresVoting: boolean;
        minimumApprovers: number;
        approvalThreshold: number;
        autoApproveCategories: string[];
        autoRejectPatterns: string[];
    };
    securityPolicy: {
        maxCpuUnits: number;
        maxMemoryMB: number;
        maxExecutionTime: number;
        allowNetworkAccess: boolean;
        allowFileSystemAccess: boolean;
        allowedAPIs: string[];
        blockedAPIs: string[];
    };
    lastUpdated: string;
    updatedBy: string;
}
export interface TemplateApprovalRequest {
    id: string;
    templateId: string;
    daoSubnet: string;
    requestedBy: string;
    requestedAt: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    votes: TemplateVote[];
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
}
export interface TemplateVote {
    validator: string;
    vote: 'approve' | 'reject' | 'abstain';
    reason?: string;
    votedAt: string;
    signature: string;
}
export declare class CodeTemplateService extends EventEmitter {
    private templatesCache;
    private whitelistsCache;
    private approvalRequestsCache;
    private executionStatsCache;
    constructor();
    registerTemplate(templateData: Omit<CodeTemplate, 'id' | 'approval' | 'metadata'> & {
        metadata: Partial<CodeTemplate['metadata']>;
    }, author: string): Promise<CodeTemplate>;
    isTemplateApproved(templateId: string, daoSubnet: string): Promise<boolean>;
    getApprovedTemplates(daoSubnet: string): Promise<CodeTemplate[]>;
    private setupEventHandlers;
    private initializeDefaultTemplates;
    private validateTemplateSecurity;
    private cleanupExpiredRequests;
    private generateEventId;
}
export declare const codeTemplateService: CodeTemplateService;
//# sourceMappingURL=CodeTemplateService.d.ts.map