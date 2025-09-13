/**
 * Auditable Historical Persistence Service
 *
 * Implements immutable execution history with cryptographic signatures
 * and comprehensive audit trail generation
 */
import { EventEmitter } from 'events';
export interface HistoricalRecord {
    recordId: string;
    executionId: string;
    flowId: string;
    stepId?: string;
    recordType: 'execution-started' | 'step-completed' | 'step-failed' | 'execution-completed' | 'execution-failed' | 'checkpoint-created';
    timestamp: string;
    actor: string;
    data: any;
    previousRecordHash?: string;
    signature: string;
    ipfsCid: string;
    metadata: {
        version: string;
        nodeId: string;
        daoSubnet?: string;
        correlationId?: string;
    };
}
export interface AuditTrail {
    executionId: string;
    flowId: string;
    records: HistoricalRecord[];
    summary: {
        totalRecords: number;
        startTime: string;
        endTime?: string;
        duration?: number;
        status: 'running' | 'completed' | 'failed' | 'aborted';
        stepsCompleted: number;
        stepsFailed: number;
        checkpointsCreated: number;
    };
    integrity: {
        chainValid: boolean;
        signaturesValid: boolean;
        lastVerified: string;
    };
}
export interface AuditQuery {
    executionId?: string;
    flowId?: string;
    actor?: string;
    recordType?: string;
    dateRange?: {
        from: string;
        to: string;
    };
    daoSubnet?: string;
    limit?: number;
    offset?: number;
}
export interface ComplianceReport {
    reportId: string;
    generatedAt: string;
    period: {
        from: string;
        to: string;
    };
    scope: {
        executionIds?: string[];
        flowIds?: string[];
        daoSubnets?: string[];
    };
    statistics: {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        totalSteps: number;
        averageExecutionTime: number;
        complianceViolations: number;
    };
    violations: ComplianceViolation[];
    auditTrails: AuditTrail[];
    ipfsCid: string;
    signature: string;
}
export interface ComplianceViolation {
    violationId: string;
    executionId: string;
    flowId: string;
    violationType: 'unauthorized-access' | 'permission-denied' | 'data-breach' | 'policy-violation' | 'integrity-failure';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    actor: string;
    remediation?: string;
}
/**
 * Auditable Historical Persistence Service
 */
export declare class AuditableHistoryService extends EventEmitter {
    private historicalRecords;
    private auditTrails;
    private recordChains;
    private complianceReports;
    constructor();
    /**
     * Record execution event in immutable history
     */
    recordExecutionEvent(executionId: string, flowId: string, recordType: HistoricalRecord['recordType'], data: any, actor: string, stepId?: string, daoSubnet?: string): Promise<string>;
    /**
     * Get complete audit trail for execution
     */
    getAuditTrail(executionId: string): Promise<AuditTrail | null>;
    /**
     * Query historical records
     */
    queryHistoricalRecords(query: AuditQuery): Promise<HistoricalRecord[]>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(period: {
        from: string;
        to: string;
    }, scope?: {
        executionIds?: string[];
        flowIds?: string[];
        daoSubnets?: string[];
    }): Promise<ComplianceReport>;
    /**
     * Verify audit trail integrity
     */
    verifyAuditTrailIntegrity(auditTrail: AuditTrail): Promise<{
        chainValid: boolean;
        signaturesValid: boolean;
    }>;
    /**
     * Get compliance reports
     */
    getComplianceReports(limit?: number): ComplianceReport[];
    /**
     * Export audit data for external compliance systems
     */
    exportAuditData(format: 'json' | 'csv' | 'xml', query: AuditQuery): Promise<{
        data: string;
        contentType: string;
        filename: string;
    }>;
    private setupEventListeners;
    private updateAuditTrail;
    private signRecord;
    private verifyRecordSignature;
    private calculateRecordHash;
    private storeRecordInIPFS;
    private storeReportInIPFS;
    private signReport;
    private detectComplianceViolations;
    private getNodeId;
    private convertToCSV;
    private convertToXML;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const auditableHistoryService: AuditableHistoryService;
//# sourceMappingURL=AuditableHistoryService.d.ts.map