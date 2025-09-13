/**
 * Qflow REST API Server
 *
 * Express.js server providing REST API endpoints for flow management
 * Implements comprehensive flow CRUD operations and execution control
 */
export interface QflowServerConfig {
    port: number;
    host: string;
    cors: {
        enabled: boolean;
        origins: string[];
    };
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
    };
    auth: {
        enabled: boolean;
        requireSquidIdentity: boolean;
        skipAuthPaths: string[];
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
    requestId: string;
}
export interface FlowCreateRequest {
    flowData: string;
    format?: 'json' | 'yaml' | 'auto';
}
export interface FlowUpdateRequest {
    flowData: string;
    format?: 'json' | 'yaml' | 'auto';
}
export interface ExecutionStartRequest {
    context: {
        triggeredBy: string;
        triggerType: 'manual' | 'webhook' | 'event' | 'schedule';
        inputData?: Record<string, any>;
        variables?: Record<string, any>;
        daoSubnet?: string;
        permissions?: string[];
    };
}
/**
 * Qflow REST API Server
 */
export declare class QflowServer {
    private app;
    private server;
    private config;
    private flows;
    constructor(config?: Partial<QflowServerConfig>);
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup error handling middleware
     */
    private setupErrorHandling;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
    private handleHealthCheck;
    private handleLivenessCheck;
    private handleReadinessCheck;
    private handleCreateFlow;
    private handleListFlows;
    private handleGetFlow;
    private handleUpdateFlow;
    private handleDeleteFlow;
    private handleValidateFlow;
    private handleStartExecution;
    private handleListExecutions;
    private handleGetExecution;
    private handlePauseExecution;
    private handleResumeExecution;
    private handleAbortExecution;
    private handleTransferOwnership;
    private handleGrantAccess;
    private handleRevokeAccess;
    private handleGetOwnership;
    private handleGetPermissions;
    private handleCreateDAOSubnet;
    private handleListDAOSubnets;
    private handleGetDAOSubnet;
    private handleAddValidator;
    private handleCreateProposal;
    private handleVoteOnProposal;
    private handleGetResourceUsage;
    private handleGetBillingUsage;
    private handleGetBillingAlerts;
    private handleAcknowledgeAlert;
    private handleUpdateBillingTier;
    private handleGetBillingReport;
}
export declare const qflowServer: QflowServer;
//# sourceMappingURL=QflowServer.d.ts.map