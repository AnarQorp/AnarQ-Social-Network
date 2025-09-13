/**
 * Qflow CLI Tool
 *
 * Command-line interface for flow management and execution control
 * Provides comprehensive commands for creating, managing, and monitoring flows
 */
export interface CLIConfig {
    apiUrl: string;
    timeout: number;
    outputFormat: 'json' | 'table' | 'yaml';
    verbose: boolean;
}
export declare class QflowCLI {
    private program;
    private config;
    constructor(config?: Partial<CLIConfig>);
    /**
     * Setup CLI commands and options
     */
    private setupCommands;
    /**
     * Parse and execute CLI commands
     */
    run(argv?: string[]): Promise<void>;
    private handleCreateFlow;
    private handleListFlows;
    private handleShowFlow;
    private handleUpdateFlow;
    private handleDeleteFlow;
    private handleValidateFlow;
    private handleStartExecution;
    private handleListExecutions;
    private handleExecutionStatus;
    private handleExecutionLogs;
    private handlePauseExecution;
    private handleResumeExecution;
    private handleAbortExecution;
    private handleSystemInfo;
    private handleSystemHealth;
    private handleSystemMetrics;
    private handleStartServer;
    private handleListNodes;
    private handleNodeHealth;
    private handleListDAOSubnets;
    private handleTransferOwnership;
    private handleGrantPermission;
    private handleRevokePermission;
    private handleShowOwnership;
    private handleRequestAccess;
    private handleReviewRequest;
    private handleUpdatePolicy;
    private handleListOwned;
    private handleListAccessible;
    private readFile;
    private confirm;
    private output;
    private outputTable;
    private outputObject;
    private verbose;
    private info;
    private success;
    private warn;
    private error;
}
export declare const qflowCLI: QflowCLI;
//# sourceMappingURL=QflowCLI.d.ts.map